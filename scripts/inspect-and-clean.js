const path = require('path');
const { neon } = require(path.resolve(__dirname, '../vercel-api/node_modules/@neondatabase/serverless'));

// Không hardcode chuỗi kết nối (trước đây để lộ mật khẩu role neondb_owner).
// Chạy kèm: node --env-file=vercel-api/.env.local scripts/inspect-and-clean.js
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Thiếu DATABASE_URL. Chạy: node --env-file=vercel-api/.env.local scripts/inspect-and-clean.js');
  process.exit(1);
}

async function main() {
  const sql = neon(DATABASE_URL);

  console.log('--- 1. CHECK EVENT PARTICIPANTS ---');
  const participants = await sql`SELECT id, user_id, data FROM app_data WHERE collection='event_participants'`;
  console.log('Total participants rows:', participants.length);
  for (const p of participants) {
    console.log(`ID: ${p.id} | Event: ${p.data?.event} | User: ${p.data?.user} | Name: ${p.data?.participant?.fullname}`);
  }

  // Deduplicate participants: keep only 1 row per (event, user)
  const seen = new Set();
  const toDelete = [];
  for (const p of participants) {
    const key = `${p.data?.event}_${p.data?.user}`;
    if (seen.has(key)) {
      toDelete.push(p.id);
    } else {
      seen.add(key);
    }
  }

  if (toDelete.length > 0) {
    console.log('Deleting duplicate participants:', toDelete);
    for (const id of toDelete) {
      await sql`DELETE FROM app_data WHERE collection='event_participants' AND id=${id}`;
    }
    console.log('Deleted', toDelete.length, 'duplicate participants');
  } else {
    console.log('No duplicate participants found.');
  }

  console.log('\n--- 2. CHECK REPORTS ---');
  const reports = await sql`SELECT id, user_id, latitude, longitude, severity, address, created_at FROM reports ORDER BY created_at DESC`;
  console.log('Total reports:', reports.length);
  for (const r of reports) {
    console.log(`Report: ${r.id} | User: ${r.user_id} | Coords: ${r.latitude},${r.longitude} | Sev: ${r.severity} | Time: ${r.created_at}`);
  }

  console.log('\n--- 3. CHECK USERS & POINTS ---');
  const users = await sql`SELECT id, fullname, email, eco_points, total_reports, total_events FROM users`;
  for (const u of users) {
    console.log(`User: ${u.fullname} (${u.email}) | Points: ${u.eco_points} | Reports: ${u.total_reports} | Events: ${u.total_events}`);
  }

  console.log('\n--- 4. CHECK EXCHANGE ITEMS (REWARDS) ---');
  const items = await sql`SELECT id, title, points_cost, category FROM exchange_items ORDER BY points_cost ASC`;
  for (const it of items) {
    console.log(`Reward: ${it.title} | Cost: ${it.points_cost} points | Cat: ${it.category}`);
  }
}

main().catch(console.error);
