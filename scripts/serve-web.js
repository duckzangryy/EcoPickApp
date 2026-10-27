const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8082;
const DIST = path.join(__dirname, '..', 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(DIST, urlPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Server Error');
    } else {
      let body = content;
      if (ext === '.html') {
        let html = content.toString('utf8');
        if (!html.includes('Plus+Jakarta+Sans')) {
          const fontInject = `
    <!-- Google Fonts: Plus Jakarta Sans & Inter (Hỗ trợ tiếng Việt sắc nét, chuẩn UI hiện đại) -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=Inter:ital,opsz,wght@0,14..32,300..800;1,14..32,300..800&display=swap" rel="stylesheet" />
    <style>
      html, body, #root, input, textarea, select, button {
        font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeLegibility;
      }
      * {
        outline: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      *:focus, *:focus-visible, *:active {
        outline: none !important;
      }
      a, button, [role="tab"], [role="button"] {
        outline: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      [role="tab"]:focus, [role="tab"]:focus-visible {
        outline: none !important;
        box-shadow: none !important;
      }
      [dir="auto"]:not([style*="Ionicons"]):not([style*="Material"]):not([style*="FontAwesome"]):not([style*="Feather"]):not([style*="Entypo"]):not([style*="Octicons"]):not([style*="AntDesign"]):not([style*="SimpleLineIcons"]):not([style*="font-family: Ionicons"]):not([style*="font-family: 'Ionicons'"]) {
        font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
    </style>
`;
          html = html.replace('</head>', `${fontInject}</head>`);
          body = Buffer.from(html, 'utf8');
        }
      }
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
      });
      res.end(body);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('EcoPick Web running at http://0.0.0.0:' + PORT);
});
