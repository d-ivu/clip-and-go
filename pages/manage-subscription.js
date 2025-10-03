import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { SUBSCRIPTION_PLANS } from '../lib/constants'

export default function ManageSubscription() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    setSubscription(sub)
    setLoading(false)
  }

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure? You can still use remaining bookings.')) return

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscription.id)

      if (error) throw error
      
      alert('Subscription cancelled')
      router.push('/profile')
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  const handleUpgrade = async (newPlanId) => {
    try {
      const newPlan = SUBSCRIPTION_PLANS.find(p => p.id === newPlanId)
      
      // Create new Stripe checkout for upgrade
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: newPlanId,
          user_email: user.email,
          shop_id: subscription.shop_id,
        }),
      })

      const data = await response.json()
      const stripe = await getStripe()
      await stripe.redirectToCheckout({ sessionId: data.sessionId })
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  if (loading) return <Layout><div className="text-center py-12">Loading...</div></Layout>
  if (!subscription) return <Layout><div className="text-center py-12">No active subscription</div></Layout>

  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === subscription.plan_type)

  return (
    <Layout title="Manage Subscription">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Manage Subscription</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold">{currentPlan?.name}</p>
              <p className="text-gray-600">${(subscription.amount_cents / 100).toFixed(2)}/month</p>
            </div>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
              ACTIVE
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Change Plan</h2>
          <div className="space-y-3">
            {SUBSCRIPTION_PLANS.filter(p => p.id !== subscription.plan_type).map(plan => (
              <div key={plan.id} className="border rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{plan.name}</p>
                  <p className="text-sm text-gray-600">${plan.price}/month</p>
                </div>
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600"
                >
                  Switch to This
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Danger Zone</h2>
          <p className="text-gray-600 mb-4">
            Cancel your subscription. You'll retain access until the end of your billing period.
          </p>
          <button
            onClick={handleCancelSubscription}
            className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
          >
            Cancel Subscription
          </button>
        </div>
      </div>
    </Layout>
  )
}