import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import ShopCard from '../components/ShopCard'

export default function Home() {
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchShops()
  }, [])

  const fetchShops = async () => {
    try {
      const response = await fetch('/api/shops')
      const result = await response.json()
      if (result.success) {
        setShops(result.data)
      }
    } catch (error) {
      console.error('Error fetching shops:', error)
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

  return (
    <Layout>
      <h1 className="text-4xl font-bold text-center mb-8">
        Never Miss a <span className="text-primary-600">Great Haircut</span>
      </h1>
      
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        {shops.map(shop => (
          <ShopCard key={shop.id} shop={shop} />
        ))}
      </div>
    </Layout>
  )
}