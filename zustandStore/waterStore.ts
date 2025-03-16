import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

interface WaterStore {
  glassCount: number
  maxGlasses: number
  lastAccessedDate: string | null

  setGlassCount: (count: number) => void
  setMaxGlasses: (max: number) => void
  setLastAccessedDate: (date: string) => void
}

export const useWaterStore = create<WaterStore>()(
    persist(
      (set) => ({
        glassCount: 0,
        maxGlasses: 0,
        lastAccessedDate: null,
        
        setGlassCount: (count) => set({ glassCount: Number(count) }),
        setMaxGlasses: (max) => set({ maxGlasses: Number(max) }),
        setLastAccessedDate: (date) => set({ lastAccessedDate: date }),
      }),
      {
        name: 'water-storage', // unique name for this storage
        storage: createJSONStorage(() => AsyncStorage), // Use AsyncStorage for React Native
        onRehydrateStorage: () => (state) => {
            // Ensure values are numbers when rehydrating from storage
            if (state) {
              state.glassCount = Number(state.glassCount);
              state.maxGlasses = Number(state.maxGlasses);
            }
        }
      }
    )
  )