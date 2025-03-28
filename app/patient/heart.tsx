import { useState, useEffect, useMemo, useRef } from "react"
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
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native"
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"
import { LinearGradient } from "expo-linear-gradient"
import HeartCard from "@/components/HeartCard"
import { useSelector } from "react-redux"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as WebBrowser from "expo-web-browser"
import { useFitbit } from "@/zustandStore/useFitbitStore"

const { width } = Dimensions.get("window")
const BAR_WIDTH = 20
const SPACING = (width - BAR_WIDTH * 10) / 8
const MAX_HEIGHT = 200

WebBrowser.maybeCompleteAuthSession();

// Handle bar press
interface DataItem {
  day: string
  bpm: number
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
  { day: "S", bpm: 0, date: "" },
  { day: "M", bpm: 0, date: "" },
  { day: "T", bpm: 0, date: "" },
  { day: "W", bpm: 0, date: "" },
  { day: "T", bpm: 0, date: "" },
  { day: "F", bpm: 0, date: "" },
  { day: "S", bpm: 0, date: "" },
]

// Default empty today data
const emptyTodayData = [{ day: "Today", bpm: 0, date: new Date().toISOString().split("T")[0] }]

// Sample data for the heart rate
// Replace the existing DUMMY_HEART_DATA constant with this function
const generateRealtimeHeartData = () => {
  const today = new Date()
  const result = []

  // Generate data for the past 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(today.getDate() - i)
    const dateString = date.toISOString().split("T")[0]

    // Get day abbreviation (S, M, T, W, T, F, S)
    const dayIndex = date.getDay() // 0 = Sunday, 1 = Monday, etc.
    const dayAbbr = "SMTWTFS"[dayIndex]

    // Generate a random BPM between 70-85
    const bpm = Math.floor(Math.random() * 15) + 80

    result.push({
      day: dayAbbr,
      bpm: bpm,
      date: dateString,
    })
  }

  return result
}

