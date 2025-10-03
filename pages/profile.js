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

  const getUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      console.log('User ID:', user.id)
      setUser(user)

      // Get subscription
const { data: subData, error } = await supabase
  .from('subscriptions')
  .select('*')
  .eq('user_id', user.id)
  .eq('status', 'active')
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle()

      console.log('Subscription data:', subData)
      console.log('Subscription error:', error)

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error)
      }

      setSubscription(subData)
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
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                  ACTIVE
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

              <div className="mt-4">
                <Link
                  href="/book"
                  className="block w-full bg-primary-500 text-white text-center py-2 rounded-md hover:bg-primary-600"
                >
                  Book Appointment
                </Link>
              </div>
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
            View Bookings
          </Link>

          <Link
            href="/manage-subscription"
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