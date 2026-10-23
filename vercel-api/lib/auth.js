const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const {
  json,
  fail,
  bodyJson,
  currentUser,
  tokenFor,
  userShape,
  parseMultipart,
  uploadImage,
} = require('./helpers');

async function handleAuth(req, res, path, method, database) {
  if ((path === '/api/v1/auth/register' || path === '/api/users/signup') && method === 'POST') {
    const contentType = req.headers['content-type'] || '';
    const body = contentType.includes('multipart/form-data')
      ? (await parseMultipart(req)).fields
      : await bodyJson(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!email || password.length < 8) {
      return fail(res, 400, 'VALIDATION_ERROR', 'Email bắt buộc; mật khẩu tối thiểu 8 ký tự');
    }
    const fullname = body.fullName || body.fullname || email.split('@')[0];
    const username =
      String(body.username || email.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 40) || `user_${Date.now()}`;
    const id = `user-${crypto.randomUUID()}`;
    const hash = await bcrypt.hash(password, 12);
    try {
      const [row] = await database`INSERT INTO users (id,email,password_hash,fullname,username,eco_points,is_verified)
        VALUES (${id},${email},${hash},${fullname},${username},0,false) RETURNING *`;
      const user = userShape(row);
      const otp = crypto.randomInt(100000, 999999).toString();
      await database`INSERT INTO otps(email,otp,expires_at) VALUES(${email},${otp},now()+interval '15 minutes') ON CONFLICT(email) DO UPDATE SET otp=EXCLUDED.otp,expires_at=EXCLUDED.expires_at`;
      return json(res, 201, {
        success: true,
        data: { user, message: 'Đăng ký thành công', otp: process.env.NODE_ENV === 'development' ? otp : undefined },
        id,
        email,
        message: 'Đăng ký thành công',
      });
    } catch (error) {
      if (error.code === '23505') return fail(res, 409, 'EMAIL_EXISTS', 'Email hoặc username đã được sử dụng');
      throw error;
    }
  }

  if ((path === '/api/v1/auth/login' || path === '/api/users/signin') && method === 'POST') {
    const body = await bodyJson(req);
    const email = String(body.email || '').trim().toLowerCase();
    const [row] = await database`SELECT * FROM users WHERE email=${email} AND is_active=true`;
    if (!row || !(await bcrypt.compare(String(body.password || ''), row.password_hash))) {
      return fail(res, 401, 'INVALID_CREDENTIALS', 'Email hoặc mật khẩu không chính xác');
    }
    const user = userShape(row);
    const accessToken = tokenFor(user);
    const refreshToken = jwt.sign({ userId: user.id, email: user.email, type: 'refresh' }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });
    return json(res, 200, {
      success: true,
      data: { user, accessToken, refreshToken },
      access_token: accessToken,
      accessToken,
      refresh_token: refreshToken,
      refreshToken,
      token_type: 'Bearer',
      expires_in: 2592000,
      user,
    });
  }

  if (path === '/api/v1/auth/refresh' && method === 'POST') {
    const body = await bodyJson(req);
    try {
      const token = body.refreshToken || body.refresh_token;
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      if (payload.type !== 'refresh') throw new Error('Invalid refresh token');
      const [row] = await database`SELECT * FROM users WHERE id=${payload.userId} AND is_active=true`;
      if (!row) return fail(res, 401, 'UNAUTHORIZED', 'Tài khoản không còn tồn tại');
      const accessToken = tokenFor(userShape(row));
      return json(res, 200, { success: true, data: { accessToken, refreshToken: token }, access_token: accessToken, refresh_token: token });
    } catch {
      return fail(res, 401, 'UNAUTHORIZED', 'Refresh token không hợp lệ');
    }
  }

  if (path === '/api/v1/auth/logout' && method === 'POST') {
    return json(res, 200, { success: true, data: { message: 'Đăng xuất thành công' } });
  }

  if ((path === '/api/v1/auth/google' || path === '/api/v1/auth/apple') && method === 'POST') {
    return fail(res, 501, 'NOT_CONFIGURED', 'OAuth chưa được cấu hình cho deployment này');
  }

  if (path === '/api/v1/auth/verify-email' && method === 'POST') {
    const body = await bodyJson(req);
    const [stored] = await database`SELECT otp FROM otps WHERE email=${String(body.email || '').toLowerCase()} AND expires_at > now()`;
    if (!stored || stored.otp !== String(body.otp || body.code || '')) {
      return fail(res, 400, 'INVALID_OTP', 'Mã xác thực không hợp lệ hoặc đã hết hạn');
    }
    const [row] = await database`UPDATE users SET is_verified=true, updated_at=now() WHERE email=${String(body.email || '').toLowerCase()} RETURNING *`;
    await database`DELETE FROM otps WHERE email=${String(body.email || '').toLowerCase()}`;
    if (!row) return fail(res, 404, 'NOT_FOUND', 'Không tìm thấy tài khoản');
    return json(res, 200, { success: true, data: { user: userShape(row), message: 'Xác thực email thành công' } });
  }

  if ((path === '/api/v1/auth/forgot-password' || path === '/api/v1/auth/reset-password') && method === 'POST') {
    const body = await bodyJson(req);
    const email = String(body.email || '').trim().toLowerCase();
    const [user] = await database`SELECT id FROM users WHERE email=${email}`;
    if (!user) return fail(res, 404, 'NOT_FOUND', 'Email không tồn tại');
    if (path.endsWith('forgot-password')) {
      const otp = crypto.randomInt(100000, 999999).toString();
      await database`INSERT INTO otps(email,otp,expires_at) VALUES(${email},${otp},now()+interval '15 minutes') ON CONFLICT(email) DO UPDATE SET otp=EXCLUDED.otp,expires_at=EXCLUDED.expires_at`;
      return json(res, 200, {
        success: true,
        data: { email, message: 'Mã đặt lại mật khẩu đã tạo', otp: process.env.NODE_ENV === 'development' ? otp : undefined },
      });
    }
    const otp = String(body.otp || body.code || '');
    const password = String(body.newPassword || body.new_password || body.password || '');
    if (password.length < 8) return fail(res, 400, 'VALIDATION_ERROR', 'Mật khẩu mới tối thiểu 8 ký tự');
    const [stored] = await database`SELECT otp FROM otps WHERE email=${email} AND expires_at > now()`;
    if (!stored || stored.otp !== otp) return fail(res, 400, 'INVALID_OTP', 'Mã xác thực không hợp lệ hoặc đã hết hạn');
    const hash = await bcrypt.hash(password, 12);
    await database`UPDATE users SET password_hash=${hash},updated_at=now() WHERE id=${user.id}`;
    await database`DELETE FROM otps WHERE email=${email}`;
    return json(res, 200, { success: true, data: { message: 'Đặt lại mật khẩu thành công' } });
  }

  if (path === '/api/v1/users/me' || path === '/api/users/userinfo') {
    const auth = currentUser(req, res);
    if (!auth) return;
    if (method === 'GET') {
      const [row] = await database`SELECT * FROM users WHERE id=${auth.userId}`;
      if (!row) return fail(res, 404, 'NOT_FOUND', 'Không tìm thấy tài khoản');
      const user = userShape(row);
      return json(res, 200, {
        success: true,
        data: {
          ...user,
          stats: {
            totalReports: user.total_reports,
            totalEvents: user.total_events,
            treesPlanted: user.total_trees,
            followerCount: 0,
            followingCount: 0,
          },
        },
        ...user,
      });
    }
    if (method === 'PATCH' || method === 'PUT') {
      const body = await bodyJson(req);
      const fullName = body.fullname || body.fullName;
      const [row] = await database`UPDATE users SET fullname=COALESCE(${fullName || null},fullname), avatar=COALESCE(${body.avatarUrl || body.avatar || null},avatar), bio=COALESCE(${body.bio || null},bio), updated_at=now() WHERE id=${auth.userId} RETURNING *`;
      return json(res, 200, { success: true, data: userShape(row), ...userShape(row) });
    }
    return fail(res, 405, 'METHOD_NOT_ALLOWED', 'Method not allowed');
  }

  if (path === '/api/v1/users/me/avatar' && method === 'POST') {
    const auth = currentUser(req, res);
    if (!auth) return;
    const contentType = req.headers['content-type'] || '';
    const parsed = contentType.includes('multipart/form-data')
      ? await parseMultipart(req)
      : { fields: await bodyJson(req), uploaded: null };
    const avatarUrl = parsed.uploaded ? await uploadImage(parsed.uploaded) : parsed.fields.avatarUrl || parsed.fields.avatar || '';
    const [row] = await database`UPDATE users SET avatar=${avatarUrl}, updated_at=now() WHERE id=${auth.userId} RETURNING *`;
    return json(res, 200, { success: true, data: { avatarUrl: row.avatar } });
  }

  return false;
}

module.exports = { handleAuth };
