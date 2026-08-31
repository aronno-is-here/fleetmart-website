import { Outlet } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import MatchBackground from '../components/MatchBackground'
import CartDrawer from '../components/CartDrawer'
import SearchOverlay from '../components/SearchOverlay'
import QuickView from '../components/QuickView'
import Toaster from '../components/ui/Toaster'

export default function StoreLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-night">
      <MatchBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
      <CartDrawer />
      <SearchOverlay />
      <QuickView />
      <Toaster />
    </div>
  )
}
