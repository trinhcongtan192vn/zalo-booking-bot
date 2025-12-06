# API SPEC – Zalo Webhook Handler

**Project:** Zalo Booking Bot (VC-ZBB-1225)
**Module:** G4 - Zalo Webhook Handler
**Version:** 1.0
**Date:** 2025-12-06

---

## 1. Mục đích

API này dùng để nhận webhook events từ Zalo Official Account (OA). Khi user gửi tin nhắn hoặc tương tác với OA, Zalo sẽ gửi POST request đến endpoint này.

**Ai/Module nào sẽ gọi nó:**
- Zalo OA Platform (external service).

**Use cases:**
- Nhận tin nhắn từ khách hàng.
- Nhận follow/unfollow events.
- Nhận payment events (future).

---

## 2. Endpoints

### POST /api/webhook/zalo

**Mô tả:**
Nhận webhook events từ Zalo OA. Zalo yêu cầu response < 5 giây, nếu không sẽ retry.

**Headers đặc biệt:**
- `Content-Type: application/json`
- `X-Zalo-Signature` (optional, cho signature verification - future implementation)

**Request body (Example 1 - User Message):**
```json
{
  "event_name": "user_send_text",
  "timestamp": 1670000000000,
  "sender": {
    "id": "1234567890123456789"
  },
  "recipient": {
    "id": "9876543210987654321"
  },
  "message": {
    "text": "Đặt lịch cắt tóc",
    "msg_id": "msg_abc123"
  }
}
```

**Request body (Example 2 - User Follow):**
```json
{
  "event_name": "follow",
  "timestamp": 1670000000000,
  "follower": {
    "id": "1234567890123456789"
  },
  "recipient": {
    "id": "9876543210987654321"
  }
}
```

**Request body (Example 3 - User Unfollow):**
```json
{
  "event_name": "unfollow",
  "timestamp": 1670000000000,
  "follower": {
    "id": "1234567890123456789"
  },
  "recipient": {
    "id": "9876543210987654321"
  }
}
```

**Response body (Success):**
```json
{
  "success": true,
  "message": "Webhook received successfully",
  "timestamp": "2025-12-06T10:30:00.000Z"
}
```

**Response status:** `200 OK`

**Mã lỗi và ý nghĩa:**
- `200 OK` – Webhook nhận thành công, Zalo sẽ không retry.
- `500 Internal Server Error` – Lỗi xử lý, Zalo sẽ retry sau 1 phút.
- `400 Bad Request` – Payload không hợp lệ (ít khi xảy ra vì Zalo send).

---

### GET /api/webhook/zalo

**Mô tả:**
Endpoint verification cho Zalo OA. Khi setup webhook URL, Zalo sẽ gửi GET request với `challenge` parameter để verify ownership.

**Query Parameters:**
- `challenge` (string, optional) – Random string từ Zalo để verify.

**Request example:**
```
GET /api/webhook/zalo?challenge=abc123xyz
```

**Response body (Verification):**
```
abc123xyz
```
(Return plain text challenge string)

**Response body (Status Check - no challenge):**
```json
{
  "status": "active",
  "endpoint": "/api/webhook/zalo",
  "message": "Zalo Webhook Handler"
}
```

**Response status:** `200 OK`

**Mã lỗi và ý nghĩa:**
- `200 OK` – Verification thành công.
- `400 Bad Request` – Missing challenge parameter (khi Zalo verify).

---

## 3. Quy tắc bảo mật & phân quyền

### Ai được phép gọi?
- **Zalo OA Platform** (external service).
- Public endpoint (không cần authentication), nhưng nên verify signature.

### Signature Verification (Future Implementation):
Zalo gửi `X-Zalo-Signature` header để verify request authenticity:
1. Compute HMAC-SHA256 của request body với `app_secret`.
2. So sánh với `X-Zalo-Signature`.
3. Nếu không khớp → Return 401 Unauthorized.

