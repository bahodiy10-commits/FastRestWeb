'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const adminNav = [
  { href: '/admin', icon: '📊', label: 'Statistika' },
  { href: '/admin/orders', icon: '📋', label: 'Buyurtma' },
  { href: '/admin/menu', icon: '🍽️', label: 'Menyu' },
  { href: '/admin/tables', icon: '🪑', label: 'Stollar' },
  { href: '/admin/payments', icon: '💳', label: "To'lov" },
  { href: '/admin/background', icon: '🖼️', label: 'Fon' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="pb-20" style={{ minHeight: '100vh' }}>
      {children}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex overflow-x-auto"
        style={{
          background: 'rgba(15,15,20,0.92)',
          borderTop: '1px solid rgba(212,175,55,0.15)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}>
        {adminNav.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href}
              className="flex-1 flex flex-col items-center py-2 min-w-0"
              style={{ minWidth: 52 }}>
              <span className="text-lg" style={{ filter: active ? 'none' : 'grayscale(0.5)' }}>
                {item.icon}
              </span>
              <span className="text-xs mt-0.5 truncate px-1"
                style={{ color: active ? '#D4AF37' : '#555', fontWeight: active ? '600' : '400' }}>
                {item.label}
              </span>
              {active && (
                <div style={{ width: 20, height: 2, background: '#D4AF37', borderRadius: 2, marginTop: 2 }}/>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
