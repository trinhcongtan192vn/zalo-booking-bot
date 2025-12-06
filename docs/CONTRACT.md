# CONTRACT – Thỏa thuận phạm vi & tiêu chuẩn cho Phase 1

**Project:** Zalo Booking Bot (VC-ZBB-1225)
**Phase:** 1 (MVP)
**Version:** 1.0
**Date:** 2025-12-06

---

## 1. Scope – Những gì sẽ làm trong Phase 1

### Tính năng / Module:

#### ✅ G1 – Database Schema & Setup
- PostgreSQL database với 4 tables: `users`, `bookings`, `messages`, `services`.
- Migration scripts.
- Seed data cho 3 dịch vụ mẫu (Cắt tóc, Nhuộm, Uốn).

#### ✅ G2 – Frontend Cơ Bản (Dashboard) ✅ COMPLETED
- Layout: Header + Sidebar + Main Content.
- Navigation: Dashboard, Bookings, Customers, Messages, Settings.
- Accent color: **#007AFF** (Zalo blue).
- Stats grid (placeholder với số 0).
- Responsive design (desktop + mobile).

#### ✅ G3 – Booking API (CRUD)
- `POST /api/bookings` – Tạo booking mới.
- `GET /api/bookings` – Lấy danh sách bookings (filter: date, status).
- `PATCH /api/bookings/:id` – Cập nhật status (confirmed, completed, cancelled).
- `DELETE /api/bookings/:id` – Xóa/hủy booking.
- Validation với Zod.

#### ✅ G4 – Zalo Webhook Handler ✅ COMPLETED
- `POST /api/webhook/zalo` – Nhận events từ Zalo OA.
- Console.log payload (MVP).
- Return 200 OK.
- Webhook verification (GET handler).

#### G5 – Chatbot Logic (Menu-based)
- Detect keywords: "đặt lịch", "book", "hẹn".
- Gửi menu dịch vụ (Quick Reply buttons).
- User chọn service → Hỏi ngày/giờ.
- Parse date/time từ text (simple regex).
- Create booking → Gửi confirmation message.

#### G6 – Reminder Job (CRON)
- Vercel Cron Job chạy mỗi giờ (`0 * * * *`).
- Query bookings có `reminder_sent = false` và `booking_time - now() < 24 hours`.
- Gửi Zalo message qua OA API.
- Update `reminder_sent = true`.

#### G7 – Dashboard Integration (Data Binding)
- Fetch bookings từ API (`GET /api/bookings`).
- Hiển thị trong table với filter (date range, status).
- Update booking status (confirm, complete, cancel).
- View customer details.

#### G8 – Testing & Deployment
- Manual testing cho 3 flows chính.
- Deploy to **Vercel**.
- Connect production Zalo OA.
- Environment variables setup.

### Quy trình:
1. Database setup → API development → Frontend integration.
2. Webhook → Chatbot logic → Reminder job.
3. Testing → Deploy → Production handoff.

### Tài liệu cần tạo:
- ✅ BLUEPRINT.md
- ✅ CONTRACT.md (file này)
- GATES.md (tracking log)
- API_SPEC.md (chi tiết API endpoints)
- DEPLOYMENT.md (hướng dẫn deploy)
- README.md (updated với setup instructions)

---

## 2. Out-of-scope – Những gì KHÔNG làm trong Phase 1

### ❌ Không làm:
- **Multi-tenant** (chỉ support 1 business duy nhất).
- **Payment integration** (Stripe/Momo) → Phase 2.
- **Advanced NLU** với OpenAI/Anthropic → Phase 2.
- **Calendar sync** (Google Calendar, Outlook) → Phase 2.
- **Customer loyalty program** → Phase 2.
- **Analytics dashboard** (charts, reports) → Phase 2.
- **Mobile app** (React Native) → Phase 3.
- **Email/SMS notifications** (chỉ Zalo messages).
- **Staff management** (multiple staff members, shifts) → Phase 2.
- **Service packages** (combos, memberships) → Phase 2.
- **Photo upload** (customer profile pics, service images) → Phase 2.

### Quy tắc khi "nảy ra" giữa đường:
- Ghi vào `docs/BACKLOG.md`.
- Tag với phase (P2, P3).
- **KHÔNG** tự ý nhồi vào Phase 1.
- Review cuối sprint để prioritize cho Phase 2.

---

## 3. Definition of Done (DoD)

Phase 1 chỉ được coi là **"XONG"** khi:

### ✅ Chức năng:
- [ ] Khách hàng có thể đặt lịch qua Zalo OA (chatbot menu-based).
- [ ] Booking được lưu vào database với đầy đủ thông tin.
- [ ] Admin xem được danh sách bookings trên dashboard.
- [ ] Admin có thể update status booking (confirm, complete, cancel).
- [ ] Reminder tự động gửi trước 24h (CRON job hoạt động).
- [ ] Hệ thống deployed trên Vercel, kết nối production Zalo OA.

### ✅ Chất lượng:
- [ ] UI follow accent color **#007AFF**.
- [ ] Dashboard responsive (desktop + mobile).
- [ ] API responses < 500ms (p95).
- [ ] Zero critical bugs.
- [ ] Code có comments cho logic phức tạp.

