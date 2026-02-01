import { NextResponse } from "next/server";
import Stripe from "stripe";

// Inicializar Stripe con la clave secreta (asegúrate de definirla en .env.local)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-01-27.acacia", // Usar la versión más reciente compatible o '2023-10-16'
});

export async function POST(request: Request) {
  try {
    const { amount, currency } = await request.json();

    if (!amount || !currency) {
      return NextResponse.json(
        { error: "Monto y moneda son requeridos" },
        { status: 400 }
      );
    }

    // Stripe espera el monto en la unidad más pequeña (centavos)
    const amountInCents = Math.round(amount * 100);

    const { walletAddress, tokenType } = await request.json();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        target_wallet: walletAddress,
        token_type: tokenType
      }
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error("Error creando payment intent:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
