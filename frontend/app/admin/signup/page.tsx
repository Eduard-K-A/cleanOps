"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import toast from 'react-hot-toast'
import { styles } from './styles'

interface SignupFormData {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export default function SignupPage() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset
  } = useForm<SignupFormData>({
    mode: 'onBlur',
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const password = watch('password')

  async function onSubmit(data: SignupFormData) {
    // Client-side validation: Check if passwords match
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    try {
      // Send registration request to backend
      const response = await axios.post(
        'http://localhost:5000/api/auth/register',
        {
          username: data.username,
          email: data.email,
          password: data.password
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      // Success
      toast.success('Registration successful! Redirecting to login...')
      reset()

      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push('/admin/login')
      }, 1500)
    } catch (error: any) {
      // Handle backend errors
      if (error.response?.data?.error) {
        toast.error(error.response.data.error)
      } else if (error.message === 'Network Error') {
        toast.error('Cannot connect to server. Make sure the backend is running.')
      } else {
        toast.error('Registration failed. Please try again.')
      }
      console.error('Registration error:', error)
    }
  }

  return (
    <main style={styles.page}>
      <form style={styles.card} onSubmit={handleSubmit(onSubmit)}>
        <h1 style={styles.title}>Create Account</h1>

        {/* Username Field */}
        <label style={styles.label} htmlFor="username">
          Username
          <input
            id="username"
            type="text"
            placeholder="Enter username"
            style={{
              ...styles.input,
              borderColor: errors.username ? '#dc2626' : '#e5e7eb'
            }}
            aria-invalid={!!errors.username}
            {...register('username', {
              required: 'Username is required',
              minLength: {
                value: 3,
                message: 'Username must be at least 3 characters'
              },
              maxLength: {
                value: 30,
                message: 'Username must not exceed 30 characters'
              },
              pattern: {
                value: /^[a-zA-Z0-9]+$/,
                message: 'Username must contain only alphanumeric characters'
              }
            })}
          />
          {errors.username && (
            <span style={{ color: '#dc2626', fontSize: 12 }}>
              {errors.username.message}
            </span>
          )}
        </label>

        {/* Email Field */}
        <label style={styles.label} htmlFor="email">
          Email
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            style={{
              ...styles.input,
              borderColor: errors.email ? '#dc2626' : '#e5e7eb'
            }}
            aria-invalid={!!errors.email}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please provide a valid email address'
              }
            })}
          />
          {errors.email && (
            <span style={{ color: '#dc2626', fontSize: 12 }}>
              {errors.email.message}
            </span>
          )}
        </label>

        {/* Password Field */}
        <label style={styles.label} htmlFor="password">
          Password
          <div style={styles.passwordRow}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password"
              style={{
                ...styles.input,
                marginRight: 8,
                borderColor: errors.password ? '#dc2626' : '#e5e7eb',
                flex: 1
              }}
              aria-invalid={!!errors.password}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
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
          {errors.password && (
            <span style={{ color: '#dc2626', fontSize: 12 }}>
              {errors.password.message}
            </span>
          )}
        </label>

        {/* Confirm Password Field */}
        <label style={styles.label} htmlFor="confirmPassword">
          Confirm Password
          <div style={styles.passwordRow}>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm password"
              style={{
                ...styles.input,
                marginRight: 8,
                borderColor: errors.confirmPassword ? '#dc2626' : '#e5e7eb',
                flex: 1
              }}
              aria-invalid={!!errors.confirmPassword}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) =>
                  value === password || 'Passwords do not match'
              })}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((s) => !s)}
              aria-pressed={showConfirmPassword}
              style={styles.toggle}
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.confirmPassword && (
            <span style={{ color: '#dc2626', fontSize: 12 }}>
              {errors.confirmPassword.message}
            </span>
          )}
        </label>

        <button
          type="submit"
          style={{
            ...styles.submit,
            opacity: isSubmitting ? 0.7 : 1,
            cursor: isSubmitting ? 'not-allowed' : 'pointer'
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Account…' : 'Sign Up'}
        </button>

        <p style={styles.footerNote}>
          Already have an account?{' '}
          <a href="/admin/login" style={styles.link}>
            Sign in
          </a>
        </p>
      </form>
    </main>
  )
}
