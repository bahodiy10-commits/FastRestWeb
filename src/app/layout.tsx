import type { Metadata } from 'next'
import './globals.css'
import BgWrapper from '@/components/BgWrapper'

export const metadata: Metadata = {
  title: 'FastRest',
  description: 'Premium Restaurant System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body style={{ background: '#0B0B0F', minHeight: '100vh' }}>
        <BgWrapper>{children}</BgWrapper>
      </body>
    </html>
  )
}
