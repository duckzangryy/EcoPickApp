const { neon } = require('@neondatabase/serverless');
const jwt = require('jsonwebtoken');
const { put } = require('@vercel/blob');
const crypto = require('node:crypto');

const sql = () => {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  return neon(process.env.DATABASE_URL);
};

const POINTS_BY_SEVERITY = { low: 10, medium: 20, high: 35, critical: 50 };

/** Parse JSON từ field multipart, trả về mặc định nếu không hợp lệ. */
const safeJson = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const DOMAIN_ERRORS = {
  USER_NOT_FOUND: [404, 'Vui lòng đăng nhập lại'],
  EVENT_NOT_FOUND: [404, 'Không tìm thấy sự kiện'],
  PARTICIPANT_NOT_FOUND: [404, 'Không tìm thấy lượt tham gia'],
  REWARD_NOT_FOUND: [404, 'Không tìm thấy phần thưởng'],
  OUT_OF_STOCK: [409, 'Phần thưởng đã hết'],
  INSUFFICIENT_POINTS: [409, 'Bạn không đủ điểm để đổi phần thưởng này'],
};

function failDomain(res, error) {
  const code = Object.keys(DOMAIN_ERRORS).find((key) => String(error?.message || '').includes(key));
  if (!code) return false;
  const [status, message] = DOMAIN_ERRORS[code];
  fail(res, status, code, message);
  return true;
}

const json = (res, status, body) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
};

const fail = (res, status, code, message) =>
  json(res, status, { success: false, error: { code, message, details: [] }, detail: message });

function bodyJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) reject(new Error('Request body too large'));
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function currentUser(req, res) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token || !process.env.JWT_SECRET) {
    fail(res, 401, 'UNAUTHORIZED', 'Vui lòng đăng nhập');
    return null;
  }
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    fail(res, 401, 'UNAUTHORIZED', 'Token không hợp lệ hoặc đã hết hạn');
    return null;
  }
}

