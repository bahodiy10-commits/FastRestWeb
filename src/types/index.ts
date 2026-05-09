export type UserRole = 'admin' | 'kitchen' | 'customer'

export interface User {
  uid: string
  email: string
  role: UserRole
  name?: string
}

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image?: string
  available: boolean
  prepTime: number
}

export interface CartItem {
  menuItem: MenuItem
  quantity: number
  comment?: string
}

export interface Order {
  id: string
  tableId: string
  items: CartItem[]
  status: 'new' | 'preparing' | 'ready' | 'paid'
  total: number
  createdAt: number
  type: 'dine-in' | 'takeaway'
}

export interface Table {
  id: string
  number: string
  roomName: string
  qrCode?: string
}
