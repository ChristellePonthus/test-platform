import { index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const courseAccess = mysqlTable(
  "course_access",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    courseSlug: varchar("courseSlug", { length: 96 }).notNull(),
    status: mysqlEnum("status", ["active", "revoked"]).default("active").notNull(),
    source: varchar("source", { length: 64 }).default("stripe_checkout").notNull(),
    grantedAt: timestamp("grantedAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    userCourseUnique: uniqueIndex("course_access_user_course_unique").on(table.userId, table.courseSlug),
    userIndex: index("course_access_user_idx").on(table.userId),
  }),
);

export const payments = mysqlTable(
  "payments",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    courseSlug: varchar("courseSlug", { length: 96 }).notNull(),
    stripeCheckoutSessionId: varchar("stripeCheckoutSessionId", { length: 255 }).notNull(),
    stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
    amountCents: int("amountCents").notNull(),
    currency: varchar("currency", { length: 12 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    completedAt: timestamp("completedAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => ({
    sessionUnique: uniqueIndex("payments_checkout_session_unique").on(table.stripeCheckoutSessionId),
    userIndex: index("payments_user_idx").on(table.userId),
  }),
);

export const processedStripeEvents = mysqlTable(
  "processed_stripe_events",
  {
    id: int("id").autoincrement().primaryKey(),
    stripeEventId: varchar("stripeEventId", { length: 255 }).notNull(),
    eventType: varchar("eventType", { length: 128 }).notNull(),
    processedAt: timestamp("processedAt").defaultNow().notNull(),
  },
  table => ({ eventUnique: uniqueIndex("stripe_event_unique").on(table.stripeEventId) }),
);

export const lessonProgress = mysqlTable(
  "lesson_progress",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    courseSlug: varchar("courseSlug", { length: 96 }).notNull(),
    lessonId: varchar("lessonId", { length: 96 }).notNull(),
    completedAt: timestamp("completedAt").defaultNow().notNull(),
  },
  table => ({
    progressUnique: uniqueIndex("lesson_progress_user_lesson_unique").on(table.userId, table.courseSlug, table.lessonId),
    userIndex: index("lesson_progress_user_idx").on(table.userId),
  }),
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
