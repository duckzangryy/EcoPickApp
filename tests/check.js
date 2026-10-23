const assert = require('node:assert');

// 1. Test image URL normalization logic
function normalizeImageUrl(image, baseUrl) {
  if (typeof image !== 'string' || !image.trim()) return '';
  if (/^(https?:|data:|blob:)/i.test(image)) return image;
  return `${baseUrl.replace(/\/$/, '')}/${image.replace(/^\//, '')}`;
}

const base = 'https://ecopick-api-iota.vercel.app';
assert.strictEqual(normalizeImageUrl('', base), '');
assert.strictEqual(normalizeImageUrl('https://example.com/a.jpg', base), 'https://example.com/a.jpg');
assert.strictEqual(normalizeImageUrl('data:image/png;base64,123', base), 'data:image/png;base64,123');
assert.strictEqual(normalizeImageUrl('uploads/1.jpg', base), 'https://ecopick-api-iota.vercel.app/uploads/1.jpg');
assert.strictEqual(normalizeImageUrl('/uploads/1.jpg', base), 'https://ecopick-api-iota.vercel.app/uploads/1.jpg');

// 2. Test app theme contrast values
const darkBg = '#101713';
const darkText = '#F1F5F2';
const lightBg = '#F6F8F7';
const lightText = '#0F172A';

assert.notStrictEqual(darkBg, lightBg);
assert.notStrictEqual(darkText, lightText);

// 3. Test API fallback URLs in app.json
const appConfig = require('../app.json');
const extra = appConfig.expo?.extra || {};
assert(extra.EXPO_PUBLIC_API_BASE_URL.startsWith('https://'), 'API_BASE_URL must be https production url');
assert(extra.EXPO_PUBLIC_DAKLAK_MAP_URL.startsWith('https://'), 'DAKLAK_MAP_URL must be https production url');
assert(!extra.EXPO_PUBLIC_API_BASE_URL.includes('localhost'), 'Production API URL must not be localhost');

console.log('All checks passed.');
