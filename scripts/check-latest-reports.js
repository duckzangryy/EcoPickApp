const path = require('path');
const { neon } = require(path.resolve(__dirname, '../vercel-api/node_modules/@neondatabase/serverless'));

// Không hardcode chuỗi kết nối (trước đây để lộ mật khẩu role neondb_owner).
// Chạy kèm: node --env-file=vercel-api/.env.local scripts/check-latest-reports.js
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Thiếu DATABASE_URL. Chạy: node --env-file=vercel-api/.env.local scripts/check-latest-reports.js');
  process.exit(1);
}

async function main() {
  const sql = neon(DATABASE_URL);
  const reports = await sql`SELECT id, user_id, latitude, longitude, address, severity, status, photo_urls, created_at FROM reports ORDER BY created_at DESC LIMIT 10`;
  console.log('REPORTS in DB:', JSON.stringify(reports, null, 2));

  const photos = await sql`SELECT id, user_id, data, created_at FROM app_data WHERE collection='map_photos' ORDER BY created_at DESC LIMIT 10`;
  console.log('MAP_PHOTOS in DB:', JSON.stringify(photos, null, 2));
}

main().catch(console.error);
