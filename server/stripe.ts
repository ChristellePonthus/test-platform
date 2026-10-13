import { COURSE_OFFER } from "@shared/course";
import type { User } from "../drizzle/schema";
import type { Request } from "express";
import Stripe from "stripe";
import * as db from "./db";

let stripeClient: Stripe | null = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Stripe is not configured");
  stripeClient ??= new Stripe(secretKey);
  return stripeClient;
}

function browserOrigin(req: Request) {
  const configuredOrigin = process.env.APP_PUBLIC_ORIGIN;
  if (configuredOrigin) {
    const parsed = new URL(configuredOrigin);
    if (parsed.protocol !== "https:") throw new Error("APP_PUBLIC_ORIGIN must use HTTPS");
    return parsed.origin;
  }
  const origin = req.header("origin");
  if (!origin) throw new Error("A browser origin is required for checkout");
  const parsed = new URL(origin);
  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".manus.computer")) {
    throw new Error("Checkout origin is not allowed");
  }
  return parsed.origin;
}

export async function createCourseCheckout(user: User, req: Request) {
  const stripe = getStripe();
  const origin = browserOrigin(req);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    allow_promotion_codes: true,
    customer_email: user.email ?? undefined,
    client_reference_id: String(user.id),
    metadata: {
      user_id: String(user.id),
      course_slug: COURSE_OFFER.slug,
      customer_email: user.email ?? "",
      customer_name: user.name ?? "",
    },
    line_items: [{
      quantity: 1,
      price_data: {
        currency: COURSE_OFFER.currency.toLowerCase(),
        unit_amount: COURSE_OFFER.priceCents,
        product_data: { name: COURSE_OFFER.title, description: COURSE_OFFER.subtitle },
      },
    }],
    success_url: `${origin}/achat/succes?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/achat/annule`,
  }, { idempotencyKey: `course-checkout-${user.id}-${COURSE_OFFER.slug}` });
  if (!session.url) throw new Error("Stripe did not provide a checkout URL");
  return session.url;
}

export async function processStripeEvent(event: Stripe.Event) {
  if (event.type !== "checkout.session.completed") {
    await db.recordIgnoredStripeEvent(event.id, event.type);
    return;
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") {
    await db.recordIgnoredStripeEvent(event.id, event.type);
    return;
  }

  const userId = Number(session.metadata?.user_id ?? session.client_reference_id);
  const courseSlug = session.metadata?.course_slug;
  const validCourse = courseSlug === COURSE_OFFER.slug;
  const validAmount = session.amount_total === COURSE_OFFER.priceCents;
  const validCurrency = session.currency?.toUpperCase() === COURSE_OFFER.currency;
  if (!Number.isInteger(userId) || userId < 1 || !courseSlug || !session.id || !validCourse || !validAmount || !validCurrency) {
    console.error("[Stripe] Checkout event did not match the configured offer", event.id);
    await db.recordIgnoredStripeEvent(event.id, event.type);
    return;
  }

  await db.fulfillCheckout({
    stripeEventId: event.id,
    eventType: event.type,
    userId,
    courseSlug,
    checkoutSessionId: session.id,
    paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
    amountCents: session.amount_total ?? COURSE_OFFER.priceCents,
    currency: session.currency?.toUpperCase() ?? COURSE_OFFER.currency,
  });
}
