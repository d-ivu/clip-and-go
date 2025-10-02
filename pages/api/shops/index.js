import { supabase } from '../../../lib/supabase'

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('active', true)
    
    if (error) throw error
    
    res.status(200).json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
}