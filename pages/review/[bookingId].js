import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'

export default function Review() {
  const router = useRouter()
  const { bookingId } = router.query
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (bookingId) loadBooking()
  }, [bookingId])

  const loadBooking = async () => {
    const { data } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()
    
    setBooking(data)
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('reviews')
        .insert([{
          user_id: user.id,
          shop_id: booking.shop_id,
          booking_id: bookingId,
          rating,
          comment
        }])

      if (error) throw error

      alert('Review submitted! Thank you!')
      router.push('/bookings')
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Layout><div>Loading...</div></Layout>

  return (
    <Layout title="Leave a Review">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">How was your haircut?</h1>

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-lg font-medium mb-3">Rating *</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-4xl"
                  >
                    {star <= rating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-lg font-medium mb-2">Comment (Optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows="4"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Tell us about your experience..."
              />
            </div>

            <button
              type="submit"
              disabled={!rating || submitting}
              className="w-full bg-primary-500 text-white py-3 rounded-md hover:bg-primary-600 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}