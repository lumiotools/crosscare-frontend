import type React from "react";
import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";

interface DateRangePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectRange: (startDate: Date | null, endDate: Date | null) => void;
  initialStartDate?: Date;
  initialEndDate?: Date;
}

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const TODAY = dayjs();

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  visible,
  onClose,
  onSelectRange,
  initialStartDate,
  initialEndDate,
}) => {
  const [month, setMonth] = useState(dayjs());
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(
    initialStartDate ? dayjs(initialStartDate) : null
  );
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(
    initialEndDate ? dayjs(initialEndDate) : null
  );

  const generateDates = useCallback(() => {
    const start = month.startOf("month").startOf("week");
    const end = month.endOf("month").endOf("week");
    const dates = [];
    let current = start;

    while (current.isBefore(end)) {
      dates.push(current);
      current = current.add(1, "day");
    }

    return dates;
  }, [month]);

  const dates = useMemo(() => generateDates(), [generateDates]);

  const weeks = useMemo(() => {
    const weeks = [];
    for (let i = 0; i < dates.length; i += 7) {
      weeks.push(dates.slice(i, i + 7));
    }
    return weeks;
  }, [dates]);

  const handleDayPress = (date: dayjs.Dayjs) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
    } else {
      if (date.isBefore(startDate)) {
        setEndDate(startDate);
        setStartDate(date);
      } else {
        setEndDate(date);
      }
    }
  };

  const isSelected = (date: dayjs.Dayjs) => {
    if (!startDate) return false;
    if (!endDate) return startDate.isSame(date, "day");
    return (
      date.isSame(startDate, "day") ||
      date.isSame(endDate, "day") ||
      (date.isAfter(startDate, "day") && date.isBefore(endDate, "day"))
    );
  };

  const isStartDate = (date: dayjs.Dayjs) => {
    return startDate && date.isSame(startDate, "day")
  }

  const isEndDate = (date: dayjs.Dayjs) => {
    return endDate && date.isSame(endDate, "day")
  }

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const handleDone = () => {
    onSelectRange(
      startDate ? startDate.toDate() : null,
      endDate ? endDate.toDate() : null
    );
    onClose();
  };

  const formatDisplayDate = (date: dayjs.Dayjs | null) => {
  return date ? date.format("YYYY-MM-DD") : "";
};


  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Month Navigation */}
          <View style={styles.header}>
            <Text style={styles.monthText}>{month.format("MMMM YYYY")}</Text>
            <View style={styles.navigationButtons}>
              <TouchableOpacity
                onPress={() => setMonth(month.subtract(1, "month"))}
                style={styles.navButton}
              >
                <Ionicons name="chevron-back" size={20} color="#38C472" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMonth(month.add(1, "month"))}
                style={styles.navButton}
              >
                <Ionicons name="chevron-forward" size={20} color="#38C472" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Weekday Headers */}
          <View style={styles.weekDays}>
            {DAYS.map((day) => (
              <Text key={day} style={styles.weekDayText}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.datesContainer}>
            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.week}>
                {week.map((date, dateIndex) => {
                  const isCurrentMonth = date.month() === month.month();
                  const isSelectedDate = isSelected(date);
                  const isStart = isStartDate(date)
                  const isEnd = isEndDate(date)
                  const isToday = date.isSame(TODAY, "day");

                  return (
                    <TouchableOpacity
                      key={dateIndex}
                      onPress={() => handleDayPress(date)}
                      style={[
                        styles.day,
                        isStart && styles.startDay,
                      isEnd && styles.endDay,
                        isSelectedDate && styles.selectedDay,
                        !isCurrentMonth && styles.inactiveDay,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          isSelectedDate && styles.selectedDayText,
                          !isCurrentMonth && styles.inactiveDayText,
                          isToday && styles.todayText,
                        ]}
                      >
                        {date.date()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Date Inputs */}
          <View style={styles.inputsContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Start Date</Text>
              <TextInput
                style={styles.input}
                placeholder="dd-mm-yy"
                value={formatDisplayDate(startDate)}
                editable={false}
              />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>End Date</Text>
              <TextInput
                style={styles.input}
                placeholder="dd-mm-yy"
                value={formatDisplayDate(endDate)}
                editable={false}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDone} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: Dimensions.get("window").width * 0.9,
    maxWidth: 400,
  },
  selectedRange: {
    backgroundColor: "#EBF9F1",
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  selectedRangeText: {
    color: "#38C472",
    textAlign: "center",
    fontFamily: "Inter400",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  monthText: {
    fontSize: 14,
    fontFamily: "Inter600",
    color: "#333",
  },
  navigationButtons: {
    flexDirection: "row",
    gap: 10,
  },
  navButton: {
    padding: 5,
  },
  weekDays: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  weekDayText: {
    width: 40,
    textAlign: "center",
    fontSize: 11,
    color: "#7B7B7B",
    fontFamily: "Inter500",
  },
  datesContainer: {
    marginBottom: 5,
  },
  week: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  day: {
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  startDay: {
    backgroundColor: "#38C472",
    borderWidth: 2,
    borderColor: "#008774",
  },
  endDay: {
    backgroundColor: "#38C472",
    borderWidth: 2,
    borderColor: "#008774",
  },
  selectedDay: {
    backgroundColor: "#EBF9F1",
  },
  dayText: {
    fontSize: 17,
    color: "#333",
    fontFamily: "Inter400",
  },
  selectedDayText: {
    color: "#008774",
    fontFamily: "Inter600",
  },
  inactiveDay: {
    opacity: 0.5,
  },
  inactiveDayText: {
    color: "#CCCCCC",
  },
  todayText: {
    color: "#008774",
    fontFamily: "Inter600",
  },
  inputsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  inputWrapper: {
    flex: 1,
    marginHorizontal: 5,
  },
  inputLabel: {
    fontSize: 12,
    color: "#434343",
    marginBottom: 5,
    fontFamily: "Inter500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    padding: 8,
    fontSize: 12,
    color: "#7B7B7B",
    fontFamily: "Inter400",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems:'center',
    // marginTop: 10,
  },
  resetButton: {
    // padding: 10,
  },
  resetButtonText: {
    color: "#7B7B7B",
    fontSize: 14,
    fontFamily: "Inter400",
  },
  doneButton: {
    // padding: 10,
  },
  doneButtonText: {
    color: "#38C472",
    fontSize: 14,
    fontFamily: "Inter500",
  },
});

export default DateRangePicker;