### ✅ Tài liệu:
- [ ] BLUEPRINT.md, CONTRACT.md, GATES.md hoàn thành.
- [ ] API_SPEC.md đầy đủ cho 4 endpoints.
- [ ] DEPLOYMENT.md hướng dẫn deploy.
- [ ] README.md cập nhật setup instructions.

### ✅ Testing:
- [ ] Manual test 3 flows chính (book, manage, remind).
- [ ] Webhook verified với Zalo OA.
- [ ] CRON job test (dry run).

---

## 4. Yêu cầu chất lượng

### Về UX/UI:
- **Accent color:** #007AFF (bắt buộc).
- **Font:** System fonts (Arial, Helvetica).
- **Spacing:** Tailwind default scale.
- **Responsive:** Mobile-first, desktop-optimized.
- **Loading states:** Skeleton loaders cho API calls.
- **Error messages:** User-friendly, không leak technical details.

### Về hiệu năng:
- **Dashboard load time:** < 2s (FCP).
- **API response time:** < 500ms (p95).
- **Zalo webhook response:** < 1s (Zalo yêu cầu < 5s).
- **Database queries:** Indexed properly, no N+1.

### Về code (nếu có):
- **TypeScript strict mode:** Bật.
- **ESLint:** Next.js recommended config.
- **Prettier:** Format on save.
- **File naming:** kebab-case cho files, PascalCase cho components.
- **API routes:** 1 file = 1 endpoint (hoặc resource group).
- **Comments:** Cho logic phức tạp (> 10 lines).

### Về tài liệu & onboarding:
- **README.md:** Setup trong < 5 phút (với npm install).
- **Environment variables:** .env.example đầy đủ.
- **API docs:** Request/response examples.
- **Comments:** Inline cho webhook handler, chatbot logic.

---

## 5. GATES & tiêu chí

### ✅ Gate 1 – Database Schema & Setup
**Tiêu chí qua:**
- [ ] PostgreSQL database đã tạo.
- [ ] 4 tables: users, bookings, messages, services.
- [ ] Migration script chạy thành công.
- [ ] Seed data 3 services.

### ✅ Gate 2 – Frontend Cơ Bản ✅ COMPLETED
**Tiêu chí qua:**
- [x] Dashboard layout (header + sidebar + main).
- [x] Accent color #007AFF applied.
- [x] Navigation links (5 pages).
- [x] Stats grid (4 cards).
- [x] Responsive design.

### Gate 3 – Booking API (CRUD)
**Tiêu chí qua:**
- [ ] POST /api/bookings – Tạo booking, return booking_id.
- [ ] GET /api/bookings – Lấy list, filter by date/status.
- [ ] PATCH /api/bookings/:id – Update status.
- [ ] DELETE /api/bookings/:id – Xóa booking.
- [ ] Validation errors return 400 với message rõ ràng.

### ✅ Gate 4 – Zalo Webhook Handler ✅ COMPLETED
**Tiêu chí qua:**
- [x] POST /api/webhook/zalo – Nhận payload.
- [x] Console.log payload.
- [x] Return 200 OK.
- [x] GET handler cho verification.

### Gate 5 – Chatbot Logic (Menu-based)
**Tiêu chí qua:**
- [ ] Detect "đặt lịch" keyword.
- [ ] Gửi menu dịch vụ (Quick Reply).
- [ ] Parse user selection.
- [ ] Hỏi ngày/giờ.
- [ ] Create booking.
- [ ] Gửi confirmation message.

### Gate 6 – Reminder Job (CRON)
**Tiêu chí qua:**
- [ ] Vercel Cron Job configured (`vercel.json`).
- [ ] Query bookings cần reminder.
- [ ] Gửi Zalo message.
- [ ] Update reminder_sent = true.
- [ ] Log thành công/thất bại.

### Gate 7 – Dashboard Integration
**Tiêu chí qua:**
- [ ] Fetch bookings từ API.
- [ ] Hiển thị trong table.
- [ ] Filter by date range.
- [ ] Update status button hoạt động.
- [ ] View customer details.

### Gate 8 – Testing & Deploy
**Tiêu chí qua:**
- [ ] Manual test 3 flows pass.
- [ ] Deploy to Vercel thành công.
- [ ] Production Zalo OA connected.
- [ ] Environment variables set.
- [ ] Zero critical bugs.

---

## 6. Quy tắc thay đổi

### Nếu cần đổi scope:
1. Tạo GitHub Issue (hoặc ghi vào BACKLOG.md).
2. Discuss với team (hoặc stakeholder).
3. Nếu approve → Update CONTRACT.md và đánh dấu version mới.
4. Nếu reject → Chuyển sang Phase 2 backlog.

### Nếu cần đổi kiến trúc:
1. Document lý do (technical debt, performance, security).
2. Update BLUEPRINT.md với kiến trúc mới.
3. Estimate effort (man-hours).
4. Nếu impact > 20% timeline → Escalate.

### Version history:
- **v1.0** (2025-12-06) – Initial contract.

---

**End of Contract**
