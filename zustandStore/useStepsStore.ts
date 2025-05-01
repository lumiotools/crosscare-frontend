"use client"

import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { createJSONStorage } from "zustand/middleware"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Define types for step data
interface StepDataItem {
  id: string
  day: string
  steps: number
  date: string
  stepsGoal: number
  source?: string // Add source to track where the data came from (fitbit, app, etc.)
}

interface FitbitData {
  todaySteps: number
  weeklyAverage: number
  totalSteps: number
  dailyData: StepDataItem[]
}

interface FitbitStepDataItem {
  dateTime: string;
  value: string;
}

interface FitbitDataResponse {
  "activities-steps"?: FitbitStepDataItem[];
}

interface StepsState {
  // State
  stepsWalked: number
  stepGoal: number
  stepData: StepDataItem[]
  filteredData: StepDataItem[]
  isLoading: boolean
  error: string | null
  timeRange: string
  lastUpdated: string | null
  isFitbitConnected: boolean
  fitbitData: FitbitData | null
  isFetchingFitbit: boolean

  // Actions
  fetchStepData: (userId: string) => Promise<void>
  setStepsWalked: (steps: number) => void
  setStepGoal: (goal: number) => void
  addStepData: (stepItem: StepDataItem) => void
  setTimeRange: (range: string) => void
  processDataForTimeRange: (data: StepDataItem[], range: string) => StepDataItem[]
  startAutoRefresh: (userId: string) => () => void

  // Fitbit actions
  setFitbitConnected: (isConnected: boolean) => void
  fetchFitbitStepData: (userId: string, timeRange?: string) => Promise<FitbitData | null>
  syncFitbitWithBackend: (userId: string, steps: number) => Promise<boolean>
  setFitbitData: (data: FitbitData | null) => void
  setIsFetchingFitbit: (isFetching: boolean) => void
}

