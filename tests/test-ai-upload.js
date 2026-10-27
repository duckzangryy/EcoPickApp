const fs = require('node:fs');

const BASE_URL = process.env.API_BASE_URL || 'https://ecopick-api-iota.vercel.app';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Please provide ADMIN_EMAIL and ADMIN_PASSWORD environment variables.');
  process.exit(1);
}

const CLEAN_IMAGE_URL = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600'; // Bãi biển sạch đẹp, không có rác
const WASTE_IMAGE_URL = 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=600'; // Bãi biển ngập rác thải nhựa thực tế

async function fetchBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download sample image: ${url}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function loginAdmin() {
  console.log(`[1] Đăng nhập tài khoản Admin (${ADMIN_EMAIL})...`);
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const data = await res.json();
  if (!res.ok || !data.accessToken) {
    throw new Error(`Đăng nhập thất bại: ${JSON.stringify(data)}`);
  }
  console.log(`-> Đăng nhập thành công! User: ${data.user.email}, Role: ${data.user.role}, Điểm hiện tại: ${data.user.eco_points}`);
  return data.accessToken;
}

async function testScan(token, imageBuffer, testName) {
  console.log(`\n[2] Test /api/ai/scan với: ${testName}...`);
  const base64 = imageBuffer.toString('base64');
  const res = await fetch(`${BASE_URL}/api/ai/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ image: base64, mimeType: 'image/jpeg' }),
  });
  const data = await res.json();
  console.log('-> Kết quả phản hồi AI Scan:');
  console.log(JSON.stringify(data, null, 2));
  return data;
}

async function testUpload(token, imageBuffer, testName) {
  console.log(`\n[3] Test /api/upload với: ${testName}...`);
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);

  const header =
    `--${boundary}\r\nContent-Disposition: form-data; name="uploader"\r\n\r\nAdmin Tester\r\n` +
    `--${boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\nTest Điểm Rác AI (${testName})\r\n` +
    `--${boundary}\r\nContent-Disposition: form-data; name="latitude"\r\n\r\n12.6828\r\n` +
    `--${boundary}\r\nContent-Disposition: form-data; name="longitude"\r\n\r\n108.0378\r\n` +
    `--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="test.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`;

  const headerBuf = Buffer.from(header, 'utf-8');
  const footerBuf = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
  const body = Buffer.concat([headerBuf, imageBuffer, footerBuf]);

  const res = await fetch(`${BASE_URL}/api/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      Authorization: `Bearer ${token}`,
    },
    body,
  });

  const data = await res.json();
  console.log('-> Kết quả phản hồi /api/upload:');
  console.log(JSON.stringify(data, null, 2));
  return data;
}

async function main() {
  try {
    const token = await loginAdmin();

    console.log('\nĐang tải ảnh mẫu kiểm thử...');
    const [cleanImg, wasteImg] = await Promise.all([
      fetchBuffer(CLEAN_IMAGE_URL),
      fetchBuffer(WASTE_IMAGE_URL),
    ]);

    // Test 1: Scan ảnh sạch (không có rác)
    const scanClean = await testScan(token, cleanImg, 'ẢNH SẠCH (BÃI BIỂN)');

    // Test 2: Thử upload ảnh sạch -> Phải bị từ chối 422 NO_WASTE_DETECTED
    console.log('\n[2b] Thử upload ảnh sạch lên /api/upload (Kỳ vọng: Từ chối, không cộng điểm, không lên maps)...');
    const uploadCleanResult = await testUpload(token, cleanImg, 'ẢNH SẠCH');

    // Test 3: Scan ảnh có rác
    const scanWaste = await testScan(token, wasteImg, 'ẢNH CÓ RÁC THỰC TẾ (CHAI LỌ)');

    // Test 4: Upload ảnh có rác thực tế để kiểm tra cộng điểm vào DB
    const uploadResult = await testUpload(token, wasteImg, 'ẢNH CÓ RÁC');

    console.log('\n========================================');
    console.log('TỔNG KẾT KIỂM THỬ AI GRADING & STRICT REJECTION:');
    console.log('Ảnh sạch scan      -> Điểm:', scanClean.data?.points, '| Màu viền:', scanClean.data?.color, '| Mức độ:', scanClean.data?.severity, '| Lý do:', scanClean.data?.reason);
    console.log('Ảnh sạch upload    -> Bị chặn:', !uploadCleanResult.success ? 'ĐÚNG (BỊ CHẶN)' : 'SAI (LỌT)', '| Chi tiết:', uploadCleanResult.error?.message || uploadCleanResult.detail);
    console.log('Ảnh rác scan       -> Điểm:', scanWaste.data?.points, '| Màu viền:', scanWaste.data?.color, '| Mức độ:', scanWaste.data?.severity, '| Lý do:', scanWaste.data?.reason);
    console.log('Ảnh rác upload     -> Điểm cộng:', uploadResult.pointsEarned, '| Màu viền:', uploadResult.color, '| Tổng điểm mới:', uploadResult.newTotal);
    console.log('========================================');
  } catch (err) {
    console.error('LỖI TEST:', err);
  }
}

main();
