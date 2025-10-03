import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { SUBSCRIPTION_PLANS } from '../../lib/constants'

export default function AdminDashboard() {
  const router = useRouter()
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSubscribers: 0,
    activeBookings: 0,
    monthlyRevenue: 0,
    shopPayout: 0
  })
  const [recentBookings, setRecentBookings] = useState([])
  const [subscribers, setSubscribers] = useState([])

  useEffect(() => {
    checkAdminAuth()
  }, [])

  const checkAdminAuth = async () => {
    if (typeof window === 'undefined') return

    const adminSession = localStorage.getItem('adminSession')
    
    if (!adminSession) {
      router.push('/admin/login')
      return
    }

    const session = JSON.parse(adminSession)
    setAdmin(session)
    
    await loadDashboardData(session.shopId)
  }

  const loadDashboardData = async (shopId) => {
    try {
      // Get subscriptions for this shop
      const { data: subs, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('shop_id', shopId)
        .eq('status', 'active')

      if (subError) throw subError

      // Calculate revenue
      const monthlyRevenue = subs.reduce((sum, sub) => sum + (sub.amount_cents / 100), 0)
      const shopPayout = monthlyRevenue * 0.8 // 80% to shop

      // Get bookings
      const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (bookingError) throw bookingError

      const activeBookings = bookings.filter(b => 
        ['scheduled', 'confirmed'].includes(b.status)
      ).length

      setStats({
        totalSubscribers: subs.length,
        activeBookings,
        monthlyRevenue: monthlyRevenue.toFixed(2),
        shopPayout: shopPayout.toFixed(2)
      })

      setRecentBookings(bookings)
      setSubscribers(subs)

    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminSession')
    router.push('/admin/login')
  }

  const handleBookingStatusChange = async (bookingId, newStatus) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId)
        .eq('shop_id', admin.shopId)

      if (error) throw error

      alert('Booking status updated!')
      loadDashboardData(admin.shopId)
    } catch (error) {
      console.error('Error updating booking:', error)
      alert('Failed to update booking')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    )
  }

  if (!admin) {
    return null
  }

  return (
    <Layout title={`${admin.shopName} - Admin Dashboard`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{admin.shopName}</h1>
            <p className="text-gray-600">Admin Dashboard</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Subscribers</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalSubscribers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Bookings</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{stats.activeBookings}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Monthly Revenue</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">${stats.monthlyRevenue}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Your Payout (80%)</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">${stats.shopPayout}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💵</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
          
          {recentBookings.length > 0 ? (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">
                        {new Date(booking.appointment_date).toLocaleDateString()} at{' '}
                        {booking.appointment_time.substring(0, 5)}
                      </p>
                      {booking.barber_name && (
                        <p className="text-sm text-gray-600">Barber: {booking.barber_name}</p>
                      )}
                      {booking.notes && (
                        <p className="text-sm text-gray-600">Notes: {booking.notes}</p>
                      )}
                    </div>
                    <select
                      value={booking.status}
                      onChange={(e) => handleBookingStatusChange(booking.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No bookings yet</p>
          )}
        </div>

        {/* Subscribers */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Active Subscribers ({subscribers.length})</h2>
          
          {subscribers.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-4">
              {SUBSCRIPTION_PLANS.map((plan) => {
                const planSubs = subscribers.filter(s => s.plan_type === plan.id)
                return (
                  <div key={plan.id} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">{plan.name}</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Subscribers:</span>
                        <span className="font-medium">{planSubs.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Revenue:</span>
                        <span className="font-medium">${(planSubs.length * plan.price).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Your Cut (80%):</span>
                        <span className="font-medium text-green-600">${(planSubs.length * plan.price * 0.8).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No subscribers yet</p>
          )}
        </div>
      </div>
    </Layout>
  )
}