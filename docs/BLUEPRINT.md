# BLUEPRINT – Kiến trúc tổng thể dự án

**Project:** Zalo Booking Bot (VC-ZBB-1225)
**Version:** 1.0
**Date:** 2025-12-06

---

## 1. Tóm tắt dự án

Zalo Booking Bot là hệ thống quản lý đặt lịch hẹn tự động, tích hợp với Zalo Official Account (OA). Dự án giải quyết bài toán quản lý booking cho các doanh nghiệp dịch vụ (salon, spa, phòng khám, nhà hàng) thông qua nền tảng Zalo - ứng dụng nhắn tin phổ biến nhất tại Việt Nam.

Đây là **Web Application** (Next.js) + **Serverless Functions** + **Chatbot** trên Zalo OA, cho phép khách hàng đặt lịch qua chat Zalo, và admin quản lý thông qua dashboard web.

---

## 2. Mục tiêu & KPI chính

### Mục tiêu chức năng:
- Khách hàng có thể đặt lịch hẹn qua Zalo OA (chat tự nhiên hoặc menu).
- Admin quản lý bookings, customers, và tin nhắn qua dashboard.
- Hệ thống tự động gửi reminder trước giờ hẹn.

### Mục tiêu trải nghiệm:
- Đặt lịch trong vòng **< 2 phút** (3-5 bước chat).
- Dashboard admin **responsive**, load time **< 2s**.
- Accent color **#007AFF** (Zalo brand blue) xuyên suốt.

### Mục tiêu kinh doanh:
- MVP phục vụ **1 business** (single-tenant).
- Giảm **50% thời gian** quản lý lịch hẹn thủ công.
- Tăng tỷ lệ khách hàng quay lại nhờ reminder tự động.

---

## 3. Các Module chính

### Module A – Zalo Chatbot (Webhook Handler)
- **Mục đích:** Nhận và xử lý tin nhắn từ Zalo OA.
- **Ai dùng:** Khách hàng (end users).
- **Input:** Webhook events từ Zalo (user messages, follow/unfollow).
- **Output:** Phản hồi tự động, lưu conversation vào DB.

### Module B – Booking Management (Backend API)
- **Mục đích:** CRUD operations cho bookings.
- **Ai dùng:** Dashboard frontend, Zalo chatbot.
- **Input:** API requests (create/update/delete bookings).
- **Output:** JSON responses, database updates.

### Module C – Admin Dashboard (Frontend)
- **Mục đích:** Quản lý bookings, customers, messages.
- **Ai dùng:** Business owner, staff.
- **Input:** User interactions (clicks, forms).
- **Output:** UI updates, API calls.

### Module D – Reminder Job (CRON)
- **Mục đích:** Gửi reminder tự động trước giờ hẹn.
- **Ai dùng:** Hệ thống (background job).
- **Input:** Scheduled time, booking data.
- **Output:** Zalo messages to customers.

---

## 4. Flow người dùng / quy trình chính

### Flow 1 – Khách hàng đặt lịch qua Zalo
1. Khách follow Zalo OA hoặc nhắn tin "đặt lịch".
2. Bot hiển thị menu: Chọn dịch vụ.
3. Khách chọn dịch vụ → Bot hỏi ngày giờ mong muốn.
4. Khách nhập ngày giờ → Bot kiểm tra lịch trống.
5. Bot confirm booking → Lưu vào DB → Gửi confirmation message.
6. Hệ thống tự động gửi reminder 24h và 2h trước giờ hẹn.

### Flow 2 – Admin quản lý booking qua Dashboard
1. Admin đăng nhập dashboard.
2. Xem danh sách bookings (hôm nay, tuần này, tháng này).
3. Filter/search bookings theo customer, status, service.
4. Update status (confirmed → completed / cancelled).
5. Xem customer profile (lịch sử bookings).
6. Gửi tin nhắn thủ công qua Zalo nếu cần.

### Flow 3 – Hệ thống gửi Reminder
1. CRON job chạy mỗi giờ (hoặc 15 phút).
2. Query bookings có `reminder_sent = false` và `booking_time - now() < 24h`.
3. Gửi Zalo message qua OA API.
4. Update `reminder_sent = true` trong DB.

---

## 5. (Nếu là hệ thống AI) – Intents / Slots / Actions

### 5.1. Intents (ý định lớn của chatbot)
- `book_appointment` – Khách muốn đặt lịch.
- `check_booking` – Khách muốn kiểm tra lịch đã đặt.
- `cancel_booking` – Khách muốn hủy lịch.
- `ask_services` – Khách hỏi về các dịch vụ.
- `ask_opening_hours` – Khách hỏi giờ mở cửa.

