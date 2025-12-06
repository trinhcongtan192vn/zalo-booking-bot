/**
 * Dashboard Page - Main Admin Interface
 * Project: Zalo Booking Bot (VC-ZBB-1225)
 * Gate: G8 - Dashboard Integration
 *
 * Features:
 * - Display user session info (name, email)
 * - Show shop configuration (shop name, Zalo OA ID)
 * - List recent bookings in a table
 * - Action buttons for status updates
 */

import { auth } from "@/auth";
import { db } from "@/db";
import { shops, bookings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // Get authenticated session
  const session = await auth();

  // Redirect if not authenticated (middleware should handle this, but double-check)
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;
  const userName = session.user.name || "User";
  const userEmail = session.user.email || "";

  // Fetch shop configuration (first shop of the user)
  const shopConfig = await db.query.shops.findFirst({
    where: eq(shops.userId, parseInt(userId)),
  });

  // Fetch bookings if shop exists
  let recentBookings: any[] = [];
  if (shopConfig) {
    recentBookings = await db.query.bookings.findMany({
      where: eq(bookings.shopId, shopConfig.id),
      orderBy: [desc(bookings.bookingStartTime)],
      limit: 100,
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold" style={{ color: "#007AFF" }}>
              Zalo Booking Bot
            </h1>
            <span className="text-sm text-gray-500">Dashboard</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500">{userEmail}</p>
            </div>
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-blue-600 transition"
                style={{ backgroundColor: "#007AFF" }}
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)]">
          <nav className="p-4 space-y-2">
            <a
              href="/dashboard"
              className="flex items-center px-4 py-3 text-sm font-medium rounded-lg text-white"
              style={{ backgroundColor: "#007AFF" }}
            >
              <svg
                className="w-5 h-5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Dashboard
            </a>
            <a
              href="/dashboard/bookings"
              className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <svg
                className="w-5 h-5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Bookings
            </a>
            <a
              href="/dashboard/customers"
              className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <svg
                className="w-5 h-5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              Customers
            </a>
            <a
              href="/dashboard/messages"
              className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <svg
                className="w-5 h-5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              Messages
            </a>
            <a
              href="/dashboard/settings"
              className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <svg
                className="w-5 h-5 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Settings
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome, {userName}!
            </h2>
            <p className="text-gray-600">
              Manage your Zalo bookings and customer interactions
            </p>
          </div>

          {/* Shop Configuration Section */}
          {shopConfig ? (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Shop Configuration
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Shop Name</p>
                  <p className="text-base font-medium text-gray-900">
                    {shopConfig.shopName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Zalo OA ID</p>
                  <p className="text-base font-medium text-gray-900">
                    {shopConfig.zaloOaId}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
              <p className="text-yellow-800">
                No shop configured yet. Please set up your shop in Settings.
              </p>
            </div>
          )}

          {/* Bookings Table Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Bookings ({recentBookings.length})
              </h3>
            </div>

            {recentBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Start Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        End Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentBookings.map((booking) => {
                      // Format dates
                      const startTime = new Date(
                        booking.bookingStartTime
                      ).toLocaleString("vi-VN");
                      const endTime = new Date(
                        booking.bookingEndTime
                      ).toLocaleString("vi-VN");

                      // Status badge color
                      let statusColor = "bg-gray-100 text-gray-800";
                      if (booking.status === "confirmed")
                        statusColor = "bg-blue-100 text-blue-800";
                      if (booking.status === "completed")
                        statusColor = "bg-green-100 text-green-800";
                      if (booking.status === "cancelled")
                        statusColor = "bg-red-100 text-red-800";

                      return (
                        <tr key={booking.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            #{booking.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {booking.customerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {startTime}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {endTime}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}
                            >
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              className="px-3 py-1 text-xs font-medium text-white rounded hover:opacity-80 transition"
                              style={{ backgroundColor: "#007AFF" }}
                              title={`Update status for Booking #${booking.id}`}
                            >
                              Update Status
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6">
                <p className="text-gray-500 text-center py-8">
                  No bookings yet. Customers can book via your Zalo OA.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
