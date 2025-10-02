import { stripe } from '../../../lib/stripe'
import { SUBSCRIPTION_PLANS } from '../../../lib/constants'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { plan_id, user_email, shop_id } = req.body

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === plan_id)
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan' })
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: `${plan.name} - Clip & Go`,
              description: plan.description,
            },
            unit_amount: plan.priceInCents,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/shop/${shop_id}`,
      customer_email: user_email,
      metadata: {
        plan_id,
        shop_id: shop_id.toString(),
      }
    })

    res.status(200).json({ sessionId: session.id })
  } catch (error) {
    console.error('Stripe error:', error)
    res.status(500).json({ error: error.message })
  }
}