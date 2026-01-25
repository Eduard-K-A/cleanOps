import React from 'react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 mt-9 bg-white pt-7 pb-4.5">
      <div className="max-w-5xl mx-auto grid grid-cols-4 gap-5 px-5">
        <div className="flex flex-col gap-2">
          <div className="font-bold text-lg text-slate-900">cleanOps</div>
          <div className="text-gray-500 text-xs mt-1.5 max-w-xs">Efficient, reliable cleaning operations for modern teams.</div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-xs text-gray-900 font-semibold">Product</div>
          <Link href="/customer/order" className="text-gray-600 no-underline text-sm mt-1.5 hover:text-sky-500 transition-colors">Order</Link>
          <Link href="/customer/payment" className="text-gray-600 no-underline text-sm mt-1.5 hover:text-sky-500 transition-colors">Payment</Link>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-xs text-gray-900 font-semibold">Company</div>
          <Link href="/homepage" className="text-gray-600 no-underline text-sm mt-1.5 hover:text-sky-500 transition-colors">About</Link>
          <Link href="/homepage" className="text-gray-600 no-underline text-sm mt-1.5 hover:text-sky-500 transition-colors">Careers</Link>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-xs text-gray-900 font-semibold">Legal</div>
          <Link href="/homepage" className="text-gray-600 no-underline text-sm mt-1.5 hover:text-sky-500 transition-colors">Privacy</Link>
          <Link href="/homepage" className="text-gray-600 no-underline text-sm mt-1.5 hover:text-sky-500 transition-colors">Terms</Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 text-gray-500 text-xs mt-3">© {new Date().getFullYear()} cleanOps — All rights reserved.</div>
    </footer>
  )
}
