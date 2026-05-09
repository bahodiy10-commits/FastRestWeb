'use client'
import BottomNav from '@/components/BottomNav'

const adminNav = [
  { href: '/admin', icon: '📊', label: 'Dashboard' },
  { href: '/admin/orders', icon: '📋', label: 'Buyurtmalar' },
  { href: '/admin/menu', icon: '🍽️', label: 'Menyu' },
  { href: '/admin/tables', icon: '🪑', label: 'Stollar' },
  { href: '/admin/payments', icon: '💳', label: 'To\'lov' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-20" style={{ background: '#0B0B0F', minHeight: '100vh' }}>
      {children}
      <BottomNav items={adminNav} />
    </div>
  )
}
