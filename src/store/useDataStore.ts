import { create } from 'zustand'
import { MenuItem, Order } from '@/types'

interface Table {
  id: string; number: number; room: string
  status: string; qrUrl: string; qrImage: string; createdAt: number
}

interface DataStore {
  menu: MenuItem[]
  orders: Order[]
  tables: Table[]
  menuLoaded: boolean
  ordersLoaded: boolean
  tablesLoaded: boolean
  setMenu: (items: MenuItem[]) => void
  setOrders: (orders: Order[]) => void
  setTables: (tables: Table[]) => void
}

export const useDataStore = create<DataStore>((set) => ({
  menu: [], orders: [], tables: [],
  menuLoaded: false, ordersLoaded: false, tablesLoaded: false,
  setMenu: (menu) => set({ menu, menuLoaded: true }),
  setOrders: (orders) => set({ orders, ordersLoaded: true }),
  setTables: (tables) => set({ tables, tablesLoaded: true }),
}))
