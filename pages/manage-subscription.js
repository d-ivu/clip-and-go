import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { getStripe } from '../lib/stripe'
import { SUBSCRIPTION_PLANS } from '../lib/constants'

export default function ManageSubscription() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

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
    if (!confirm('Are you sure you want to cancel? You can still use bookings until the end of your billing period.')) {
      return
    }

    setProcessing(true)

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscription.id)

      if (error) throw error

      alert('Subscription cancelled. You can use remaining bookings until end of billing period.')
      router.push('/profile')
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  const handlePauseSubscription = async () => {
    if (!confirm('Pause subscription for 30 days? Billing will resume automatically after 30 days.')) return

    setProcessing(true)

    try {
      const pauseUntil = new Date()
      pauseUntil.setDate(pauseUntil.getDate() + 30)

      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          status: 'paused',
          paused_until: pauseUntil.toISOString()
        })
        .eq('id', subscription.id)

      if (error) throw error

      alert('Subscription paused for 30 days')
      loadData()
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleChangePlan = async (newPlanId) => {
    const newPlan = SUBSCRIPTION_PLANS.find(p => p.id === newPlanId)
    const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === subscription.plan_type)
    const isUpgrade = newPlan.price > currentPlan.price

    if (!confirm(`${isUpgrade ? 'Upgrade' : 'Downgrade'} to ${newPlan.name} for $${newPlan.price}/month?`)) {
      return
    }

    setProcessing(true)

    try {
      // Create new checkout session for plan change
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
      if (data.error) throw new Error(data.error)

      // Cancel old subscription
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscription.id)

      // Redirect to Stripe
      const stripe = await getStripe()
      await stripe.redirectToCheckout({ sessionId: data.sessionId })

    } catch (error) {
      alert('Error: ' + error.message)
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    )
  }

  if (!subscription) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-4">No Active Subscription</h1>
          <p className="text-gray-600 mb-6">Subscribe to start booking haircuts</p>
          <a href="/" className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 inline-block">
            View Plans
          </a>
        </div>
      </Layout>
    )
  }

  const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === subscription.plan_type)
  const otherPlans = SUBSCRIPTION_PLANS.filter(p => p.id !== subscription.plan_type)

  return (
    <Layout title="Manage Subscription">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Manage Your Subscription</h1>

        {/* Current Plan */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Current Plan</h2>
              <p className="text-lg font-bold text-primary-600">{currentPlan?.name}</p>
              <p className="text-gray-600">${(subscription.amount_cents / 100).toFixed(2)}/month</p>
              <p className="text-sm text-gray-500 mt-2">
                {currentPlan?.haircuts} haircut{currentPlan?.haircuts > 1 ? 's' : ''} per month
              </p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              subscription.status === 'active' 
                ? 'bg-green-100 text-green-800' 
                : subscription.status === 'paused'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {subscription.status.toUpperCase()}
            </span>
          </div>

          {subscription.status === 'active' && (
            <div className="flex gap-3">
              <button
                onClick={handlePauseSubscription}
                disabled={processing}
                className="px-4 py-2 border border-yellow-500 text-yellow-600 rounded hover:bg-yellow-50 disabled:opacity-50"
              >
                {processing ? 'Processing...' : 'Pause for 30 Days'}
              </button>
            </div>
          )}

          {subscription.status === 'paused' && subscription.paused_until && (
            <div className="mt-4 p-3 bg-yellow-50 rounded">
              <p className="text-sm text-yellow-800">
                Paused until {new Date(subscription.paused_until).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Change Plan Options */}
        {subscription.status === 'active' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Change Your Plan</h2>
            <div className="space-y-4">
              {otherPlans.map(plan => {
                const isUpgrade = plan.price > currentPlan.price
                return (
                  <div key={plan.id} className="border rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{plan.name}</p>
                      <p className="text-sm text-gray-600">${plan.price}/month • {plan.haircuts} haircuts</p>
                      <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                    </div>
                    <button
                      onClick={() => handleChangePlan(plan.id)}
                      disabled={processing}
                      className={`px-6 py-2 rounded font-semibold disabled:opacity-50 ${
                        isUpgrade
                          ? 'bg-primary-500 text-white hover:bg-primary-600'
                          : 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50'
                      }`}
                    >
                      {processing ? 'Processing...' : (isUpgrade ? 'Upgrade' : 'Downgrade')}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Billing Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Billing Information</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Next billing date:</span>
              <span className="font-semibold">
                {subscription.current_period_end 
                  ? new Date(subscription.current_period_end).toLocaleDateString()
                  : 'N/A'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold">${(subscription.amount_cents / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment method:</span>
              <span className="font-semibold">Card via Stripe</span>
            </div>
          </div>
        </div>

        {/* Cancel Subscription */}
        {subscription.status === 'active' && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Cancel Subscription</h2>
            <p className="text-red-700 mb-4 text-sm">
              Cancel anytime. You'll retain access until the end of your current billing period.
              All unused bookings will be forfeited.
            </p>
            <button
              onClick={handleCancelSubscription}
              disabled={processing}
              className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {processing ? 'Processing...' : 'Cancel Subscription'}
            </button>
          </div>
        )}
      </div>
    </Layout>
  )
}