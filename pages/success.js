import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

export default function Success() {
  const router = useRouter()
  const { session_id } = router.query
  const [processing, setProcessing] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (session_id) {
      handleSuccess()
    }
  }, [session_id])

  const handleSuccess = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not found')
      }

      // Get session details from Stripe
      const response = await fetch('/api/stripe/get-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_id }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Save subscription to database
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert([
          {
            user_id: user.id,
            shop_id: parseInt(data.metadata.shop_id),
            plan_type: data.metadata.plan_id,
            status: 'active',
            amount_cents: data.amount_total,
          }
        ])

      if (subError) {
        // Check if already exists
        if (subError.code === '23505') {
          console.log('Subscription already exists')
        } else {
          throw subError
        }
      }

      setProcessing(false)
    } catch (error) {
      console.error('Error processing payment:', error)
      setError(error.message)
      setProcessing(false)
    }
  }

  if (processing) {
    return (
      <Layout title="Processing...">
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your subscription...</p>
        </div>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout title="Error">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-red-500 text-5xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/"
              className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 inline-block"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Payment Successful!">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Payment Successful! 🎉
          </h1>
          
          <p className="text-gray-600 mb-6">
            Your subscription has been activated. You can now book your haircuts!
          </p>

          <div className="space-y-3">
            <Link
              href="/book"
              className="block w-full bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600"
            >
              Book Your First Haircut
            </Link>
            
            <Link
              href="/profile"
              className="block w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50"
            >
              View Profile
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}