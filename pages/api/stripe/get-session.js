import { stripe } from '../../../lib/stripe'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { session_id } = req.body

    if (!session_id) {
      return res.status(400).json({ error: 'Session ID required' })
    }

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id)

    res.status(200).json({
      amount_total: session.amount_total,
      customer_email: session.customer_email,
      metadata: session.metadata,
    })
  } catch (error) {
    console.error('Stripe error:', error)
    res.status(500).json({ error: error.message })
  }
}