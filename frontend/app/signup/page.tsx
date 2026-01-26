"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import toast from 'react-hot-toast'
import { getApiBaseUrl } from '@/lib/api'

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
      const apiUrl = getApiBaseUrl()
      const response = await axios.post(
        `${apiUrl}/auth/register`,
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
        router.push('/login')
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
    <main className="min-h-screen flex items-center justify-center px-6 py-8 bg-linear-to-b from-slate-100 to-white">
      <form className="w-full max-w-md p-7 rounded-2xl shadow-lg bg-white flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
        <h1 className="m-0 text-xl font-semibold">Create Account</h1>

        {/* Username Field */}
        <label className="flex flex-col gap-2 text-sm text-gray-900" htmlFor="username">
          Username
          <input
            id="username"
            type="text"
            placeholder="Enter username"
            className={`h-11 px-3 py-2 rounded-lg border outline-none text-sm focus:ring-1 focus:ring-sky-500 transition-colors ${
              errors.username ? 'border-red-600 focus:border-red-600' : 'border-gray-300 focus:border-sky-500'
            }`}
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
            <span className="text-red-600 text-xs">
              {errors.username.message}
            </span>
          )}
        </label>

        {/* Email Field */}
        <label className="flex flex-col gap-2 text-sm text-gray-900" htmlFor="email">
          Email
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            className={`h-11 px-3 py-2 rounded-lg border outline-none text-sm focus:ring-1 focus:ring-sky-500 transition-colors ${
              errors.email ? 'border-red-600 focus:border-red-600' : 'border-gray-300 focus:border-sky-500'
            }`}
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
            <span className="text-red-600 text-xs">
              {errors.email.message}
            </span>
          )}
        </label>

        {/* Password Field */}
        <label className="flex flex-col gap-2 text-sm text-gray-900" htmlFor="password">
          Password
          <div className="flex items-center gap-2">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password"
              className={`flex-1 h-11 px-3 py-2 rounded-lg border outline-none text-sm focus:ring-1 focus:ring-sky-500 transition-colors ${
                errors.password ? 'border-red-600 focus:border-red-600' : 'border-gray-300 focus:border-sky-500'
              }`}
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
              className="h-9 px-2.5 rounded-lg border border-gray-300 bg-white cursor-pointer text-sm hover:bg-gray-50 transition-colors"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.password && (
            <span className="text-red-600 text-xs">
              {errors.password.message}
            </span>
          )}
        </label>

        {/* Confirm Password Field */}
        <label className="flex flex-col gap-2 text-sm text-gray-900" htmlFor="confirmPassword">
          Confirm Password
          <div className="flex items-center gap-2">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm password"
              className={`flex-1 h-11 px-3 py-2 rounded-lg border outline-none text-sm focus:ring-1 focus:ring-sky-500 transition-colors ${
                errors.confirmPassword ? 'border-red-600 focus:border-red-600' : 'border-gray-300 focus:border-sky-500'
              }`}
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
              className="h-9 px-2.5 rounded-lg border border-gray-300 bg-white cursor-pointer text-sm hover:bg-gray-50 transition-colors"
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.confirmPassword && (
            <span className="text-red-600 text-xs">
              {errors.confirmPassword.message}
            </span>
          )}
        </label>

        <button
          type="submit"
          className={`mt-1.5 h-12 rounded-xl border-0 bg-sky-500 text-white font-semibold cursor-pointer hover:bg-sky-600 transition-colors ${
            isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
          }`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating Account…' : 'Sign Up'}
        </button>

        <p className="m-0 text-xs text-gray-500 text-center mt-1.5">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 no-underline hover:underline cursor-pointer">
            Sign in
          </a>
        </p>
      </form>
    </main>
  )
}