function tokenFor(user) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return jwt.sign(
    { userId: user.id, email: user.email, is_staff: user.is_staff, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function userShape(row, socialCounts) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    fullname: row.fullname,
    full_name: row.fullname,
    username: row.username,
    avatar: row.avatar,
    avatar_url: row.avatar,
    bio: row.bio,
    role: row.role,
    level: row.level,
    eco_points: row.eco_points,
    total_reports: row.total_reports,
    total_events: row.total_events,
    total_trees: row.total_trees,
    followers_count: socialCounts?.followers ?? 0,
    follower_count: socialCounts?.followers ?? 0,
    following_count: socialCounts?.following ?? 0,
    is_verified: row.is_verified,
    is_active: row.is_active,
    is_staff: row.is_staff,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** Đếm follower/following thật từ collection 'follows' (id: follow-{follower}-{target}). */
async function socialCounts(database, userId) {
  if (!userId) return { followers: 0, following: 0 };
  const [row] = await database`
    SELECT
      count(*) FILTER (WHERE data->>'user_id' = ${userId})::int AS followers,
      count(*) FILTER (WHERE user_id = ${userId})::int AS following
    FROM app_data WHERE collection='follows'`;
  return { followers: row?.followers ?? 0, following: row?.following ?? 0 };
}

async function parseMultipart(req) {
  const fields = {};
  let uploaded = null;
  // busboy là Writable: 'finish' có thể bắn TRƯỚC khi stream file đọc hết,
  // khi đó uploaded còn null và ảnh bị mất âm thầm (thumb rỗng → icon 📍).
  // Vì vậy chỉ resolve khi vừa parse xong vừa đóng hết stream file.
  const pending = new Set();
  let parsed = false;
  await new Promise((resolve, reject) => {
    let settled = false;
    const done = () => {
      if (settled || !parsed || pending.size > 0) return;
      settled = true;
      resolve();
    };
    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    let parser;
    try {
      parser = require('busboy')({ headers: req.headers, limits: { fileSize: 4 * 1024 * 1024, files: 1 } });
    } catch (error) {
      fail(error);
      return;
    }
    parser.on('field', (name, value) => {
      fields[name] = value;
    });
    parser.on('file', (name, stream, info) => {
      const chunks = [];
      pending.add(stream);
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('limit', () => fail(new Error('Ảnh vượt giới hạn 4MB')));
      stream.on('error', fail);
      stream.on('end', () => {
        uploaded = { filename: info.filename, mimeType: info.mimeType, buffer: Buffer.concat(chunks) };
        pending.delete(stream);
        done();
      });
    });
    parser.on('error', fail);
    req.on('error', fail);
    parser.on('finish', () => {
      parsed = true;
      done();
    });
    req.pipe(parser);
  });
  return { fields, uploaded };
}

async function uploadImage(uploaded) {
  if (!uploaded) return '';
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
    throw new Error('Blob storage is not configured (BLOB_READ_WRITE_TOKEN or BLOB_STORE_ID)');
  }
  const safeName = (uploaded.filename || 'report.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');
  const blob = await put(`reports/${Date.now()}-${safeName}`, uploaded.buffer, {
    access: 'public',
    contentType: uploaded.mimeType || 'image/jpeg',
  });
  return blob.url;
}

async function createReport(req, res, database, user, fields, imageUrl) {
  const severity = Object.hasOwn(POINTS_BY_SEVERITY, fields.severity) ? fields.severity : 'medium';
  const points = POINTS_BY_SEVERITY[severity];
  const id = `rep-${crypto.randomUUID()}`;
  const latitude = Number(fields.latitude || fields.lat) || 12.6828;
  const longitude = Number(fields.longitude || fields.lng) || 108.0378;
  const photoUrls = imageUrl
    ? [imageUrl]
    : Array.isArray(fields.photo_urls)
    ? fields.photo_urls
    : fields.photo_urls
    ? safeJson(fields.photo_urls, [])
    : [];
  const wasteRaw = fields.wasteTypes || fields.waste_type || '';
  const wasteTypes = String(wasteRaw)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  const description = fields.description || '';

  const [report] = await database`INSERT INTO reports (id,user_id,latitude,longitude,address,severity,waste_types,description,status,photo_urls)
    VALUES (${id},${user.userId},${latitude},${longitude},${fields.address || fields.location || fields.title || 'Đắk Lắk, Việt Nam'},
      ${severity},${JSON.stringify(wasteTypes)}::jsonb,${description},'reported',${JSON.stringify(photoUrls)}::jsonb)
    RETURNING *`;

  const [log] = await database`INSERT INTO point_logs (id,user_id,points,action,reason,reference_id)
    VALUES (${'pl-' + id},${user.userId},${points},'report_submitted',${'Gửi báo cáo rác (' + severity + ')'},${id})
    ON CONFLICT (id) DO NOTHING RETURNING id`;

  const earned = log ? points : 0;
  const [u] = await database`UPDATE users SET eco_points=eco_points+${earned},total_reports=total_reports+1,updated_at=now()
    WHERE id=${user.userId} RETURNING eco_points`;
  return { report, pointsEarned: earned, newTotal: u?.eco_points ?? 0 };
}

/** Tham gia sự kiện, cộng điểm một lần duy nhất cho mỗi người/sự kiện. */
async function joinEvent(database, userId, eventId) {
  const [event] = await database`SELECT data FROM app_data WHERE collection='events' AND id=${eventId}`;
  if (!event) throw new Error('EVENT_NOT_FOUND');
  const participantId = `ep-${userId}-${eventId}`;
  const [inserted] = await database`INSERT INTO app_data(collection,id,user_id,data)
    VALUES('event_participants',${participantId},${userId},${JSON.stringify({
      id: participantId, event: eventId, user: userId, status: 'joined', joined_at: new Date().toISOString(),
    })}::jsonb)
    ON CONFLICT (collection,id) DO NOTHING RETURNING id`;
  if (!inserted) {
    const [u] = await database`SELECT eco_points FROM users WHERE id=${userId}`;
    return { id: participantId, joined: false, pointsEarned: 0, newTotal: u?.eco_points ?? 0 };
  }
  const points = Math.max(0, Number(event.data?.eco_point_reward) || 0);
  const [log] = await database`INSERT INTO point_logs (id,user_id,points,action,reason,reference_id)
    VALUES (${'pl-join-' + eventId + '-' + userId},${userId},${points},'event_joined',
      ${'Tham gia sự kiện: ' + (event.data?.title || '')},${eventId})
    ON CONFLICT (id) DO NOTHING RETURNING id`;
  const earned = log ? points : 0;
  const [u] = await database`UPDATE users SET eco_points=eco_points+${earned},total_events=total_events+1,updated_at=now()
    WHERE id=${userId} RETURNING eco_points`;
  return { id: participantId, joined: true, pointsEarned: earned, newTotal: u?.eco_points ?? 0 };
}

/** Rời sự kiện, thu hồi điểm đã cấp khi tham gia. */
async function leaveEvent(database, userId, participantId) {
  const [row] = await database`DELETE FROM app_data
    WHERE collection='event_participants' AND id=${participantId} AND user_id=${userId} RETURNING data`;
  if (!row) throw new Error('PARTICIPANT_NOT_FOUND');
  const eventId = row.data?.event;
  const [log] = await database`DELETE FROM point_logs
    WHERE user_id=${userId} AND action='event_joined' AND reference_id=${eventId} RETURNING points`;
  const revoked = log ? Number(log.points) || 0 : 0;
  const [u] = await database`UPDATE users SET eco_points=GREATEST(0,eco_points-${revoked}),
    total_events=GREATEST(0,total_events-1),updated_at=now()
    WHERE id=${userId} RETURNING eco_points`;
  return { left: true, revoked, newTotal: u?.eco_points ?? 0 };
}

module.exports = {
  sql,  POINTS_BY_SEVERITY,
  DOMAIN_ERRORS,
  failDomain,
  json,
  fail,
  bodyJson,
  currentUser,
  tokenFor,
  userShape,
  socialCounts,
  parseMultipart,
  uploadImage,
  createReport,
  joinEvent,
  leaveEvent,
};
