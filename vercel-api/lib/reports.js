const crypto = require('node:crypto');
const {
  json,
  fail,
  bodyJson,
  currentUser,
  parseMultipart,
  uploadImage,
  createReport,
} = require('./helpers');

async function handleReports(req, res, path, method, database) {
  const reportImageDelete = path.match(/^\/api\/report\/report-images\/([^/]+)$/);
  if (reportImageDelete && method === 'DELETE') {
    const auth = currentUser(req, res);
    if (!auth) return;
    await database`DELETE FROM app_data WHERE collection='report_images' AND id=${reportImageDelete[1]} AND user_id=${auth.userId}`;
    return json(res, 200, { success: true, message: 'Deleted image' });
  }

  const reportIdMatch = path.match(/^\/api\/report\/reports\/([^/]+)$/);
  if (reportIdMatch && method === 'GET') {
    const [row] = await database`SELECT * FROM reports WHERE id=${reportIdMatch[1]}`;
    return row ? json(res, 200, row) : fail(res, 404, 'NOT_FOUND', 'Không tìm thấy báo cáo');
  }
  if (reportIdMatch && ['PATCH', 'PUT'].includes(method)) {
    const auth = currentUser(req, res);
    if (!auth) return;
    const body = await bodyJson(req);
    const [row] = await database`UPDATE reports SET address=COALESCE(${body.address || body.location || null},address),description=COALESCE(${body.description || null},description),status=COALESCE(${body.status || null},status),updated_at=now() WHERE id=${reportIdMatch[1]} AND user_id=${auth.userId} RETURNING *`;
    return row ? json(res, 200, row) : fail(res, 404, 'NOT_FOUND', 'Không tìm thấy báo cáo');
  }
  if (reportIdMatch && method === 'DELETE') {
    const auth = currentUser(req, res);
    if (!auth) return;
    const [row] = await database`DELETE FROM reports WHERE id=${reportIdMatch[1]} AND user_id=${auth.userId} RETURNING id`;
    return row ? json(res, 200, { success: true }) : fail(res, 404, 'NOT_FOUND', 'Không tìm thấy báo cáo');
  }

  const reportMutation = path.match(/^\/api\/v1\/reports\/([^/]+)\/(upvote|claim|status)$/);
  if (reportMutation && (method !== 'GET' || reportMutation[2] === 'upvote')) {
    const auth = currentUser(req, res);
    if (!auth) return;
    // Client truyền id ảnh (không tiền tố) — reports table lưu `rep-` + id ảnh
    const [reportRow] = await database`SELECT id, upvote_count FROM reports WHERE id=${reportMutation[1]} OR id=${'rep-' + reportMutation[1]}`;
    if (!reportRow) return fail(res, 404, 'NOT_FOUND', 'Không tìm thấy báo cáo');
    const id = reportRow.id;
    if (reportMutation[2] === 'upvote' && method === 'GET') {
      const [mine] = await database`SELECT id FROM app_data WHERE collection='report_upvotes' AND id=${'up-' + auth.userId + '-' + id}`;
      return json(res, 200, { success: true, data: { upvoted: !!mine, upvoteCount: reportRow.upvote_count ?? 0 } });
    }
    if (reportMutation[2] === 'upvote' && ['POST', 'DELETE'].includes(method)) {
      // Ghi nhận ai đã upvote để chặn upvote lặp và cho client render trạng thái đã upvote
      const upvoteId = `up-${auth.userId}-${id}`;
      if (method === 'POST') {
        const [inserted] = await database`INSERT INTO app_data(collection,id,user_id,data)
          VALUES('report_upvotes',${upvoteId},${auth.userId},${JSON.stringify({ id: upvoteId, report_id: id, user_id: auth.userId, created_at: new Date().toISOString() })}::jsonb)
          ON CONFLICT (collection,id) DO NOTHING RETURNING id`;
        if (!inserted) {
          return json(res, 200, { success: true, data: { upvoteCount: reportRow.upvote_count, upvoted: true, alreadyUpvoted: true } });
        }
      } else {
        const [removed] = await database`DELETE FROM app_data WHERE collection='report_upvotes' AND id=${upvoteId} RETURNING id`;
        if (!removed) {
          return json(res, 200, { success: true, data: { upvoteCount: reportRow.upvote_count, upvoted: false } });
        }
      }
      const upvoted = method === 'POST';
      const [row] = await database`UPDATE reports SET upvote_count=GREATEST(0,upvote_count+${upvoted ? 1 : -1}),updated_at=now() WHERE id=${id} RETURNING upvote_count`;
      return row ? json(res, 200, { success: true, data: { upvoteCount: row.upvote_count, upvoted } }) : fail(res, 404, 'NOT_FOUND', 'Không tìm thấy báo cáo');
    }
    if (reportMutation[2] === 'claim' && method === 'POST') {
      const [row] = await database`UPDATE reports SET status='in_progress',updated_at=now() WHERE id=${id} RETURNING *`;
      return row ? json(res, 200, { success: true, data: { report: row, message: 'Đã nhận nhiệm vụ dọn dẹp!' } }) : fail(res, 404, 'NOT_FOUND', 'Không tìm thấy báo cáo');
    }
    if (reportMutation[2] === 'status' && ['PATCH', 'PUT'].includes(method)) {
      const body = await bodyJson(req);
      const [row] = await database`UPDATE reports SET status=${String(body.status || 'reported')},updated_at=now() WHERE id=${id} RETURNING *`;
      return row ? json(res, 200, { success: true, data: row }) : fail(res, 404, 'NOT_FOUND', 'Không tìm thấy báo cáo');
    }
  }

  if ((path === '/api/photos' || path === '/api/photos/') && method === 'GET') {
    const rows = await database`SELECT data FROM app_data WHERE collection='map_photos' ORDER BY created_at DESC`;
    const photos = rows.map((r) => r.data);
    return json(res, 200, photos);
  }

  if ((path === '/api/photos' || path === '/api/photos/') && method === 'DELETE') {
    await database`DELETE FROM app_data WHERE collection='map_photos'`;
    await database`DELETE FROM reports`;
    return json(res, 200, { success: true, message: 'Đã xóa toàn bộ dữ liệu ảnh trên bản đồ' });
  }

  const photoDelete = path.match(/^\/api\/photos\/([^/]+)$/);
  if (photoDelete && method === 'DELETE') {
    const photoId = photoDelete[1];
    await database`DELETE FROM app_data WHERE collection='map_photos' AND id=${photoId}`;
    await database`DELETE FROM reports WHERE id=${photoId} OR id=${'rep-' + photoId}`;
    return json(res, 200, { success: true, message: 'Deleted photo' });
  }

  if (path === '/api/upload' && method === 'POST') {
    const auth = currentUser(req, res);
    if (!auth) return;
    const { fields, uploaded } = await parseMultipart(req);
    if (!uploaded) return fail(res, 400, 'IMAGE_REQUIRED', 'Thiếu tệp ảnh trong yêu cầu tải lên');
    // Ảnh phải có toạ độ thật — nếu không server sẽ ghim về Đắk Lắk (12.6828, 108.0378)
    const latNum = Number(fields.latitude ?? fields.lat);
    const lngNum = Number(fields.longitude ?? fields.lng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum) || (latNum === 0 && lngNum === 0)) {
      return fail(res, 400, 'LOCATION_REQUIRED', 'Thiếu toạ độ vị trí của ảnh');
    }
    const imageUrl = await uploadImage(uploaded);
    const result = await createReport(req, res, database, auth, fields, imageUrl);
    const report = result.report;
    const photo = {
      id: report.id.replace(/^rep-/, ''),
      name: fields.uploader || fields.reporter_name || fields.name || 'EcoPick Volunteer',
      uploader: fields.uploader || fields.reporter_name || fields.name || 'EcoPick Volunteer',
      title: fields.title || fields.address || report.address || 'Báo cáo rác Đắk Lắk',
      userid: auth.email,
      thumb: imageUrl || (report.photo_urls && report.photo_urls[0]) || '',
      lat: report.latitude,
      lng: report.longitude,
      severity: fields.severity || report.severity || 'medium',
      hasGps: true,
      outside: false,
      createdAt: Date.now(),
      source: 'app',
    };
    await database`INSERT INTO app_data (collection,id,user_id,data) VALUES ('map_photos',${photo.id},${auth.userId},${JSON.stringify(photo)}::jsonb)`;
    return json(res, 201, { success: true, ...photo, pointsEarned: result.pointsEarned, newTotal: result.newTotal });
  }

  if (path === '/api/v1/reports' || path === '/api/report/reports') {
    if (method === 'GET') {
      const rows = await database`SELECT * FROM reports ORDER BY created_at DESC`;
      const reports = rows.map((row) => ({ ...row, waste_types: row.waste_types, photo_urls: row.photo_urls }));
      return json(res, 200, path.includes('/v1/') ? { success: true, data: reports, results: reports } : reports);
    }
    if (method === 'POST') {
      const auth = currentUser(req, res);
      if (!auth) return;
      const contentType = req.headers['content-type'] || '';
      let fields;
      let uploaded;
      if (contentType.includes('multipart/form-data')) ({ fields, uploaded } = await parseMultipart(req));
      else fields = await bodyJson(req);
      const imageUrl = await uploadImage(uploaded);
      const result = await createReport(req, res, database, auth, fields, imageUrl);
      return json(res, 201, {
        success: true,
        data: result,
        ...result.report,
        pointsEarned: result.pointsEarned,
        newTotal: result.newTotal,
      });
    }
  }

  return false;
}

module.exports = { handleReports };
