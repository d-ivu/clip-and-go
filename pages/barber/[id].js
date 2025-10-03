import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'

export default function BarberProfile() {
  const router = useRouter()
  const { id } = router.query
  const [barber, setBarber] = useState(null)
  const [shop, setShop] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadBarber()
    }
  }, [id])

  const loadBarber = async () => {
    try {
      // Load barber
      const { data: barberData, error: barberError } = await supabase
        .from('barbers')
        .select('*')
        .eq('id', id)
        .single()

      if (barberError) throw barberError

      setBarber(barberData)

      // Load shop
      const response = await fetch('/api/shops')
      const result = await response.json()
      const shopData = result.data.find(s => s.id === barberData.shop_id)
      setShop(shopData)

    } catch (error) {
      console.error('Error loading barber:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    )
  }

  if (!barber) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Barber not found</h1>
          <Link href="/barbers" className="text-primary-600">← Back to barbers</Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title={`${barber.name} - Clip & Go`}>
      <div className="max-w-4xl mx-auto">
        <Link href="/barbers" className="text-primary-600 mb-4 inline-block">
          ← Back to all barbers
        </Link>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="md:flex">
            {/* Photo */}
            <div className="md:w-1/3">
              <div className="h-64 md:h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <span className="text-8xl">👨‍💼</span>
              </div>
            </div>

            {/* Info */}
            <div className="md:w-2/3 p-8">
              <h1 className="text-3xl font-bold mb-2">{barber.name}</h1>
              
              {shop && (
                <Link 
                  href={`/shop/${shop.id}`}
                  className="text-primary-600 hover:underline mb-4 inline-block"
                >
                  📍 {shop.name}
                </Link>
              )}

              {barber.years_experience && (
                <p className="text-lg text-gray-700 mb-4">
                  <strong>{barber.years_experience} years</strong> of experience
                </p>
              )}

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">About</h2>
                <p className="text-gray-600">{barber.bio}</p>
              </div>

              {barber.specialties && barber.specialties.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-3">Specialties</h2>
                  <div className="flex flex-wrap gap-2">
                    {barber.specialties.map((specialty, idx) => (
                      <span 
                        key={idx}
                        className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-semibold"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {shop && (
                <Link
                  href={`/shop/${shop.id}`}
                  className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 inline-block"
                >
                  Book at {shop.name}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}