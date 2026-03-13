import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY not set - Stripe payments will not work');
}

export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export interface CartItemRequest {
  productId: string;
  quantity: number;
}

export interface VerifiedProduct {
  id: string;
  name: string;
  price: string;
  imageUrl: string | null;
}

export async function createCheckoutSession(
  items: CartItemRequest[],
  verifiedProducts: Map<string, VerifiedProduct>,
  userId: string,
  successUrl: string,
  cancelUrl: string
): Promise<Stripe.Checkout.Session | null> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(item => {
    const product = verifiedProducts.get(item.productId);
    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }
    
    return {
      price_data: {
        currency: 'usd',
        product_data: {
          name: product.name,
          ...(product.imageUrl ? { images: [product.imageUrl] } : {}),
        },
        unit_amount: Math.round(parseFloat(product.price) * 100),
      },
      quantity: item.quantity,
    };
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      items: JSON.stringify(items),
    },
  });

  return session;
}

export async function retrieveCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session | null> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  return stripe.checkout.sessions.retrieve(sessionId);
}

export function constructWebhookEvent(
  payload: Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

// Flexible checkout session creation for memberships and other one-off payments
export interface FlexibleCheckoutOptions {
  mode: 'payment' | 'subscription';
  lineItems: {
    price_data: {
      currency: string;
      product_data: {
        name: string;
        description?: string;
        images?: string[];
      };
      unit_amount: number;
      recurring?: {
        interval: 'day' | 'week' | 'month' | 'year';
      };
    };
    quantity: number;
  }[];
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  customerEmail?: string;
}

export async function createFlexibleCheckoutSession(
  options: FlexibleCheckoutOptions
): Promise<Stripe.Checkout.Session> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: options.lineItems,
    mode: options.mode,
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    metadata: options.metadata,
    ...(options.customerEmail ? { customer_email: options.customerEmail } : {}),
  });

  return session;
}
