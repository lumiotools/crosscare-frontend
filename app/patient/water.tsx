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

const MAX_HEIGHT = 200;
const BAR_WIDTH = 20;
const SPACING = (Dimensions.get("window").width - BAR_WIDTH * 10) / 8;
interface DataItem {
  day: string;
  waterMl: number;
  waterL: number;
  date: string;
}

interface CustomBarProps {
  item: DataItem;
  index: number;
  isSelected: boolean;
}
export default function water() {
  const [glassCount, setGlassCount] = useState(0);
  const [maxGlasses, setMaxGlasses] = useState(10);
  const [goalSet, setGoalSet] = useState(false);
  const [tooltipAnim] = useState(new Animated.Value(0)); // Start with 0 opacity
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newGoal, setNewGoal] = useState("");

   // Calculate water percentage for the animation
   const waterPercentage = maxGlasses > 0 ? (glassCount / maxGlasses) * 100 : 0

  // Function to open the goal setting modal
  const openGoalModal = () => {
    setNewGoal(maxGlasses.toString());
    setModalVisible(true);
  };

  // Function to save the new goal and close the modal
  const saveGoal = () => {
    const parsedGoal = Number.parseInt(newGoal);
    if (!isNaN(parsedGoal) && parsedGoal > 0) {
      // Update the maximum glasses
      setMaxGlasses(parsedGoal);
      setGoalSet(true);
      setModalVisible(false);
    }
  };

  // Sample data for the last 7 days
  const data = [
    { day: "S", waterMl: 2200, waterL: 2.2, date: "FEB 25, 2025" },
    { day: "M", waterMl: 2300, waterL: 2.3, date: "FEB 26, 2025" },
    { day: "T", waterMl: 2500, waterL: 2.5, date: "FEB 27, 2025" },
    { day: "W", waterMl: 2400, waterL: 2.4, date: "FEB 28, 2025" },
    { day: "T", waterMl: 2600, waterL: 2.6, date: "FEB 29, 2025" },
    { day: "F", waterMl: 2700, waterL: 2.7, date: "MAR 1, 2025" },
    { day: "S", waterMl: 2200, waterL: 2.2, date: "MAR 2, 2025" },
  ];

  // Calculate y-axis values using useMemo to prevent recalculation on every render
  const { yAxisLabels, roundedMax, roundedMin } = useMemo(() => {
    const maxWeight = Math.max(...data.map((item) => item.waterL));
    const minWeight = Math.min(...data.map((item) => item.waterL));

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
    const normalizedWeight = item.waterL - roundedMin; // Adjust for minimum value
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
              isSelected ? ["#67B6FF", "#67B6FF"] : ["#B9DDFF", "#B9DDFF"]
            }
            style={[styles.bar, { height: "100%" }]}
          />
        </View>

        {isSelected && (
          <View style={styles.tooltip}>
            <View style={styles.tooltipContent}>
              <Text style={styles.tooltipTitle}>WATER</Text>
              <Text style={styles.tooltipWeight}>
                {item.waterL}{" "}
                <Text
                  style={{
                    fontSize: 16,
                    color: "#67B6FF",
                  }}
                >
                  L
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
            value={glassCount}
            onValueChange={setGlassCount}
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
                {goalSet ? ` of ${maxGlasses} Glasses` : " Glasses"}
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
            <TouchableOpacity style={styles.periodSelector}>
              <Text style={styles.periodText}>Last 7 Days</Text>
              <Ionicons name="chevron-down" size={14} color="#4dabff" />
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

        {/* Bottom Message */}
        <View style={styles.bottomContainer}>
          <View style={styles.messageContainer}>
            <Text style={styles.messageTitle}>Make Every Drop Count!</Text>
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
});
