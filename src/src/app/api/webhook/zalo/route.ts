import { NextRequest, NextResponse } from "next/server";
import { db, shops } from "@/db";
import { eq } from "drizzle-orm";
import { handleIncomingMessage } from "@/services/booking-logic";

/**
 * Zalo OA Webhook Handler
 * Receives POST requests from Zalo Official Account
 *
 * Gate: G4 - Webhook Handler (Updated in G5)
 * Project: VC-ZBB-1225
 */
export async function POST(request: NextRequest) {
  try {
    // Parse incoming webhook payload
    const payload = await request.json();

    // Log the received payload
    console.log("=== Zalo Webhook Received ===");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Payload:", JSON.stringify(payload, null, 2));
    console.log("=============================");

    // Extract event data
    const eventName = payload.event_name;

    // Handle user message event
    if (eventName === "user_send_text") {
      const oaId = payload.recipient?.id;
      const userId = payload.sender?.id;
      const messageText = payload.message?.text;

      if (!oaId || !userId || !messageText) {
        console.warn("[Webhook] Missing required fields in payload");
        return NextResponse.json(
          { success: true, message: "Missing fields" },
          { status: 200 }
        );
      }

      // Find shop configuration by Zalo OA ID
      const shop = await db.query.shops.findFirst({
        where: eq(shops.zaloOaId, oaId),
      });

      if (!shop) {
        console.warn(`[Webhook] Shop not found for OA ID: ${oaId}`);
        return NextResponse.json(
          { success: true, message: "Shop not configured" },
          { status: 200 }
        );
      }

      // Process message with chatbot logic
      // Run async (don't await to return 200 quickly)
      handleIncomingMessage(shop.id, shop, userId, messageText).catch((error) => {
        console.error("[Webhook] Error processing message:", error);
      });

      return NextResponse.json(
        {
          success: true,
          message: "Message processing started",
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    // Handle follow event
    if (eventName === "follow") {
      const oaId = payload.recipient?.id;
      const userId = payload.follower?.id;

      console.log(`[Webhook] User ${userId} followed OA ${oaId}`);

      // Find shop and send welcome message
      const shop = await db.query.shops.findFirst({
        where: eq(shops.zaloOaId, oaId),
      });

      if (shop) {
        const { sendMessage } = await import("@/services/zalo");
        await sendMessage(shop.zaloAccessToken, userId, {
          text: `Xin chào! Cảm ơn bạn đã theo dõi ${shop.shopName}. Gửi 'đặt lịch' để đặt lịch hẹn.`,
        });
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Handle unfollow event
    if (eventName === "unfollow") {
      const userId = payload.follower?.id;
      console.log(`[Webhook] User ${userId} unfollowed`);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Unknown event type
    console.log(`[Webhook] Unhandled event type: ${eventName}`);
    return NextResponse.json(
      {
        success: true,
        message: "Event received but not processed",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Webhook] Error processing Zalo webhook:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process webhook",
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler for webhook verification
 * Some webhook providers require GET endpoint for verification
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get("challenge");

  if (challenge) {
    console.log("Webhook verification requested");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json(
    {
      status: "active",
      endpoint: "/api/webhook/zalo",
      message: "Zalo Webhook Handler",
    },
    { status: 200 }
  );
}
