# EcoPick API + Đắk Lắk map on Vercel

Vercel project root: `vercel-api/`. Expo mobile app stays a separate client. Native map uses `react-native-maps`; the browser map is a Leaflet page hosted at `/opendesign/mockups/daklak-map/` on this deployment.

## Production services

- Neon Postgres: users, reports, reward redemption, points, app collections (`app_data`).
- Vercel Blob: public uploaded report images. `BLOB_STORE_ID` OIDC or `BLOB_READ_WRITE_TOKEN`.
- Set `DATABASE_URL`, `JWT_SECRET` (random, >=32 bytes), `CORS_ORIGIN` in Vercel project environment. Keep secrets out of git and archives.
- Schema: `psql "$DATABASE_URL" -f db/schema.sql`; seed sample rewards: `npm run db:seed`.

## Deploy

Project is configured to use root `vercel-api`. Deploy from that project root:

```bash
npm install
npx vercel --prod
```

Vercel serves `/api/*` through `api/index.js`; `vercel.json` preserves legacy paths with or without trailing slash. Map page is served from `public/opendesign/mockups/daklak-map/index.html`; its `GET /api/photos` and image URLs share the same deployment.

## Route coverage

API route groups currently include auth/profile, users, reports/photos/image uploads, events, posts/comments/likes/media, badges/rewards, roles, point logs, leaderboard/challenges, notifications, conversations and messages. This is not yet verified as complete parity with every method/body in `src/api/services/*`; point-log writes, role CRUD, unread notifications and chat membership/access still need end-to-end verification. Collections without dedicated relational tables use JSONB `app_data`; no local mock DB is copied to production.

Nearby routes currently return recent items without radius filtering. Do not treat the route list as a completed production certification; run authorized deployment smoke tests after each remaining parity fix.

Check deployment:

```bash
curl -i https://<deployment>/health
curl -i https://<deployment>/api/photos
curl -i https://<deployment>/opendesign/mockups/daklak-map/
```

## Known limits

- Nearby endpoints return current reports/events; no PostGIS radius calculation is included.
- Uploads use direct Vercel Blob, not presigned URLs. OAuth providers, real OTP email delivery, push notifications and sponsor code validation require external integrations.
- Map tiles come from OpenStreetMap and routing from OSRM; they are external services, not hosted by Vercel. Respect their usage policies.
- This is not a production security certification. Configure backups, monitoring and rate limiting before launch. Review the smoke tests after each schema/API change.