export const useStepsStore = create<StepsState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        stepsWalked: 0,
        stepGoal: 0,
        stepData: [],
        filteredData: [],
        isLoading: false,
        error: null,
        timeRange: "week",
        lastUpdated: null,
        isFitbitConnected: false,
        fitbitData: null,
        isFetchingFitbit: false,

        // Actions
        fetchStepData: async (userId: string) => {
          if (!userId) {
            set({ error: "User ID is required" })
            return
          }

          set({ isLoading: true, error: null })

          try {
            const response = await fetch(
              `https://crosscare-backends.onrender.com/api/user/activity/${userId}/stepsStatus`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
              },
            )

            if (!response.ok) {
              throw new Error(`API request failed with status ${response.status}`)
            }

            const data = await response.json()
            // console.log("API step data:", data)

            if (data.stepsData && Array.isArray(data.stepsData) && data.stepsData.length > 0) {
              // Process the step data from the API
              const fixedWeekdays = ["S", "M", "T", "W", "T", "F", "S"]
              const fullWeekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

              // Create a map to store unique step data for each day
              const stepMap = new Map()
              let latestEntry: StepDataItem | null = null as StepDataItem | null
              let latestDate = new Date(0) // Start with epoch time

              // Process all data regardless of time range
              data.stepsData.forEach((entry: any) => {
                if (!entry || !entry.date) {
                  console.warn("Invalid entry in step data:", entry)
                  return // Skip invalid entries
                }

                try {
                  const entryDate = new Date(entry.date)

                  // Skip invalid dates
                  if (isNaN(entryDate.getTime())) {
                    console.warn("Invalid date in step data:", entry.date)
                    return
                  }

                  const fullDay = entry.day || entryDate.toLocaleString("en-US", { weekday: "long" })
                  const dayIndex = fullWeekdays.indexOf(fullDay)

                  // If day is not found, use the first character of the day
                  const dayLetter =
                    dayIndex !== -1 ? fixedWeekdays[dayIndex] : (entry.day && entry.day.charAt(0)) || "?"

                  const dateString = entryDate.toISOString().split("T")[0]

                  const stepItem: StepDataItem = {
                    id: entry.id || `step-${dateString}`,
                    day: dayLetter,
                    steps: Number(entry.steps) || 0,
                    date: dateString,
                    stepsGoal: Number(entry.stepsGoal) || get().stepGoal, // Fix applied here
                    source: entry.source || "app", // Default to app if not specified
                  };

                  console.log("Processed step item:", stepItem)

                  // Store data with ISO date string as key
                  stepMap.set(dateString, stepItem)

                  // Track the latest entry for current steps and goal
                  if (entryDate > latestDate) {
                    latestDate = entryDate
                    latestEntry = stepItem
                  }
                } catch (err) {
                  console.error("Error processing step entry:", err, entry)
                }
              })

              // Get current steps and goal from the latest entry
              let stepsWalked = get().stepsWalked
              let stepGoal = get().stepGoal

              if (latestEntry) {
                stepsWalked = latestEntry.steps
                if (latestEntry.stepsGoal > 0) {
                  stepGoal = latestEntry.stepsGoal
                }
              }

              // Convert map to array and sort by date (newest first)
              const processedData = Array.from(stepMap.values()).sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
              )

              // Process data for current time range
              const timeRange = get().timeRange
              const filteredData = get().processDataForTimeRange(processedData, timeRange)

              set({
                stepsWalked,
                stepGoal,
                stepData: processedData,
                filteredData,
                isLoading: false,
                lastUpdated: new Date().toISOString(),
              })
            } else {
              console.log("No step data returned from API or invalid format")
              set({
                isLoading: false,
                error: data ? "Invalid data format received" : "No data received",
              })
            }
          } catch (error) {
            console.error("Error fetching step data:", error)
            set({
              error: error instanceof Error ? error.message : "Unknown error occurred",
              isLoading: false,
            })
          }
        },

        setStepsWalked: (steps: number) => {
          set({ stepsWalked: steps })
        },

        setStepGoal: (goal: number) => {
          set({ stepGoal: goal })
        },

        addStepData: (stepItem: StepDataItem) => {
          const { stepData, timeRange, processDataForTimeRange } = get()

          // Check if we already have data for this date
          const existingIndex = stepData.findIndex((item) => item.date === stepItem.date)

          let updatedStepData
          if (existingIndex >= 0) {
            // Update existing entry
            updatedStepData = [...stepData]
            updatedStepData[existingIndex] = {
              ...updatedStepData[existingIndex],
              steps: stepItem.steps,
              stepsGoal: stepItem.stepsGoal || updatedStepData[existingIndex].stepsGoal,
              source: stepItem.source || updatedStepData[existingIndex].source,
            }
          } else {
            // Add new entry
            updatedStepData = [...stepData, stepItem]
          }

          // Sort by date (newest first)
          updatedStepData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

          // Process data for current time range
          const filteredData = processDataForTimeRange(updatedStepData, timeRange)

          set({
            stepData: updatedStepData,
            filteredData,
            lastUpdated: new Date().toISOString(),
          })
        },

        setTimeRange: (range: string) => {
          const { stepData, processDataForTimeRange } = get()
          const filteredData = processDataForTimeRange(stepData, range)
          set({ timeRange: range, filteredData })
        },

        processDataForTimeRange: (data: StepDataItem[], range: string): StepDataItem[] => {
          if (!data || data.length === 0) return []

          const today = new Date()
          today.setHours(23, 59, 59, 999) // End of today

          let startDate: Date

          switch (range) {
            case "day":
              // Just today's data
              startDate = new Date(today)
              startDate.setHours(0, 0, 0, 0) // Start of today
              break

            case "week":
              // Last 7 days
              startDate = new Date(today)
              startDate.setDate(today.getDate() - 6) // 7 days including today
              startDate.setHours(0, 0, 0, 0) // Start of the day
              break

            case "month":
              // Last 30 days
              startDate = new Date(today)
              startDate.setDate(today.getDate() - 29) // 30 days including today
              startDate.setHours(0, 0, 0, 0) // Start of the day
              break

            case "year":
              // Last 365 days
              startDate = new Date(today)
              startDate.setFullYear(today.getFullYear() - 1)
              startDate.setHours(0, 0, 0, 0) // Start of the day
              break

            default:
              // Default to week
              startDate = new Date(today)
              startDate.setDate(today.getDate() - 6) // 7 days including today
              startDate.setHours(0, 0, 0, 0) // Start of the day
          }

          return data.filter((item) => {
            try {
              const itemDate = new Date(item.date)
              return itemDate >= startDate && itemDate <= today
            } catch (err) {
              console.error("Error filtering date:", err, item)
              return false
            }
          })
        },

        // Auto-refresh functionality
        startAutoRefresh: (userId: string) => {
          if (!userId) {
            console.error("Cannot start auto-refresh: User ID is required")
            return () => {}
          }

          console.log("Starting auto-refresh for steps data...")

          // Initial fetch
          get().fetchStepData(userId)

          // Set up interval for auto-refresh every 20 seconds
          const intervalId = setInterval(() => {
            // console.log("Auto-refreshing steps data...")
            get().fetchStepData(userId)

            // If Fitbit is connected, also refresh Fitbit data
            if (get().isFitbitConnected) {
              get().fetchFitbitStepData(userId, "today")
            }
          }, 300000) // 20 seconds

          // Return cleanup function to clear interval
          return () => {
            // console.log("Stopping auto-refresh for steps data")
            clearInterval(intervalId)
          }
        },

        // Fitbit actions
        setFitbitConnected: (isConnected: boolean) => {
          set({ isFitbitConnected: isConnected })
        },

        fetchFitbitStepData: async (userId: string, timeRange = "today") => {
          if (!userId) {
            console.error("Cannot fetch Fitbit data: User ID is required")
            return null
          }

          set({ isFetchingFitbit: true })

          try {
            // Determine date range based on timeRange
            const today = new Date()
            const startDate = new Date()

            if (timeRange === "today") {
              // Just today
              startDate.setDate(today.getDate() - 1)
            } else if (timeRange === "week") {
              startDate.setDate(today.getDate() - 7)
            } else if (timeRange === "month") {
              startDate.setMonth(today.getMonth() - 1)
            } else if (timeRange === "lastMonth") {
              startDate.setMonth(today.getMonth() - 2)
              const endDate = new Date()
              endDate.setMonth(today.getMonth() - 1)
              today.setTime(endDate.getTime())
            }

            // Format dates for Fitbit API (yyyy-MM-dd)
            const startDateStr = startDate.toISOString().split("T")[0]
            const endDateStr = today.toISOString().split("T")[0]

            // Get data for date range - this is a placeholder, replace with actual implementation
            // const data = await getDataForRange("activities/steps", startDateStr, endDateStr)

            // Placeholder for Fitbit API call
            console.log(`Fetching Fitbit data for activities/steps from ${startDateStr} to ${endDateStr}`)

            // Placeholder data - replace with actual API call
            const data = null

            if (!data) {
              throw new Error("Failed to fetch Fitbit data")
            }

            // Process Fitbit data
            const todaySteps = getTodayStepsFromFitbit(data)
            const stepsData: { dateTime: string; value: string }[] = data["activities-steps"] || []
            const totalSteps = stepsData.reduce((sum, day) => sum + Number.parseInt(day.value), 0)
            const weeklyAverage = stepsData.length > 0 ? Math.round(totalSteps / stepsData.length) : 0

            // Format data for your step store
            const fixedWeekdays = ["S", "M", "T", "W", "T", "F", "S"]
            const formattedData = stepsData.map((item) => {
              const date = new Date(item.dateTime)
              const dayIndex = date.getDay() // 0 = Sunday, 1 = Monday, etc.
              const dayAbbr = fixedWeekdays[dayIndex]

              return {
                id: `fitbit-${item.dateTime}`,
                day: dayAbbr,
                steps: Number.parseInt(item.value),
                date: item.dateTime,
                stepsGoal: get().stepGoal || 0, // Use current goal or default
                source: "fitbit",
              }
            })

            const fitbitData = {
              todaySteps: todaySteps || 0,
              weeklyAverage,
              totalSteps,
              dailyData: formattedData,
            }

            // Update state with Fitbit data
            set({ fitbitData, isFetchingFitbit: false })

            // If we have today's steps, update the main steps count and sync with backend
            if (todaySteps) {
              set({ stepsWalked: todaySteps })
              await get().syncFitbitWithBackend(userId, todaySteps)
            }

            // Add Fitbit data to step store
            formattedData.forEach((stepItem) => {
              get().addStepData(stepItem)
            })

            return fitbitData
          } catch (error) {
            console.error("Error fetching Fitbit step data:", error)
            set({ isFetchingFitbit: false })
            return null
          }
        },

        syncFitbitWithBackend: async (userId: string, steps: number) => {
          try {
            if (!userId) {
              console.log("Cannot send steps data: User ID is undefined")
              return false
            }

            const apiUrl = `https://crosscare-backends.onrender.com/api/user/activity/${userId}/steps`
            console.log(`Sending ${steps} steps to backend API: ${apiUrl}`)

            const response = await fetch(apiUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ steps }),
            })

            if (!response.ok) {
              throw new Error(`Failed to send steps to backend: ${response.status}`)
            }

            const responseData = await response.json()
            console.log("Backend API response:", responseData)
            return true
          } catch (error) {
            console.error("Error sending steps to backend:", error)
            return false
          }
        },

        setFitbitData: (data: FitbitData | null) => {
          set({ fitbitData: data })
        },

        setIsFetchingFitbit: (isFetching: boolean) => {
          set({ isFetchingFitbit: isFetching })
        },
      }),
      {
        name: "steps-storage", // unique name for storage
        storage: createJSONStorage(() => AsyncStorage), // Use AsyncStorage for React Native
        partialize: (state) => ({
          stepsWalked: state.stepsWalked,
          stepGoal: state.stepGoal,
          stepData: state.stepData,
          timeRange: state.timeRange,
          lastUpdated: state.lastUpdated,
          isFitbitConnected: state.isFitbitConnected,
        }),
      },
    ),
  ),
)

// Helper function to get today's steps from Fitbit data


const getTodayStepsFromFitbit = (fitbitData: FitbitDataResponse): number | null => {
  if (!fitbitData || !fitbitData["activities-steps"]) {
    return null;
  }

  const today = new Date().toISOString().split("T")[0];
  const todayData = fitbitData["activities-steps"].find((item) => item.dateTime === today);

  return todayData ? Number.parseInt(todayData.value) : null;
};

// Custom hook to use the store with auto-refresh
import { useEffect } from "react"

export const useStepsWithAutoRefresh = (userId: string) => {
  const { startAutoRefresh, isFitbitConnected, fetchFitbitStepData } = useStepsStore()

  useEffect(() => {
    if (userId) {
      // Start auto-refresh and get cleanup function
      const stopAutoRefresh = startAutoRefresh(userId)

      // If Fitbit is connected, fetch initial Fitbit data
      if (isFitbitConnected) {
        fetchFitbitStepData(userId, "today")
      }

      // Clean up on unmount
      return stopAutoRefresh
    }
  }, [userId, isFitbitConnected, fetchFitbitStepData])

  return useStepsStore()
}
