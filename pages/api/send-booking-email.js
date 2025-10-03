import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { to, shopName, date, time } = req.body

  try {
    await resend.emails.send({
      from: 'Clip & Go <onboarding@resend.dev>',
      to,
      subject: 'Booking Confirmation - Clip & Go',
      html: `
        <h1>Booking Confirmed!</h1>
        <p>Your haircut appointment has been booked.</p>
        <p><strong>Shop:</strong> ${shopName}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p>See you soon!</p>
      `
    })

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Email error:', error)
    res.status(500).json({ error: error.message })
  }
}