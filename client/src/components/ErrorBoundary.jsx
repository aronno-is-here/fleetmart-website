import { Component } from 'react'
import { Link } from 'react-router-dom'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-screen place-items-center bg-night px-4 text-center">
          <div className="max-w-md">
            <p className="font-display text-7xl text-volt">500</p>
            <h1 className="mt-4 font-display text-3xl uppercase tracking-wide text-chalk">Something went wrong</h1>
            <p className="mt-3 text-sm text-muted">An unexpected error occurred. Please try again.</p>
            <div className="mt-8 flex justify-center gap-3">
              <button onClick={() => window.location.reload()} className="btn-volt !text-xs">Reload Page</button>
              <Link to="/" className="btn-ghost !text-xs">Go Home</Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
