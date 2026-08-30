import { Outlet } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import CartDrawer from '../components/CartDrawer'
import SearchOverlay from '../components/SearchOverlay'
import QuickView from '../components/QuickView'
import Toaster from '../components/ui/Toaster'

export default function StoreLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-night">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <SearchOverlay />
      <QuickView />
      <Toaster />
    </div>
  )
}
