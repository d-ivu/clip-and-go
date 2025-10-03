import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'

export default function ManageShops() {
  const router = useRouter()
  const [admin, setAdmin] = useState(null)
  const [shops, setShops] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    description: ''
  })

  useEffect(() => {
    checkAdmin()
    loadShops()
  }, [])

  const checkAdmin = () => {
    const session = localStorage.getItem('adminSession')
    if (!session) {
      router.push('/admin/login')
      return
    }
    setAdmin(JSON.parse(session))
  }

  const loadShops = async () => {
    const { data } = await supabase
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false })
    
    setShops(data || [])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const { error } = await supabase
        .from('shops')
        .insert([formData])

      if (error) throw error

      alert('Shop added!')
      setShowForm(false)
      setFormData({ name: '', address: '', phone: '', description: '' })
      loadShops()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  const toggleShop = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('shops')
        .update({ active: !currentStatus })
        .eq('id', id)

      if (error) throw error
      loadShops()
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  return (
    <Layout title="Manage Shops">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manage Shops</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600"
          >
            {showForm ? 'Cancel' : 'Add Shop'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Add New Shop</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Shop Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
                className="w-full px-3 py-2 border rounded"
              />
              <input
                type="text"
                placeholder="Address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                required
                className="w-full px-3 py-2 border rounded"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 py-2 border rounded"
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="3"
                className="w-full px-3 py-2 border rounded"
              />
              <button
                type="submit"
                className="w-full bg-primary-500 text-white py-2 rounded hover:bg-primary-600"
              >
                Add Shop
              </button>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {shops.map(shop => (
            <div key={shop.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">{shop.name}</h3>
                  <p className="text-gray-600">{shop.address}</p>
                  <p className="text-gray-600">{shop.phone}</p>
                </div>
                <button
                  onClick={() => toggleShop(shop.id, shop.active)}
                  className={`px-4 py-2 rounded ${
                    shop.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {shop.active ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}