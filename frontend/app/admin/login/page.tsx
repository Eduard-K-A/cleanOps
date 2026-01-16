"use client"

import React, { useState } from 'react'
import { styles } from './styles'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
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
      const response = await axios.post(
        'http://localhost:5000/api/auth/login',
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

      // Store user data in localStorage
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user))
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
    <main style={styles.page}>
      <form style={styles.card} onSubmit={handleSubmit} aria-describedby={error ? 'error-msg' : undefined}>
        <h1 style={styles.title}>Admin sign in</h1>

        {error && (
          <div id="error-msg" role="alert" style={styles.error}>
            {error}
          </div>
        )}

        {success && (
          <div role="status" style={styles.success}>
            {success}
          </div>
        )}

        <label style={styles.label} htmlFor="email">
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
            style={styles.input}
            aria-invalid={!!error && error.toLowerCase().includes('email')}
          />
        </label>

        <label style={styles.label} htmlFor="password">
          Password
          <div style={styles.passwordRow}>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ ...styles.input, marginRight: 8 }}
              aria-invalid={!!error && error.toLowerCase().includes('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-pressed={showPassword}
              style={styles.toggle}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        <div style={styles.rowBetween}>
          <label style={styles.checkboxLabel}>
            <input type="checkbox" style={styles.checkbox} /> Remember me
          </label>
          <a href="#" style={styles.forgot}>Forgot?</a>
        </div>

        <button type="submit" style={styles.submit} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <p style={styles.footerNote}>
          Don't have an account?{' '}
          <a href="/admin/signup" style={{ ...styles.forgot, cursor: 'pointer' }}>
            Sign up
          </a>
        </p>
      </form>
    </main>
  )
}

