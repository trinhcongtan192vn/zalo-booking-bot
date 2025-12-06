import { NextRequest, NextResponse } from "next/server";
import { db, chatLogs } from "@/db";
import { eq, desc } from "drizzle-orm";

/**
 * Chat Logs API
 * Project: Zalo Booking Bot (VC-ZBB-1225)
 * Gate: G3 - Logic API
 *
 * POST /api/chatlogs - Create new chat log entry
 * GET /api/chatlogs - Retrieve chat logs for a shop/user
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { shopId, zaloUserId, direction, messageContent } = body;

    // Basic validation
    if (!shopId || !zaloUserId || !direction || !messageContent) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: shopId, zaloUserId, direction, messageContent",
        },
        { status: 400 }
      );
    }

    // Validate direction
    if (direction !== "in" && direction !== "out") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid direction. Must be 'in' or 'out'",
        },
        { status: 400 }
      );
    }

    // Insert chat log
    const newChatLog = await db
      .insert(chatLogs)
      .values({
        shopId,
        zaloUserId,
        direction,
        messageContent,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        chatLog: newChatLog[0],
        message: "Chat log created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API /chatlogs POST] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create chat log",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/chatlogs - Retrieve chat logs
 * Query params:
 * - shopId (required)
 * - zaloUserId (optional) - Filter by specific Zalo user
 * - limit (optional) - Number of logs to return (default: 50, max: 200)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");
    const zaloUserId = searchParams.get("zaloUserId");
    const limitParam = searchParams.get("limit");

    if (!shopId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing shopId parameter",
        },
        { status: 400 }
      );
    }

    // Parse limit
    const limit = limitParam
      ? Math.min(parseInt(limitParam), 200)
      : 50;

    // Build query conditions
    const conditions = [eq(chatLogs.shopId, parseInt(shopId))];

    if (zaloUserId) {
      conditions.push(eq(chatLogs.zaloUserId, zaloUserId));
    }

    // Query chat logs
    const logs = await db.query.chatLogs.findMany({
      where: conditions.length > 1 ?
        (chatLogs, { and }) => and(...conditions.map(c => c)) :
        conditions[0],
      orderBy: [desc(chatLogs.timestamp)],
      limit,
    });

    return NextResponse.json(
      {
        success: true,
        chatLogs: logs,
        count: logs.length,
        filters: {
          shopId: parseInt(shopId),
          zaloUserId,
          limit,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API /chatlogs GET] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch chat logs",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
