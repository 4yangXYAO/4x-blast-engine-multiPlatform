import './globals.css'
import type { Metadata } from 'next'
import AppLayout from '@/components/layout/AppLayout'

export const metadata: Metadata = {
  title: '4x Blast Engine | Social Media Automation',
  description: 'Professional multi-platform social media automation engine by 4yangXYAO.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
      <body className="bg-slate-950 text-slate-100 min-h-screen font-sans selection:bg-emerald-500/30 selection:text-emerald-200" suppressHydrationWarning>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  )
}
