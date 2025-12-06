import { NextRequest, NextResponse } from "next/server";
import { db, bookings } from "@/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";

/**
 * Booking Management API
 * Project: Zalo Booking Bot (VC-ZBB-1225)
 * Gate: G3 - Logic API
 *
 * POST /api/bookings - Create new booking
 * GET /api/bookings - List bookings with filters
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      shopId,
      customerZaloId,
      customerName,
      bookingStartTime,
      bookingEndTime,
      status,
    } = body;

    // Basic validation
    if (
      !shopId ||
      !customerZaloId ||
      !customerName ||
      !bookingStartTime ||
      !bookingEndTime
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: shopId, customerZaloId, customerName, bookingStartTime, bookingEndTime",
        },
        { status: 400 }
      );
    }

    // Convert string timestamps to Date objects
    const startTime = new Date(bookingStartTime);
    const endTime = new Date(bookingEndTime);

    // Validate dates
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid date format for bookingStartTime or bookingEndTime",
        },
        { status: 400 }
      );
    }

    if (startTime >= endTime) {
      return NextResponse.json(
        {
          success: false,
          error: "bookingStartTime must be before bookingEndTime",
        },
        { status: 400 }
      );
    }

    // Check for overlapping bookings (optional - basic conflict check)
    const overlappingBookings = await db.query.bookings.findMany({
      where: and(
        eq(bookings.shopId, shopId),
        sql`${bookings.bookingStartTime} < ${endTime}`,
        sql`${bookings.bookingEndTime} > ${startTime}`,
        sql`${bookings.status} != 'cancelled'`
      ),
    });

    if (overlappingBookings.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Time slot already booked",
          conflictingBookings: overlappingBookings,
        },
        { status: 409 }
      );
    }

    // Insert new booking
    const newBooking = await db
      .insert(bookings)
      .values({
        shopId,
        customerZaloId,
        customerName,
        bookingStartTime: startTime,
        bookingEndTime: endTime,
        status: status || "confirmed",
        isReminded: false,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        booking: newBooking[0],
        message: "Booking created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API /bookings POST] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create booking",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bookings - List bookings with filters
 * Query params:
 * - shopId (required)
 * - date (optional, format: YYYY-MM-DD) - Filter bookings for specific date
 * - status (optional) - Filter by status (confirmed, completed, cancelled)
 * - dateFrom (optional, format: YYYY-MM-DD) - Filter bookings from this date
 * - dateTo (optional, format: YYYY-MM-DD) - Filter bookings to this date
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");
    const date = searchParams.get("date");
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    if (!shopId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing shopId parameter",
        },
        { status: 400 }
      );
    }

    // Build filter conditions
    const conditions = [eq(bookings.shopId, parseInt(shopId))];

    // Filter by specific date
    if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      conditions.push(gte(bookings.bookingStartTime, targetDate));
      conditions.push(lte(bookings.bookingStartTime, nextDay));
    }

    // Filter by date range
    if (dateFrom) {
      conditions.push(gte(bookings.bookingStartTime, new Date(dateFrom)));
    }

    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setDate(endDate.getDate() + 1);
      conditions.push(lte(bookings.bookingStartTime, endDate));
    }

    // Filter by status
    if (status) {
      conditions.push(eq(bookings.status, status));
    }

    // Query bookings
    const shopBookings = await db.query.bookings.findMany({
      where: and(...conditions),
      orderBy: (bookings, { desc }) => [desc(bookings.bookingStartTime)],
    });

    return NextResponse.json(
      {
        success: true,
        bookings: shopBookings,
        count: shopBookings.length,
        filters: {
          shopId: parseInt(shopId),
          date,
          status,
          dateFrom,
          dateTo,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API /bookings GET] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch bookings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
