import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import Stripe from "stripe";

// Mock initialization until actual keys are active
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock", {
  apiVersion: "2023-10-16",
});

export async function POST(req) {
  try {
    const authSession = await getSession();
    const user = authSession?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { priceId } = body;

    // Simulate lack of Stripe Secret Key for MVP
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ 
        error: "Stripe API Key missing. Billing gateway is running in Sandbox Simulation mode.",
        checkoutUrl: "/admin/billing?simulated=success"
      });
    }

    // Actual Implementation
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/admin/billing?canceled=true`,
      customer_email: user.email,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
