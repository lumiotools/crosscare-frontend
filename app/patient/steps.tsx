//

import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
  ScrollView,
  Dimensions,
  Animated,
  Modal,
  ActivityIndicator,
  Platform,
} from "react-native";
import {
  Ionicons,
  FontAwesome5,
  Feather,
  MaterialIcons,
} from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import StepsIcon from "@/assets/images/Svg/StepsIcon";
import { LinearGradient } from "expo-linear-gradient";
import StepsModal from "./modal/stepsmodal";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFitbit } from "@/zustandStore/useFitbitStore";
import { Alert } from "react-native";

const { width } = Dimensions.get("window");
const BAR_WIDTH = 20;
const SPACING = (width - BAR_WIDTH * 10) / 8;
const MAX_HEIGHT = 200;

// Define the CustomBarProps interface
interface CustomBarProps {
  item: {
    day: string;
    steps: number;
    date: string;
    isRangeLabel?: boolean;
    rangeLabel?: string;
  };
  index: number;
  isSelected: boolean;
  timeRange: string;
}

// Define the structure for step data items
interface StepDataItem {
  id: string;
  date: string;
  day: string;
  steps: number;
  stepsGoal: number;
  isRangeLabel?: boolean;
  rangeLabel?: string;
}

// Time range options
type TimeRangeOption = {
  id: string;
  label: string;
};

const timeRangeOptions: TimeRangeOption[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "Last 7 Days" },
  { id: "month", label: "This Month" },
  { id: "lastMonth", label: "Last Month" },
];

// Custom Progress Bar Component
const CustomProgressBar = ({ progress }: { progress: number }) => {
  const progressWidth = `${progress * 100}%`;

  return (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBarBackground, { width: "100%" }]}>
        <View
          style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
        />
      </View>
    </View>
  );
};

// Default empty chart data
const emptyChartData = [
  { id: "empty-1", day: "S", steps: 0, date: "" },
  { id: "empty-2", day: "M", steps: 0, date: "" },
  { id: "empty-3", day: "T", steps: 0, date: "" },
  { id: "empty-4", day: "W", steps: 0, date: "" },
  { id: "empty-5", day: "T", steps: 0, date: "" },
  { id: "empty-6", day: "F", steps: 0, date: "" },
  { id: "empty-7", day: "S", steps: 0, date: "" },
];

// Default empty today data
const emptyTodayData = [
  {
    id: "today-empty",
    day: "Today",
    steps: 0,
    date: new Date().toISOString().split("T")[0],
  },
];

