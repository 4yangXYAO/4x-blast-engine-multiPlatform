'use client'

import './globals.css'
import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'
import Sidebar, { MobileNav } from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const metadata: Metadata = {
  title: 'JOKI BLAST Dashboard',
  description: 'Social media blast engine dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        <QueryClientProvider client={queryClient}>
          <div className="flex min-h-screen">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className={`flex-1 transition-all ${collapsed ? 'md:ml-16' : 'md:ml-64'}`}>
              <Header
                onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
                breadcrumb=""
              />
              <main className="p-4 md:p-6 max-w-7xl">
                {children}
              </main>
            </div>
            <MobileNav open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 z-20 bg-slate-800 border border-slate-700 rounded-r-lg px-1 py-2 hover:bg-slate-700 min-h-[44px] min-w-[44px]"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg className={`w-3 h-3 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          </div>
          <Toaster position="top-right" theme="dark" />
        </QueryClientProvider>
      </body>
    </html>
  )
}
