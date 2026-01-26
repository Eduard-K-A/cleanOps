"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/authContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import { getApiBaseUrl } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const { setIsLoggedIn, setUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function validate() {
    if (!email) return 'Please enter your email.'
    // simple email check
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(email)) return 'Please enter a valid email address.'
    if (!password) return 'Please enter your password.'
    if (password.length < 6) return 'Password must be at least 6 characters.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      toast.error(validationError)
      return
    }

    setLoading(true)
    try {
      // Make login request to backend
      const apiUrl = getApiBaseUrl()
      const response = await axios.post(
        `${apiUrl}/auth/login`,
        {
          email,
          password
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      // Success
      const successMessage = response.data.message || 'Login successful!'
      setSuccess(successMessage)
      toast.success(successMessage)

      // Store user data in localStorage and update context
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user))
        setUser(response.data.user)
        setIsLoggedIn(true)
      }

      // Redirect to customer dashboard after a short delay
      setTimeout(() => {
        router.push('/customer/dashboard')
      }, 1000)
    } catch (err: any) {
      // Handle errors
      let errorMessage = 'Failed to sign in. Please try again.'

      // Check for backend validation or authentication errors
      if (err.response?.status === 401) {
        // 401 Unauthorized - Invalid credentials
        errorMessage = err.response.data?.error || 'Invalid email or password'
      } else if (err.response?.status === 400) {
        // 400 Bad Request - Validation error
        errorMessage = err.response.data?.error || 'Invalid input'
      } else if (err.message === 'Network Error') {
        errorMessage = 'Cannot connect to server. Make sure the backend is running.'
      }

      setError(errorMessage)
      toast.error(errorMessage)
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-8 bg-linear-to-b from-slate-100 to-white">
      <form className="w-full max-w-md p-7 rounded-2xl shadow-lg bg-white flex flex-col gap-3" onSubmit={handleSubmit} aria-describedby={error ? 'error-msg' : undefined}>
        <h1 className="m-0 text-xl font-semibold">Admin sign in</h1>

        {error && (
          <div id="error-msg" role="alert" className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div role="status" className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg text-sm">
            {success}
          </div>
        )}

        <label className="flex flex-col gap-2 text-sm text-gray-900" htmlFor="email">
          Email
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 px-3 py-2 rounded-lg border border-gray-300 outline-none text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            aria-invalid={!!error && error.toLowerCase().includes('email')}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm text-gray-900" htmlFor="password">
          Password
          <div className="flex items-center gap-2">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 h-11 px-3 py-2 rounded-lg border border-gray-300 outline-none text-sm focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              aria-invalid={!!error && error.toLowerCase().includes('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-pressed={showPassword}
              className="h-9 px-2.5 rounded-lg border border-gray-300 bg-white cursor-pointer text-sm hover:bg-gray-50 transition-colors"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        <div className="flex justify-between items-center mt-1">
          <label className="text-xs text-gray-600 flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4" /> Remember me
          </label>
          <a href="#" className="text-xs text-blue-600 no-underline hover:underline">Forgot?</a>
        </div>

        <button type="submit" className="mt-1.5 h-12 rounded-xl border-0 bg-sky-500 text-white font-semibold cursor-pointer hover:bg-sky-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="m-0 text-xs text-gray-500 text-center mt-1.5">
          Don't have an account?{' '}
          <a href="/signup" className="text-blue-600 no-underline hover:underline cursor-pointer">
            Sign up
          </a>
        </p>
      </form>
    </main>
  )
}

