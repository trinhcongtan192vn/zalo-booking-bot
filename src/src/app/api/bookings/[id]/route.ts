/**
 * Single Booking API - CRUD Operations
 * Project: Zalo Booking Bot (VC-ZBB-1225)
 * Gate: G8 - Dashboard Integration
 *
 * Endpoints:
 * - GET /api/bookings/:id - Get booking details
 * - PATCH /api/bookings/:id - Update booking (status, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/bookings/:id
 * Retrieve single booking by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = parseInt(params.id, 10);

    if (isNaN(bookingId)) {
      return NextResponse.json(
        { success: false, error: "Invalid booking ID" },
        { status: 400 }
      );
    }

    // Query booking from database
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error("[GET /api/bookings/:id] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bookings/:id
 * Update booking fields (status, etc.)
 *
 * Request body:
 * {
 *   status?: string (e.g., "confirmed", "completed", "cancelled")
 *   // Add other updatable fields as needed
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = parseInt(params.id, 10);

    if (isNaN(bookingId)) {
      return NextResponse.json(
        { success: false, error: "Invalid booking ID" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { status } = body;

    // Validate status if provided
    const validStatuses = ["confirmed", "completed", "cancelled", "pending"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Check if booking exists
    const existingBooking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
    });

    if (!existingBooking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Record<string, any> = {};
    if (status) updateData.status = status;

    // Perform update
    const updatedBooking = await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, bookingId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedBooking[0],
      message: "Booking updated successfully",
    });
  } catch (error) {
    console.error("[PATCH /api/bookings/:id] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
