import { useEffect, useMemo, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  TextInput,
  ActivityIndicator,
} from "react-native";
import {
  Ionicons,
  Feather,
  FontAwesome5,
  MaterialIcons,
} from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { BarChart } from "react-native-chart-kit";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Modal } from "react-native";
import GlassIcon from "@/assets/images/Svg/GlassIcon";
import WaterWaveAnimation from "@/components/waterwaveanimation";
import { useWaterStore } from "@/zustandStore/waterStore";
import { useSelector } from "react-redux";
import axios from "axios";

const MAX_HEIGHT = 200;
const BAR_WIDTH = 20;
const SPACING = (Dimensions.get("window").width - BAR_WIDTH * 10) / 8;

interface DataItem {
  id: string;
  day: string;
  waterMl: number;
  waterL: number;
  date: string;
  goalMl: number;
  isRangeLabel?: boolean;
  rangeLabel?: string;
}

interface CustomBarProps {
  item: DataItem;
  index: number;
  isSelected: boolean;
}

export default function water() {
  const { glassCount, setGlassCount, maxGlasses, setMaxGlasses } = useWaterStore();
  const user = useSelector((state:any)=>state.user);
  const [goalSet, setGoalSet] = useState(false);
  const [tooltipAnim] = useState(new Animated.Value(0));
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newGoal, setNewGoal] = useState("");
  
  // State variables for water data
  const [waterData, setWaterData] = useState<DataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("week"); // "week", "month", "lastMonth"

  // Calculate water percentage for the animation
  const waterPercentage = maxGlasses > 0 ? (glassCount / maxGlasses) * 100 : 0;

  // Modify the generateAllDays function to use the correct date format
  const generateAllDays = (timeRange: string): DataItem[] => {
    const today = new Date();
    const days = [];
    let startDate: Date;
    let endDate: Date;
    
    if (timeRange === "week") {
      // Weekly view - show each day
      startDate = new Date(today);
      const dayOfWeek = startDate.getDay();
      startDate.setDate(startDate.getDate() - dayOfWeek);
      
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      
      // For debugging
      console.log("Week view date range:", startDate.toISOString().split('T')[0], "to", endDate.toISOString().split('T')[0]);
      
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split('T')[0];
        days.push({
          id: `empty-${dateString}`,
          date: dateString,
          day: currentDate.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
          waterMl: 0,
          waterL: 0,
          goalMl: 0
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
        { label: "30", start: 30, end: 31 }
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
          const labelDateString = labelDate.toISOString().split('T')[0];
          
          days.push({
            id: `label-${labelDateString}`,
            date: labelDateString,
            day: range.label,
            waterMl: 0,
            waterL: 0,
            goalMl: 0,
            isRangeLabel: true // Mark this as a label for the range
          });
          
          // Add individual days in the range
          for (let day = range.start; day <= Math.min(range.end, lastDay); day++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(day);
            const dateString = currentDate.toISOString().split('T')[0];
            
            days.push({
              id: `day-${dateString}`,
              date: dateString,
              day: "", // Empty string for non-label days
              waterMl: 0,
              waterL: 0,
              goalMl: 0,
              rangeLabel: range.label // Reference to which label this belongs to
            });
          }
        }
      }
    }
    
    return days;
  };

  // Add a function to format dates consistently
  const formatDate = (dateString: string): string => {
    // Ensure date is in YYYY-MM-DD format
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (e) {
      console.error("Invalid date format:", dateString);
      return dateString;
    }
  };

  // Add this function to check if it's a new day
  const isNewDay = () => {
    // Get the last accessed date from the store or local storage
    const lastAccessedDate = useWaterStore.getState().lastAccessedDate;
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    // If there's no last accessed date or it's different from today, it's a new day
    return !lastAccessedDate || lastAccessedDate !== today;
  };

  // Modify the fetchWaterData function to better handle updates from AI
  const fetchWaterData = async () => {
    setIsLoading(true);
    try {
      // Check if it's a new day
      if (isNewDay()) {
        // Reset glass count to 0 for the new day
        setGlassCount(0);
        
        // Update the last accessed date in the store
        useWaterStore.getState().setLastAccessedDate(new Date().toISOString().split('T')[0]);
        
        console.log("New day detected - resetting glass count to 0");
      }
      
      const response = await fetch(
        `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/waterstatus`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch water data');
      }
      
      const data = await response.json();
      console.log("Refreshed water data:", data);
      
      // Process the data - ensure all fields are properly formatted
      const processedData = data.waterData.map((item: any) => {
        const formattedDate = formatDate(item.date);
        
        // Check if the value is small (likely glasses) or large (likely milliliters)
        const isGlassCount = item.waterMl !== null && item.waterMl < 100;
        
        // Convert to milliliters if it's a glass count
        const waterMl = isGlassCount ? item.waterMl * 250 : item.waterMl;
        
        return {
          ...item,
          date: formattedDate,
          waterMl: waterMl || 0,
          waterL: waterMl / 1000 || 0,
          goalMl: item.goalMl !== null ? Number(item.goalMl) * 250 : 0, // Assuming goalMl is also in glasses
          day: item.day || new Date(formattedDate).toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)
        };
      });
      
      console.log("Processed data:", processedData);
      setWaterData(processedData);
      
      // Find today's data
      const today = new Date().toISOString().split('T')[0];
      const todayData = processedData.find((item: any) => item.date === today);
      
      if (todayData) {
        // IMPORTANT CHANGE: Always update glassCount from API
        // This ensures synchronization between API and UI
        if (todayData.waterMl > 0) {
          const newGlassCount = Math.round(todayData.waterMl / 250);
          console.log(`Updating glass count from API: ${newGlassCount} glasses`);
          setGlassCount(newGlassCount);
        }
        
        // Only set maxGlasses if it's not already set
        if (maxGlasses === 0 && todayData.goalMl > 0) {
          setMaxGlasses(Math.round(todayData.goalMl / 250)); // Convert ml to glasses
          setGoalSet(true);
        }
      } else {
        // If there's no data for today but we have data for other days,
        // use the goal from the most recent day
        const sortedData = [...processedData].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        if (sortedData.length > 0) {
          // If no current goal is set but we have historical data with goals
          if (maxGlasses === 0 && sortedData[0].goalMl > 0) {
            setMaxGlasses(Math.round(sortedData[0].goalMl / 250));
            setGoalSet(true);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching water data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a dedicated function to sync water intake from external sources (like AI)
  const syncWaterIntakeFromApi = async () => {
    try {
      console.log("Syncing water intake from API...");
      
      // First make the API call to get the latest data
      const response = await fetch(
        `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/waterstatus`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch water data for sync');
      }
      
      const data = await response.json();
      console.log(data);
      
      // Find today's data
      const today = new Date().toISOString().split('T')[0];
      const todayData = data.waterData.find((item: any) => formatDate(item.date) === today);
      
      if (todayData) {
        // Check if today's API data is different from local state
        const apiGlassCount = Math.round((todayData.waterMl < 100 ? todayData.waterMl * 250 : todayData.waterMl) / 250);
        
        if (apiGlassCount !== glassCount) {
          console.log(`Syncing water intake: API shows ${apiGlassCount} glasses, local shows ${glassCount} glasses`);
          
          // Update local state with API value
          setGlassCount(apiGlassCount);
          
          // Update water data state with new value
          setWaterData(prevData => {
            return prevData.map(item => {
              if (formatDate(item.date) === today) {
                const waterMl = apiGlassCount * 250;
                return {
                  ...item,
                  waterMl: waterMl,
                  waterL: waterMl / 1000
                };
              }
              return item;
            });
          });
        }
      }
    } catch (error) {
      console.error("Error syncing water intake from API:", error);
    }
  };

  // Modify initial useEffect to also poll for updates and sync with external changes
  useEffect(() => {
    fetchWaterData();
    
    // Set up a polling interval to check for updates from external sources (like AI)
    const syncInterval = setInterval(() => {
      syncWaterIntakeFromApi();
    }, 20000); // Check every 20 seconds
    
    return () => clearInterval(syncInterval);
  }, [user.user_id, setGlassCount, setMaxGlasses]);

  // Modify the postWaterIntake function to handle both local updates and external updates
  const postWaterIntake = async (newGlassCount = glassCount) => {
    try {
      // Update local water data for today first for immediate UI feedback
      setWaterData(prevData => {
        const today = new Date().toISOString().split('T')[0];
        return prevData.map(item => {
          if (item.date === today) {
            return {
              ...item,
              waterMl: newGlassCount * 250,
              waterL: (newGlassCount * 250) / 1000
            };
          }
          return item;
        });
      });
      
      // Then update the API - send the glass count directly as that's what the backend expects
      const response = await fetch(`https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/water`,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          water: newGlassCount // Send the number of glasses, not milliliters
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Water intake update response:", data);
      
      // After successful API update, refresh water data to ensure everything is in sync
      // Add a small delay to allow the database to update
      setTimeout(() => {
        fetchWaterData();
      }, 500);
      
    } catch (error) {
      console.error("Error updating water intake:", error);
    }
  };

  // Update the glassCount useEffect to use the modified postWaterIntake function
  useEffect(() => {
    // Skip the initial render when glassCount is 0
    if (glassCount === 0) return;
    
    postWaterIntake();
  }, [glassCount, user.user_id]);

  // Modify the getFilteredData function to better handle date matching
  const getFilteredData = useMemo(() => {
    const allDays = generateAllDays(timeRange);
    
    if (isLoading || waterData.length === 0) {
      return allDays;
    }
    
    // Create a map of existing data by date
    const dataMap = new Map();
    
    // Process and add each water data item to the map
    waterData.forEach(item => {
      const formattedDate = formatDate(item.date);
      
      // For dates with multiple entries, use the one with the highest water value
      const existingItem = dataMap.get(formattedDate);
      if (!existingItem || (item.waterMl && item.waterMl > existingItem.waterMl)) {
        dataMap.set(formattedDate, {
          ...item,
          date: formattedDate, // Ensure consistent date format
          waterMl: item.waterMl !== null ? Number(item.waterMl) : 0,
          waterL: item.waterMl !== null ? Number(item.waterMl) / 1000 : 0
        });
      }
    });
    
    // For debugging
    console.log("Data map dates:", Array.from(dataMap.keys()));
    console.log("All days dates:", allDays.map(day => day.date));
    
    // Merge existing data with all days
    const mergedData = allDays.map(day => {
      const existingData = dataMap.get(day.date);
      if (existingData) {
        console.log("Found data for day:", day.date, "with water:", existingData.waterMl);
        return {
          ...existingData,
          day: day.day,
          isRangeLabel: day.isRangeLabel,
          rangeLabel: day.rangeLabel
        };
      }
      return day;
    });
    
    return mergedData;
  }, [waterData, timeRange, isLoading]);

  // Modify the y-axis calculation to have a more appropriate range
  const { yAxisLabels, roundedMax, roundedMin } = useMemo(() => {
    const dataToUse = getFilteredData;
    
    // Find the maximum water intake in liters
    const maxWater = Math.max(...dataToUse.map((item) => item.waterL || 0));
    
    // Set a minimum max value of 3L for better visualization
    const effectiveMax = Math.max(maxWater, 3);
    
    // Round up to the nearest 0.5L
    const roundedMax = Math.ceil(effectiveMax * 2) / 2;
    const roundedMin = 0; // Start from 0L
    
    // Create y-axis labels with appropriate steps
    const step = roundedMax > 3 ? 1 : 0.5; // Use 0.5L steps for smaller ranges, 1L for larger
    
    const labels = [];
    for (let value = 0; value <= roundedMax; value += step) {
      labels.push(Number(value.toFixed(1)));
    }
    
    // Make sure max value is included
    if (labels[labels.length - 1] < roundedMax) {
      labels.push(Number(roundedMax.toFixed(1)));
    }
    
    return {
      yAxisLabels: labels.reverse(), // Reverse for top-to-bottom display
      roundedMax,
      roundedMin,
    };
  }, [getFilteredData]);

  // Function to open the goal setting modal
  const openGoalModal = () => {
    setNewGoal(maxGlasses.toString());
    setModalVisible(true);
  };

  // Function to save the new goal and close the modal
  const saveGoal = async () => {
    const parsedGoal = Number.parseFloat(newGoal);
    
    if (!isNaN(parsedGoal) && parsedGoal > 0) {
      try {
        console.log(`🚀 Saving water goal: ${parsedGoal} glasses`);
        
        // Update the store first for immediate UI feedback
        setMaxGlasses(parsedGoal);
        setGoalSet(true);
        setModalVisible(false);
        
        // Update local water data with new goal
        setWaterData(prevData => {
          return prevData.map(item => ({
            ...item,
            goalMl: parsedGoal * 250 // Convert glasses to ml
          }));
        });
        
        // API Call to Save Water Goal
        const response = await axios.post(
          `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/waterGoal`, 
          { waterGoal: parsedGoal },
          { headers: { "Content-Type": "application/json" } }
        );
        
        console.log("✅ API Response:", response.data);
        
        if (!response.data) {
          console.error("❌ Failed to save water goal. Response:", response.data);
          // If API fails, we could revert the changes, but since the store is persisted,
          // we'll keep the user's input to avoid confusion
        }
      } catch (error: any) {
        console.error("❌ API Error:", error.response ? error.response.data : error.message);
        // Even if API fails, keep the user's input in the store
      }
    } else {
      console.error("❌ Invalid input. Please enter a valid number greater than zero.");
    }
  };

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
    if (selectedIndex === index) {
      return; // Already selected
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

    Animated.timing(tooltipAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

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

  // Update the CustomBar component to handle date ranges with multiple bars
  const CustomBar = ({ item, index, isSelected }: CustomBarProps) => {
    // Check if this is a month view
    const isMonthView = timeRange !== "week";
    
    // Skip rendering for range labels in month view - they're just for organization
    if (isMonthView && item.isRangeLabel) {
      return (
        <View style={styles.dateRangeContainer}>
          <Text style={styles.dateRangeLabel}>{item.day}</Text>
        </View>
      );
    }
    
    // For regular bars (weekly view) or individual day bars (monthly view)
    const dataRange = roundedMax - roundedMin;
    const normalizedWeight = item.waterL - roundedMin;
    
    const calculatedHeight = (normalizedWeight / dataRange) * MAX_HEIGHT;
    const barHeight = item.waterL > 0 ? Math.max(calculatedHeight, 2) : 2;
    
    // Use thinner bars for month views
    const barWidth = isMonthView ? 4 : BAR_WIDTH;
    
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleBarPress(index)}
        style={[
          styles.barContainer,
          isMonthView && { 
            width: barWidth, 
            marginRight: 2, // Tighter spacing for clustered bars
            marginLeft: item.rangeLabel && index > 0 && 
                       getFilteredData[index-1].rangeLabel !== item.rangeLabel ? 10 : 0 // Add space between ranges
          }
        ]}
      >
        {!isMonthView && (
          <View style={styles.barLabelContainer}>
            <Text style={styles.barLabel}>{item.day}</Text>
          </View>
        )}

        <View style={[
          styles.barWrapper, 
          { height: barHeight },
          isMonthView && { width: barWidth }
        ]}>
          <LinearGradient
            colors={
              isSelected ? ["#67B6FF", "#67B6FF"] : ["#B9DDFF", "#B9DDFF"]
            }
            style={[
              styles.bar, 
              { height: "100%" },
              isMonthView && { borderTopLeftRadius: 2, borderTopRightRadius: 2 }
            ]}
          />
        </View>

        {isSelected && (
          <View style={styles.tooltip}>
            <View style={styles.tooltipContent}>
              <Text style={styles.tooltipTitle}>WATER</Text>
              <Text style={styles.tooltipWeight}>
                {item.waterL.toFixed(2)}{" "}
                <Text style={{ fontSize: 16, color: "#67B6FF" }}>L</Text>
              </Text>
              <Text style={styles.tooltipDate}>{item.date}</Text>
            </View>
            <View style={styles.tooltipArrow} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Water</Text>
        <TouchableOpacity style={styles.menuButton} onPress={()=>router.push('/patient/unitscreen')}>
          <Feather name="more-vertical" size={20} color="#E5E5E5" />
        </TouchableOpacity>
      </View>

      {/* Water Icon */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            {/* Water wave animation */}
            <WaterWaveAnimation percentage={waterPercentage} />

            {/* Glass icon overlay */}
            <View style={styles.glassIconOverlay}>
              <GlassIcon />
            </View>
          </View>
        </View>

        {/* Glass Info */}
        <Text style={styles.glassInfo}>
          {glassCount} Glass is{" "}
          {glassCount * 250 >= 1000
            ? ((glassCount * 250) / 1000).toFixed(2) + "L"
            : glassCount * 250 + "ml"}
        </Text>

        {/* Slider */}
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={maxGlasses}
            step={1}
            value={Number(glassCount)}
            onValueChange={(value) => setGlassCount(Number(value))}
            minimumTrackTintColor="#4dabff"
            maximumTrackTintColor="#e0e0e0"
            thumbTintColor="#4dabff"
          />
          <View style={styles.sliderLabelContainer}>
            <Text style={styles.sliderLabel}>
              {glassCount}
              <Text
                style={{
                  fontSize: 14,
                  fontFamily: "Inter400",
                  color: "#777",
                  lineHeight: 22,
                }}
              >
                {" "}
                {glassCount ? ` of ${maxGlasses} Glasses` : " Glasses"}
              </Text>
            </Text>
            <TouchableOpacity onPress={openGoalModal}>
              <FontAwesome5 name="pen" size={15} color="#777" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Analysis Section */}
        <View style={styles.analysisContainer}>
          <View style={styles.analysisHeader}>
            <View style={styles.analysisTab}>
              <MaterialIcons name="bar-chart" size={18} color="#99CEFF" />
              <Text style={styles.analysisTabText}>Analysis</Text>
            </View>
            <TouchableOpacity 
              style={styles.periodSelector}
              onPress={() => {
                // Toggle between week, month, and last month
                if (timeRange === "week") setTimeRange("month");
                else if (timeRange === "month") setTimeRange("lastMonth");
                else setTimeRange("week");
              }}
            >
              <Text style={styles.periodText}>
                {timeRange === "week" ? "Last 7 Days" : 
                 timeRange === "month" ? "This Month" : "Last Month"}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#4dabff" />
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
              <View
                key={index}
                style={[
                  styles.gridLine,
                  { top: (index / (yAxisLabels.length - 1)) * MAX_HEIGHT },
                ]}
              />
            ))}

            {/* For month views, render date labels at the bottom */}
            {timeRange !== "week" && (
              <View style={styles.dateLabelsContainer}>
                {getFilteredData
                  .filter(item => item.isRangeLabel)
                  .map((item, index) => (
                    <Text key={index} style={styles.monthDateLabel}>
                      {item.day}
                    </Text>
                  ))}
              </View>
            )}

            {/* Bars */}
            <View style={[
              styles.barsContainer,
              timeRange !== "week" && { paddingHorizontal: 10 }
            ]}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#67B6FF" />
                </View>
              ) : getFilteredData.length === 0 ? (
                <View style={styles.noDataContainer}>
                  <Text style={styles.noDataText}>No data available</Text>
                </View>
              ) : (
                // For month views, filter out the range labels as they're shown separately
                getFilteredData
                  .filter(item => timeRange === "week" || !item.isRangeLabel)
                  .map((item, index) => (
                    <CustomBar
                      key={index}
                      item={item}
                      index={getFilteredData.findIndex(d => d.date === item.date)} // Use original index for reference
                      isSelected={selectedIndex === getFilteredData.findIndex(d => d.date === item.date)}
                    />
                  ))
              )}
            </View>
          </View>
        </View>

        {/* Bottom Message */}
        <View style={styles.bottomContainer}>
          <View style={styles.messageContainer}>
            <Text style={styles.messageTitle}>Make Every Drop Count!</Text>
            <Text style={styles.messageSubtitle}>
              Set a reminder and stay on track.
            </Text>
          </View>
          <TouchableOpacity style={styles.reminderButton} onPress={() => {
            router.push({
              pathname: '/patient/settings/reminder',
              params: { type: 'water' }
            });
          }}>
            <Ionicons name="alarm" size={16} color="white" />
            <Text style={styles.reminderButtonText}>Set Reminder</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set New Goal</Text>
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={newGoal}
                onChangeText={setNewGoal}
                keyboardType="numeric"
                placeholder="-- Glass"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={saveGoal}>
                <Text style={styles.saveButtonText}>Save & Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: MAX_HEIGHT,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: MAX_HEIGHT,
  },
  noDataText: {
    color: '#999',
    fontFamily: 'Inter400',
    fontSize: 14,
  },
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
  customChartContainer: {
    flexDirection: "row",
    marginTop: 10,
    height: MAX_HEIGHT + 40, // Add extra height for labels
    marginRight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter600",
    color: "#67B6FF",
  },
  inputContainer: {
    width: "60%",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    // padding: 10,
    paddingHorizontal: 32,
    paddingVertical: 12,

    fontSize: 14,
    textAlign: "center",
    fontFamily: "Inter500",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    color: "#7B7B7B",
    fontSize: 14,
    fontFamily: "Inter400",
  },
  saveButton: {
    backgroundColor: "#67B6FF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderColor: "#85C5FF",
    borderWidth: 2,
    borderRadius: 32,
    boxShadow:
      "0px 0px 4px 0px rgba(0, 0, 0, 0.25) inset, 0px 0px 2.6px 0px rgba(0, 0, 0, 0.32);",
  },
  saveButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Inter600",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "DMSans600",
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
  tooltip: {
    position: "absolute",
    top: -60, // Positioned above the bar
    alignItems: "center",
    width: 120,
    zIndex: 10, // Ensure tooltip is above other elements
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#99CEFF",
    marginTop: -1,
  },
  tooltipTitle: {
    fontSize: 12,
    color: "#434343",
    fontFamily: "Inter500",
  },
  tooltipWeight: {
    fontSize: 22,
    color: "#67B6FF",
    marginVertical: 2,
    fontFamily: "Inter700",
  },
  tooltipDate: {
    fontSize: 12,
    color: "#434343",
    fontFamily: "Inter500",
  },
  tooltipContent: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#99CEFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  menuButton: {
    padding: 8,
  },
  iconContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  glassIconOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  iconBackground: {
    width: 180,
    height: 180,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: "white",
    backgroundColor:'rgba(103, 182, 255, 0.32);',
    boxShadow: "0px 0px 4.8px 0px rgba(0, 0, 0, 0.25);",
    justifyContent: "center",
    alignItems: "center",
  },
  glassIcon: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  glass: {
    width: 40,
    height: 50,
    borderWidth: 2,
    borderColor: "white",
    borderRadius: 4,
    overflow: "hidden",
  },
  waterLevel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  glassInfo: {
    textAlign: "center",
    marginTop: 16,
    fontFamily: "Inter500",
    fontSize: 14,
    color: "#333",
  },
  sliderContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 0,
    marginHorizontal: 16,
  },
  sliderLabel: {
    fontSize: 20,
    color: "#333",
    fontFamily: "Inter600",
    lineHeight: 22,
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
    color: "#333",
    letterSpacing: 0.28,
    fontFamily: "Inter400",
  },
  periodSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F8FF",
    borderWidth: 1,
    borderColor: "#D0E8FF",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    borderRadius: 8,
  },
  periodText: {
    fontSize: 12,
    letterSpacing: 0.28,
    fontFamily: "Inter500",
    color: "#4dabff",
  },

  chart: {
    marginVertical: 8,
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
    color: "#4981B5",
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
    backgroundColor: "#67B6FF",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#85C5FF",
    paddingVertical: 10,
    boxShadow: "0px 0px 4px 0px rgba(0, 0, 0, 0.10);",
    borderRadius: 20,
  },
  reminderButtonText: {
    color: "#FEF8FD",
    marginLeft: 8,
    fontSize: 12,
    fontFamily: "Inter500",
  },
  thinBar: {
    width: 4,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  dateRangeContainer: {
    alignItems: 'center',
    width: 20,
    height: '100%',
  },
  dateRangeLabel: {
    position: 'absolute',
    bottom: -25,
    fontSize: 12,
    color: '#888888',
    fontFamily: 'Inter500',
  },
  dateLabelsContainer: {
    position: 'absolute',
    bottom: -25,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  monthDateLabel: {
    fontSize: 12,
    color: '#888888',
    fontFamily: 'Inter500',
  },
});