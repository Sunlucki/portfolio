import { createContext, useContext } from 'react'
import type { FlightTheme } from './path'

/* Тема мира для отделки станций: стекло и двойники берут тон по ней (v3.1 —
   тёмная студия, v3.2 — светлая). */
export const WorldTheme = createContext<FlightTheme>('dark')

export const useWorldTheme = (): FlightTheme => useContext(WorldTheme)
