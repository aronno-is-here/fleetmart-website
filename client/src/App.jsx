import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import StoreLayout from './layouts/StoreLayout'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './pages/admin/AdminLayout'

const Home = lazy(() => import('./pages/Home'))
const Shop = lazy(() => import('./pages/Shop'))
const ProductDetails = lazy(() => import('./pages/ProductDetails'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'))
const OrderLookup = lazy(() => import('./pages/OrderLookup'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const Account = lazy(() => import('./pages/Account'))
const Wishlist = lazy(() => import('./pages/Wishlist'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Support = lazy(() => import('./pages/Support'))
const Faq = lazy(() => import('./pages/Faq'))
const Policy = lazy(() => import('./pages/Policy'))
const NotFound = lazy(() => import('./pages/NotFound'))
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'))
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'))
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'))
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'))
const AdminBanners = lazy(() => import('./pages/admin/AdminBanners'))

function Loading() {
  return (
    <div className="grid h-64 place-items-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-volt border-t-transparent" />
    </div>
  )
}

function withSuspense(Component) {
  return (
    <Suspense fallback={<Loading />}>
      <Component />
    </Suspense>
  )
}

const router = createBrowserRouter([
  {
    element: <StoreLayout />,
    children: [
      { path: '/', element: withSuspense(Home) },
      { path: '/shop', element: withSuspense(Shop) },
      { path: '/product/:slug', element: withSuspense(ProductDetails) },
      { path: '/cart', element: withSuspense(Cart) },
      { path: '/checkout', element: withSuspense(Checkout) },
      { path: '/order/success', element: withSuspense(OrderSuccess) },
      { path: '/order/lookup', element: withSuspense(OrderLookup) },
      { path: '/login', element: withSuspense(Login) },
      { path: '/register', element: withSuspense(Register) },
      { path: '/forgot-password', element: withSuspense(ForgotPassword) },
      {
        path: '/account',
        element: (
          <ProtectedRoute>
            {withSuspense(Account)}
          </ProtectedRoute>
        ),
      },
      {
        path: '/account/:tab',
        element: (
          <ProtectedRoute>
            {withSuspense(Account)}
          </ProtectedRoute>
        ),
      },
      { path: '/account/wishlist', element: withSuspense(Wishlist) },
      { path: '/about', element: withSuspense(About) },
      { path: '/contact', element: withSuspense(Contact) },
      { path: '/support', element: withSuspense(Support) },
      { path: '/faq', element: withSuspense(Faq) },
      { path: '/policies/:slug', element: withSuspense(Policy) },
      { path: '*', element: withSuspense(NotFound) },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { path: '', element: withSuspense(Dashboard) },
      { path: 'login', element: withSuspense(AdminLogin) },
      { path: 'products', element: withSuspense(AdminProducts) },
      { path: 'orders', element: withSuspense(AdminOrders) },
      { path: 'users', element: withSuspense(AdminUsers) },
      { path: 'coupons', element: withSuspense(AdminCoupons) },
      { path: 'reviews', element: withSuspense(AdminReviews) },
      { path: 'analytics', element: withSuspense(AdminAnalytics) },
      { path: 'categories', element: withSuspense(AdminCategories) },
      { path: 'banners', element: withSuspense(AdminBanners) },
      { path: 'settings', element: withSuspense(AdminSettings) },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
