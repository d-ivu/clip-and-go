import { useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/Layout'

// Hardcoded admin credentials for MVP (shop username/password)
const ADMIN_CREDENTIALS = {
  'sydneycuts': { password: 'admin123', shopId: 1, shopName: 'Sydney Cuts' },
  'kingsxbarbers': { password: 'admin123', shopId: 2, shopName: 'Kings Cross Barbers' },
  'bondicuts': { password: 'admin123', shopId: 3, shopName: 'Bondi Beach Cuts' }
}

export default function AdminLogin() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const admin = ADMIN_CREDENTIALS[username]
    
    if (admin && admin.password === password) {
      // Store admin session
      if (typeof window !== 'undefined') {
        localStorage.setItem('adminSession', JSON.stringify({
          username,
          shopId: admin.shopId,
          shopName: admin.shopName,
          loginTime: new Date().toISOString()
        }))
      }
      
      router.push('/admin/dashboard')
    } else {
      setError('Invalid username or password')
      setLoading(false)
    }
  }

  return (
    <Layout title="Admin Login - Clip & Go">
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Admin Login</h1>
            <p className="text-gray-600 mt-2">Barbershop Dashboard Access</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="sydneycuts"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 text-white py-2 px-4 rounded-md hover:bg-primary-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded text-sm">
            <p className="font-semibold mb-2">Demo Credentials:</p>
            <p className="text-gray-600">Username: <code>sydneycuts</code></p>
            <p className="text-gray-600">Password: <code>admin123</code></p>
          </div>
        </div>
      </div>
    </Layout>
  )
}