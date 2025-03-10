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
} from "react-native";
import {
  Ionicons,
  FontAwesome,
  MaterialCommunityIcons,
  MaterialIcons,
  Feather,
} from "@expo/vector-icons";
import * as Progress from "react-native-progress";
import { BarChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import HeartCard from "@/components/HeartCard";
import { useEffect, useMemo, useRef, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const BAR_WIDTH = 20;
const SPACING = (width - BAR_WIDTH * 10) / 8;
const MAX_HEIGHT = 200;

type CustomBarProps = {
  item: { day: string; bpm: number; date: string };
  index: number;
  isSelected: boolean;
};

export default function HeartRateScreen() {
  // Mock data for the weekly chart
  const [selectedIndex, setSelectedIndex] = useState<number | null>(3); // Default to Wednesday (index 3)
  const [tooltipAnim] = useState(new Animated.Value(0)); // Start with 0 opacity
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sample data for the last 7 days
  const data = [
    { day: "S", bpm: 72, date: "FEB 25, 2025" },
    { day: "M", bpm: 75, date: "FEB 26, 2025" },
    { day: "T", bpm: 78, date: "FEB 27, 2025" },
    { day: "W", bpm: 74, date: "FEB 28, 2025" },
    { day: "T", bpm: 80, date: "FEB 29, 2025" },
    { day: "F", bpm: 82, date: "MAR 1, 2025" },
    { day: "S", bpm: 76, date: "MAR 2, 2025" },
  ];
  

  // Calculate y-axis values using useMemo to prevent recalculation on every render
  const { yAxisLabels, roundedMax, roundedMin } = useMemo(() => {
    const maxWeight = Math.max(...data.map((item) => item.bpm));
    const minWeight = Math.min(...data.map((item) => item.bpm));

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
  }, [data]); // Only recalculate when data changes

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
    const dataRange = roundedMax - roundedMin;
    const normalizedWeight = item.bpm - roundedMin; // Adjust for minimum value
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
              isSelected ? ["#D53E4F", "#D53E4F"] : ["#F2C3C8", "#F2C3C8"]
            }
            style={[styles.bar, { height: "100%" }]}
          />
        </View>

        {isSelected && (
          <View style={styles.tooltip}>
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
              <Text style={styles.tooltipDate}>{item.date}</Text>
            </View>
            <View style={styles.tooltipArrow} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const [heartRate, setHeartRate] = useState(60);

  // Optional: Simulate changing heart rate
  useEffect(() => {
    const interval = setInterval(() => {
      setHeartRate((prevRate) => {
        // Random fluctuation between 55-85
        const newRate = prevRate + (Math.random() + 1); // Random fluctuation
        // Round to the nearest integer and clamp between 90 and 200
        return Math.min(Math.max(parseFloat(newRate.toFixed(1)), 90), 200); // Ensure the rate is an integer
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
        <Text style={styles.headerTitle}>Heart-Rate</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Feather name="more-vertical" size={20} color="#E5E5E5" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Heart Rate Circle */}
        <View style={styles.heartRateContainer}>
          {/* <View style={styles.progressContainer}>
            <Progress.Circle
              size={160}
              progress={heartRateProgress}
              thickness={8}
              color="#FF3B30"
              unfilledColor="rgba(255, 192, 203, 0.5)"
              borderWidth={0}
              strokeCap="round"
              direction="counter-clockwise"
              style={styles.progressCircle}
            />
            <View style={styles.heartRateTextContainer}>
              <Text style={styles.bpmValue}>60</Text>
              <View style={styles.heartIconContainer}>
                <FontAwesome name="heart" size={16} color="#FF3B30" />
              </View>
              <Text style={styles.bpmLabel}>bpm</Text>
            </View>
          </View> */}

          <HeartCard bpm={heartRate} />
        </View>

        {/* Connect to Application */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Connect to Application</Text>
          <View style={styles.connectItem}>
            <Image
              source={require("../../assets/images/applehealth.png")}
              style={{ width: 24, height: 24 }}
            />
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
            <Image
              source={require("../../assets/images/fitbit.png")}
              style={{ width: 24, height: 24 }}
            />
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
              <MaterialIcons name="bar-chart" size={18} color="#F2C3C8" />
              <Text style={styles.analysisTabText}>Analysis</Text>
            </View>
            <TouchableOpacity style={styles.periodSelector}>
              <Text style={styles.periodText}>Last 7 Days</Text>
              <Ionicons name="chevron-down" size={14} color="#D53E4F" />
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
              {data.map((item, index) => (
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
      </ScrollView>
    </SafeAreaView>
  );
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
    color: "#333",
    letterSpacing: 0.28,
    fontFamily: "Inter400",
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
    fontSize: 16,
    color: "#67B6FF",
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
});
