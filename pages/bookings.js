import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../components/Layout'
import { supabase } from '../lib/supabase'

export default function Bookings() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [bookings, setBookings] = useState([])
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUserAndFetchBookings()
  }, [])

  const checkUserAndFetchBookings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }
    
    setUser(user)
    await fetchShops()
    await fetchBookings(user.id)
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

  const fetchBookings = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false })

      if (error) throw error

      setBookings(data || [])
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .eq('user_id', user.id)

      if (error) throw error

      alert('Booking cancelled successfully')
      fetchBookings(user.id)
    } catch (error) {
      console.error('Error cancelling booking:', error)
      alert('Failed to cancel booking')
    }
  }

  const getShopName = (shopId) => {
    const shop = shops.find(s => s.id === shopId)
    return shop ? shop.name : 'Unknown Shop'
  }

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    )
  }

  return (
    <Layout title="My Bookings - Clip & Go">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <Link
            href="/book"
            className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600"
          >
            New Booking
          </Link>
        </div>

        {bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{getShopName(booking.shop_id)}</h3>
                    <p className="text-gray-600">
                      {new Date(booking.appointment_date).toLocaleDateString('en-AU', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-gray-600">Time: {booking.appointment_time}</p>
                    {booking.barber_name && (
                      <p className="text-gray-600">Barber: {booking.barber_name}</p>
                    )}
                    {booking.notes && (
                      <p className="text-gray-600 text-sm mt-2">Notes: {booking.notes}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}>
                    {booking.status.toUpperCase()}
                  </span>
                </div>

                {booking.status === 'scheduled' && (
                  <button
                    onClick={() => handleCancelBooking(booking.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Cancel Booking
                  </button>
                )}
                {booking.status === 'completed' && (
  <Link
    href={`/review/${booking.id}`}
    className="text-primary-600 hover:text-primary-700 text-sm"
  >
    Leave a Review
  </Link>
)}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 mb-4">You haven't made any bookings yet.</p>
            <Link
              href="/book"
              className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 inline-block"
            >
              Book Your First Haircut
            </Link>
          </div>
        )}
      </div>
    </Layout>
  )
}