**Example (pseudo-code):**
```typescript
const crypto = require('crypto');

const signature = request.headers['x-zalo-signature'];
const body = JSON.stringify(request.body);
const secret = process.env.ZALO_APP_SECRET;

const computed = crypto
  .createHmac('sha256', secret)
  .update(body)
  .digest('hex');

if (signature !== computed) {
  return res.status(401).json({ error: 'Invalid signature' });
}
```

### Rate Limiting:
- Không cần rate limit (Zalo control traffic).
- Nếu có spam → Report đến Zalo support.

---

## 4. Ghi chú implement

### Performance:
- **Response time target:** < 1 second (Zalo timeout: 5s).
- **Strategy:** Nhận webhook → Log → Return 200 ngay → Process async.
- Sử dụng background job (queue) cho heavy processing (database writes, AI calls).

### Logging:
- Log mọi webhook event (timestamp, event_name, sender_id).
- Log format: JSON cho dễ parse.
- Store trong database (`messages` table) hoặc logging service (Sentry, LogFlare).

### Error Handling:
- Nếu có lỗi → Return 500 → Zalo sẽ retry.
- Retry strategy của Zalo: 1 phút, 5 phút, 15 phút.
- Idempotency: Check `msg_id` để tránh xử lý trùng.

### Async Processing (Future):
```typescript
// Webhook handler (sync)
export async function POST(request: NextRequest) {
  const payload = await request.json();

  // Log immediately
  console.log('Webhook received:', payload);

  // Enqueue for async processing
  await queue.add('process-message', payload);

  // Return 200 immediately
  return NextResponse.json({ success: true }, { status: 200 });
}

// Worker (async)
async function processMessage(payload) {
  // Parse message
  // Call chatbot logic
  // Create booking
  // Send response to Zalo
}
```

### Testing:
- **Local testing:** Use ngrok to expose localhost.
  ```bash
  ngrok http 3000
  # Webhook URL: https://abc123.ngrok.io/api/webhook/zalo
  ```
- **Mock webhook:** Use Postman/Thunder Client to send test payloads.
- **Production:** Connect real Zalo OA, test với Zalo app.

### Monitoring:
- Track webhook success rate (target: > 99%).
- Alert nếu có > 5 failures liên tiếp.
- Monitor response time (target: p95 < 1s).

---

## 5. Payload Examples (Reference)

### Event: User Send Image
```json
{
  "event_name": "user_send_image",
  "timestamp": 1670000000000,
  "sender": {
    "id": "1234567890123456789"
  },
  "recipient": {
    "id": "9876543210987654321"
  },
  "message": {
    "msg_id": "msg_img123",
    "attachments": [
      {
        "type": "image",
        "payload": {
          "url": "https://zalo.me/image/abc123.jpg"
        }
      }
    ]
  }
}
```

### Event: User Send Sticker
```json
{
  "event_name": "user_send_sticker",
  "timestamp": 1670000000000,
  "sender": {
    "id": "1234567890123456789"
  },
  "message": {
    "msg_id": "msg_sticker456",
    "sticker_id": "sticker_789"
  }
}
```

### Event: User Click Button (Quick Reply)
```json
{
  "event_name": "user_clicked_button",
  "timestamp": 1670000000000,
  "sender": {
    "id": "1234567890123456789"
  },
  "message": {
    "msg_id": "msg_button789",
    "payload": "service_haircut"
  }
}
```

---

## 6. Zalo OA API Reference

**Official Docs:** https://developers.zalo.me/docs/api/official-account-api

**Key APIs:**
- **Send Message:** `POST https://openapi.zalo.me/v3.0/oa/message/cs`
- **Get User Profile:** `GET https://openapi.zalo.me/v3.0/oa/getprofile`
- **Send Quick Reply:** Include `buttons` array trong message payload.

**Authentication:**
- Cần `access_token` (lấy từ Zalo Developer Console).
- Refresh token mỗi 90 ngày.

---

**End of API Spec**
