import { loadStripe } from '@stripe/stripe-js'

// Client-side Stripe
let stripePromise
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  }
  return stripePromise
}

// Server-side Stripe (for API routes)
export const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)