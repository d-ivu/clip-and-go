import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { getStripe } from '../../lib/stripe'
import { SUBSCRIPTION_PLANS } from '../../lib/constants'

export default function ShopDetail() {
  const router = useRouter()
  const { id } = router.query
  const [shop, setShop] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    if (id) {
      fetchShop()
      checkUser()
    }
  }, [id])

  const fetchShop = async () => {
    try {
      const response = await fetch('/api/shops')
      const result = await response.json()
      if (result.success) {
        const foundShop = result.data.find(s => s.id === parseInt(id))
        setShop(foundShop)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const handleSubscribe = async (planId) => {
    if (!user) {
      router.push('/signup')
      return
    }

    setSubscribing(true)

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: planId,
          user_email: user.email,
          shop_id: id,
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Redirect to Stripe Checkout
      const stripe = await getStripe()
      await stripe.redirectToCheckout({ sessionId: data.sessionId })

    } catch (error) {
      console.error('Error:', error)
      alert('Failed to start checkout. Please try again.')
      setSubscribing(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    )
  }

  if (!shop) {
    return (
      <Layout>
        <div className="text-center py-12">Shop not found</div>
      </Layout>
    )
  }

  return (
    <Layout title={shop.name}>
      <Link href="/" className="text-primary-600 mb-4 inline-block">← Back</Link>
      
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="h-48 bg-blue-500 rounded mb-6 flex items-center justify-center text-white text-7xl">
          ✂️
        </div>
        
        <h1 className="text-3xl font-bold mb-4">{shop.name}</h1>
        <p className="text-gray-600 mb-2">📍 {shop.address}</p>
        <p className="text-gray-600 mb-2">📞 {shop.phone}</p>
        <p className="text-gray-700 mb-6">{shop.description}</p>
        
        <h2 className="text-2xl font-bold mb-4">Subscription Plans</h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <div 
              key={plan.id}
              className={`border rounded-lg p-4 ${plan.popular ? 'border-2 border-primary-500' : ''}`}
            >
              {plan.popular && (
                <div className="bg-primary-500 text-white text-xs px-2 py-1 rounded inline-block mb-2">
                  POPULAR
                </div>
              )}
              <h3 className="font-bold mb-2">{plan.name}</h3>
              <p className="text-2xl text-primary-600 font-bold mb-1">${plan.price}</p>
              <p className="text-sm text-gray-500 mb-2">per month (inc. GST)</p>
              <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
              
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={subscribing}
                className="w-full bg-primary-500 text-white py-2 rounded hover:bg-primary-600 disabled:opacity-50"
              >
                {subscribing ? 'Loading...' : 'Subscribe'}
              </button>
            </div>
          ))}
        </div>

        {!user && (
          <div className="mt-6 p-4 bg-blue-50 rounded">
            <p className="text-sm text-blue-800">
              <Link href="/signup" className="font-bold underline">Sign up</Link> or{' '}
              <Link href="/login" className="font-bold underline">login</Link> to subscribe
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}