import axios from 'axios';

/**
 * Automatically determines the API base URL based on the environment:
 * - If NEXT_PUBLIC_API_URL is explicitly set, use it (allows manual override)
 * - If NODE_ENV is 'development' (bun run dev), use local backend
 * - If client-side and on localhost, use local backend
 * - Otherwise, use production backend (Vercel deployment)
 */
export function getApiBaseUrl(): string {
  // Manual override: if explicitly set, use it (highest priority)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Development mode: use local backend
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000/api';
  }

  // Client-side: check if we're on localhost (fallback for edge cases)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
      return 'http://localhost:5000/api';
    }
  }

  // Production (Vercel): use production backend
  return 'https://cleanops-8epb.onrender.com/api';
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
});
