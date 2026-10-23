# BÁO CÁO KỸ THUẬT DỰ ÁN ECOPICK

> **Dự án:** EcoPick (Ứng dụng bảo vệ môi trường, phân loại & báo cáo rác thải, sự kiện xanh)  
> **Kiến trúc:** Phân tách rõ ràng **Client - Server (React Native / Expo Web + Backend API)**

---

## 1. TỔNG QUAN KIẾN TRÚC & MỤC TIÊU DỰ ÁN

- **Frontend / Client:**
  - Framework: **Expo SDK 54 / React Native (chạy Hermes engine)**.
  - Hỗ trợ đa nền tảng: Web (React Native Web / Vite / Webpack) và Mobile (Android / iOS).
  - Quản lý trạng thái: **Zustand** (`authStore.ts`), **React Query / TanStack Query** (`useEventQueries`, `useReportQueries`, `useBadgeQueries`, `useUserQueries`).
  - Mạng & HTTP: **Axios** có interceptor gắn JWT token tự động và xử lý lỗi tập trung.
  - Quản lý biến môi trường: Đã gom toàn bộ URL cấu hình vào file `.env` chuẩn hóa tiền tố `EXPO_PUBLIC_*` và module `src/config/env.ts`.

- **Backend / Mock API Server (`mock-server.js`):**
  - Chạy tại: `http://localhost:8000` (Node.js native HTTP server, không phụ thuộc nặng thư viện ngoài).
  - Tích hợp chuẩn **REST API v1** đồng thời **tương thích 100% ngược (backward compatibility)** với các endpoint Django REST cũ (`/api/...`).
  - Tự động lưu trữ dữ liệu bền vững (persistence) vào file `mock-db.json`.

---

## 2. CÁC TÍNH NĂNG CHÍNH ĐÃ HOÀN THIỆN

### 2.1. Bản đồ ảnh báo cáo rác Đắk Lắk
- Tích hợp bản đồ trực quan bằng Leaflet và React Native Maps.
- Hỗ trợ xem các điểm rác được báo cáo kèm ảnh chụp, vị trí GPS và mức độ nghiêm trọng.
- Cho phép người dùng lọc theo mức độ rác (Light, Medium, Heavy, Extreme).

### 2.2. Báo cáo rác & Trích xuất GPS từ ảnh chụp
- Chụp ảnh trực tiếp từ camera hoặc chọn ảnh từ thư viện.
- Tự động trích xuất tọa độ GPS từ metadata EXIF của ảnh để ghim chính xác lên bản đồ.
- Tự động di chuyển tâm bản đồ tới vị trí vừa báo cáo.

### 2.3. Quản lý sự kiện môi trường & Người tham gia
- Danh sách sự kiện sắp tới, sự kiện của tôi và sự kiện đã qua.
- Chi tiết sự kiện: thông tin thời gian, địa điểm, bản đồ, dụng cụ cần thiết, danh sách người tham gia theo thời gian thực.
- Tính năng tham gia / hủy tham gia sự kiện và tích lũy điểm thưởng Eco Points.

### 2.4. Đổi quà & Gamification
- Hệ sinh thái điểm thưởng Eco Points cho mỗi báo cáo và sự kiện tham gia.
- Đổi điểm nhận quà thực tế (voucher cà phê, nước suối...).
- Bảng xếp hạng và hệ thống huy hiệu thành tích.

---

## 3. CẤU TRÚC THƯ MỤC DỰ ÁN

```
EcoPickApp/
├── .env                              # Quản lý toàn bộ URL môi trường
├── app.json                          # Cấu hình Expo, quyền thiết bị & biến môi trường extra
├── mock-server.js                    # Server Mock API chuẩn REST v1 & Legacy (Node.js port 8000)
├── mock-db.json                      # Database JSON lưu trữ dữ liệu
├── src/
│   ├── api/
│   │   ├── endpoints.ts              # Định nghĩa toàn bộ endpoint hệ thống
│   │   ├── queryKeys.ts              # Key định danh cho React Query
│   │   └── services/                 # Các API service (event, report, user, badge, chat)
│   ├── components/                   # Các component tái sử dụng (BottomSheet, SearchBar, ReportCard...)
│   ├── config/                       # Cấu hình biến môi trường
│   ├── hooks/                        # Custom hooks React Query
│   ├── stores/                       # Zustand store (authStore, themeStore, mapStore)
│   └── types/                        # TypeScript type definitions
```

---

## 4. HƯỚNG DẪN KHỞI CHẠY DỰ ÁN

### 4.1. Khởi động Mock Server
```bash
node mock-server.js
```
*Server sẽ lắng nghe tại `http://localhost:8000`.*

### 4.2. Khởi động ứng dụng Expo
```bash
npx expo start
```
- Nhấn `a` để mở trên Android Emulator / thiết bị Android.
- Nhấn `w` để mở trên trình duyệt Web.

### 4.3. Kiểm tra TypeScript
```bash
npx tsc --noEmit
```

---

## 5. TÀI KHOẢN THỬ NGHIỆM
- **Admin:** `admin@ecopick.vn` | Mật khẩu: `123456`
- **Tình nguyện viên:** `volunteer@ecopick.vn` | Mật khẩu: `123456`
