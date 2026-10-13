import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  courseAccess,
  InsertUser,
  lessonProgress,
  payments,
  processedStripeEvents,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function hasActiveAccess(userId: number, courseSlug: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const result = await db
    .select({ id: courseAccess.id })
    .from(courseAccess)
    .where(and(eq(courseAccess.userId, userId), eq(courseAccess.courseSlug, courseSlug), eq(courseAccess.status, "active")))
    .limit(1);
  return result.length > 0;
}

export async function getCompletedLessonIds(userId: number, courseSlug: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const rows = await db
    .select({ lessonId: lessonProgress.lessonId })
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.courseSlug, courseSlug)));
  return rows.map(row => row.lessonId);
}

export async function markLessonCompleted(userId: number, courseSlug: string, lessonId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(lessonProgress).values({ userId, courseSlug, lessonId }).onDuplicateKeyUpdate({
    set: { completedAt: new Date() },
  });
}

export async function getPaymentsForUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db
    .select({ courseSlug: payments.courseSlug, amountCents: payments.amountCents, currency: payments.currency, status: payments.status, completedAt: payments.completedAt })
    .from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.completedAt));
}

function isDuplicateKey(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === "ER_DUP_ENTRY";
}

export async function recordIgnoredStripeEvent(stripeEventId: string, eventType: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  try {
    await db.insert(processedStripeEvents).values({ stripeEventId, eventType });
    return true;
  } catch (error) {
    if (isDuplicateKey(error)) return false;
    throw error;
  }
}

export async function fulfillCheckout(input: {
  stripeEventId: string;
  eventType: string;
  userId: number;
  courseSlug: string;
  checkoutSessionId: string;
  paymentIntentId: string | null;
  amountCents: number;
  currency: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  try {
    return await db.transaction(async tx => {
      const handled = await tx
        .select({ id: processedStripeEvents.id })
        .from(processedStripeEvents)
        .where(eq(processedStripeEvents.stripeEventId, input.stripeEventId))
        .limit(1);
      if (handled.length > 0) return false;

      await tx.insert(processedStripeEvents).values({ stripeEventId: input.stripeEventId, eventType: input.eventType });
      await tx.insert(payments).values({
        userId: input.userId,
        courseSlug: input.courseSlug,
        stripeCheckoutSessionId: input.checkoutSessionId,
        stripePaymentIntentId: input.paymentIntentId,
        amountCents: input.amountCents,
        currency: input.currency,
        status: "paid",
      }).onDuplicateKeyUpdate({
        set: { status: "paid", stripePaymentIntentId: input.paymentIntentId, completedAt: new Date() },
      });
      await tx.insert(courseAccess).values({ userId: input.userId, courseSlug: input.courseSlug, source: "stripe_checkout" }).onDuplicateKeyUpdate({
        set: { status: "active", updatedAt: new Date() },
      });
      return true;
    });
  } catch (error) {
    if (isDuplicateKey(error)) return false;
    throw error;
  }
}
