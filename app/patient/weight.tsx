//

import { useState, useEffect, useMemo, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform,
  ScrollView,
  Animated,
  ActivityIndicator,
  Modal,
} from "react-native"
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons"
import WeightIcon from "@/assets/images/Svg/WeightIcon"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import WeightModal from "./modal/weightmodal"
import { useSelector } from "react-redux"
import AsyncStorage from "@react-native-async-storage/async-storage"

const { width } = Dimensions.get("window")
const BAR_WIDTH = 20
const SPACING = (width - BAR_WIDTH * 10) / 8
const MAX_HEIGHT = 200

// Handle bar press
interface DataItem {
  day: string
  weight: number
  date: string
  isRangeLabel?: boolean
  rangeLabel?: string
  id?: string
}

interface CustomBarProps {
  item: DataItem
  index: number
  isSelected: boolean
  roundedMax: number
  roundedMin: number
  timeRange: string
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

// Default empty chart data
const emptyChartData = [
  { day: "S", weight: 0, date: "" },
  { day: "M", weight: 0, date: "" },
  { day: "T", weight: 0, date: "" },
  { day: "W", weight: 0, date: "" },
  { day: "T", weight: 0, date: "" },
  { day: "F", weight: 0, date: "" },
  { day: "S", weight: 0, date: "" },
]

// Default empty today data
const emptyTodayData = [{ day: "Today", weight: 0, date: new Date().toISOString().split("T")[0] }]

const WeightScreen = () => {
  const [timeRange, setTimeRange] = useState("week") // "today", "week", "month", "lastMonth"
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [tooltipAnim] = useState(new Animated.Value(0)) // Start with 0 opacity
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const periodSelectorRef = useRef<TouchableOpacity>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [currentWeight, setCurrentWeight] = useState<number | null>(null)
  const [dropdownVisible, setDropdownVisible] = useState(false)
  const user = useSelector((state: any) => state.user)
  const [weightData, setWeightData] = useState<DataItem[]>(emptyChartData)
  const [lastResetDate, setLastResetDate] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filteredData, setFilteredData] = useState<DataItem[]>([])
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })

  // Function to get the current week number
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
  }

  // Generate all days for the selected time range
  const generateAllDays = (timeRange: string): DataItem[] => {
    const today = new Date()
    const days = []
    let startDate: Date
    let endDate: Date

    if (timeRange === "today") {
      // Today view - just show today
      const todayStr = today.toISOString().split("T")[0]

      return [
        {
          id: `today-${todayStr}`,
          date: todayStr,
          day: "Today",
          weight: 0,
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
          weight: 0,
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
            weight: 0,
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
              weight: 0,
              rangeLabel: range.label, // Reference to which label this belongs to
            })
          }
        }
      }
    }

    return days
  }

  // Function to check if we need to reset the chart data
  const checkAndResetWeeklyData = async () => {
    try {
      // Get current date
      const currentDate = new Date()
      const currentWeek = getWeekNumber(currentDate)
      const currentYear = currentDate.getFullYear()

      // Get the stored last reset info from AsyncStorage
      const lastResetInfo = await AsyncStorage.getItem("lastWeightResetInfo")
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
        console.log("Resetting weight data for new week")

        // Store the current weight as the starting point for the new week
        const lastWeight = currentWeight

        // Reset chart data but keep the last weight if available
        const resetData = emptyChartData.map((item) => ({
          ...item,
          weight: 0, // Reset all weights to 0
        }))

        // If we have a current weight, set it for today
        if (lastWeight) {
          const today = new Date()
          const dayIndex = today.getDay() // 0 = Sunday, 1 = Monday, etc.

          if (resetData[dayIndex]) {
            resetData[dayIndex].weight = lastWeight
            resetData[dayIndex].date = today
              .toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
              .toUpperCase()
          }
        }

        setWeightData(resetData)

        // Store the current week info
        const resetInfo = {
          week: currentWeek,
          year: currentYear,
          date: currentDate.toISOString(),
        }

        await AsyncStorage.setItem("lastWeightResetInfo", JSON.stringify(resetInfo))
        setLastResetDate(currentDate)

        return true // Indicate that we reset the data
      }

      return false // No reset needed
    } catch (error) {
      console.error("Error in checkAndResetWeeklyData:", error)
      return false
    }
  }

  // Generate past week dates with proper day abbreviations
  const generatePastWeekDates = () => {
    const today = new Date()
    const pastWeek = []

    // Generate dates for the past 7 days (including today)
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(today.getDate() - i)

      // Format the date as "MMM DD, YYYY"
      const formattedDate = date
        .toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        .toUpperCase()

      // Get day abbreviation (S, M, T, W, T, F, S)
      const dayIndex = date.getDay() // 0 = Sunday, 1 = Monday, etc.
      const dayAbbr = "SMTWTFS"[dayIndex] // Get the corresponding letter

      pastWeek.push({
        day: dayAbbr,
        weight: 0,
        date: formattedDate,
      })
    }

    return pastWeek
  }

  // Replace your DUMMY constant with this function
  const DUMMY = generatePastWeekDates()

  // Process and filter data based on time range
  const processDataForTimeRange = (data: DataItem[], timeRange: string) => {
    const allDays = generateAllDays(timeRange);
  
    if (data.length === 0) {
      return allDays;
    }
  
    const dataMap = new Map();
    data.forEach((item) => {
      if (item.date) {
        // Ensure we're working with a string date
        const dateKey = typeof item.date === 'string' 
          ? item.date.split('T')[0] 
          : new Date(item.date).toISOString().split('T')[0];
        dataMap.set(dateKey, item);
      }
    });
  
    // For "today" view, we need to specifically check if today's data exists
    if (timeRange === "today") {
      const todayStr = new Date().toISOString().split("T")[0];
      const todayData = dataMap.get(todayStr);
  
      if (todayData) {
        return [
          {
            id: `today-${todayStr}`,
            date: todayStr,
            day: "Today",
            weight: todayData.weight || 0,
          },
        ];
      } else {
        return allDays; // Return empty today template
      }
    }
  
    // For week view, ensure we map data to the correct days
    if (timeRange === "week") {
      return allDays.map((day) => {
        const existingData = dataMap.get(day.date);
        if (existingData) {
          return {
            ...day,
            weight: existingData.weight || 0,
          };
        }
        return day;
      });
    }
  
    // For month views, handle the date ranges
    return allDays.map((day) => {
      // For range labels, just return as is
      if (day.isRangeLabel) {
        return day;
      }
  
      const existingData = dataMap.get(day.date);
      if (existingData) {
        return {
          ...day,
          weight: existingData.weight || 0,
          isRangeLabel: day.isRangeLabel,
          rangeLabel: day.rangeLabel,
        };
      }
      return day;
    });
  };

  const getWeightStatus = async () => {
    setIsLoading(true);
    try {
      // First check if we need to reset weekly data
      const wasReset = await checkAndResetWeeklyData();
  
      // Make the actual API call instead of using dummy data
      const response = await fetch(
        `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/weightStatus`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
  
      const data = await response.json();
      console.log("API weight data:", data);
  
      if (data.data) {
        setCurrentWeight(data.data.lastWeight);
  
        if (data.data.weightData && data.data.weightData.length > 0) {
          // Process the weight data from the API
          const fixedWeekdays = ["S", "M", "T", "W", "T", "F", "S"];
          const fullWeekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
          // Create a map to store unique weight data for each day
          const weightMap = new Map();
  
          // Process all data regardless of time range
          data.data.weightData.forEach((entry) => {
            if (!entry.date || !entry.weight) return; // Skip invalid entries
            
            const entryDate = new Date(entry.date);
            const fullDay = entryDate.toLocaleString("en-US", { weekday: "long" }); // Get full weekday name
            const dayIndex = fullWeekdays.indexOf(fullDay); // Get unique index
  
            if (dayIndex === -1) return; // Skip invalid dates
  
            const dayLetter = fixedWeekdays[dayIndex]; // Get S, M, T, W...
            const dateString = entryDate.toISOString().split("T")[0];
            const formattedDate = entryDate
              .toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
              .toUpperCase();
  
            // Store data with ISO date string as key
            weightMap.set(dateString, {
              day: dayLetter,
              weight: parseFloat(entry.weight),
              date: dateString,
              formattedDate: formattedDate,
            });
          });
  
          // Convert map to array
          const processedData = Array.from(weightMap.values());
          setWeightData(processedData);
  
          // Process data for current time range
          const filteredData = processDataForTimeRange(processedData, timeRange);
          setFilteredData(filteredData);
        } else {
          // Use default days with zero weight
          setWeightData(DUMMY);
  
          // Process data for current time range
          const filteredData = processDataForTimeRange(DUMMY, timeRange);
          setFilteredData(filteredData);
        }
      } else {
        // Handle case where data.data is undefined
        setWeightData(DUMMY);
  
        // Process data for current time range
        const filteredData = processDataForTimeRange(DUMMY, timeRange);
        setFilteredData(filteredData);
      }
    } catch (error) {
      console.error("Error fetching weight status:", error);
      setWeightData(DUMMY);
  
      // If there's an error, still set filtered data based on time range
      const filteredData = processDataForTimeRange(DUMMY, timeRange);
      setFilteredData(filteredData);
    } finally {
      setIsLoading(false);
    }
  };

  // Update filtered data when time range changes
  useEffect(() => {
    const filtered = processDataForTimeRange(weightData, timeRange)
    setFilteredData(filtered)

    // Reset selected index when changing time range
    setSelectedIndex(null)
  }, [timeRange, weightData])

  // Initialize data when component mounts
  useEffect(() => {
    const initializeData = async () => {
      // Load the last reset date from storage
      const lastResetInfo = await AsyncStorage.getItem("lastWeightResetInfo")
      if (lastResetInfo) {
        const parsedInfo = JSON.parse(lastResetInfo)
        setLastResetDate(new Date(parsedInfo.date))
      }

      // Check for reset and fetch data
      await getWeightStatus()
    }

    initializeData()

    // Set up a check that runs when the app is opened or comes to foreground
    const checkInterval = setInterval(() => {
      checkAndResetWeeklyData().then((wasReset) => {
        if (wasReset) {
          // If data was reset, refresh the weight status
          getWeightStatus()
        }
      })
    }, 3600000) // Check every hour

    return () => clearInterval(checkInterval)
  }, [])

  const handleSaveWeight = async (weightValue: string) => {
    const parsedWeight = Number.parseFloat(weightValue)
    if (!isNaN(parsedWeight) && parsedWeight > 0) {
      setCurrentWeight(parsedWeight)
      setModalVisible(false)

      // Update today's weight in the chart
      const today = new Date()
      const todayStr = today.toISOString().split("T")[0]
      const formattedDate = today
        .toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        .toUpperCase()

      // Create a new entry for today
      const todayEntry = {
        day: "Today",
        weight: parsedWeight,
        date: todayStr,
      }

      // Update the weight data with today's entry
      const updatedData = [...weightData]
      const existingIndex = updatedData.findIndex(
        (item) => new Date(item.date).toISOString().split("T")[0] === todayStr,
      )

      if (existingIndex >= 0) {
        updatedData[existingIndex] = {
          ...updatedData[existingIndex],
          weight: parsedWeight,
        }
      } else {
        // Also update the weekly view
        const dayIndex = today.getDay() // 0 = Sunday, 1 = Monday, etc.
        const weeklyIndex = updatedData.findIndex((item) => item.day === "SMTWTFS"[dayIndex])

        if (weeklyIndex >= 0) {
          updatedData[weeklyIndex] = {
            ...updatedData[weeklyIndex],
            weight: parsedWeight,
            date: formattedDate,
          }
        }

        // Add today's entry
        updatedData.push(todayEntry)
      }

      setWeightData(updatedData)

      // Refresh data from API
      await getWeightStatus()
    }
  }

  // Calculate y-axis values using useMemo to prevent recalculation on every render
  const { yAxisLabels, roundedMax, roundedMin } = useMemo(() => {
    if (!filteredData.length) {
      return { yAxisLabels: [100, 75, 50, 25, 0], roundedMax: 100, roundedMin: 0 }
    }

    // Filter out zero weights for calculation
    const nonZeroWeights = filteredData
      .filter((item) => !item.isRangeLabel && item.weight > 0)
      .map((item) => item.weight)

    // If no non-zero weights, use default range
    if (nonZeroWeights.length === 0) {
      return { yAxisLabels: [100, 75, 50, 25, 0], roundedMax: 100, roundedMin: 0 }
    }

    const maxWeight = Math.max(...nonZeroWeights)
    const minWeight = Math.min(...nonZeroWeights)

    // Add padding to the range
    const paddedMax = maxWeight + 5
    const paddedMin = Math.max(0, minWeight - 5)

    // Calculate rounded max for y-axis (round up to nearest 5)
    const roundedMax = Math.ceil(paddedMax / 5) * 5
    // Calculate rounded min for y-axis (round down to nearest 5)
    const roundedMin = Math.floor(paddedMin / 5) * 5

    // Create appropriate y-axis labels based on data range
    const range = roundedMax - roundedMin
    const step = Math.ceil(range / 4) || 5 // We want about 4 labels, default to 5 if range is 0

    const labels = []
    for (let i = 0; i <= 4; i++) {
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
  }, [filteredData]) // Only recalculate when data changes

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
    if (item.isRangeLabel || item.weight <= 0) {
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

  // Get the current selected time range label
  const getTimeRangeLabel = () => {
    const option = timeRangeOptions.find((option) => option.id === timeRange)
    return option ? option.label : "Last 7 Days"
  }

  // Fixed CustomBar component
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

    // Check if the bar has weight data
    const hasWeight = item.weight > 0

    // Calculate bar height based on data range
    const dataRange = roundedMax - roundedMin
    const normalizedWeight = hasWeight ? item.weight - roundedMin : 0 // Adjust for minimum value

    // Ensure we don't get NaN or negative values for barHeight
    let barHeight = 0
    if (dataRange > 0 && normalizedWeight > 0) {
      barHeight = (normalizedWeight / dataRange) * MAX_HEIGHT
      // Ensure minimum visible height for bars with very small values
      barHeight = Math.max(barHeight, 2)
    }

    // Use thinner bars for month views, wider for today view
    let barWidth = BAR_WIDTH
    if (isMonthView) {
      barWidth = 4
    } else if (timeRange === "today") {
      barWidth = BAR_WIDTH * 2 // Wider bar for today view
    }

    // Format the date for display
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

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => (hasWeight ? handleBarPress(index) : null)}
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
        disabled={!hasWeight} // Disable touch for bars with no weight
      >
        {/* Show day label for week view and today view */}
        {(timeRange === "week" || timeRange === "today") && (
          <View style={styles.barLabelContainer}>
            <Text style={styles.barLabel}>{item.day}</Text>
          </View>
        )}

        {/* Only render the bar if there's weight data */}
        {hasWeight && (
          <View style={[styles.barWrapper, { height: barHeight }, { width: barWidth }]}>
            <LinearGradient
              colors={isSelected ? ["#FFA44C", "#FFA44C"] : ["#FFD5AD", "#FFD5AD"]}
              style={[
                styles.bar,
                { height: "100%" },
                isMonthView && { borderTopLeftRadius: 2, borderTopRightRadius: 2 },
              ]}
            />
          </View>
        )}

        {/* Only show tooltip for selected bars with weight */}
        {isSelected && hasWeight && (
          <Animated.View style={[styles.tooltip, { opacity: tooltipAnim }]}>
            <View style={styles.tooltipContent}>
              <Text style={styles.tooltipTitle}>WEIGHT</Text>
              <Text style={styles.tooltipWeight}>
                {item.weight}{" "}
                <Text
                  style={{
                    fontSize: 16,
                    color: "#FFA44C",
                  }}
                >
                  KG
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weight</Text>
        <TouchableOpacity onPress={() => router.push("/patient/weightunit")}>
          <Feather name="more-vertical" size={20} color="#E5E5E5" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{
          flex: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Weight Circle */}
        <View style={styles.weightCircleContainer}>
          <View style={styles.weightCircle}>
            <Text style={styles.weightValue}>
              {currentWeight ? (
                <>
                  {currentWeight}
                  <Text
                    style={{
                      fontSize: 20,
                      fontFamily: "Inter500",
                    }}
                  >
                    kg
                  </Text>
                </>
              ) : (
                "--"
              )}
            </Text>
          </View>
        </View>

        {/* Last Logged Weight */}
        <View style={styles.lastLoggedContainer}>
          <View style={styles.lastLoggedIcon}>
            <WeightIcon />
          </View>
          <Text style={styles.lastLoggedText}>{currentWeight ? "Last logged weight" : "No logs yet"}</Text>
        </View>

        {/* Add Log Button */}
        <TouchableOpacity style={styles.addLogButton} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={14} color="#fff" />
          <Text style={styles.addLogText}>Add Log</Text>
        </TouchableOpacity>

        {/* Timeline Section */}
        <View style={styles.timelineContainer}>
          <View style={styles.timelineHeader}>
            <View style={styles.timelineIconContainer}>
              <MaterialIcons name="bar-chart" size={18} color="#F9A826" />
              <Text style={styles.timelineTitle}>Timeline</Text>
            </View>

            <TouchableOpacity
              ref={periodSelectorRef}
              style={styles.periodSelector}
              onPress={() => {
                // Measure the position of the period selector button
                if (periodSelectorRef.current) {
                  periodSelectorRef.current.measure((x: any, y: any, width: number, height: any, pageX: any, pageY: any) => {
                    setDropdownPosition({
                      top: pageY + 10, // Position below the button with a small gap
                      right: width > 0 ? Dimensions.get("window").width - (pageX + width) : 20,
                    })
                    setDropdownVisible(true)
                  })
                } else {
                  setDropdownVisible(false)
                }
              }}
            >
              <Text style={styles.periodText}>{getTimeRangeLabel()}</Text>
              <Ionicons name="chevron-down" size={14} color="#FFA44C" />
            </TouchableOpacity>
          </View>

          {/* Chart */}
        </View>
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
            {timeRange !== "week" && timeRange !== "today" && (
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
                timeRange !== "week" && timeRange !== "today" && { paddingHorizontal: 10 },
              ]}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FFA44C" />
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
                      roundedMax={roundedMax}
                      roundedMin={roundedMin}
                      timeRange={timeRange}
                    />
                  ))
              )}
            </View>
          </View>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomContainer}>
          <View style={styles.messageContainer}>
            <Text style={styles.messageTitle}>Track Your Weight Progress</Text>
            <Text style={styles.messageSubtitle}>Set a reminder and stay on track.</Text>
          </View>
          <TouchableOpacity style={styles.reminderButton}>
            <Ionicons name="alarm" size={16} color="white" />
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
          <View style={[styles.dropdownContainer, { top: dropdownPosition.top, right: dropdownPosition.right }]}>
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
                {timeRange === option.id && <Ionicons name="checkmark" size={16} color="#FFA44C" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <WeightModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveWeight}
        reload={getWeightStatus}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: "Inter600",
  },
  menuButton: {
    padding: 8,
  },
  weightCircleContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  weightCircle: {
    width: 180,
    height: 180,
    borderWidth: 4,
    borderColor: "#FFFAFD",
    borderRadius: 100,
    backgroundColor: "rgba(255, 164, 76, 0.16)",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4.8,
    boxShadow: "0px 0px 4.8px 0px rgba(0, 0, 0, 0.25);",
  },
  weightValue: {
    fontSize: 60,
    fontFamily: "Inter700",
    color: "#333",
  },
  weightUnit: {
    fontSize: 18,
    color: "#333",
  },
  lastLoggedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 25,
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
  lastLoggedIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
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
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#FFA44C",
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
    borderTopColor: "#FFA44C",
    marginTop: -1,
  },
  tooltipTitle: {
    fontSize: 12,
    color: "#434343",
    fontFamily: "Inter500",
  },
  tooltipWeight: {
    fontSize: 22,
    color: "#FFA44C",
    marginVertical: 2,
    fontFamily: "Inter700",
  },
  tooltipDate: {
    fontSize: 12,
    color: "#434343",
    fontFamily: "Inter500",
  },
  lastLoggedText: {
    fontSize: 20,
    color: "#373737",
    fontFamily: "Inter600",
  },
  periodSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF6ED",
    borderWidth: 1,
    borderColor: "#FFE3C8",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    borderRadius: 8,
  },
  periodText: {
    fontSize: 12,
    letterSpacing: 0.28,
    fontFamily: "Inter500",
    color: "#FFA44C",
  },
  addLogButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFA44C",
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#FFC287",
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: 25,
    alignSelf: "flex-start",
    marginTop: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  addLogText: {
    color: "#fff",
    marginLeft: 5,
    fontFamily: "Inter400",
    fontSize: 14,
  },
  timelineContainer: {
    marginTop: 25,
    marginHorizontal: 16,
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  timelineIconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timelineTitle: {
    fontSize: 14,
    fontFamily: "Inter500",
    letterSpacing: 0.28,
    marginLeft: 5,
    color: "#373737",
  },
  timeframeSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(249, 168, 38, 0.15)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  timeframeText: {
    fontSize: 14,
    color: "#F9A826",
    marginRight: 5,
  },
  chart: {
    marginVertical: 20,
    borderRadius: 16,
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
    color: "#E89545",
    textTransform: "capitalize",
    fontFamily: "Inter500",
  },
  messageSubtitle: {
    fontSize: 12,
    color: "#7B7B7B",
    fontFamily: "Inter400",
  },
  reminderButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFA44C",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#FFC287",
    paddingVertical: 10,
    borderRadius: 20,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  reminderButtonText: {
    color: "#FEF8FD",
    marginLeft: 8,
    fontSize: 12,
    fontFamily: "Inter500",
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
    // backgroundColor: "rgba(0, 0, 0, 0.5)", // Uncommented this line to make overlay visible
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownContainer: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFE3C8",
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
    borderBottomColor: "rgba(255, 164, 76, 0.1)",
  },
  dropdownItemSelected: {
    backgroundColor: "#FFF6ED",
  },
  dropdownItemText: {
    color: "#373737",
    fontSize: 14,
    fontFamily: "Inter400",
  },
  dropdownItemTextSelected: {
    color: "#FFA44C",
    fontFamily: "Inter600",
  },
})

export default WeightScreen

