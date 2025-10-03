import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { to, shopName, date, time } = req.body

  try {
    await client.messages.create({
      body: `Reminder: Your haircut at ${shopName} tomorrow at ${time}. See you soon! - Clip & Go`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to // Must be in format: +61400000000
    })

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('SMS error:', error)
    res.status(500).json({ error: error.message })
  }
}