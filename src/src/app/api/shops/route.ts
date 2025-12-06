import { NextRequest, NextResponse } from "next/server";
import { db, shops } from "@/db";

/**
 * Shop Configuration API
 * Project: Zalo Booking Bot (VC-ZBB-1225)
 * Gate: G3 - Logic API
 *
 * POST /api/shops - Create new shop configuration
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      userId,
      shopName,
      zaloOaId,
      zaloAccessToken,
      serviceDurationMinutes,
      workingHours,
    } = body;

    // Basic validation
    if (!userId || !shopName || !zaloOaId || !zaloAccessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: userId, shopName, zaloOaId, zaloAccessToken",
        },
        { status: 400 }
      );
    }

    // Insert new shop into database
    const newShop = await db
      .insert(shops)
      .values({
        userId,
        shopName,
        zaloOaId,
        zaloAccessToken,
        serviceDurationMinutes: serviceDurationMinutes || 60,
        workingHours: workingHours || {},
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        shop: newShop[0],
        message: "Shop created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API /shops] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create shop",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/shops - List shops for a user
 * Query params: userId
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing userId parameter",
        },
        { status: 400 }
      );
    }

    // Query shops by userId
    const userShops = await db.query.shops.findMany({
      where: (shops, { eq }) => eq(shops.userId, parseInt(userId)),
    });

    return NextResponse.json(
      {
        success: true,
        shops: userShops,
        count: userShops.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API /shops GET] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch shops",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
