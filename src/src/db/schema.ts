import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
  boolean,
  text,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * GATE G1 - Database Schema
 * Project: Zalo Booking Bot (VC-ZBB-1225)
 * ORM: Drizzle ORM + PostgreSQL
 */

// ====================================================================
// Table 1: users (Quản lý tài khoản Chủ shop)
// ====================================================================
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  googleId: varchar("google_id", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ====================================================================
// Table 2: shops (Cấu hình Zalo OA & Giờ làm việc)
// ====================================================================
export const shops = pgTable("shops", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  shopName: varchar("shop_name", { length: 255 }).notNull(),
  zaloOaId: varchar("zalo_oa_id", { length: 255 }).notNull(),
  zaloAccessToken: varchar("zalo_access_token", { length: 500 }).notNull(),
  serviceDurationMinutes: integer("service_duration_minutes").default(60).notNull(),
  workingHours: jsonb("working_hours").default({}).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ====================================================================
// Table 3: bookings (Lịch hẹn đã đặt)
// ====================================================================
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  customerZaloId: varchar("customer_zalo_id", { length: 255 }).notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  bookingStartTime: timestamp("booking_start_time", { withTimezone: true }).notNull(),
  bookingEndTime: timestamp("booking_end_time", { withTimezone: true }).notNull(),
  status: varchar("status", { length: 50 }).default("confirmed").notNull(),
  isReminded: boolean("is_reminded").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ====================================================================
// Table 4: chat_logs (Lịch sử hội thoại bot)
// ====================================================================
export const chatLogs = pgTable("chat_logs", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id")
    .notNull()
    .references(() => shops.id, { onDelete: "cascade" }),
  zaloUserId: varchar("zalo_user_id", { length: 255 }).notNull(),
  direction: varchar("direction", { length: 10 }).notNull(), // 'in' or 'out'
  messageContent: text("message_content").notNull(),
  timestamp: timestamp("timestamp", { withTimezone: true }).defaultNow().notNull(),
});

// ====================================================================
// Relations (Drizzle ORM)
// ====================================================================

export const usersRelations = relations(users, ({ many }) => ({
  shops: many(shops),
}));

export const shopsRelations = relations(shops, ({ one, many }) => ({
  user: one(users, {
    fields: [shops.userId],
    references: [users.id],
  }),
  bookings: many(bookings),
  chatLogs: many(chatLogs),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  shop: one(shops, {
    fields: [bookings.shopId],
    references: [shops.id],
  }),
}));

export const chatLogsRelations = relations(chatLogs, ({ one }) => ({
  shop: one(shops, {
    fields: [chatLogs.shopId],
    references: [shops.id],
  }),
}));

// ====================================================================
// TypeScript Types (auto-inferred from schema)
// ====================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Shop = typeof shops.$inferSelect;
export type NewShop = typeof shops.$inferInsert;

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;

export type ChatLog = typeof chatLogs.$inferSelect;
export type NewChatLog = typeof chatLogs.$inferInsert;
