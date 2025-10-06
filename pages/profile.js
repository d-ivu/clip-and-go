import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'
import { SUBSCRIPTION_PLANS } from '../lib/constants'

export default function Profile() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUserData()
  }, [])

  // This runs when the page comes into focus (after returning from manage-subscription)
  useEffect(() => {
    const handleFocus = () => {
      getUserData()
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const getUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      // Get subscription - fetch all and take first (handles no results gracefully)
      const { data: subs, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching subscription:', error)
      }

      // Find active or paused subscription
      const activeSub = subs?.find(s => s.status === 'active' || s.status === 'paused')
      setSubscription(activeSub || null)

    } catch (error) {
      console.error('Error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    )
  }

  if (!user) {
    return null
  }

  const plan = subscription ? SUBSCRIPTION_PLANS.find(p => p.id === subscription.plan_type) : null

  return (
    <Layout title="Profile - Clip & Go">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Your Profile</h1>
        
        {/* Account Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Account Details</h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-600">Name</label>
              <p className="text-lg">{user.user_metadata?.name || 'Not provided'}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600">Email</label>
              <p className="text-lg">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Subscription Status</h2>
          
          {subscription ? (
            <div>
              <div className="flex items-center mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  subscription.status === 'active' 
                    ? 'bg-green-100 text-green-800'
                    : subscription.status === 'paused'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {subscription.status.toUpperCase()}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-semibold">{plan?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Cost:</span>
                  <span className="font-semibold">${(subscription.amount_cents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Haircuts per month:</span>
                  <span className="font-semibold">{plan?.haircuts}</span>
                </div>
              </div>

              {subscription.status === 'paused' && subscription.paused_until && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    ⏸️ Paused until {new Date(subscription.paused_until).toLocaleDateString()}
                  </p>
                </div>
              )}

              {subscription.status === 'active' && (
                <>
                  <div className="mt-4">
                    <Link
                      href="/book"
                      className="block w-full bg-primary-500 text-white text-center py-2 rounded-md hover:bg-primary-600"
                    >
                      Book Appointment
                    </Link>
                  </div>
                  <div className="mt-2">
                    <Link
                      href="/manage-subscription"
                      className="block w-full bg-gray-100 text-gray-700 text-center py-2 rounded-md hover:bg-gray-200"
                    >
                      Manage Subscription
                    </Link>
                  </div>
                </>
              )}

              {subscription.status === 'paused' && (
                <div className="mt-4">
                  <Link
                    href="/manage-subscription"
                    className="block w-full bg-yellow-500 text-white text-center py-2 rounded-md hover:bg-yellow-600"
                  >
                    View Paused Subscription
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">No active subscription</p>
              <Link
                href="/"
                className="bg-primary-500 text-white px-6 py-2 rounded-md hover:bg-primary-600 inline-block"
              >
                Subscribe Now
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <Link
            href="/bookings"
            className="block w-full bg-gray-100 text-gray-700 text-center py-3 rounded-md hover:bg-gray-200"
          >
            View My Bookings
          </Link>
          
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white py-3 rounded-md hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </Layout>
  )
}