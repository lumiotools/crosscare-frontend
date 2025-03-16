import { useState, useEffect, useMemo, useRef } from "react";
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
} from "react-native";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import WeightIcon from "@/assets/images/Svg/WeightIcon";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import WeightModal from "./modal/weightmodal";
import { useSelector } from "react-redux";

const { width } = Dimensions.get("window");
const BAR_WIDTH = 20;
const SPACING = (width - BAR_WIDTH * 10) / 8;
const MAX_HEIGHT = 200;

// Handle bar press
interface DataItem {
  day: string;
  weight: number;
  date: string;
}

interface CustomBarProps {
  item: DataItem;
  index: number;
  isSelected: boolean;
}

const WeightScreen = () => {
  const [timeframe, setTimeframe] = useState("Last 7 Days");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null); // Default to Wednesday (index 3)
  const [tooltipAnim] = useState(new Animated.Value(0)); // Start with 0 opacity
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const user = useSelector((state:any)=>state.user);
  const [weightData, setWeightData] = useState<DataItem[]>([]);


  // Sample data for the last 7 days
  const generatePastWeekDates = () => {
    const today = new Date();
    const pastWeek = [];
    
    // Generate dates for the past 7 days (including today)
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      // Format the date as "MMM DD, YYYY"
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).toUpperCase();
      
      // Get day abbreviation (S, M, T, W, T, F, S)
      const dayAbbr = date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
      
      pastWeek.push({
        day: dayAbbr,
        weight: 0,
        date: formattedDate
      });
    }
    console.log(pastWeek);
    return pastWeek;
  };
  
  // Replace your DUMMY constant with this function
  const DUMMY = generatePastWeekDates();

  const getWeightStatus = async () => {
    try {
      const response = await fetch(`http://192.168.1.102:8000/api/user/activity/${user.user_id}/weightStatus`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      console.log(data);
      
      if (data.data) {
        setCurrentWeight(data.data.lastWeight);
        
        if (data.data.weightData && data.data.weightData.length > 0) {
          // Set the weight data directly from the API response
          setWeightData(data.data.weightData);
          
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
          
          // Create a map to store unique weight data for each day
          const weightMap = new Map();
          
          data.data.weightData.forEach((entry: { date: string | number | Date; weight: any; }) => {
            const date = new Date(entry.date);
            const fullDay = date.toLocaleString("en-US", { weekday: "long" });
            const dayIndex = fullWeekdays.indexOf(fullDay);
            
            if (dayIndex === -1) return; // Skip invalid dates
            
            const dayLetter = fixedWeekdays[dayIndex];
            
            // Store data uniquely per day
            weightMap.set(dayIndex, {
              day: dayLetter,
              weight: entry.weight,
              date: entry.date,
            });
          });
          
          // Ensure all weekdays exist, filling missing ones with default weight
          const processedData = fixedWeekdays.map((day, index) => {
            return weightMap.get(index) || { day, weight: 0, date: "" };
          });
          
          // Update the weight data with the processed data
          setWeightData(processedData);
        } else {
          // Use default days with zero weight
          setWeightData(DUMMY);
        }
      } else {
        // Handle case where data.data is undefined
        setWeightData(DUMMY);
      }
    } catch (error) {
      console.error("Error fetching weight status:", error);
      setWeightData(DUMMY);
    }
  };

  useEffect(()=>{
    getWeightStatus();
  },[])

  // Calculate y-axis values using useMemo to prevent recalculation on every render
  const { yAxisLabels, roundedMax, roundedMin } = useMemo(() => {

    if(!weightData.length){
      return {yAxisLabels: [], roundedMax: 100, roundedMin: 50};
    }
    const maxWeight = Math.max(...weightData.map((item) => item.weight));
    const minWeight = Math.min(...weightData.map((item) => item.weight));

    // Calculate rounded max for y-axis (round up to nearest 5)
    const roundedMax = Math.ceil(maxWeight / 5) * 5;
    // Calculate rounded min for y-axis (round down to nearest 5)
    const roundedMin = Math.floor(minWeight / 5) * 5;

    // Create appropriate y-axis labels based on data range
    const range = roundedMax - roundedMin;
    const step = Math.ceil(range / 4); // We want about 4 labels

    const labels = [];
    for (let i = 0; i <= 4; i++) {
      const value = roundedMin + step * i;
      if (value <= roundedMax) {
        labels.push(value);
      }
    }

    // Make sure max value is included
    if (labels[labels.length - 1] < roundedMax) {
      labels.push(roundedMax);
    }

    return {
      yAxisLabels: labels.reverse(), // Reverse for top-to-bottom display
      roundedMax,
      roundedMin,
    };
  }, [weightData]); // Only recalculate when data changes

  const handleSaveWeight = (weightValue: string) => {
    const parsedWeight = Number.parseFloat(weightValue)
    if (!isNaN(parsedWeight) && parsedWeight > 0) {
      setCurrentWeight(parsedWeight)
      setModalVisible(false)

      // Here you would typically also update your data array
      // with the new weight entry for today's date
    }
  }

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

  const CustomBar = ({ item, index, isSelected }: CustomBarProps) => {
    // Calculate bar height based on data range
    const getDayAbbreviation = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { weekday: "short" }).charAt(0); // Get first letter
    };
  
    const dayAbbreviation = getDayAbbreviation(item.date);
    const dataRange = roundedMax - roundedMin;
    const normalizedWeight = item.weight - roundedMin; // Adjust for minimum value
    const barHeight = (normalizedWeight / dataRange) * MAX_HEIGHT;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handleBarPress(index)}
        style={styles.barContainer}
      >
        <View style={styles.barLabelContainer}>
          <Text style={styles.barLabel}>{item.day}</Text>
        </View>

        <View style={[styles.barWrapper, { height: barHeight }]}>
          <LinearGradient
            colors={
              isSelected ? ["#FFA44C", "#FFA44C"] : ["#FFD5AD", "#FFD5AD"]
            }
            style={[styles.bar, { height: "100%" }]}
          />
        </View>

        {isSelected && (
          <View style={styles.tooltip}>
            <View style={styles.tooltipContent}>
              <Text style={styles.tooltipTitle}>WEIGHT</Text>
              <Text style={styles.tooltipWeight}>
                {item.weight} <Text style={{
                  fontSize: 16,
                  color: "#FFA44C",
                }}>KG</Text>
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
          <Ionicons name="chevron-back" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Weight</Text>
        <TouchableOpacity onPress={()=>router.push('/patient/weightunit')}>
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

            <TouchableOpacity style={styles.periodSelector}>
              <Text style={styles.periodText}>{timeframe}</Text>
              <Ionicons name="chevron-down" size={14} color="#F9A826" />
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
              <View
                key={index}
                style={[
                  styles.gridLine,
                  { top: (index / (yAxisLabels.length - 1)) * MAX_HEIGHT },
                ]}
              />
            ))}

            {/* Bars */}
            <View style={styles.barsContainer}>
              {weightData.map((item, index) => (
                <CustomBar
                  key={index}
                  item={item}
                  index={index}
                  isSelected={selectedIndex === index}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomContainer}>
          <View style={styles.messageContainer}>
            <Text style={styles.messageTitle}>Track Your Weight Progress</Text>
            <Text style={styles.messageSubtitle}>
              Set a reminder and stay on track.
            </Text>
          </View>
          <TouchableOpacity style={styles.reminderButton}>
            <Ionicons name="alarm" size={16} color="white" />
            <Text style={styles.reminderButtonText}>Set Reminder</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <WeightModal visible={modalVisible} onClose={() => setModalVisible(false)} onSave={handleSaveWeight} reload={getWeightStatus} />
    </SafeAreaView>
  );
};

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
    boxShadow:'0px 0px 4.8px 0px rgba(0, 0, 0, 0.25);',
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
});

export default WeightScreen;
