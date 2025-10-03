import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { code } = req.body

    if (!code) {
      return res.status(400).json({ error: 'Code required' })
    }

    // Fetch promo code
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('active', true)
      .single()

    if (error || !data) {
      return res.status(404).json({ 
        success: false, 
        error: 'Invalid promo code' 
      })
    }

    // Check if expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return res.status(400).json({ 
        success: false, 
        error: 'This promo code has expired' 
      })
    }

    // Check if max uses reached
    if (data.max_uses && data.uses_count >= data.max_uses) {
      return res.status(400).json({ 
        success: false, 
        error: 'This promo code has reached its usage limit' 
      })
    }

    // Valid code!
    res.status(200).json({ 
      success: true, 
      discount_percent: data.discount_percent,
      code: data.code
    })

  } catch (error) {
    console.error('Promo validation error:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    })
  }
}