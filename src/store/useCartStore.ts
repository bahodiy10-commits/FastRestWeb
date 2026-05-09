import { create } from 'zustand'
import { CartItem, MenuItem } from '@/types'

interface CartStore {
  items: CartItem[]
  tableId: string | null
  orderType: 'dine-in' | 'takeaway' | null
  addItem: (item: MenuItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  setTableId: (id: string) => void
  setOrderType: (type: 'dine-in' | 'takeaway') => void
  total: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  tableId: null,
  orderType: null,
  addItem: (menuItem) => {
    const items = get().items
    const existing = items.find(i => i.menuItem.id === menuItem.id)
    if (existing) {
      set({ items: items.map(i => i.menuItem.id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i) })
    } else {
      set({ items: [...items, { menuItem, quantity: 1 }] })
    }
  },
  removeItem: (id) => set({ items: get().items.filter(i => i.menuItem.id !== id) }),
  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeItem(id)
    } else {
      set({ items: get().items.map(i => i.menuItem.id === id ? { ...i, quantity } : i) })
    }
  },
  clearCart: () => set({ items: [], tableId: null, orderType: null }),
  setTableId: (tableId) => set({ tableId }),
  setOrderType: (orderType) => set({ orderType }),
  total: () => get().items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0),
}))
