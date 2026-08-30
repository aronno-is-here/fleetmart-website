import { Link } from 'react-router-dom'
import { JerseyArt } from '../components/ProductArt'

export default function NotFound() {
  return (
    <div className="container-fm grid items-center gap-10 py-20 lg:grid-cols-2">
      <div>
        <p className="font-display text-[8rem] leading-none tracking-wide text-volt sm:text-[12rem]">404</p>
        <h1 className="font-display text-5xl uppercase tracking-wide text-chalk">Off The Pitch</h1>
        <p className="mt-4 max-w-md text-muted">The page you're looking for was substituted off. Let's get you back in the game.</p>
        <div className="mt-8 flex gap-3">
          <Link to="/" className="btn-volt">Back Home</Link>
          <Link to="/shop" className="btn-ghost">Browse Gear</Link>
        </div>
      </div>
      <div className="mx-auto hidden w-full max-w-sm -rotate-6 lg:block">
        <JerseyArt primary="#111923" secondary="#223040" number="404" name="NOT FOUND" view="front" />
      </div>
    </div>
  )
}