const step = () => {
  const [stepGoal, setStepGoal] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [stepsWalked, setStepsWalked] = useState(0); // This can be dynamic based on actual step count
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const user = useSelector((state: any) => state.user);
  const [stepData, setStepData] = useState<StepDataItem[]>(
    emptyChartData as StepDataItem[]
  );
  const [filteredData, setFilteredData] = useState<StepDataItem[]>([]);
  const [lastResetDate, setLastResetDate] = useState<Date | null>(null);

  // Calculate progress based on goal (if set)
  const progress = stepGoal ? stepsWalked / stepGoal : 0;

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [tooltipAnim] = useState(new Animated.Value(0)); // Start with 0 opacity
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State for dropdown
  const [timeRange, setTimeRange] = useState("week"); // "today", "week", "month", "lastMonth"
  const [dropdownVisible, setDropdownVisible] = useState(false);

  // Ref for the period selector button to measure its position
  const periodSelectorRef = useRef<TouchableOpacity>(null);
  // State to store the dropdown position
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    right: 0,
  });

  const {
    isConnected,
    isLoading: fitbitLoading,
    connect,
    disconnect,
    getStepsData,
    getDataForRange,
  } = useFitbit();

  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    const checkInitialConnection = async () => {
      try {
        // Wait for the hook's connection check to complete
        await new Promise((resolve) => setTimeout(resolve, 500));
        setInitialCheckDone(true);
      } catch (error) {
        console.error("Error in initial connection check:", error);
        setInitialCheckDone(true);
      }
    };

    checkInitialConnection();
  }, []);

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
        getStepStatus(); // Refresh data with Fitbit data
      } else {
        Alert.alert('Error', 'Failed to connect to Fitbit');
      }
    }
  };

  const fetchFitbitStepData = async () => {
    try {
      // Determine date range based on timeRange
      const today = new Date();
      let startDate = new Date();

    // const data = await getStepStatus(today);

      
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
      const data = await getDataForRange('activities/steps', startDateStr, endDateStr);
      console.log(data);
      
      if (!data) {
        throw new Error('Failed to fetch Fitbit data');
      }

      const todaySteps = getTodayStepsFromFitbit(data);

      if (todaySteps !== null) {
        await sendStepsToBackend(todaySteps);
      }
      
      return processFitbitStepData(data);
    } catch (error) {
      console.error('Error fetching Fitbit step data:', error);
      return null;
    }
  };


  const getTodayStepsFromFitbit = (fitbitData: any) => {
    if (!fitbitData || !fitbitData['activities-steps']) {
      return null;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const todayData = fitbitData['activities-steps'].find(
      (item: any) => item.dateTime === today
    );
    
    return todayData ? parseInt(todayData.value) : null;
  };

  const sendStepsToBackend = async (steps: number) => {
    try {
      const userId = user?.user_id;
      const apiUrl = `https://crosscare-backends.onrender.com/api/user/activity/${userId}/steps`;
      
      console.log(`Sending ${steps} steps to backend API: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ steps: steps, }),
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('Backend API response:', responseData);
      
      return responseData;
    } catch (error) {
      console.error('Error sending steps to backend:', error);
      return null;
    }
  };

  useEffect(() => {
    if (isConnected) {
      console.log('Setting up 1-minute refresh interval for Fitbit data');
      // Set up interval to refresh data every 1 minute when connected to Fitbit
      const refreshInterval = setInterval(() => {
        console.log('Refreshing Fitbit data...');
        getStepStatus();
      }, 10000); // 1 minute (60000 milliseconds)
      
      return () => {
        console.log('Clearing Fitbit refresh interval');
        clearInterval(refreshInterval);
      };
    }
  }, [isConnected]);

  // Process Fitbit step data
  const processFitbitStepData = (fitbitData: any) => {
    if (!fitbitData || !fitbitData['activities-steps']) {
      return [];
    }
    
    const stepData = fitbitData['activities-steps'];
    const fixedWeekdays = ["S", "M", "T", "W", "T", "F", "S"];
    
    // Map Fitbit data to app format
    return stepData.map((item: any) => {
      const date = new Date(item.dateTime);
      const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayAbbr = fixedWeekdays[dayIndex];
      
      // Get the step count or default to 0
      const steps = parseInt(item.value) || 0;
      
      return {
        id: `fitbit-${item.dateTime}`,
        day: dayAbbr,
        steps: steps,
        date: item.dateTime,
        stepsGoal: stepGoal || 0, // Use current step goal
      };
    });
  };

  // Function to get the current week number
  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // Function to check if we need to reset the chart data
  const checkAndResetWeeklyData = async () => {
    try {
      // Get current date
      const currentDate = new Date();
      const currentWeek = getWeekNumber(currentDate);
      const currentYear = currentDate.getFullYear();

      // Get the stored last reset info from AsyncStorage
      const lastResetInfo = await AsyncStorage.getItem("lastStepResetInfo");
      let lastResetWeek = 0;
      let lastResetYear = 0;

      if (lastResetInfo) {
        const parsedInfo = JSON.parse(lastResetInfo);
        lastResetWeek = parsedInfo.week;
        lastResetYear = parsedInfo.year;
        setLastResetDate(new Date(parsedInfo.date));
      }

      console.log("Current week/year:", currentWeek, currentYear);
      console.log("Last reset week/year:", lastResetWeek, lastResetYear);

      // Reset if it's a new week or a new year
      if (
        !lastResetInfo ||
        lastResetWeek !== currentWeek ||
        lastResetYear !== currentYear
      ) {
        console.log("Resetting step data for new week");
        // Reset chart data
        setStepData(emptyChartData.map((item) => ({ ...item, stepsGoal: 0 })));

        // Store the current week info
        const resetInfo = {
          week: currentWeek,
          year: currentYear,
          date: currentDate.toISOString(),
        };

        await AsyncStorage.setItem(
          "lastStepResetInfo",
          JSON.stringify(resetInfo)
        );
        setLastResetDate(currentDate);

        return true; // Indicate that we reset the data
      }

      return false; // No reset needed
    } catch (error) {
      console.error("Error in checkAndResetWeeklyData:", error);
      return false;
    }
  };

  // Generate all days for the selected time range
  const generateAllDays = (timeRange: string): StepDataItem[] => {
    const today = new Date();
    const days = [];
    let startDate: Date;
    let endDate: Date;

    if (timeRange === "today") {
      // Today view - just show today
      const todayStr = today.toISOString().split("T")[0];

      return [
        {
          id: `today-${todayStr}`,
          date: todayStr,
          day: "Today",
          steps: 0,
          stepsGoal: 0,
        },
      ];
    } else if (timeRange === "week") {
      // Weekly view - show each day
      startDate = new Date(today);
      const dayOfWeek = startDate.getDay();
      startDate.setDate(startDate.getDate() - dayOfWeek);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);

      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split("T")[0];
        days.push({
          id: `empty-${dateString}`,
          date: dateString,
          day: currentDate
            .toLocaleDateString("en-US", { weekday: "short" })
            .charAt(0),
          steps: 0,
          stepsGoal: 0,
        });
        currentDate.setDate(currentDate.getDate() + 1);
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
      ];

      if (timeRange === "month") {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      } else {
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      }

      const lastDay = endDate.getDate();

      // Generate entries for each date range
      for (const range of dateRanges) {
        if (range.start <= lastDay) {
          // Add the main label date
          const labelDate = new Date(startDate);
          labelDate.setDate(range.start);
          const labelDateString = labelDate.toISOString().split("T")[0];

          days.push({
            id: `label-${labelDateString}`,
            date: labelDateString,
            day: range.label,
            steps: 0,
            stepsGoal: 0,
            isRangeLabel: true, // Mark this as a label for the range
          });

          // Add individual days in the range
          for (
            let day = range.start;
            day <= Math.min(range.end, lastDay);
            day++
          ) {
            const currentDate = new Date(startDate);
            currentDate.setDate(day);
            const dateString = currentDate.toISOString().split("T")[0];

            days.push({
              id: `day-${dateString}`,
              date: dateString,
              day: "", // Empty string for non-label days
              steps: 0,
              stepsGoal: 0,
              rangeLabel: range.label, // Reference to which label this belongs to
            });
          }
        }
      }
    }

    return days;
  };

  // Process and filter data based on time range
  const processDataForTimeRange = (data: StepDataItem[], timeRange: string) => {
    const allDays = generateAllDays(timeRange);

    if (data.length === 0) {
      return allDays;
    }

    const dataMap = new Map();
    data.forEach((item) => {
      if (item.date) {
        const dateKey = new Date(item.date).toISOString().split("T")[0];
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
            steps: todayData.steps || 0,
            stepsGoal: todayData.stepsGoal || 0,
          },
        ];
      } else {
        return allDays; // Return empty today template
      }
    }

    // For other views, map the data as before
    return allDays.map((day) => {
      const existingData = dataMap.get(day.date);
      if (existingData) {
        return {
          ...day,
          steps: existingData.steps || 0,
          stepsGoal: existingData.stepsGoal || 0,
          isRangeLabel: day.isRangeLabel,
          rangeLabel: day.rangeLabel,
        };
      }
      return day;
    });
  };

  // Generate past week dates with proper day abbreviations
  const generatePastWeekDates = () => {
    const today = new Date();
    const pastWeek = [];

    // Generate dates for the past 7 days (including today)
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);

      // Format the date as ISO string for consistency
      const dateString = date.toISOString().split("T")[0];

      // Get day abbreviation (S, M, T, W, T, F, S)
      const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dayAbbr = "SMTWTFS"[dayIndex]; // Get the corresponding letter

      pastWeek.push({
        id: `default-${dateString}`,
        day: dayAbbr,
        steps: 0,
        date: dateString,
        stepsGoal: 0,
      });
    }

    return pastWeek;
  };

  // Default data if API fails
  const DUMMY = generatePastWeekDates();

  // Fetch step data from API
  const getStepStatus = async () => {
    // setIsLoading(true);
    try {
      // First check if we need to reset weekly data
      const wasReset = await checkAndResetWeeklyData();

      if (isConnected) {
        // Get step data from Fitbit
        const fitbitData = await fetchFitbitStepData();

        // console.log(fitbitData);
        
        // if (fitbitData && fitbitData.length > 0) {
        //   // Get today's steps for the current count
        //   const today = new Date().toISOString().split('T')[0];
        //   const todayData = fitbitData.find(item => item.date === today);
        //   if (todayData) {
        //     setStepsWalked(todayData.steps);
        //   }
          
        //   // Set step data from Fitbit
        //   setStepData(fitbitData);
          
        //   // Process data for current time range
        //   const filteredData = processDataForTimeRange(fitbitData, timeRange);
        //   setFilteredData(filteredData);
        //   // setIsLoading(false);
        //   return;
        // }
      }

      // If we just reset the data, we might want to show the reset data
      if (wasReset) {
        console.log("Step data was reset for new week");
        // The reset function already updated the state, so we could return early
        // But we'll continue to fetch the latest data from the API
      }

      const userId = user?.user_id;
      const response = await fetch(
        `https://crosscare-backends.onrender.com/api/user/activity/${userId}/stepsStatus`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log("API step data:", data.stepsData);

      if (data.stepsData && data.stepsData.length > 0) {
        // Process the step data from the API
        const fixedWeekdays = ["S", "M", "T", "W", "T", "F", "S"];
        const fullWeekdays = [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ];

        // Create a map to store unique step data for each day
        const stepMap = new Map();

        // Process all data regardless of time range
        data.stepsData.forEach((entry: StepDataItem) => {
          const entryDate = new Date(entry.date);
          const fullDay =
            entry.day || entryDate.toLocaleString("en-US", { weekday: "long" });
          const dayIndex = fullWeekdays.indexOf(fullDay); // Get unique index

          // If day is not found, use the first character of the day
          const dayLetter =
            dayIndex !== -1 ? fixedWeekdays[dayIndex] : entry.day.charAt(0);
          const dateString = entryDate.toISOString().split("T")[0];

          // Store data with ISO date string as key
          stepMap.set(dateString, {
            id: entry.id,
            day: dayLetter,
            steps: entry.steps,
            date: dateString,
            stepsGoal: entry.stepsGoal,
          });

          // Update current steps walked and goal from the most recent entry
          if (
            !stepMap.has("latest") ||
            new Date(entry.date) > new Date(stepMap.get("latest").date)
          ) {
            stepMap.set("latest", {
              id: entry.id,
              day: dayLetter,
              steps: entry.steps,
              date: dateString,
              stepsGoal: entry.stepsGoal,
            });
          }
        });

        // Set current steps and goal from the latest entry
        const latestEntry = stepMap.get("latest");
        if (latestEntry) {
          setStepsWalked(latestEntry.steps);
          if (latestEntry.stepsGoal > 0) {
            setStepGoal(latestEntry.stepsGoal);
          }
          stepMap.delete("latest"); // Remove the temporary entry
        }

        // Convert map to array
        const processedData = Array.from(stepMap.values());
        setStepData(processedData);

        // Process data for current time range
        const filteredData = processDataForTimeRange(processedData, timeRange);
        setFilteredData(filteredData);
      } else {
        // Use default days with zero steps
        setStepData(DUMMY);

        // Process data for current time range
        const filteredData = processDataForTimeRange(DUMMY, timeRange);
        setFilteredData(filteredData);
      }
    } catch (error) {
      console.error("Error fetching step data:", error);
      setStepData(DUMMY);

      // If there's an error, still set filtered data based on time range
      const filteredData = processDataForTimeRange(DUMMY, timeRange);
      setFilteredData(filteredData);
    } finally {
      setIsLoading(false);
    }
  };

  // Update filtered data when time range changes
  useEffect(() => {
    const filtered = processDataForTimeRange(stepData, timeRange);
    setFilteredData(filtered);

    // Reset selected index when changing time range
    setSelectedIndex(null);
  }, [timeRange, stepData]);

  // Initialize data when component mounts
  useEffect(() => {
    const initializeData = async () => {
      // Load the last reset date from storage
      const lastResetInfo = await AsyncStorage.getItem("lastStepResetInfo");
      if (lastResetInfo) {
        const parsedInfo = JSON.parse(lastResetInfo);
        setLastResetDate(new Date(parsedInfo.date));
      }

      // Check for reset and fetch data
      await getStepStatus();
    };

    initializeData();

    // Set up a check that runs when the app is opened or comes to foreground
    const checkInterval = setInterval(() => {
      checkAndResetWeeklyData().then((wasReset) => {
        if (wasReset) {
          // If data was reset, refresh the step status
          getStepStatus();
        }
      });
    }, 3600000); // Check every hour

    return () => clearInterval(checkInterval);
  }, []);

  const handleSaveGoal = async (steps: string) => {
    const parsedSteps = Number.parseInt(steps, 10);
    if (!isNaN(parsedSteps) && parsedSteps > 0) {
      setStepGoal(parsedSteps);
      setModalVisible(false);
    }
  };

  // Calculate y-axis values using useMemo to prevent recalculation on every render
  const { yAxisLabels, roundedMax, roundedMin } = useMemo(() => {
    // Step values are divided by 1000 to represent in thousands
    const nonZeroSteps = filteredData
      .filter((item) => !item.isRangeLabel && item.steps > 0)
      .map((item) => item.steps / 1000); // Convert to thousands

    // If no non-zero steps, use default range
    if (nonZeroSteps.length === 0) {
      return { yAxisLabels: [15, 10, 5, 0], roundedMax: 15, roundedMin: 0 };
    }

    const maxSteps = Math.max(...nonZeroSteps);
    const minSteps = Math.min(...nonZeroSteps);

    // Add padding to the range
    const paddedMax = maxSteps + 2;
    const paddedMin = Math.max(0, minSteps - 1);

    // Calculate rounded max for y-axis (round up to nearest integer)
    const roundedMax = Math.ceil(paddedMax);
    // Calculate rounded min for y-axis (round down to nearest integer)
    const roundedMin = Math.floor(paddedMin);

    // Create appropriate y-axis labels based on the new range
    const range = roundedMax - roundedMin;
    const step = Math.max(1, Math.ceil(range / 4)); // Divide the range into 4 labels, minimum step of 1

    const labels = [];
    for (let i = 0; i <= 4; i++) {
      const value = roundedMin + step * i;
      if (value <= roundedMax) {
        labels.push(value);
      }
    }

    // Ensure max value is included
    if (labels[labels.length - 1] < roundedMax) {
      labels.push(roundedMax);
    }

    return {
      yAxisLabels: labels.reverse(), // Reverse for top-to-bottom display
      roundedMax,
      roundedMin,
    };
  }, [filteredData]); // Recalculate when filtered data changes

  // Function to hide tooltip after a delay
  const hideTooltipAfterDelay = () => {
    // Clear any existing timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }

    // Set a new timeout to hide the tooltip after 3 seconds
    tooltipTimeoutRef.current = setTimeout(() => {
      Animated.timing(tooltipAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setSelectedIndex(null);
      });
    }, 3000);
  };

  const handleBarPress = (index: number): void => {
    // Get the actual item
    const item = filteredData[index];

    // Skip if it's a range label or has no data
    if (item.isRangeLabel || item.steps <= 0) {
      return;
    }

    if (selectedIndex === index) {
      setSelectedIndex(null); // Deselect if already selected
      return;
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
    ]).start();

    setSelectedIndex(index);

    // Set timeout to hide tooltip after delay
    hideTooltipAfterDelay();
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  // Get the current selected time range label
  const getTimeRangeLabel = () => {
    const option = timeRangeOptions.find((option) => option.id === timeRange);
    return option ? option.label : "Last 7 Days";
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date
        .toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
        .toUpperCase();
    } catch (e) {
      return dateString; // Return original if parsing fails
    }
  };

  // Function to handle opening the dropdown and measuring the button position
  const handleOpenDropdown = () => {
    if (periodSelectorRef.current) {
      periodSelectorRef.current.measure(
        (x: any, y: any, width: any, height: any, pageX: any, pageY: any) => {
          // Calculate the position for the dropdown to appear below the button
          setDropdownPosition({
            top: pageY + 10,
            right: Dimensions.get("window").width - (pageX + width),
          });
          setDropdownVisible(true);
        }
      );
    } else {
      // Fallback if ref is not available
      setDropdownVisible(true);
    }
  };

  const CustomBar = ({
    item,
    index,
    isSelected,
    timeRange,
  }: CustomBarProps) => {
    // Check if this is a month view
    const isMonthView = timeRange !== "week" && timeRange !== "today";

    // Skip rendering for range labels in month view - they're just for organization
    if (isMonthView && item.isRangeLabel) {
      return (
        <View style={styles.dateRangeContainer}>
          <Text style={styles.dateRangeLabel}>{item.day}</Text>
        </View>
      );
    }

    // Check if the bar has step data
    const hasSteps = item.steps > 0;

    // Calculate bar height based on data range
    const dataRange = roundedMax - roundedMin;
    const normalizedSteps = hasSteps ? item.steps / 1000 - roundedMin : 0; // Adjust for minimum value

    // Ensure we don't get NaN or negative values for barHeight
    let barHeight = 0;
    if (dataRange > 0 && normalizedSteps > 0) {
      barHeight = (normalizedSteps / dataRange) * MAX_HEIGHT;
      // Ensure minimum visible height for bars with very small values
      barHeight = Math.max(barHeight, 2);
    }

    // Use thinner bars for month views, wider for today view
    let barWidth = BAR_WIDTH;
    if (isMonthView) {
      barWidth = 4;
    } else if (timeRange === "today") {
      barWidth = BAR_WIDTH * 2; // Wider bar for today view
    }

    const formatSteps = (steps: number) => {
      return steps >= 1000 ? `${(steps / 1000).toFixed(1)}` : steps.toString();
    };

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => (hasSteps ? handleBarPress(index) : null)}
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
            marginLeft:
              item.rangeLabel &&
              index > 0 &&
              filteredData[index - 1].rangeLabel !== item.rangeLabel
                ? 10
                : 0, // Add space between ranges
          },
        ]}
        disabled={!hasSteps} // Disable touch for bars with no steps
      >
        {/* Show day label for week view and today view */}
        {(timeRange === "week" || timeRange === "today") && (
          <View style={styles.barLabelContainer}>
            <Text style={styles.barLabel}>{item.day}</Text>
          </View>
        )}

        {/* Only render the bar if there's step data */}
        {hasSteps && (
          <View
            style={[
              styles.barWrapper,
              { height: barHeight },
              { width: barWidth },
            ]}
          >
            <LinearGradient
              colors={
                isSelected ? ["#5E4FA2", "#5E4FA2"] : ["#B5AED4", "#B5AED4"]
              }
              style={[
                styles.bar,
                { height: "100%" },
                isMonthView && {
                  borderTopLeftRadius: 2,
                  borderTopRightRadius: 2,
                },
              ]}
            />
          </View>
        )}

        {/* Only show tooltip for selected bars with steps */}
        {isSelected && hasSteps && (
          <Animated.View style={[styles.tooltip, { opacity: tooltipAnim }]}>
            <View style={styles.tooltipContent}>
              <Text style={styles.tooltipTitle}>STEPS</Text>
              <Text style={styles.tooltipWeight}>
                {formatSteps(item.steps)}{" "}
                <Text
                  style={{
                    fontSize: 16,
                    color: "#5E4FA2",
                  }}
                >
                  {item.steps >= 1000 ? "k" : ""}
                </Text>
              </Text>
              <Text style={styles.tooltipDate}>{formatDate(item.date)}</Text>
            </View>
            <View style={styles.tooltipArrow} />
          </Animated.View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={"white"} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Steps</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Feather name="more-vertical" size={20} color="#E5E5E5" />
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Step Count Section */}
        <View style={styles.stepCountContainer}>
          <View style={styles.stepsCircleContainer}>
            <View style={styles.stepsCircle}>
              <StepsIcon width={80} height={80} />
            </View>
          </View>
          <CustomProgressBar progress={progress} />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={styles.stepCountText}>
              {stepsWalked}{" "}
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Inter400",
                  color: "black",
                }}
              >
                {stepGoal ? `of ${stepGoal} steps walked` : "steps walked"}
              </Text>
            </Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setModalVisible(true)}
            >
              <FontAwesome5 name="pen" size={15} color="#707070" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Connect to Application Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Connect to Application</Text>
          <View style={styles.connectItem}>
            <Image
              source={require("../../assets/images/applehealth.png")}
              style={{ width: 24, height: 24 }}
            />
            <Text style={styles.connectText}>{Platform.OS === 'ios' ? 'Health App' : 'Samsung Health'}</Text>
            <TouchableOpacity>
              <Text style={styles.connectButton}>CONNECT</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Connect to Device Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Connect to Device</Text>
          <View style={styles.connectItem}>
            <Image
              source={require("../../assets/images/fitbit.png")}
              style={{ width: 24, height: 24 }}
            />
            <Text style={styles.connectText}>Fitbit</Text>
            <TouchableOpacity onPress={handleFitbitConnection}>
              <Text style={styles.connectButton}>
                {!initialCheckDone
                  ? "CHECKING..."
                  : fitbitLoading
                  ? "CONNECTING..."
                  : isConnected
                  ? "DISCONNECT"
                  : "CONNECT"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.analysisContainer}>
          <View style={styles.analysisHeader}>
            <View style={styles.analysisTab}>
              <MaterialIcons name="bar-chart" size={18} color="#CDC8E2" />
              <Text style={styles.analysisTabText}>Analysis</Text>
            </View>
            <TouchableOpacity
              ref={periodSelectorRef}
              style={styles.periodSelector}
              onPress={handleOpenDropdown}
            >
              <Text style={styles.periodText}>{getTimeRangeLabel()}</Text>
              <Ionicons name="chevron-down" size={14} color="#7E72B5" />
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

          <View style={styles.chartContainer}>
            {/* Horizontal grid lines */}
            {yAxisLabels.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.gridLine,
                  { top: (index / (yAxisLabels.length - 1)) * MAX_HEIGHT },
                ]}
              />
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
                timeRange !== "week" &&
                  timeRange !== "today" && { paddingHorizontal: 10 },
              ]}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#5E4FA2" />
                </View>
              ) : filteredData.length === 0 ? (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No data available</Text>
                </View>
              ) : (
                // For month views, filter out the range labels as they're shown separately
                filteredData
                  .filter(
                    (item) =>
                      timeRange === "week" ||
                      timeRange === "today" ||
                      !item.isRangeLabel
                  )
                  .map((item, index) => (
                    <CustomBar
                      key={index}
                      item={item}
                      index={filteredData.findIndex(
                        (d) => d.date === item.date
                      )} // Use original index for reference
                      isSelected={
                        selectedIndex ===
                        filteredData.findIndex((d) => d.date === item.date)
                      }
                      timeRange={timeRange}
                    />
                  ))
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Time Range Dropdown Modal */}
      <Modal
        transparent={true}
        visible={dropdownVisible}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
        >
          <View
            style={[
              styles.dropdownContainer,
              {
                position: "absolute",
                top: dropdownPosition.top,
                right: dropdownPosition.right,
              },
            ]}
          >
            {timeRangeOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.dropdownItem,
                  timeRange === option.id && styles.dropdownItemSelected,
                ]}
                onPress={() => {
                  setTimeRange(option.id);
                  setDropdownVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    timeRange === option.id && styles.dropdownItemTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {timeRange === option.id && (
                  <Ionicons name="checkmark" size={16} color="#5E4FA2" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <StepsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveGoal}
        reload={getStepStatus}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    // paddingh: 16,
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
  stepCountContainer: {
    // marginTop: 20,
    // alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 10,
    marginBottom: 20,
  },
  stepsCircleContainer: {
    alignItems: "center",
    // marginTop: 20,
    marginBottom: 20,
  },
  stepsCircle: {
    width: 180,
    height: 180,
    borderWidth: 4,
    borderColor: "#FFF",
    borderRadius: 100,
    backgroundColor: "#F5F3FF",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0px 0px 4.8px 0px rgba(0, 0, 0, 0.25);",
  },
  stepCountText: {
    fontFamily: "Inter600",
    fontSize: 17,
  },
  progressBarContainer: {
    width: "100%",
    height: 7,
    backgroundColor: "#EFEFEF",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 10,
    marginBottom: 10,
  },
  progressBarBackground: {
    backgroundColor: "#EFEFEF",
  },
  analysisContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
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
  periodSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFEDF6",
    borderWidth: 1,
    borderColor: "#CDC8E2",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    borderRadius: 8,
  },
  periodText: {
    fontSize: 12,
    letterSpacing: 0.28,
    fontFamily: "Inter500",
    color: "#7E72B5",
  },
  barContainer: {
    width: BAR_WIDTH,
    marginRight: SPACING,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
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
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#5E4FA2",
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
    borderTopColor: "#5E4FA2",
    marginTop: -1,
  },
  tooltipTitle: {
    fontSize: 12,
    color: "#434343",
    fontFamily: "Inter500",
  },
  tooltipWeight: {
    fontSize: 22,
    color: "#5E4FA2",
    marginVertical: 2,
    fontFamily: "Inter700",
  },
  tooltipDate: {
    fontSize: 12,
    color: "#434343",
    fontFamily: "Inter500",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 20,
    backgroundColor: "#5E4FA2",
  },
  editButton: {
    marginTop: 10,
  },
  sectionContainer: {
    marginTop: 30,
    marginHorizontal: 16,
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
    color: "#5E4FA2",
    fontSize: 14,
    fontFamily: "Inter600",
    lineHeight: 22,
  },
  // Dropdown styles
  modalOverlay: {
    flex: 1,
    // backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CDC8E2",
    width: 160,
    overflow: "hidden",
    shadowColor: "#000",
    marginTop:-25,
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
    borderBottomColor: "rgba(94, 79, 162, 0.1)",
  },
  dropdownItemSelected: {
    backgroundColor: "#F5F3FF",
  },
  dropdownItemText: {
    color: "#373737",
    fontSize: 14,
    fontFamily: "Inter400",
  },
  dropdownItemTextSelected: {
    color: "#5E4FA2",
    fontFamily: "Inter600",
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
});

export default step;
