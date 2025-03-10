import type React from "react"
import { TouchableOpacity, Text, View, StyleSheet } from "react-native"
import { MaterialIcons } from "@expo/vector-icons"
import dayjs from "dayjs"

interface DateRangeButtonProps {
  onPress: () => void
  startDate: Date | null
  endDate: Date | null
}

const DateRangeButton: React.FC<DateRangeButtonProps> = ({ onPress, startDate, endDate }) => {
  // Format the button text based on selected dates
  const getButtonText = () => {
    if (!startDate) return "Today"

    if (!endDate || dayjs(startDate).isSame(endDate, "day")) {
      return dayjs(startDate).format("DD/MM/YYYY")
    }

    return `${dayjs(startDate).format("DD/MM/YYYY")} - ${dayjs(endDate).format("DD/MM/YYYY")}`
  }

  const hasDateRange = startDate !== null

  return (
    <TouchableOpacity style={[styles.container, hasDateRange && styles.expandedContainer]} onPress={onPress}>
      <Text style={styles.text}>{getButtonText()}</Text>
      <View style={styles.iconContainer}>
        <MaterialIcons name="keyboard-arrow-down" size={13} color="#434343" />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    width: 85,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    borderWidth: 0.6,
    borderColor: "#FCDDF4",
    backgroundColor: "#E6F6F4",
    borderRadius: 8,
    marginBottom:10,
  },
  text: {
    fontSize: 14,
    color: "#434343",
    fontFamily: "Inter500",
  },
  expandedContainer: {
    width: 224,
    paddingHorizontal: 12,
  },
  iconContainer: {
    width: 16,
    height: 16,
    backgroundColor: "#B0E4DD",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
})

export default DateRangeButton

