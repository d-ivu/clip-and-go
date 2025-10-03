import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
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
  
  // Promo code state
  const [promoCode, setPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoError, setPromoError] = useState('')
  const [checkingPromo, setCheckingPromo] = useState(false)

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

  const handlePromoCheck = async () => {
    if (!promoCode.trim()) return

    setCheckingPromo(true)
    setPromoError('')

    try {
      const response = await fetch('/api/validate-promo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode })
      })

      const data = await response.json()

      if (data.success) {
        setPromoDiscount(data.discount_percent)
        setPromoError('')
        alert(`✅ Promo applied! ${data.discount_percent}% off`)
      } else {
        setPromoError(data.error)
        setPromoDiscount(0)
      }
    } catch (error) {
      setPromoError('Error validating code')
      setPromoDiscount(0)
    } finally {
      setCheckingPromo(false)
    }
  }

  const calculateDiscountedPrice = (originalPrice) => {
    if (promoDiscount === 0) return originalPrice
    return originalPrice * (1 - promoDiscount / 100)
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: planId,
          user_email: user.email,
          shop_id: id,
          promo_code: promoCode || null
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

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
        
        {/* Promo Code Input */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-3">Have a promo code?</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Enter code"
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              onClick={handlePromoCheck}
              disabled={checkingPromo || !promoCode}
              className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 disabled:opacity-50"
            >
              {checkingPromo ? 'Checking...' : 'Apply'}
            </button>
          </div>
          {promoError && (
            <p className="text-red-600 text-sm mt-2">{promoError}</p>
          )}
          {promoDiscount > 0 && (
            <p className="text-green-600 text-sm mt-2 font-semibold">
              ✅ {promoDiscount}% discount applied!
            </p>
          )}
        </div>

        <h2 className="text-2xl font-bold mb-4">Subscription Plans</h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const discountedPrice = calculateDiscountedPrice(plan.price)
            const hasDiscount = promoDiscount > 0

            return (
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
                
                {hasDiscount ? (
                  <div>
                    <p className="text-gray-400 line-through">${plan.price.toFixed(2)}</p>
                    <p className="text-2xl text-primary-600 font-bold mb-1">
                      ${discountedPrice.toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <p className="text-2xl text-primary-600 font-bold mb-1">
                    ${plan.price.toFixed(2)}
                  </p>
                )}
                
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
            )
          })}
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