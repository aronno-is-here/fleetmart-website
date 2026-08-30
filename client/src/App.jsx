import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import StoreLayout from './layouts/StoreLayout'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetails from './pages/ProductDetails'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import Login from './pages/Login'
import Register from './pages/Register'
import Account from './pages/Account'
import Wishlist from './pages/Wishlist'
import About from './pages/About'
import Contact from './pages/Contact'
import Faq from './pages/Faq'
import Policy from './pages/Policy'
import NotFound from './pages/NotFound'

const router = createBrowserRouter([
  {
    element: <StoreLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/shop', element: <Shop /> },
      { path: '/product/:slug', element: <ProductDetails /> },
      { path: '/cart', element: <Cart /> },
      { path: '/checkout', element: <Checkout /> },
      { path: '/order/success', element: <OrderSuccess /> },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/account', element: <Account /> },
      { path: '/account/:tab', element: <Account /> },
      { path: '/account/wishlist', element: <Wishlist /> },
      { path: '/about', element: <About /> },
      { path: '/contact', element: <Contact /> },
      { path: '/faq', element: <Faq /> },
      { path: '/policies/:slug', element: <Policy /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
