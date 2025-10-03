import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

export default function Barbers() {
  const [barbers, setBarbers] = useState([])
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedShop, setSelectedShop] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load barbers
      const { data: barbersData, error: barbersError } = await supabase
        .from('barbers')
        .select('*')
        .eq('active', true)
        .order('name')

      if (barbersError) throw barbersError

      // Load shops
      const response = await fetch('/api/shops')
      const result = await response.json()
      
      setBarbers(barbersData || [])
      setShops(result.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBarbers = selectedShop === 'all' 
    ? barbers 
    : barbers.filter(b => b.shop_id === parseInt(selectedShop))

  const getShopName = (shopId) => {
    const shop = shops.find(s => s.id === shopId)
    return shop?.name || 'Unknown Shop'
  }

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    )
  }

  return (
    <Layout title="Our Barbers - Clip & Go">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4">Meet Our Barbers</h1>
        <p className="text-center text-gray-600 mb-8">
          Experienced professionals ready to give you the perfect cut
        </p>

        {/* Filter by Shop */}
        <div className="mb-8 flex justify-center">
          <select
            value={selectedShop}
            onChange={(e) => setSelectedShop(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Shops</option>
            {shops.map(shop => (
              <option key={shop.id} value={shop.id}>
                {shop.name}
              </option>
            ))}
          </select>
        </div>

        {/* Barbers Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBarbers.map(barber => (
            <Link 
              key={barber.id} 
              href={`/barber/${barber.id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Photo Placeholder */}
              <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <span className="text-6xl">👨‍💼</span>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold mb-1">{barber.name}</h3>
                <p className="text-sm text-gray-500 mb-3">
                  {getShopName(barber.shop_id)}
                </p>
                
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {barber.bio}
                </p>

                {barber.years_experience && (
                  <p className="text-sm text-primary-600 font-semibold mb-3">
                    {barber.years_experience} years experience
                  </p>
                )}

                {barber.specialties && barber.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {barber.specialties.slice(0, 3).map((specialty, idx) => (
                      <span 
                        key={idx}
                        className="text-xs bg-gray-100 px-2 py-1 rounded"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  )
}