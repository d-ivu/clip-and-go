import Layout from '../components/Layout'
import ShopCard from '../components/ShopCard'

const SHOPS = [
  {
    id: 1,
    name: "Sydney Cuts",
    address: "123 Pitt St, Sydney",
    phone: "(02) 9123 4567"
  },
  {
    id: 2,
    name: "Kings Cross Barbers",
    address: "456 Darlinghurst Rd",
    phone: "(02) 9234 5678"
  },
  {
    id: 3,
    name: "Bondi Beach Cuts",
    address: "789 Campbell Parade",
    phone: "(02) 9345 6789"
  }
]

export default function Shops() {
  return (
    <Layout title="Shops - Clip & Go">
      <h1 className="text-3xl font-bold mb-8">All Shops</h1>
      <div className="grid md:grid-cols-3 gap-6">
        {SHOPS.map(shop => (
          <ShopCard key={shop.id} shop={shop} />
        ))}
      </div>
    </Layout>
  )
}