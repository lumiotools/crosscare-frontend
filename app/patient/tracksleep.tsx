//

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  ScrollView,
  Platform,
  Animated,
  Dimensions,
  Modal,
} from "react-native"
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"
import { useEffect, useMemo, useRef, useState } from "react"
import { LinearGradient } from "expo-linear-gradient"
import MoonIcon from "@/assets/images/Svg/MoonIcon"
import SleepLogModal from "./modal/sleepmodal"
import { MenuProvider } from "react-native-popup-menu"
import DeleteMenu from "./modal/deletemodal"
import MoonIcon1 from "@/assets/images/Svg/MoonIcon1"
import { useSelector } from "react-redux"
import { ActivityIndicator } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"

const { width } = Dimensions.get("window")
const BAR_WIDTH = 20
const SPACING = (width - BAR_WIDTH * 10) / 8
const MAX_HEIGHT = 200

type CustomBarProps = {
  item: {
    day: string
    hours: number
    date: string
    isRangeLabel?: boolean
    rangeLabel?: string
  }
  index: number
  isSelected: boolean
  timeRange: string
}

interface ChartDataEntry {
  day: string
  hours: number
  date: string
  isRangeLabel?: boolean
  rangeLabel?: string
  id?: string
}

interface SleepEntry {
  id: string
  date: string
  sleepStart: string
  sleepEnd: string
  duration: string
}

// Time range options
type TimeRangeOption = {
  id: string
  label: string
}

const timeRangeOptions: TimeRangeOption[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "Last 7 Days" },
  { id: "month", label: "This Month" },
  { id: "lastMonth", label: "Last Month" },
]

const sleepData: SleepEntry[] = [
  {
    id: "1",
    date: "26th Feb, 2025",
    sleepStart: "11:30 PM",
    sleepEnd: "7:30 AM",
    duration: "8 hr 30 min",
  },
  {
    id: "2",
    date: "27th Feb, 2025",
    sleepStart: "11:30 PM",
    sleepEnd: "7:30 AM",
    duration: "8 hr",
  },
]

// Default empty chart data
const emptyChartData = [
  { day: "S", hours: 0, date: "" },
  { day: "M", hours: 0, date: "" },
  { day: "T", hours: 0, date: "" },
  { day: "W", hours: 0, date: "" },
  { day: "T", hours: 0, date: "" },
  { day: "F", hours: 0, date: "" },
  { day: "S", hours: 0, date: "" },
]

// Default empty today data
const emptyTodayData = [{ day: "Today", hours: 0, date: new Date().toISOString().split("T")[0] }]

