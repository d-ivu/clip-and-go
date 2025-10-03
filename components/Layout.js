import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Layout({ children, title = 'Clip & Go' }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 h-16 flex justify-between items-center">
            <Link href="/" className="text-xl font-bold text-primary-600">
              Clip & Go
            </Link>
            <nav className="flex gap-4 items-center">
              <Link href="/" className="text-gray-600 hover:text-primary-600">
                Home
              </Link>
              <Link href="/shops" className="text-gray-600 hover:text-primary-600">
                Shops
              </Link>
              <Link href="/barbers" className="text-gray-600 hover:text-primary-600">
  Barbers
</Link>
              
              {user ? (
  <>
    <Link href="/book" className="text-gray-600 hover:text-primary-600">
      Book
    </Link>
    <Link href="/bookings" className="text-gray-600 hover:text-primary-600">
      My Bookings
    </Link>
    <Link href="/profile" className="text-gray-600 hover:text-primary-600">
      Profile
    </Link>
    <button
      onClick={handleLogout}
      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
    >
      Logout
    </button>
  </>
) : (
                <>
                  <Link href="/login" className="text-gray-600 hover:text-primary-600">
                    Login
                  </Link>
                  <Link href="/signup" className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600">
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        
        <footer className="bg-gray-800 text-white py-8 mt-12">
          <div className="container mx-auto px-4 text-center">
            <p>© 2024 Clip & Go</p>
          </div>
        </footer>
      </div>
    </>
  )
}