export default function HeartRateScreen() {
  const [timeRange, setTimeRange] = useState("week") // "today", "week", "month", "lastMonth"
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [tooltipAnim] = useState(new Animated.Value(0)) // Start with 0 opacity
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [dropdownVisible, setDropdownVisible] = useState(false)
  const user = useSelector((state: any) => state.user)
  const [heartRateData, setHeartRateData] = useState<DataItem[]>(emptyChartData)
  const [lastResetDate, setLastResetDate] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filteredData, setFilteredData] = useState<DataItem[]>([])
  const [currentHeartRate, setCurrentHeartRate] = useState<number>(75)

  // Add a ref for the period selector button
  const periodSelectorRef = useRef<TouchableOpacity>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })

  // Use the simplified Fitbit hook
  const { isConnected, isLoading: fitbitLoading, connect, disconnect, getHeartRateData, getDataForRange, testConnect } = useFitbit();

  // Function to fetch heart rate data from Fitbit
  const fetchFitbitHeartRateData = async () => {
    try {
      // Determine date range based on timeRange
      const today = new Date();
      let startDate = new Date();
      
      if (timeRange === 'today') {
        // Just today
      } else if (timeRange === 'week') {
        startDate.setDate(today.getDate() - 7);
      } else if (timeRange === 'month') {
        startDate.setMonth(today.getMonth() - 1);
      } else if (timeRange === 'lastMonth') {
        startDate.setMonth(today.getMonth() - 2);
        const endDate = new Date();
        endDate.setMonth(today.getMonth() - 1);
        today.setTime(endDate.getTime());
      }
      
      // Format dates for Fitbit API (yyyy-MM-dd)
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = today.toISOString().split('T')[0];
      
      // Get data for date range
      const data = await getDataForRange('activities/heart', startDateStr, endDateStr);
      
      if (!data) {
        throw new Error('Failed to fetch Fitbit data');
      }
      
      return processFitbitHeartRateData(data);
    } catch (error) {
      console.error('Error fetching Fitbit heart rate data:', error);
      return null;
    }
  };

  // Function to get current heart rate
  const getCurrentHeartRate = async () => {
    try {
      // Get today's date in yyyy-MM-dd format
      const today = new Date().toISOString().split('T')[0];
      
      // Get heart rate data for today
      const data = await getHeartRateData(today);
      console.log("this is the data", JSON.stringify(data));
      if (!data) {
        return 79; // Default value if no data
      } 
       
      
      // Try to get the most recent heart rate value
      const intradayData = data['activities-heart-intraday']?.dataset;
      if (intradayData && intradayData.length > 0) {
        return intradayData[intradayData.length - 1].value;
      }
      
      // If no intraday data, try to get resting heart rate
      const restingHR = data['activities-heart'][0]?.value?.restingHeartRate;
      if (restingHR) {
        return restingHR;
      }
      
      return 75; // Default value if no specific data
    } catch (error) {
      console.error('Error fetching current heart rate:', error);
      return 75; // Default value on error
    }
  };

  // Process Fitbit heart rate data
  const processFitbitHeartRateData = (fitbitData: any) => {
    if (!fitbitData || !fitbitData['activities-heart']) {
      return [];
    }
    
    const heartRateData = fitbitData['activities-heart'];
    const fixedWeekdays = ["S", "M", "T", "W", "T", "F", "S"];
    
    // Map Fitbit data to app format
    return heartRateData.map((item: any) => {
      const date = new Date(item.dateTime);
      const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayAbbr = fixedWeekdays[dayIndex];
      
      // Get the resting heart rate or default to 0
      const bpm = item.value?.restingHeartRate || 0;
      
      return {
        day: dayAbbr,
        bpm: bpm,
        date: item.dateTime,
      };
    });
  };

  // Handle Fitbit connection/disconnection
  const handleFitbitConnection = async () => {
    if (isConnected) {
      // Disconnect from Fitbit
      await disconnect();
      Alert.alert('Disconnected', 'Successfully disconnected from Fitbit');
    } else {
      // Connect to Fitbit
      const success = await connect();
      if (success) {
        Alert.alert('Success', 'Connected to Fitbit');
        getHeartRateStatus(); // Refresh data with Fitbit data
      } else {
        Alert.alert('Error', 'Failed to connect to Fitbit');
      }
    }
  };

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
          bpm: 0,
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
          bpm: 0,
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
            bpm: 0,
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
              bpm: 0,
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
      const lastResetInfo = await AsyncStorage.getItem("lastHeartRateResetInfo")
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
        console.log("Resetting heart rate data for new week")

        // Store the current heart rate as the starting point for the new week
        const lastHeartRate = currentHeartRate

        // Reset chart data but keep the last heart rate if available
        const resetData = emptyChartData.map((item) => ({
          ...item,
          bpm: 0, // Reset all heart rates to 0
        }))

        // If we have a current heart rate, set it for today
        if (lastHeartRate) {
          const today = new Date()
          const dayIndex = today.getDay() // 0 = Sunday, 1 = Monday, etc.

          if (resetData[dayIndex]) {
            resetData[dayIndex].bpm = lastHeartRate
            resetData[dayIndex].date = today
              .toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
              .toUpperCase()
          }
        }

        setHeartRateData(resetData)

        // Store the current week info
        const resetInfo = {
          week: currentWeek,
          year: currentYear,
          date: currentDate.toISOString(),
        }

        await AsyncStorage.setItem("lastHeartRateResetInfo", JSON.stringify(resetInfo))
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
        bpm: 0,
        date: formattedDate,
      })
    }

    return pastWeek
  }

  // Replace your DUMMY constant with this function
  const DUMMY = generatePastWeekDates()

  // Process and filter data based on time range
  const processDataForTimeRange = (data: DataItem[], timeRange: string) => {
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
            bpm: todayData.bpm || 0,
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
          bpm: existingData.bpm || 0,
          isRangeLabel: day.isRangeLabel,
          rangeLabel: day.rangeLabel,
        }
      }
      return day
    })
  }

  const getHeartRateStatus = async () => {
    setIsLoading(true)
    try {
      // First check if we need to reset weekly data
      const wasReset = await checkAndResetWeeklyData();

      // If connected to Fitbit, get data from there
      if (isConnected) {
        // Get heart rate data from Fitbit
        const fitbitData = await fetchFitbitHeartRateData();
        
        if (fitbitData && fitbitData.length > 0) {
          // Get current heart rate from Fitbit
          const latestHeartRate = await getCurrentHeartRate();
          setCurrentHeartRate(latestHeartRate);
          
          // Set heart rate data from Fitbit
          setHeartRateData(fitbitData);
          
          // Process data for current time range
          const filteredData = processDataForTimeRange(fitbitData, timeRange);
          setFilteredData(filteredData);
          setIsLoading(false);
          return;
        }
      }

      // If not connected to Fitbit or no Fitbit data, use simulated data
      const data = {
        data: {
          lastHeartRate: currentHeartRate,
          heartRateData: generateRealtimeHeartData(),
        },
      };
      
      setCurrentHeartRate(data.data.lastHeartRate);
      
      if (data.data.heartRateData && data.data.heartRateData.length > 0) {
        // Process the heart rate data from the API
        const fixedWeekdays = ["S", "M", "T", "W", "T", "F", "S"]
        const fullWeekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

        // Create a map to store unique heart rate data for each day
        const heartRateMap = new Map()

        // Process all data regardless of time range
        data.data.heartRateData.forEach((entry: { date: string | number | Date; bpm: any }) => {
          const entryDate = new Date(entry.date)
          const fullDay = entryDate.toLocaleString("en-US", { weekday: "long" }) // Get full weekday name
          const dayIndex = fullWeekdays.indexOf(fullDay) // Get unique index

          if (dayIndex === -1) return // Skip invalid dates

          const dayLetter = fixedWeekdays[dayIndex] // Get S, M, T, W...
          const dateString = entryDate.toISOString().split("T")[0]

          // Store data with ISO date string as key
          heartRateMap.set(dateString, {
            day: dayLetter,
            bpm: entry.bpm,
            date: dateString,
          })
        })

        // Convert map to array
        const processedData = Array.from(heartRateMap.values())
        setHeartRateData(processedData)

        // Process data for current time range
        const filteredData = processDataForTimeRange(processedData, timeRange)
        setFilteredData(filteredData)
      } else {
        // Use default days with zero heart rate
        setHeartRateData(DUMMY)

        // Process data for current time range
        const filteredData = processDataForTimeRange(DUMMY, timeRange)
        setFilteredData(filteredData)
      }
    } catch (error) {
      console.error("Error fetching heart rate status:", error)
      setHeartRateData(DUMMY)

      // If there's an error, still set filtered data based on time range
      const filteredData = processDataForTimeRange(DUMMY, timeRange)
      setFilteredData(filteredData)
    } finally {
      setIsLoading(false)
    }
  }

  // Update filtered data when time range changes
  useEffect(() => {
    const filtered = processDataForTimeRange(heartRateData, timeRange)
    setFilteredData(filtered)

    // Reset selected index when changing time range
    setSelectedIndex(null)
  }, [timeRange, heartRateData])

  // Initialize data when component mounts
  useEffect(() => {
    const initializeData = async () => {
      // Load the last reset date from storage
      const lastResetInfo = await AsyncStorage.getItem("lastHeartRateResetInfo")
      if (lastResetInfo) {
        const parsedInfo = JSON.parse(lastResetInfo)
        setLastResetDate(new Date(parsedInfo.date))
      }

      // Check for reset and fetch data
      await getHeartRateStatus()
    }

    initializeData()

    // Set up a check that runs when the app is opened or comes to foreground
    const checkInterval = setInterval(() => {
      checkAndResetWeeklyData().then((wasReset) => {
        if (wasReset) {
          // If data was reset, refresh the heart rate status
          getHeartRateStatus()
        }
      })
    }, 3600000) // Check every hour

    return () => clearInterval(checkInterval)
  }, [])

  // Simulate changing heart rate for the live display if not connected to Fitbit
  useEffect(() => {
    // Only simulate heart rate if not connected to Fitbit
    if (!isConnected) {
      const interval = setInterval(() => {
        setCurrentHeartRate((prevRate) => {
          // Random fluctuation between 70-85
          const newRate = prevRate + (Math.random() * 2 - 1) // Random fluctuation
          // Round to the nearest integer and clamp between 70 and 85
          const updatedRate = Math.min(Math.max(Math.round(newRate), 70), 85)

          // Update today's heart rate in the chart data
          const today = new Date()
          const todayStr = today.toISOString().split("T")[0]

          // Update the heart rate data for today
          setHeartRateData((prevData) => {
            const updatedData = [...prevData]
            const todayIndex = updatedData.findIndex(
              (item) => new Date(item.date).toISOString().split("T")[0] === todayStr,
            )

            if (todayIndex >= 0) {
              // Update existing entry
              updatedData[todayIndex] = {
                ...updatedData[todayIndex],
                bpm: updatedRate,
              }
            } else {
              // Add new entry for today
              const dayIndex = today.getDay() // 0 = Sunday, 1 = Monday, etc.
              const dayAbbr = "SMTWTFS"[dayIndex]

              updatedData.push({
                day: dayAbbr,
                bpm: updatedRate,
                date: todayStr,
              })
            }

            return updatedData
          })

          return updatedRate
        })
      }, 1000)

      return () => clearInterval(interval)
    } else {
      // If connected to Fitbit, periodically refresh the current heart rate
      const interval = setInterval(async () => {
        try {
          const latestHeartRate = await getCurrentHeartRate();
          setCurrentHeartRate(latestHeartRate);
          
          // Update today's heart rate in the chart data
          const today = new Date();
          const todayStr = today.toISOString().split("T")[0];
          
          setHeartRateData((prevData) => {
            const updatedData = [...prevData];
            const todayIndex = updatedData.findIndex(
              (item) => new Date(item.date).toISOString().split("T")[0] === todayStr,
            );
            
            if (todayIndex >= 0) {
              updatedData[todayIndex] = {
                ...updatedData[todayIndex],
                bpm: latestHeartRate,
              };
            }
            
            return updatedData;
          });
        } catch (error) {
          console.error("Error updating heart rate:", error);
        }
      }, 60000); // Refresh every minute
      
      return () => clearInterval(interval);
    }
  }, [isConnected])

  // Calculate y-axis values using useMemo to prevent recalculation on every render
  const { yAxisLabels, roundedMax, roundedMin } = useMemo(() => {
    if (!filteredData.length) {
      return { yAxisLabels: [100, 90, 80, 70, 60], roundedMax: 100, roundedMin: 60 }
    }

    // Filter out zero heart rates for calculation
    const nonZeroBpms = filteredData.filter((item) => !item.isRangeLabel && item.bpm > 0).map((item) => item.bpm)

    // If no non-zero heart rates, use default range
    if (nonZeroBpms.length === 0) {
      return { yAxisLabels: [100, 90, 80, 70, 60], roundedMax: 100, roundedMin: 60 }
    }

    const maxBpm = Math.max(...nonZeroBpms)
    const minBpm = Math.min(...nonZeroBpms)

    // Add padding to the range
    const paddedMax = maxBpm + 5
    const paddedMin = Math.max(60, minBpm - 5) // Don't go below 60 BPM

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
    if (item.isRangeLabel || item.bpm <= 0) {
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

    // Check if the bar has heart rate data
    const hasBpm = item.bpm > 0

    // Calculate bar height based on data range
    const dataRange = roundedMax - roundedMin
    const normalizedBpm = hasBpm ? item.bpm - roundedMin : 0 // Adjust for minimum value

    // Ensure we don't get NaN or negative values for barHeight
    let barHeight = 0
    if (dataRange > 0 && normalizedBpm > 0) {
      barHeight = (normalizedBpm / dataRange) * MAX_HEIGHT
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
        onPress={() => (hasBpm ? handleBarPress(index) : null)}
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
        disabled={!hasBpm} // Disable touch for bars with no heart rate
      >
        {/* Show day label for week view and today view */}
        {(timeRange === "week" || timeRange === "today") && (
          <View style={styles.barLabelContainer}>
            <Text style={styles.barLabel}>{item.day}</Text>
          </View>
        )}

        {/* Only render the bar if there's heart rate data */}
        {hasBpm && (
          <View style={[styles.barWrapper, { height: barHeight }, { width: barWidth }]}>
            <LinearGradient
              colors={isSelected ? ["#D53E4F", "#D53E4F"] : ["#F2C3C8", "#F2C3C8"]}
              style={[
                styles.bar,
                { height: "100%" },
                isMonthView && { borderTopLeftRadius: 2, borderTopRightRadius: 2 },
              ]}
            />
          </View>
        )}

        {/* Only show tooltip for selected bars with heart rate */}
        {isSelected && hasBpm && (
          <Animated.View style={[styles.tooltip, { opacity: tooltipAnim }]}>
            <View style={styles.tooltipContent}>
              <Text style={styles.tooltipTitle}>AVG. HEART-RATE</Text>
              <Text style={styles.tooltipWeight}>
                {item.bpm}{" "}
                <Text
                  style={{
                    fontSize: 16,
                    color: "#D53E4F",
                  }}
                >
                  BPM
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
        <Text style={styles.headerTitle}>Heart-Rate</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Feather name="more-vertical" size={20} color="#E5E5E5" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{
          flex: 1,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Heart Rate Circle */}
        <View style={styles.heartRateContainer}>
          <HeartCard bpm={currentHeartRate} />
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
             <TouchableOpacity 
              onPress={handleFitbitConnection}
            >
              <Text style={styles.connectButton}>
                {fitbitLoading ? 'CONNECTING...' : isConnected ? 'DISCONNECT' : 'CONNECT'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Test connect button - can be removed in production */}
          {/* {!isConnected && (
            <View style={styles.connectItem}>
              <Image source={require("../../assets/images/fitbit.png")} style={{ width: 24, height: 24 }} />
              <Text style={styles.connectText}>Test Mode</Text>
              <TouchableOpacity 
                onPress={async () => {
                  const success = await testConnect();
                  if (success) {
                    Alert.alert('Test Mode', 'Connected with test data');
                    getHeartRateStatus();
                  }
                }}
              >
                <Text style={styles.connectButton}>TEST DATA</Text>
              </TouchableOpacity>
            </View>
          )} */}
        </View>

        {/* Analysis Section */}
        <View style={styles.analysisSection}>
          <View style={styles.analysisHeader}>
            <View style={styles.analysisTab}>
              <MaterialIcons name="bar-chart" size={18} color="#F2C3C8" />
              <Text style={styles.analysisTabText}>Analysis</Text>
            </View>
            {/* Update the TouchableOpacity for the period selector to include the ref and measure its position */}
            <TouchableOpacity
              ref={periodSelectorRef}
              style={styles.periodSelector}
              onPress={() => {
                // Measure the position of the period selector button
                if (periodSelectorRef.current) {
                  periodSelectorRef.current.measure((x: any, y: any, width: number, height: any, pageX: any, pageY: any) => {
                    setDropdownPosition({
                      top: pageY +10, // Position below the button with a small gap
                      right: width > 0 ? Dimensions.get("window").width - (pageX + width) : 20,
                    })
                    setDropdownVisible(true)
                  })
                } else {
                  setDropdownVisible(true)
                }
              }}
            >
              <Text style={styles.periodText}>{getTimeRangeLabel()}</Text>
              <Ionicons name="chevron-down" size={14} color="#D53E4F" />
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
                  <ActivityIndicator size="large" color="#D53E4F" />
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
            <Text style={styles.messageTitle}>Monitor Your Heart Health</Text>
            <Text style={styles.messageSubtitle}>Set a reminder for regular checks.</Text>
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
          {/* Update the dropdown container style to use the measured position */}
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
                {timeRange === option.id && <Ionicons name="checkmark" size={16} color="#D53E4F" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
    fontSize: 16,
    fontFamily: "DMSans600",
  },
  menuButton: {
    padding: 8,
  },
  heartRateContainer: {
    alignItems: "center",
    marginVertical: 20,
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
    width: 140,
    zIndex: 10, // Ensure tooltip is above other elements
  },
  tooltipContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#D53E4F",
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
    borderTopColor: "#D53E4F",
    marginTop: -1,
  },
  tooltipTitle: {
    fontSize: 12,
    color: "#434343",
    fontFamily: "Inter500",
  },
  tooltipWeight: {
    fontSize: 22,
    color: "#D53E4F",
    marginVertical: 2,
    fontFamily: "Inter700",
  },
  tooltipDate: {
    fontSize: 12,
    color: "#434343",
    fontFamily: "Inter500",
  },
  periodSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FBECED",
    borderWidth: 1,
    borderColor: "#F2C3C8",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    borderRadius: 8,
  },
  periodText: {
    fontSize: 12,
    letterSpacing: 0.28,
    fontFamily: "Inter500",
    color: "#D53E4F",
  },
  analysisSection: {
    paddingHorizontal: 20,
    marginTop: 10,
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
    color: "#333",
    letterSpacing: 0.28,
    fontFamily: "Inter400",
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
    color: "#D53E4F",
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
    backgroundColor: "#D53E4F",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#F2C3C8",
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
  sectionContainer: {
    marginTop: 10,
    paddingHorizontal: 25,
  },
  sectionTitle: {
    fontSize: 16,
    color: "#000",
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
    color: "#0C0C0C",
  },
  connectButton: {
    color: "#D53E4F",
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
    justifyContent: "center",
    alignItems: "center",
  },
  // Update the dropdownContainer style to remove the fixed positioning
  dropdownContainer: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#F2C3C8",
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
    borderBottomColor: "rgba(213, 62, 79, 0.1)",
  },
  dropdownItemSelected: {
    backgroundColor: "#FBECED",
  },
  dropdownItemText: {
    color: "#373737",
    fontSize: 14,
    fontFamily: "Inter400",
  },
  dropdownItemTextSelected: {
    color: "#D53E4F",
    fontFamily: "Inter600",
  },
})