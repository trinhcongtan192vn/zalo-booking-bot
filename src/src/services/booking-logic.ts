/**
 * Booking Logic Service
 * Project: Zalo Booking Bot (VC-ZBB-1225)
 * Gate: G5 - Chatbot Core Logic
 *
 * Handles conversation state machine and booking availability logic
 */

import { db, type Shop, type Booking, bookings } from "@/db";
import { and, eq, gte, lte } from "drizzle-orm";
import { sendMessage, getUserProfile } from "./zalo";

// Conversation state types
type ConversationState = "IDLE" | "WAITING_FOR_DATE" | "WAITING_FOR_TIME" | "CONFIRMATION";

interface UserSession {
  state: ConversationState;
  shopId: number;
  selectedDate?: string;
  selectedTime?: string;
  customerName?: string;
}

// In-memory session storage (production: use Redis/DB)
const userSessions = new Map<string, UserSession>();

/**
 * Get available time slots for a specific date
 * @param shop - Shop configuration
 * @param date - Target date (YYYY-MM-DD)
 * @returns Array of available time slots in HH:MM format
 */
export async function getAvailableSlots(
  shop: Shop,
  date: string
): Promise<string[]> {
  try {
    // Parse working hours (assuming format: { "monday": ["09:00-17:00"], ... })
    const workingHours = shop.workingHours as Record<string, string[]> || {};

    const targetDate = new Date(date);
    const dayOfWeek = targetDate.toLocaleDateString("en-US", { weekday: "lowercase" });

    const dayHours = workingHours[dayOfWeek];

    if (!dayHours || dayHours.length === 0) {
      return []; // Shop closed on this day
    }

    // Parse working hours (e.g., "09:00-17:00")
    const [startTime, endTime] = dayHours[0].split("-");
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    // Generate all possible slots based on service duration
    const allSlots: string[] = [];
    let currentHour = startHour;
    let currentMin = startMin;

    const serviceDuration = shop.serviceDurationMinutes;

    while (
      currentHour < endHour ||
      (currentHour === endHour && currentMin < endMin)
    ) {
      const slotTime = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`;
      allSlots.push(slotTime);

      // Increment by service duration
      currentMin += serviceDuration;
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60);
        currentMin = currentMin % 60;
      }
    }

    // Fetch existing bookings for this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingBookings = await db.query.bookings.findMany({
      where: and(
        eq(bookings.shopId, shop.id),
        gte(bookings.bookingStartTime, startOfDay),
        lte(bookings.bookingStartTime, endOfDay),
        eq(bookings.status, "confirmed")
      ),
    });

    // Filter out booked slots
    const availableSlots = allSlots.filter((slot) => {
      const [slotHour, slotMin] = slot.split(":").map(Number);
      const slotDate = new Date(date);
      slotDate.setHours(slotHour, slotMin, 0, 0);

      // Check if this slot conflicts with any booking
      return !existingBookings.some((booking) => {
        return (
          slotDate >= booking.bookingStartTime &&
          slotDate < booking.bookingEndTime
        );
      });
    });

    return availableSlots;
  } catch (error) {
    console.error("[Booking Logic] Error getting available slots:", error);
    return [];
  }
}

/**
 * Handle incoming message and manage conversation state
 * @param shopId - Shop ID
 * @param shop - Shop configuration
 * @param zaloUserId - Zalo user ID
 * @param message - User message text
 */
export async function handleIncomingMessage(
  shopId: number,
  shop: Shop,
  zaloUserId: string,
  message: string
): Promise<void> {
  try {
    // Log incoming message
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/chatlogs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shopId,
        zaloUserId,
        direction: "in",
        messageContent: message,
      }),
    });

    // Get or create user session
    const sessionKey = `${shopId}:${zaloUserId}`;
    let session = userSessions.get(sessionKey);

    if (!session) {
      session = {
        state: "IDLE",
        shopId,
      };
      userSessions.set(sessionKey, session);
    }

    const messageNormalized = message.toLowerCase().trim();
    let responseText = "";

    // State machine logic
    switch (session.state) {
      case "IDLE":
        // Detect booking intent
        if (
          messageNormalized.includes("đặt lịch") ||
          messageNormalized.includes("book") ||
          messageNormalized.includes("hẹn") ||
          messageNormalized.includes("lịch")
        ) {
          session.state = "WAITING_FOR_DATE";
          responseText = "Xin chào! Vui lòng cho tôi biết ngày bạn muốn đặt lịch (định dạng: YYYY-MM-DD, ví dụ: 2025-12-10):";
        } else {
          responseText = "Xin chào! Gửi 'đặt lịch' để bắt đầu đặt lịch hẹn.";
        }
        break;

      case "WAITING_FOR_DATE":
        // Parse date
        const dateMatch = message.match(/(\d{4})-(\d{2})-(\d{2})/);

        if (dateMatch) {
          const selectedDate = dateMatch[0];
          const targetDate = new Date(selectedDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          if (targetDate < today) {
            responseText = "Ngày không hợp lệ (đã qua). Vui lòng chọn ngày trong tương lai:";
            break;
          }

          session.selectedDate = selectedDate;

          // Get available slots
          const slots = await getAvailableSlots(shop, selectedDate);

          if (slots.length === 0) {
            responseText = `Không có slot trống cho ngày ${selectedDate}. Vui lòng chọn ngày khác:`;
            break;
          }

          session.state = "WAITING_FOR_TIME";
          responseText = `Các slot khả dụng cho ngày ${selectedDate}:\n${slots.join(", ")}\n\nVui lòng chọn giờ (ví dụ: 09:00):`;
        } else {
          responseText = "Định dạng ngày không đúng. Vui lòng nhập theo định dạng YYYY-MM-DD (ví dụ: 2025-12-10):";
        }
        break;

      case "WAITING_FOR_TIME":
        // Parse time
        const timeMatch = message.match(/(\d{2}):(\d{2})/);

        if (timeMatch && session.selectedDate) {
          const selectedTime = timeMatch[0];

          // Verify slot is available
          const availableSlots = await getAvailableSlots(shop, session.selectedDate);

          if (!availableSlots.includes(selectedTime)) {
            responseText = `Slot ${selectedTime} không khả dụng. Vui lòng chọn từ: ${availableSlots.join(", ")}`;
            break;
          }

          session.selectedTime = selectedTime;

          // Get customer name
          const profile = await getUserProfile(shop.zaloAccessToken, zaloUserId);
          session.customerName = profile?.name || "Khách hàng";

          session.state = "CONFIRMATION";

          const [hour, min] = selectedTime.split(":").map(Number);
          const endHour = hour + Math.floor((min + shop.serviceDurationMinutes) / 60);
          const endMin = (min + shop.serviceDurationMinutes) % 60;
          const endTime = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;

          responseText = `Xác nhận thông tin:\n📅 Ngày: ${session.selectedDate}\n⏰ Giờ: ${selectedTime} - ${endTime}\n👤 Tên: ${session.customerName}\n\nGửi 'OK' để xác nhận hoặc 'Hủy' để bắt đầu lại.`;
        } else {
          responseText = "Định dạng giờ không đúng. Vui lòng nhập theo định dạng HH:MM (ví dụ: 09:00):";
        }
        break;

      case "CONFIRMATION":
        if (messageNormalized.includes("ok") || messageNormalized.includes("xác nhận")) {
          // Create booking
          if (session.selectedDate && session.selectedTime && session.customerName) {
            const [hour, min] = session.selectedTime.split(":").map(Number);
            const bookingStartTime = new Date(session.selectedDate);
            bookingStartTime.setHours(hour, min, 0, 0);

            const bookingEndTime = new Date(bookingStartTime);
            bookingEndTime.setMinutes(bookingEndTime.getMinutes() + shop.serviceDurationMinutes);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/bookings`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                shopId,
                customerZaloId: zaloUserId,
                customerName: session.customerName,
                bookingStartTime: bookingStartTime.toISOString(),
                bookingEndTime: bookingEndTime.toISOString(),
                status: "confirmed",
              }),
            });

            const data = await response.json();

            if (data.success) {
              responseText = `✅ Đặt lịch thành công!\n📋 Mã booking: #${data.booking.id}\n📅 Ngày: ${session.selectedDate}\n⏰ Giờ: ${session.selectedTime}\n\nCảm ơn bạn đã đặt lịch!`;

              // Reset session
              session.state = "IDLE";
              session.selectedDate = undefined;
              session.selectedTime = undefined;
            } else {
              responseText = `❌ Lỗi khi tạo booking: ${data.error}\n\nVui lòng thử lại sau.`;
              session.state = "IDLE";
            }
          }
        } else if (messageNormalized.includes("hủy") || messageNormalized.includes("cancel")) {
          session.state = "IDLE";
          session.selectedDate = undefined;
          session.selectedTime = undefined;
          responseText = "Đã hủy. Gửi 'đặt lịch' để bắt đầu lại.";
        } else {
          responseText = "Vui lòng gửi 'OK' để xác nhận hoặc 'Hủy' để bắt đầu lại.";
        }
        break;
    }

    // Send response
    await sendMessage(shop.zaloAccessToken, zaloUserId, { text: responseText });

    // Log outgoing message
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/chatlogs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shopId,
        zaloUserId,
        direction: "out",
        messageContent: responseText,
      }),
    });

    // Update session
    userSessions.set(sessionKey, session);
  } catch (error) {
    console.error("[Booking Logic] Error handling message:", error);

    // Send error message
    try {
      await sendMessage(shop.zaloAccessToken, zaloUserId, {
        text: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.",
      });
    } catch (sendError) {
      console.error("[Booking Logic] Failed to send error message:", sendError);
    }
  }
}

/**
 * Clear user session (for testing or manual reset)
 */
export function clearUserSession(shopId: number, zaloUserId: string): void {
  const sessionKey = `${shopId}:${zaloUserId}`;
  userSessions.delete(sessionKey);
}
