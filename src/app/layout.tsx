import type { Metadata } from 'next'
import './globals.css'
import BgWrapper from '@/components/BgWrapper'
import DataProvider from '@/components/DataProvider'

export const metadata: Metadata = {
  title: 'FastRest',
  description: 'Premium Restaurant System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body>
        <div
          id="global-bg"
          style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100%', height: '100%',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0,
            zIndex: 0,
            pointerEvents: 'none',
            transform: 'translateZ(0)',
            willChange: 'opacity',
          }}
        />
        <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
          <BgWrapper>
            <DataProvider>
              {children}
            </DataProvider>
          </BgWrapper>
        </div>
      </body>
    </html>
  )
}
