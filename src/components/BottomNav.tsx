'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  icon: string
  label: string
}

export default function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex" 
      style={{background: '#1E1E24', borderTop: '1px solid #333'}}>
      {items.map(item => (
        <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center py-3">
          <span className="text-2xl">{item.icon}</span>
          <span className="text-xs mt-1" style={{color: pathname === item.href ? '#D4AF37' : '#666'}}>
            {item.label}
          </span>
        </Link>
      ))}
    </div>
  )
}
