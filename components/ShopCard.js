import Link from 'next/link'

export default function ShopCard({ shop }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="h-32 bg-blue-500 rounded mb-4 flex items-center justify-center text-white text-5xl">
        ✂️
      </div>
      
      <h3 className="text-xl font-bold mb-2">{shop.name}</h3>
      <p className="text-gray-600 mb-2">{shop.address}</p>
      <p className="text-gray-500 mb-4">{shop.phone}</p>
      
      <Link 
        href={`/shop/${shop.id}`}
        className="block w-full bg-primary-500 text-white text-center py-2 rounded hover:bg-primary-600"
      >
        View Details
      </Link>
    </div>
  )
}