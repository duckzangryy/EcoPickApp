#!/bin/bash
# 1. Khởi động lại web server để cập nhật code mới từ dist/
pkill -f 'serve-web.js' 2>/dev/null || true
sleep 1
nohup node ~/EcoPickApp/scripts/serve-web.js </dev/null > ~/EcoPickApp/web.log 2>&1 &
echo $! > ~/EcoPickApp/web.pid

# 2. Giữ nguyên Cloudflare Tunnel chạy riêng, không kill để link cố định vĩnh viễn
if pgrep -f 'cloudflared tunnel' > /dev/null; then
  echo "Cloudflare Tunnel đang chạy độc lập (link cố định được giữ nguyên)."
else
  echo "Khởi động Cloudflare Tunnel mới..."
  nohup ~/.local/bin/cloudflared tunnel --url http://127.0.0.1:8082 </dev/null > ~/EcoPickApp/tunnel.log 2>&1 &
  echo $! > ~/EcoPickApp/tunnel.pid
  sleep 4
fi

URL=$(grep -a -o 'https://[-a-zA-Z0-9.]*\.trycloudflare\.com' ~/EcoPickApp/tunnel.log | tail -n 1)
echo "TUNNEL_URL: $URL"
