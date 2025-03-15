// SleepLogModal.tsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSelector } from "react-redux";

interface SleepLogModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (date: Date, sleepTime: Date, wakeTime: Date) => void;
  reload: () =>void;
}

const SleepLogModal: React.FC<SleepLogModalProps> = ({
  isVisible,
  onClose,
  onSave,
  reload,
}) => {
  const [date, setDate] = useState(new Date());
  const [sleepTime, setSleepTime] = useState(
    new Date(new Date().setHours(23, 0, 0, 0))
  );
  const [wakeTime, setWakeTime] = useState(
    new Date(new Date().setHours(9, 0, 0, 0))
  );

  const user = useSelector((state: any) => state.user);
  const [showSleepPicker, setShowSleepPicker] = useState(false);
  const [showWakePicker, setShowWakePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isVisible) {
      // Keep the current values when reopening
    }
  }, [isVisible]);

  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0"); // Ensure 2-digit minutes
    const ampm = hours >= 12 ? "PM" : "AM";
  
    hours = hours % 12 || 12; // Convert 24-hour format to 12-hour format
    return `${hours}:${minutes} ${ampm}`;
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Ensure 2-digit month
    const day = String(date.getDate()).padStart(2, "0"); // Ensure 2-digit day
    return `${year}-${month}-${day}`;
  };

  const handleSave = async () => {
    const Date = formatDate(date);
    const Time = formatTime(sleepTime);
    const End = formatTime(wakeTime);
    console.log(Date, Time, End);
    const response = await fetch(
      `http://192.168.1.102:8000/api/user/activity/${user.user_id}/sleep`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            date:Date,
            sleepStart: Time,
            sleepEnd: End,
        })
      }
    );
    const data = await response.json();
    console.log(data);
    reload();
    // onSave(date, sleepTime, wakeTime);
    onClose();
  };

  const onChangeSleepTime = (event: any, selectedDate?: Date) => {
    setShowSleepPicker(false);

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    setSleepTime(selectedDate);

    // For iOS, we need to manually hide the picker
    if (Platform.OS === "ios") {
      setTimeout(() => {
        setShowSleepPicker(false);
      }, 0);
    }
  };

  const onChangeWakeTime = (event: any, selectedDate?: Date) => {
    setShowWakePicker(false);

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    setWakeTime(selectedDate);

    // For iOS, we need to manually hide the picker
    if (Platform.OS === "ios") {
      setTimeout(() => {
        setShowWakePicker(false);
      }, 0);
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    // Create a new date object to avoid reference issues
    const newDate = new Date(selectedDate.getTime());
    setDate(newDate);

    // For iOS, we need to manually hide the picker
    if (Platform.OS === "ios") {
      setTimeout(() => {
        setShowDatePicker(false);
      }, 0);
    }
  };

  // Handle picker display
  const showPicker = (pickerType: "date" | "sleep" | "wake") => {
    // Close any open pickers first
    setShowDatePicker(false);
    setShowSleepPicker(false);
    setShowWakePicker(false);

    // Open the requested picker
    if (pickerType === "date") setShowDatePicker(true);
    if (pickerType === "sleep") setShowSleepPicker(true);
    if (pickerType === "wake") setShowWakePicker(true);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Log</Text>

              {/* Date Selector */}
              <TouchableOpacity
                style={styles.dateSelector}
                onPress={() => showPicker("date")}
              >
                <Text style={styles.dateSelectorText}>
                  {date.toDateString() === new Date().toDateString()
                    ? "Today"
                    : formatDate(date)}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#E5E5E5" />
              </TouchableOpacity>

              {/* Time Selectors */}
              <View style={styles.timeSelectors}>
                <View style={styles.timeColumn}>
                  <Text style={styles.timeLabel}>Sleep</Text>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => showPicker("sleep")}
                  >
                    <Text style={styles.timeText}>{formatTime(sleepTime)}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.timeColumn}>
                  <Text style={styles.timeLabel}>Wake</Text>
                  <TouchableOpacity
                    style={styles.timeButton}
                    onPress={() => showPicker("wake")}
                  >
                    <Text style={styles.timeText}>{formatTime(wakeTime)}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Save & Continue</Text>
                </TouchableOpacity>
              </View>

              {/* Date Picker - Only render when visible */}
              {showDatePicker && (
                <DateTimePicker
                  testID="datePicker"
                  value={date}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onChangeDate}
                />
              )}

              {/* Sleep Time Picker - Only render when visible */}
              {showSleepPicker && (
                <DateTimePicker
                  testID="sleepTimePicker"
                  value={sleepTime}
                  mode="time"
                  is24Hour={false}
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onChangeSleepTime}
                />
              )}

              {/* Wake Time Picker - Only render when visible */}
              {showWakePicker && (
                <DateTimePicker
                  testID="wakeTimePicker"
                  value={wakeTime}
                  mode="time"
                  is24Hour={false}
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onChangeWakeTime}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#001F3E",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    borderWidth: 0.5,
    boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.15)",
    borderColor: "#335C85",
    // Add shadow for iOS
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter600",
    color: "#FFFFFF",
    marginBottom: 15,
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#193450",
    width: "100%",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  dateSelectorText: {
    color: "#E5E5E5",
    fontFamily: "Inter500",
    fontSize: 14,
    flex: 1,
  },
  timeSelectors: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  timeColumn: {
    width: "48%",
  },
  timeLabel: {
    color: "#E5E5E5",
    fontFamily: "Inter400",
    fontSize: 14,
    marginBottom: 8,
  },
  timeButton: {
    backgroundColor: "rgba(50, 74, 98, 0.50)",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  timeText: {
    color: "#FFFFFF",
    fontFamily: "Inter500",
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#E5E5E5",
    fontFamily: "Inter500",
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: "#335C85",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#547698",
    borderRadius: 32,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontFamily: "Inter500",
    fontSize: 14,
  },
});

export default SleepLogModal;
