import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'

export default function Book() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [shops, setShops] = useState([])
  const [selectedShop, setSelectedShop] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [barberName, setBarberName] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    checkUserAndSubscription()
    fetchShops()
  }, [])

  const checkUserAndSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }
    
    setUser(user)

    // Check if user has active subscription
    const { data: subData, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking subscription:', error)
    }

    setSubscription(subData)
    setLoading(false)
  }

  const fetchShops = async () => {
    try {
      const response = await fetch('/api/shops')
      const result = await response.json()
      if (result.success) {
        setShops(result.data)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!subscription) {
      alert('You need an active subscription to book appointments!')
      return
    }

    setBooking(true)

    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([
          {
            user_id: user.id,
            shop_id: parseInt(selectedShop),
            subscription_id: subscription.id,
            appointment_date: selectedDate,
            appointment_time: selectedTime,
            barber_name: barberName || null,
            notes: notes || null,
            status: 'scheduled'
          }
        ])
        .select()

      if (error) throw error

      alert('Booking successful! ✅')
      router.push('/bookings')
    } catch (error) {
      console.error('Booking error:', error)
      alert('Failed to create booking: ' + error.message)
    } finally {
      setBooking(false)
    }
  }

  // Generate time slots (9 AM to 5 PM)
  const timeSlots = []
  for (let hour = 9; hour < 17; hour++) {
    for (let minute of [0, 30]) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      timeSlots.push(time)
    }
  }

  // Get next 30 days
  const getAvailableDates = () => {
    const dates = []
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      dates.push(date.toISOString().split('T')[0])
    }
    return dates
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    )
  }

  // If no subscription, show message
  if (!subscription) {
    return (
      <Layout title="Book Appointment - Clip & Go">
        <div className="max-w-2xl mx-auto">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8 text-center">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              No Active Subscription
            </h2>
            <p className="text-gray-600 mb-6">
              You need an active subscription to book appointments. 
              Subscribe to one of our plans to get started!
            </p>
            <Link
              href="/"
              className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 inline-block"
            >
              View Subscription Plans
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Book Appointment - Clip & Go">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Book Your Haircut</h1>

        {/* Subscription Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-green-800 font-semibold">
              Active Subscription: {subscription.plan_type.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Shop Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Shop *
              </label>
              <select
                value={selectedShop}
                onChange={(e) => setSelectedShop(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Choose a shop...</option>
                {shops.map(shop => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name} - {shop.address}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date *
              </label>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Choose a date...</option>
                {getAvailableDates().map(date => (
                  <option key={date} value={date}>
                    {new Date(date).toLocaleDateString('en-AU', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Time *
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Choose a time...</option>
                {timeSlots.map(time => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            {/* Barber Name (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Barber (Optional)
              </label>
              <input
                type="text"
                value={barberName}
                onChange={(e) => setBarberName(e.target.value)}
                placeholder="Leave blank for any available barber"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Notes (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Requests (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
                placeholder="Any specific requests or preferences..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={booking}
              className="w-full bg-primary-500 text-white py-3 rounded-md hover:bg-primary-600 disabled:opacity-50 transition-colors"
            >
              {booking ? 'Booking...' : 'Confirm Booking'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}