### 5.2. Slots (thông tin cần để xử lý intent)
- `service_type`: string, required (e.g., "cắt tóc", "nhuộm", "uốn").
- `booking_date`: date, required (e.g., "2025-12-15").
- `booking_time`: time, required (e.g., "14:00").
- `customer_name`: string, optional (lấy từ Zalo profile).
- `customer_phone`: string, optional.

### 5.3. Actions (hàm/operation cụ thể)
- `create_booking(service, date, time, customer) -> BookingID`
- `check_availability(date, time) -> boolean`
- `send_confirmation(booking_id) -> void`
- `cancel_booking(booking_id) -> void`
- `send_reminder(booking_id) -> void`

---

## 6. Dữ liệu & tích hợp

### Nguồn dữ liệu chính:
- **PostgreSQL** (primary database).
- **Zalo OA API** (messages, user profiles).

### Bảng/collection quan trọng:
- `users` – Customers (Zalo user ID, name, phone).
- `bookings` – Appointments (service, date, time, status).
- `messages` – Conversation history.
- `services` – Available services (name, duration, price).
- `settings` – Business settings (hours, holidays).

### Tích hợp với hệ thống nào:
- **Zalo Official Account API** – Send/receive messages, webhooks.
- **Vercel Serverless Functions** – API endpoints, webhook handlers.
- **PostgreSQL** (Vercel Postgres / Supabase / Railway).
- **Vercel Cron Jobs** – Reminder scheduler.

---

## 7. Đề xuất kiến trúc kỹ thuật

### Frontend:
- **Next.js 14+** (App Router)
- **TypeScript**
- **Tailwind CSS** (accent: #007AFF)
- **Vercel deployment**

### Backend:
- **Next.js Serverless Functions** (API routes)
- **Zod** (validation)
- **Drizzle ORM** hoặc **Prisma** (database ORM)

### Database:
- **PostgreSQL** (Vercel Postgres hoặc Supabase)

### AI providers:
- (Optional) **OpenAI GPT-4** cho natural language understanding.
- Hoặc **rule-based NLU** đơn giản cho MVP.

### Hạ tầng deploy:
- **Vercel** (frontend + serverless functions + cron jobs).
- **Supabase** hoặc **Railway** (PostgreSQL).

---

## 8. Phase & Gates

### Phase 1 – MVP (Single Business)

**Mục tiêu chính:**
- Khách hàng đặt lịch qua Zalo OA (manual chatbot với menu).
- Admin quản lý bookings qua dashboard.
- Reminder tự động trước 24h.

**Module/flow nào phải có:**
- ✅ Zalo Webhook Handler (nhận messages).
- ✅ Dashboard UI (CRUD bookings).
- ✅ Database schema (users, bookings, messages).
- ✅ Reminder CRON job.

**Gates:**

#### Gate 1 – Database Schema & Setup
- Tạo PostgreSQL database.
- Define schema cho 4 tables chính.
- Seed data mẫu (3 services).

#### Gate 2 – Frontend Cơ Bản ✅ DONE
- Dashboard layout (header, sidebar).
- Màu accent #007AFF.
- Navigation: Dashboard, Bookings, Customers, Messages, Settings.
- Stats grid (placeholder).

#### Gate 3 – Booking API (CRUD)
- POST `/api/bookings` – Create booking.
- GET `/api/bookings` – List bookings (filter by date).
- PATCH `/api/bookings/:id` – Update status.
- DELETE `/api/bookings/:id` – Cancel booking.

#### Gate 4 – Zalo Webhook Handler ✅ DONE
- POST `/api/webhook/zalo` – Nhận events.
- Console.log payload (MVP).
- Verify webhook với Zalo.

#### Gate 5 – Chatbot Logic (Menu-based)
- Detect "đặt lịch" → Show services menu.
- User chọn service → Ask for date/time.
- Create booking → Send confirmation.

#### Gate 6 – Reminder Job
- CRON job chạy mỗi giờ.
- Query bookings cần reminder.
- Gửi Zalo message qua OA API.

#### Gate 7 – Dashboard Integration
- Hiển thị danh sách bookings từ API.
- Filter theo date range.
- Update booking status.

#### Gate 8 – Testing & Deploy
- End-to-end test flows.
- Deploy to Vercel.
- Connect production Zalo OA.

---

### Phase 2 – Multi-Tenant & Advanced Features

**Sẽ có:**
- Multi-business support (SaaS model).
- Payment integration (Stripe/Momo).
- Advanced NLU với AI (OpenAI).
- Calendar sync (Google Calendar).
- Customer loyalty program.
- Analytics dashboard.

---

**End of Blueprint**
