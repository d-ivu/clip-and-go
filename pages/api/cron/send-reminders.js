import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  // Protect this endpoint
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Get tomorrow's bookings
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowDate = tomorrow.toISOString().split('T')[0]

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        profiles!inner(phone)
      `)
      .eq('appointment_date', tomorrowDate)
      .eq('status', 'scheduled')

    if (error) throw error

    // Send SMS to each
    const results = await Promise.all(
      bookings.map(booking => 
        fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-sms-reminder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: booking.profiles.phone,
            shopName: 'Your Shop', // Get from shops table
            date: booking.appointment_date,
            time: booking.appointment_time
          })
        })
      )
    )

    res.status(200).json({ 
      success: true, 
      sent: results.length 
    })
  } catch (error) {
    console.error('Cron error:', error)
    res.status(500).json({ error: error.message })
  }
}