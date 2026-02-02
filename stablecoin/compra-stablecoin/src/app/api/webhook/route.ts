import { NextResponse } from "next/server";
import Stripe from "stripe";
import { mintTokens } from "@/lib/mint-service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-01-28.clover",
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature") || "";

  let event: Stripe.Event;

  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } else {
      // Para desarrollo local sin secret configurado (no recomendado para prod)
      event = JSON.parse(body);
    }
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Manejar el evento de pago exitoso
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    
    // Extraer datos guardados en la metadata al crear el intent
    const targetWallet = paymentIntent.metadata.target_wallet;
    const tokenType = paymentIntent.metadata.token_type as "EURT" | "USDT";
    const amount = paymentIntent.amount / 100; // Stripe guarda en centavos

    if (targetWallet && tokenType) {
        try {
            await mintTokens(targetWallet, amount, tokenType);
            console.log(`✅ Tokens entregados con éxito a ${targetWallet}`);
        } catch (error) {
            console.error("❌ Fallo al entregar tokens tras pago:", error);
            // Aquí se podría implementar un sistema de reintentos
        }
    }
  }

  return NextResponse.json({ received: true });
}
