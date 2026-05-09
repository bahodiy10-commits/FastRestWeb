'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const adminNav = [
  { href: '/admin', icon: '📊', label: 'Dashboard' },
  { href: '/admin/orders', icon: '📋', label: 'Buyurtma' },
  { href: '/admin/menu', icon: '🍽️', label: 'Menyu' },
  { href: '/admin/tables', icon: '🪑', label: 'Stollar' },
  { href: '/admin/payments', icon: '💳', label: "To'lov" },
  { href: '/admin/background', icon: '🖼️', label: 'Fon' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="pb-20" style={{ background: '#0B0B0F', minHeight: '100vh' }}>
      {children}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex overflow-x-auto"
        style={{ background: '#1E1E24', borderTop: '1px solid #2A2A35' }}>
        {adminNav.map(item => (
          <Link key={item.href} href={item.href}
            className="flex-1 flex flex-col items-center py-2 min-w-0"
            style={{ minWidth: 56 }}>
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs mt-0.5 truncate px-1"
              style={{ color: pathname === item.href ? '#D4AF37' : '#666' }}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
