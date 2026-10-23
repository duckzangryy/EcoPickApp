const { sql, failDomain, json, fail } = require('../lib/helpers');
const { handleAuth } = require('../lib/auth');
const { handleReports } = require('../lib/reports');
const { handleEventsAndRewards } = require('../lib/eventsAndRewards');
const { handleDomain } = require('../lib/domain');

async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type,Accept,X-Requested-With');
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const database = sql();
  const originalUrl = req.url || '/';
  const url = new URL(originalUrl, `https://${req.headers.host || 'localhost'}`);
  const routedPath = url.searchParams.get('route');
  const forwardedPath =
    req.headers['x-original-uri'] ||
    req.headers['x-vercel-original-path'] ||
    req.headers['x-forwarded-uri'];
  const path =
    (routedPath || (forwardedPath ? new URL(forwardedPath, url).pathname : url.pathname)).replace(/\/+$/, '') || '/';
  const method = req.method.toUpperCase();

  if (path === '/' || path === '/health' || path === '/api/health' || path === '/api/v1/health') {
    return json(res, 200, {
      success: true,
      ok: true,
      message: 'EcoPick API is running',
      version: '1.0.0',
    });
  }

  await handleAuth(req, res, path, method, database);
  if (res.writableEnded || res.headersSent) return;
  await handleReports(req, res, path, method, database);
  if (res.writableEnded || res.headersSent) return;
  await handleEventsAndRewards(req, res, path, method, database);
  if (res.writableEnded || res.headersSent) return;
  await handleDomain(req, res, path, method, database, url);
  if (res.writableEnded || res.headersSent) return;

  return fail(res, 404, 'NOT_FOUND', `Endpoint ${method} ${path} chưa được đóng gói`);
}

module.exports = async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error('EcoPick API error:', error);
    if (!res.headersSent && !failDomain(res, error)) {
      fail(
        res,
        500,
        'INTERNAL_ERROR',
        process.env.NODE_ENV === 'development' ? error.message : 'Lỗi máy chủ'
      );
    } else {
      res.end();
    }
  }
};