export default function tracksleep() {
  // Mock data for the weekly chart
  const [logAdded, setLogAdded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [tooltipAnim] = useState(new Animated.Value(0)) // Start with 0 opacity
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [sleepLogs, setSleepLogs] = useState<SleepEntry[]>(sleepData)
  const [chartData, setChartData] = useState<ChartDataEntry[]>(emptyChartData)
  const [lastResetDate, setLastResetDate] = useState<Date | null>(null)
  const [timeRange, setTimeRange] = useState("week") // "today", "week", "month", "lastMonth"
  const [filteredData, setFilteredData] = useState<ChartDataEntry[]>([])

  // Dropdown state
  const [dropdownVisible, setDropdownVisible] = useState(false)

  const user = useSelector((state: any) => state.user)

  const [isModalVisible, setIsModalVisible] = useState(false)

  // Get the current selected time range label
  const getTimeRangeLabel = () => {
    const option = timeRangeOptions.find((option) => option.id === timeRange)
    return option ? option.label : "Last 7 Days"
  }

  // Generate all days for the selected time range
  const generateAllDays = (timeRange: string): ChartDataEntry[] => {
    const today = new Date()
    const days = []
    let startDate: Date
    let endDate: Date

    if (timeRange === "today") {
      // Today view - just show today
      const todayStr = today.toISOString().split("T")[0]
      const dayName = today.toLocaleDateString("en-US", { weekday: "long" })

      return [
        {
          id: `today-${todayStr}`,
          date: todayStr,
          day: "Today",
          hours: 0,
        },
      ]
    } else if (timeRange === "week") {
      // Weekly view - show each day
      startDate = new Date(today)
      const dayOfWeek = startDate.getDay()
      startDate.setDate(startDate.getDate() - dayOfWeek)

      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)

      const currentDate = new Date(startDate)
      while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split("T")[0]
        days.push({
          id: `empty-${dateString}`,
          date: dateString,
          day: currentDate.toLocaleDateString("en-US", { weekday: "short" }).charAt(0),
          hours: 0,
        })
        currentDate.setDate(currentDate.getDate() + 1)
      }
    } else if (timeRange === "month" || timeRange === "lastMonth") {
      // For month views, create date ranges around key dates
      const dateRanges = [
        { label: "1", start: 1, end: 4 },
        { label: "5", start: 5, end: 9 },
        { label: "10", start: 10, end: 14 },
        { label: "15", start: 15, end: 19 },
        { label: "20", start: 20, end: 24 },
        { label: "25", start: 25, end: 29 },
        { label: "30", start: 30, end: 31 },
      ]

      if (timeRange === "month") {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      } else {
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        endDate = new Date(today.getFullYear(), today.getMonth(), 0)
      }

      const lastDay = endDate.getDate()

      // Generate entries for each date range
      for (const range of dateRanges) {
        if (range.start <= lastDay) {
          // Add the main label date
          const labelDate = new Date(startDate)
          labelDate.setDate(range.start)
          const labelDateString = labelDate.toISOString().split("T")[0]

          days.push({
            id: `label-${labelDateString}`,
            date: labelDateString,
            day: range.label,
            hours: 0,
            isRangeLabel: true, // Mark this as a label for the range
          })

          // Add individual days in the range
          for (let day = range.start; day <= Math.min(range.end, lastDay); day++) {
            const currentDate = new Date(startDate)
            currentDate.setDate(day)
            const dateString = currentDate.toISOString().split("T")[0]

            days.push({
              id: `day-${dateString}`,
              date: dateString,
              day: "", // Empty string for non-label days
              hours: 0,
              rangeLabel: range.label, // Reference to which label this belongs to
            })
          }
        }
      }
    }

    return days
  }

  // Function to get the current week number
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }

  // Function to check if we need to reset the chart data
  const checkAndResetWeeklyData = async () => {
    try {
      // Get current date
      const currentDate = new Date()
      const currentWeek = getWeekNumber(currentDate)
      const currentYear = currentDate.getFullYear()

      // Get the stored last reset info from AsyncStorage
      const lastResetInfo = await AsyncStorage.getItem("lastChartResetInfo")
      let lastResetWeek = 0
      let lastResetYear = 0

      if (lastResetInfo) {
        const parsedInfo = JSON.parse(lastResetInfo)
        lastResetWeek = parsedInfo.week
        lastResetYear = parsedInfo.year
        setLastResetDate(new Date(parsedInfo.date))
      }

      console.log("Current week/year:", currentWeek, currentYear)
      console.log("Last reset week/year:", lastResetWeek, lastResetYear)

      // Reset if it's a new week or a new year
      if (!lastResetInfo || lastResetWeek !== currentWeek || lastResetYear !== currentYear) {
        console.log("Resetting chart data for new week")

        // Reset chart data
        setChartData(emptyChartData)

        // Store the current week info
        const resetInfo = {
          week: currentWeek,
          year: currentYear,
          date: currentDate.toISOString(),
        }

        await AsyncStorage.setItem("lastChartResetInfo", JSON.stringify(resetInfo))
        setLastResetDate(currentDate)

        return true // Indicate that we reset the data
      }

      return false // No reset needed
    } catch (error) {
      console.error("Error in checkAndResetWeeklyData:", error)
      return false
    }
  }

  // Add these functions to handle the modal
  const handleOpenModal = () => {
    setIsModalVisible(true)
  }

  const handleCloseModal = () => {
    setIsModalVisible(false)
  }

  const handleSaveSleepLog = (date: Date, sleepTime: Date, wakeTime: Date) => {
    // Format the times for display using toLocaleTimeString
    const formattedSleepTime = sleepTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })

    const formattedWakeTime = wakeTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })

    // Calculate duration (this is a simple calculation, might need adjustment)
    const sleepMs = sleepTime.getTime()
    const wakeMs = wakeTime.getTime()
    let durationMs = wakeMs - sleepMs

    // If wake time is earlier than sleep time, assume it's the next day
    if (durationMs < 0) {
      durationMs += 24 * 60 * 60 * 1000
    }

    const durationHours = Math.floor(durationMs / (60 * 60 * 1000))
    const durationMinutes = Math.floor((durationMs % (60 * 60 * 1000)) / (60 * 1000))

    const formattedDuration = `${durationHours} hr${durationMinutes > 0 ? ` ${durationMinutes} min` : ""}`

    // Format the date using toLocaleDateString
    const formattedDate = date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })

    // Create a new sleep entry
    const newEntry: SleepEntry = {
      id: (sleepLogs.length + 1).toString(),
      date: formattedDate,
      sleepStart: formattedSleepTime,
      sleepEnd: formattedWakeTime,
      duration: formattedDuration,
    }

    // Add the new entry to the sleep data
    setSleepLogs((prevLogs) => [newEntry, ...prevLogs])
    setIsModalVisible(false)

    // Refresh the chart data
    getSleepStatus()
  }

  // Process and filter data based on time range
  const processDataForTimeRange = (data: any[], timeRange: string) => {
    const allDays = generateAllDays(timeRange)

    if (data.length === 0) {
      return allDays
    }

    const dataMap = new Map()
    data.forEach((item) => {
      if (item.date) {
        const dateKey = new Date(item.date).toISOString().split("T")[0]
        dataMap.set(dateKey, item)
      }
    })

    // For "today" view, we need to specifically check if today's data exists
    if (timeRange === "today") {
      const todayStr = new Date().toISOString().split("T")[0]
      const todayData = dataMap.get(todayStr)

      if (todayData) {
        return [
          {
            id: `today-${todayStr}`,
            date: todayStr,
            day: "Today",
            hours: todayData.hours || 0,
          },
        ]
      } else {
        return allDays // Return empty today template
      }
    }

    // For other views, map the data as before
    return allDays.map((day) => {
      const existingData = dataMap.get(day.date)
      if (existingData) {
        return {
          ...day,
          hours: existingData.hours || 0,
          isRangeLabel: day.isRangeLabel,
          rangeLabel: day.rangeLabel,
        }
      }
      return day
    })
  }

  const getSleepStatus = async () => {
    setLoading(true) // Show loader
    try {
      // Check if we need to reset weekly data first
      const wasReset = await checkAndResetWeeklyData()

      // If we just reset the data, we might want to show empty chart initially
      if (wasReset) {
        console.log("Chart was reset, showing empty data")
        // You could choose to return early here if you want to show empty chart
        // return;
      }

      const response = await fetch(`https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/sleepstatus`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      console.log("API data:", data)
      setSleepLogs(data)

      const fixedWeekdays = ["S", "M", "T", "W", "T", "F", "S"]
      const fullWeekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

      // Create a map to store unique sleep data
      const sleepMap = new Map()

      // Process all data regardless of time range
      data.forEach((entry: { date: string | number | Date; duration: string }) => {
        const entryDate = new Date(entry.date)
        const fullDay = entryDate.toLocaleString("en-US", { weekday: "long" }) // Get full weekday name
        const dayIndex = fullWeekdays.indexOf(fullDay) // Get unique index

        if (dayIndex === -1) return // Skip invalid dates

        const dayLetter = fixedWeekdays[dayIndex] // Get S, M, T, W...

        // Extract sleep duration
        let hours = 0
        let minutes = 0

        if (entry.duration) {
          const durationParts = entry.duration.split(" ")
          if (durationParts.length >= 1) {
            hours = Number.parseFloat(durationParts[0]) || 0
          }
          if (durationParts.length >= 3) {
            minutes = Number.parseFloat(durationParts[2]) || 0
          }
        }

        const totalHours = hours + minutes / 60
        const dateString = entryDate.toISOString().split("T")[0]

        // Store data with ISO date string as key
        sleepMap.set(dateString, {
          day: dayLetter,
          hours: totalHours,
          date: dateString,
        })
      })

      // Convert map to array
      const processedData = Array.from(sleepMap.values())
      setChartData(processedData)

      // Process data for current time range
      const filteredData = processDataForTimeRange(processedData, timeRange)
      setFilteredData(filteredData)
    } catch (error) {
      console.error("Error fetching sleep data:", error)

      // If there's an error, still set filtered data based on time range
      const filteredData = processDataForTimeRange([], timeRange)
      setFilteredData(filteredData)
    } finally {
      setLoading(false) // Hide loader
    }
  }

  // Update filtered data when time range changes
  useEffect(() => {
    const filtered = processDataForTimeRange(chartData, timeRange)
    setFilteredData(filtered)

    // Reset selected index when changing time range
    setSelectedIndex(null)
  }, [timeRange, chartData])

  // Initialize data when component mounts
  useEffect(() => {
    const initializeData = async () => {
      // Load the last reset date from storage
      const lastResetInfo = await AsyncStorage.getItem("lastChartResetInfo")
      if (lastResetInfo) {
        const parsedInfo = JSON.parse(lastResetInfo)
        setLastResetDate(new Date(parsedInfo.date))
      }

      // Check for reset and fetch data
      await getSleepStatus()
    }

    initializeData()

    // Set up a check that runs when the app is opened or comes to foreground
    const checkInterval = setInterval(() => {
      checkAndResetWeeklyData().then((wasReset) => {
        if (wasReset) {
          // If data was reset, refresh the sleep status
          getSleepStatus()
        }
      })
    }, 3600000) // Check every hour

    return () => clearInterval(checkInterval)
  }, [])

  const handleDeleteLog = async (id: string) => {
    console.log(id)
    const response = await fetch(
      `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/sleepstatus/delete/${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
    const data = await response.json()
    console.log(data)
    setSleepLogs(sleepLogs.filter((log) => log.id !== id))

    // Refresh chart data after deletion
    getSleepStatus()
  }

  // ✅ Convert "10.0" to "10 hr 0 min" format
  const formatDuration = (duration: string | null | undefined) => {
    if (!duration) return "0 hr 0 min" // Default if missing
    const totalMinutes = Number.parseFloat(duration) * 60
    if (isNaN(totalMinutes)) return "0 hr 0 min" // Handle invalid numbers

    const hours = Math.floor(totalMinutes / 60)
    const minutes = Math.round(totalMinutes % 60)

    return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`
  }

  // ✅ Convert "03/08/2025" to "08 March, 25"
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return date
        .toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        .toUpperCase()
    } catch (e) {
      return dateString // Return original if parsing fails
    }
  }

  // Calculate y-axis values using useMemo to prevent recalculation on every render
  const { yAxisLabels, roundedMax, roundedMin } = useMemo(() => {
    // Filter out zero values for calculation
    const nonZeroValues = filteredData.filter((item) => !item.isRangeLabel && item.hours > 0).map((item) => item.hours)

    // If no non-zero values, use default range
    if (nonZeroValues.length === 0) {
      return { yAxisLabels: [10, 8, 6, 4, 2, 0], roundedMax: 10, roundedMin: 0 }
    }

    const maxWeight = Math.max(...nonZeroValues)
    const minWeight = Math.min(...nonZeroValues)

    // Add padding to the range - increase the padding for the max value
    const paddedMax = maxWeight * 1.1 // Add 10% padding to max value
    const paddedMin = Math.max(0, minWeight - 1)

    // Calculate rounded max for y-axis (round up to nearest 1)
    const roundedMax = Math.ceil(paddedMax)
    // Calculate rounded min for y-axis (round down to nearest 1)
    const roundedMin = Math.floor(paddedMin)

    // Create appropriate y-axis labels based on data range
    const range = roundedMax - roundedMin
    const step = Math.max(1, Math.ceil(range / 5)) // We want about 5 labels, minimum step of 1

    const labels = []
    for (let i = 0; i <= 5; i++) {
      const value = roundedMin + step * i
      if (value <= roundedMax) {
        labels.push(value)
      }
    }

    // Make sure max value is included
    if (labels[labels.length - 1] < roundedMax) {
      labels.push(roundedMax)
    }

    return {
      yAxisLabels: labels.reverse(), // Reverse for top-to-bottom display
      roundedMax,
      roundedMin,
    }
  }, [filteredData]) // Recalculate when filtered data changes

  // Function to hide tooltip after a delay
  const hideTooltipAfterDelay = () => {
    // Clear any existing timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current)
    }

    // Set a new timeout to hide the tooltip after 3 seconds
    tooltipTimeoutRef.current = setTimeout(() => {
      Animated.timing(tooltipAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setSelectedIndex(null)
      })
    }, 3000)
  }

  const handleBarPress = (index: number): void => {
    // Get the actual item
    const item = filteredData[index]

    // Skip if it's a range label or has no data
    if (item.isRangeLabel || item.hours <= 0) {
      return
    }

    if (selectedIndex === index) {
      setSelectedIndex(null) // Deselect if already selected
      return
    }

    // Animate tooltip disappearing and reappearing
    Animated.sequence([
      Animated.timing(tooltipAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(tooltipAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()

    setSelectedIndex(index)

    // Set timeout to hide tooltip after delay
    hideTooltipAfterDelay()
  }

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current)
      }
    }
  }, [])

  const CustomBar = ({ item, index, isSelected, timeRange }: CustomBarProps) => {
    // Check if this is a month view
    const isMonthView = timeRange !== "week" && timeRange !== "today"

    // Skip rendering for range labels in month view - they're just for organization
    if (isMonthView && item.isRangeLabel) {
      return (
        <View style={styles.dateRangeContainer}>
          <Text style={styles.dateRangeLabel}>{item.day}</Text>
        </View>
      )
    }

    // Check if the bar has data
    const hasData = item.hours > 0

    // Calculate bar height based on data range
    const dataRange = roundedMax - roundedMin
    // Ensure we don't exceed the maximum height for very large values
    const normalizedWeight = Math.min(item.hours - roundedMin, dataRange)
    const barHeight = dataRange > 0 ? (normalizedWeight / dataRange) * MAX_HEIGHT : 0

    // Use thinner bars for month views, wider for today view
    let barWidth = BAR_WIDTH
    if (isMonthView) {
      barWidth = 4
    } else if (timeRange === "today") {
      barWidth = BAR_WIDTH * 2 // Wider bar for today view
    }

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => (hasData ? handleBarPress(index) : null)}
        style={[
          styles.barContainer,
          timeRange === "today" && {
            width: barWidth,
            flex: 1,
            alignItems: "center",
            justifyContent: "flex-end",
          },
          isMonthView && {
            width: barWidth,
            marginRight: 2, // Tighter spacing for clustered bars
            marginLeft: item.rangeLabel && index > 0 && filteredData[index - 1].rangeLabel !== item.rangeLabel ? 10 : 0, // Add space between ranges
          },
        ]}
        disabled={!hasData} // Disable touch for bars with no data
      >
        {/* Show day label for week view and today view */}
        {(timeRange === "week" || timeRange === "today") && (
          <View style={styles.barLabelContainer}>
            <Text style={styles.barLabel}>{item.day}</Text>
          </View>
        )}

        {hasData && (
          <View style={[styles.barWrapper, { height: barHeight || 0 }, { width: barWidth }]}>
            <LinearGradient
              colors={isSelected ? ["#B0C0D0", "#B0C0D0"] : ["#8AA1B9", "#8AA1B9"]}
              style={[
                styles.bar,
                { height: "100%" },
                isMonthView && { borderTopLeftRadius: 2, borderTopRightRadius: 2 },
              ]}
            />
          </View>
        )}

        {/* Only show tooltip if selected AND has data */}
        {isSelected && hasData && (
          <Animated.View style={[styles.tooltip, { opacity: tooltipAnim }]}>
            <View style={styles.tooltipContent}>
              <Text style={styles.tooltipTitle}>SLEEP</Text>
              <Text style={styles.tooltipWeight}>
                ~{item.hours.toFixed(1)}{" "}
                <Text
                  style={{
                    fontSize: 16,
                    color: "#E6EBF0",
                  }}
                >
                  hr
                </Text>
              </Text>
              <Text style={styles.tooltipDate}>{formatDate(item.date)}</Text>
            </View>
            <View style={styles.tooltipArrow} />
          </Animated.View>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <MenuProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Track Sleep</Text>
          <TouchableOpacity style={styles.menuButton}>
            <Feather name="more-vertical" size={20} color="#E5E5E5" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Heart Rate Circle */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <View style={styles.moonIcon}>
                <MoonIcon width={88} height={88} />
              </View>
            </View>
          </View>

          <View
            style={{
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 14,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                color: "#E5E5E5",
                fontFamily: "Inter600",
              }}
            >
              Hi {user.user_name}!
            </Text>

            {logAdded ? (
              <View>
                <Text
                  style={{
                    color: "#E5E5E5",
                    fontFamily: "Inter400",
                    fontSize: 14,
                    textAlign: "center",
                  }}
                >
                  Logs added
                </Text>
              </View>
            ) : (
              <View
                style={{
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                <View
                  style={{
                    gap: 14,
                  }}
                >
                  <Text
                    style={{
                      color: "#E5E5E5",
                      fontFamily: "Inter400",
                      fontSize: 14,
                    }}
                  >
                    Did you sleep at 11:30 PM?
                  </Text>
                  <Text
                    style={{
                      color: "#E5E5E5",
                      fontFamily: "Inter400",
                      fontSize: 14,
                    }}
                  >
                    Did you wake up at 07:30 AM?
                  </Text>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 48,
                    marginTop: 6,
                  }}
                >
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 27,
                      paddingVertical: 6,
                      backgroundColor: "#547698",
                      borderWidth: 2,
                      borderColor: "#E6EBF0",
                      borderRadius: 99,
                      boxShadow: "0px 0px 4px 0px rgba(255, 255, 255, 0.25);",
                    }}
                    onPress={() => setIsModalVisible(true)}
                  >
                    <Text
                      style={{
                        color: "#E5E5E5",
                        fontFamily: "Inter400",
                        fontSize: 14,
                      }}
                    >
                      Edit
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      paddingHorizontal: 27,
                      paddingVertical: 6,
                      backgroundColor: "#547698",
                      borderWidth: 2,
                      borderColor: "#E6EBF0",
                      borderRadius: 99,
                      boxShadow: "0px 0px 4px 0px rgba(255, 255, 255, 0.25);",
                    }}
                    onPress={() => setLogAdded(true)}
                  >
                    <Text
                      style={{
                        color: "#E5E5E5",
                        fontFamily: "Inter400",
                        fontSize: 14,
                      }}
                    >
                      Yes
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View
            style={{
              marginTop: 30,
              marginHorizontal: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: 8,
                borderBottomWidth: 1,
                borderBottomColor: "rgba(229, 229, 229, 0.20);",
              }}
            >
              <Text
                style={{
                  color: "#E5E5E5",
                  fontFamily: "Inter500",
                  fontSize: 16,
                }}
              >
                My Sleep
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: "#335C85",
                  borderWidth: 2,
                  borderColor: "#547698",
                  flexDirection: "row",
                  paddingHorizontal: 12,
                  gap: 5,
                  paddingVertical: 8,
                  borderRadius: 32,
                  justifyContent: "center",
                  alignItems: "center",
                  boxShadow: "0px 0px 4px 0px rgba(255, 255, 255, 0.25);",
                }}
                onPress={handleOpenModal}
              >
                <Ionicons name="add" size={14} color={"#FFF6ED"} />
                <Text
                  style={{
                    color: "#FFF6ED",
                    fontSize: 12,
                    fontFamily: "Inter500",
                  }}
                >
                  Add Log
                </Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View
                style={{
                  marginVertical: 20,
                }}
              >
                <ActivityIndicator size="small" color="#335C85" />
              </View>
            ) : sleepLogs.length === 0 ? (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 40,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <MoonIcon1 width={24} height={24} />
                  <Text
                    style={{
                      color: "#547698",
                      fontSize: 14,
                      fontFamily: "Inter500",
                    }}
                  >
                    No sleep tracked yet!
                  </Text>
                </View>
              </View>
            ) : (
              sleepLogs.map((entry) => (
                <View
                  key={entry.id}
                  style={{
                    flexDirection: "column",
                    paddingVertical: 21,
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(229, 229, 229, 0.20);",
                    gap: 17,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          fontFamily: "Inter700",
                          color: "white",
                          fontSize: 16,
                        }}
                      >
                        {entry.duration}
                      </Text>
                      <Text
                        style={{
                          fontFamily: "Inter400",
                          color: "white",
                          fontSize: 12,
                        }}
                      >
                        {formatDate(entry.date)}
                      </Text>
                    </View>
                    <DeleteMenu onDelete={() => handleDeleteLog(entry.id)} />
                  </View>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "Inter400",
                          fontSize: 12,
                          color: "white",
                        }}
                      >
                        Sleep
                      </Text>
                      <Text
                        style={{
                          fontFamily: "Inter500",
                          fontSize: 14,
                          color: "white",
                        }}
                      >
                        {entry.sleepStart}
                      </Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "Inter400",
                          fontSize: 12,
                          color: "white",
                        }}
                      >
                        Wake
                      </Text>
                      <Text
                        style={{
                          fontFamily: "Inter500",
                          fontSize: 14,
                          color: "white",
                        }}
                      >
                        {entry.sleepEnd}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Connect to Application */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Connect to Application</Text>
            <View style={styles.connectItem}>
              <Image source={require("../../assets/images/applehealth.png")} style={{ width: 24, height: 24 }} />
              <Text style={styles.connectText}>Health App</Text>
              <TouchableOpacity>
                <Text style={styles.connectButton}>CONNECT</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Connect to Device Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Connect to Device</Text>
            <View style={styles.connectItem}>
              <Image source={require("../../assets/images/fitbit.png")} style={{ width: 24, height: 24 }} />
              <Text style={styles.connectText}>Fitbit</Text>
              <TouchableOpacity>
                <Text style={styles.connectButton}>CONNECT</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Analysis Section */}
          <View style={styles.analysisSection}>
            <View style={styles.analysisHeader}>
              <View style={styles.analysisTab}>
                <MaterialIcons name="bar-chart" size={18} color="#547698" />
                <Text style={styles.analysisTabText}>Analysis</Text>
              </View>
              <TouchableOpacity style={styles.periodSelector} onPress={() => setDropdownVisible(true)}>
                <Text style={styles.periodText}>{getTimeRangeLabel()}</Text>
                <Ionicons name="chevron-down" size={14} color="#E5E5E5" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Chart */}
          <View style={styles.customChartContainer}>
            {/* Y-axis labels */}
            <View style={styles.yAxisContainer}>
              {yAxisLabels.map((label, index) => (
                <Text key={index} style={styles.yAxisLabel}>
                  {label}
                </Text>
              ))}
            </View>

            {/* Chart area */}
            <View style={styles.chartContainer}>
              {/* Horizontal grid lines */}
              {yAxisLabels.map((_, index) => (
                <View key={index} style={[styles.gridLine, { top: (index / (yAxisLabels.length - 1)) * MAX_HEIGHT }]} />
              ))}

              {/* For month views, render date labels at the bottom */}
              {(timeRange === "month" || timeRange === "lastMonth") && (
                <View style={styles.dateLabelsContainer}>
                  {filteredData
                    .filter((item) => item.isRangeLabel)
                    .map((item, index) => (
                      <Text key={index} style={styles.monthDateLabel}>
                        {item.day}
                      </Text>
                    ))}
                </View>
              )}

              {/* Bars */}
              <View
                style={[
                  styles.barsContainer,
                  timeRange === "today" && styles.todayBarsContainer,
                  (timeRange === "month" || timeRange === "lastMonth") && { paddingHorizontal: 10 },
                ]}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8AA1B9" />
                  </View>
                ) : filteredData.length === 0 ? (
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>No data available</Text>
                  </View>
                ) : (
                  // For month views, filter out the range labels as they're shown separately
                  filteredData
                    .filter((item) => timeRange === "week" || timeRange === "today" || !item.isRangeLabel)
                    .map((item, index) => (
                      <CustomBar
                        key={index}
                        item={item}
                        index={filteredData.findIndex((d) => d.date === item.date)} // Use original index for reference
                        isSelected={selectedIndex === filteredData.findIndex((d) => d.date === item.date)}
                        timeRange={timeRange}
                      />
                    ))
                )}
              </View>
            </View>
          </View>

          {/* Bottom Message */}
          <View style={styles.bottomContainer}>
            <View style={styles.messageContainer}>
              <Text style={styles.messageTitle}>Get a good night's sleep</Text>
              <Text style={styles.messageSubtitle}>Set a reminder and stay on track.</Text>
            </View>
            <TouchableOpacity style={styles.reminderButton}>
              <Ionicons name="alarm" size={16} color="#FEF8FD" />
              <Text style={styles.reminderButtonText}>Set Reminder</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Time Range Dropdown Modal */}
        <Modal
          transparent={true}
          visible={dropdownVisible}
          animationType="fade"
          onRequestClose={() => setDropdownVisible(false)}
        >
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setDropdownVisible(false)}>
            <View style={styles.dropdownContainer}>
              {timeRangeOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.dropdownItem, timeRange === option.id && styles.dropdownItemSelected]}
                  onPress={() => {
                    setTimeRange(option.id)
                    setDropdownVisible(false)
                  }}
                >
                  <Text style={[styles.dropdownItemText, timeRange === option.id && styles.dropdownItemTextSelected]}>
                    {option.label}
                  </Text>
                  {timeRange === option.id && <Ionicons name="checkmark" size={16} color="#E5E5E5" />}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        <SleepLogModal
          isVisible={isModalVisible}
          onClose={handleCloseModal}
          onSave={handleSaveSleepLog}
          reload={getSleepStatus}
        />
      </SafeAreaView>
    </MenuProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#001F3E",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  menuButton: {
    padding: 8,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    color: "white",
    fontFamily: "DMSans600",
  },
  moreButton: {
    padding: 4,
  },
  heartRateContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  progressContainer: {
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  progressCircle: {
    position: "absolute",
  },
  heartRateTextContainer: {
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
  },
  analysisContainer: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  analysisHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  analysisTab: {
    flexDirection: "row",
    alignItems: "center",
  },
  analysisTabText: {
    marginLeft: 6,
    fontSize: 14,
    color: "#E5E5E5",
    letterSpacing: 0.28,
    fontFamily: "Inter400",
  },
  iconContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  iconCircle: {
    width: 180,
    height: 180,
    borderRadius: 100,
    backgroundColor: "#547698",
    justifyContent: "center",
    borderWidth: 5,
    borderColor: "#E6EBF0",
    boxShadow: "0px 0px 4px 0px rgba(0, 0, 0, 0.10);",
    alignItems: "center",
  },
  moonIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  bpmValue: {
    fontSize: 48,
    fontWeight: "300",
    color: "#fff",
  },
  heartIconContainer: {
    position: "absolute",
    top: "40%",
    right: "30%",
  },
  bpmLabel: {
    fontSize: 14,
    color: "#fff",
    marginTop: 5,
  },
  connectionSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  connectionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  connectionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  healthAppIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f8f8f8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  customChartContainer: {
    flexDirection: "row",
    marginTop: 10,
    height: MAX_HEIGHT + 40, // Add extra height for labels
    marginRight: 16,
  },
  yAxisContainer: {
    width: 40,
    height: MAX_HEIGHT,
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingRight: 5,
  },
  yAxisLabel: {
    color: "#AAAAAA",
    fontSize: 12,
    fontFamily: "Inter400",
  },
  chartContainer: {
    flex: 1,
    height: MAX_HEIGHT,
    position: "relative",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#EEEEEE",
  },
  barsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: "100%",
    paddingLeft: SPACING,
  },
  todayBarsContainer: {
    justifyContent: "center",
    paddingLeft: 0,
  },
  barContainer: {
    width: BAR_WIDTH,
    marginRight: SPACING,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  barWrapper: {
    width: BAR_WIDTH,
    borderRadius: 0,
    overflow: "hidden",
  },
  bar: {
    width: "100%",
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  barLabelContainer: {
    position: "absolute",
    bottom: -25,
    alignItems: "center",
  },
  barLabel: {
    fontSize: 14,
    color: "#888888",
    fontFamily: "Inter400",
  },
  tooltip: {
    position: "absolute",
    top: -60, // Positioned above the bar
    alignItems: "center",
    width: 120,
    zIndex: 10, // Ensure tooltip is above other elements
  },
  tooltipContent: {
    backgroundColor: "#547698",
    borderRadius: 10,
    padding: 10,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#E5E5E5",
    marginTop: -1,
  },
  tooltipTitle: {
    fontSize: 12,
    color: "#E6EBF0",
    fontFamily: "Inter500",
  },
  tooltipWeight: {
    fontSize: 22,
    color: "#E6EBF0",
    marginVertical: 2,
    fontFamily: "Inter700",
  },
  tooltipDate: {
    fontSize: 12,
    color: "#E6EBF0",
    fontFamily: "Inter500",
  },
  connectionText: {
    fontSize: 15,
  },
  connectButtonText: {
    color: "#FF3B30",
    fontWeight: "500",
    fontSize: 13,
  },
  analysisSection: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  analysisTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  analysisTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  analysisIcon: {
    marginRight: 5,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  daysSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 15,
  },
  daysSelectorText: {
    fontSize: 12,
    color: "#666",
    marginRight: 4,
  },
  yAxisLabels: {
    width: 20,
    height: 120,
    justifyContent: "space-between",
    alignItems: "center",
    marginRight: 5,
  },
  barColumn: {
    alignItems: "center",
    width: 30,
  },
  dayLabel: {
    marginTop: 5,
    fontSize: 12,
    color: "#999",
  },
  periodSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#335C85",
    borderWidth: 1,
    borderColor: "#547698",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    borderRadius: 8,
  },
  periodText: {
    fontSize: 12,
    letterSpacing: 0.28,
    fontFamily: "Inter500",
    color: "#E5E5E5",
  },
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Platform.OS === "android" ? "auto" : 5,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  messageContainer: {
    flex: 1,
  },
  messageTitle: {
    fontSize: 14,
    color: "#E5E5E5",
    textTransform: "capitalize",
    fontFamily: "Inter500",
  },
  messageSubtitle: {
    fontSize: 12,
    color: "#8A8A8A",
    fontFamily: "Inter400",
  },
  reminderButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#335C85",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#547698",
    paddingVertical: 10,
    boxShadow: "0px 0px 4px 0px rgba(255, 255, 255, 0.25);",
    borderRadius: 20,
  },
  reminderButtonText: {
    color: "#FEF8FD",
    marginLeft: 8,
    fontSize: 12,
    fontFamily: "Inter500",
  },
  sectionContainer: {
    marginTop: 40,
    paddingHorizontal: 25,
  },
  sectionTitle: {
    fontSize: 16,
    color: "white",
    lineHeight: 22,
    fontFamily: "Inter600",
  },
  connectItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    paddingBottom: 10,
    paddingTop: 15,
    gap: 5,
  },
  connectText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter600",
    color: "white",
  },
  connectButton: {
    color: "#FFD764",
    fontSize: 14,
    fontFamily: "Inter600",
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: MAX_HEIGHT,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    height: MAX_HEIGHT,
  },
  noDataText: {
    color: "#999",
    fontFamily: "Inter400",
    fontSize: 14,
  },
  dateRangeContainer: {
    alignItems: "center",
    width: 20,
    height: "100%",
  },
  dateRangeLabel: {
    position: "absolute",
    bottom: -25,
    fontSize: 12,
    color: "#888888",
    fontFamily: "Inter500",
  },
  dateLabelsContainer: {
    position: "absolute",
    bottom: -25,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  monthDateLabel: {
    fontSize: 12,
    color: "#888888",
    fontFamily: "Inter500",
  },
  // Dropdown styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownContainer: {
    position: "absolute",
    top: 220, // Position below the period selector
    right: 20,
    backgroundColor: "#1A3352",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#547698",
    width: 160,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(229, 229, 229, 0.1)",
  },
  dropdownItemSelected: {
    backgroundColor: "#335C85",
  },
  dropdownItemText: {
    color: "#E5E5E5",
    fontSize: 14,
    fontFamily: "Inter400",
  },
  dropdownItemTextSelected: {
    fontFamily: "Inter600",
  },
})

