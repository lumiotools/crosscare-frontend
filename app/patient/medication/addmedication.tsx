import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useSelector } from "react-redux";

interface MedicationState {
  setMedicationName: string;
  selectedDays: string[];
  isStartDatePickerVisible: boolean;
  isEndDatePickerVisible: boolean;
  isTimePickerVisible: boolean;
  startDate: Date | null;
  endDate: Date | null;
  selectedTimes: string[];
}

export default function addmedication() {
  const [state, setState] = useState<MedicationState>({
    setMedicationName: "",
    selectedDays: ["T"],
    isStartDatePickerVisible: false,
    isEndDatePickerVisible: false,
    isTimePickerVisible: false,
    startDate: null,
    endDate: null,
    selectedTimes: [],
  });

  const user = useSelector((state:any)=>state.user);

  const days = ["SU", "M", "T", "W", "TH", "F", "SA"];

  const formatDate = (date: Date | null): string => {
    if (!date) return "";
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const toggleDay = (day: string): void => {
    setState((prevState) => ({
      ...prevState,
      selectedDays: prevState.selectedDays.includes(day)
        ? prevState.selectedDays.filter((d) => d !== day)
        : [...prevState.selectedDays, day],
    }));
  };

  const showDatePicker = (pickerType: "start" | "end"): void => {
    setState((prevState) => ({
      ...prevState,
      isStartDatePickerVisible: pickerType === "start",
      isEndDatePickerVisible: pickerType === "end",
    }));
  };

  const hideDatePicker = (): void => {
    setState((prevState) => ({
      ...prevState,
      isStartDatePickerVisible: false,
      isEndDatePickerVisible: false,
    }));
  };

  const handleDateConfirm = (
    event: any,
    selectedDate: Date | undefined,
    dateType: "start" | "end"
  ): void => {
    if (Platform.OS === "android") {
      hideDatePicker();
    }
    if (selectedDate) {
      setState((prevState) => ({
        ...prevState,
        [dateType === "start" ? "startDate" : "endDate"]: selectedDate,
      }));
    }
  };

  const handleTimeConfirm = (
    event: any,
    selectedTime: Date | undefined
  ): void => {
    if (Platform.OS === "android") {
      setState((prevState) => ({ ...prevState, isTimePickerVisible: false }));
    }
    if (selectedTime) {
      const timeString = selectedTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      setState((prevState) => ({
        ...prevState,
        selectedTimes: [...prevState.selectedTimes, timeString],
      }));
    }
  };

  const removeTime = (timeToRemove: string) => {
    setState((prevState) => ({
      ...prevState,
      selectedTimes: prevState.selectedTimes.filter(
        (time) => time !== timeToRemove
      ),
    }));
  };

  const handleSubmit = async () => {
    if (!state.setMedicationName.trim()) {
      alert("Please enter the medication name.");
      return;
    }
  
    if (!state.startDate) {
      alert("Please select a start date.");
      return;
    }
  
    if (!state.endDate) {
      alert("Please select an end date.");
      return;
    }
  
    if (state.selectedDays.length === 0) {
      alert("Please select at least one day.");
      return;
    }
  
    if (state.selectedTimes.length === 0) {
      alert("Please add at least one time.");
      return;
    }
  
    try {
      const apiUrl = `https://crosscare-backends.onrender.com/api/user/activity/${user.user_id}/addMedication`;

  
      const payload = {
        medicationName: state.setMedicationName,
        days: state.selectedDays,
        startDate: state.startDate.toISOString().split("T")[0],
        endDate: state.endDate.toISOString().split("T")[0],
        times: state.selectedTimes,
      };
  
      console.log("Submitting Data: ", payload);
  
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
  
      const data = await response.json();
  
      if (response.ok) { // Changed from response.success to response.ok
        console.log("Success:", data);
        // alert("Medication added successfully!");
        router.back();
      } else {
        console.log("Error:", data);
        alert("Failed to add medication!");
      }
    } catch (error: any) {
      console.log("Error occurred", error.message);
      alert("Something went wrong!");
    }
  };
  

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add new medication</Text>
        <View style={{ width: 25, height: 1 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={{ flexDirection: "column", gap: 36 }}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medicine Name</Text>
            <TextInput
              placeholderTextColor={"#7B7B7B"}
              placeholder="Medicine Name"
              style={styles.input}
              value={state.setMedicationName}
              onChangeText={(text) =>
                setState((prevState) => ({
                  ...prevState,
                  setMedicationName: text,
                }))
              }
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Start and End Date</Text>
            <View style={styles.dateContainer}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => showDatePicker("start")}
              >
                <Text
                  style={[
                    styles.dateButtonText,
                    !state.startDate && styles.dateButtonPlaceholder,
                  ]}
                >
                  {state.startDate ? formatDate(state.startDate) : "Start Date"}
                </Text>
                <Ionicons name="calendar-outline" size={16} color="#00A884" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => showDatePicker("end")}
              >
                <Text
                  style={[
                    styles.dateButtonText,
                    !state.endDate && styles.dateButtonPlaceholder,
                  ]}
                >
                  {state.endDate ? formatDate(state.endDate) : "End Date"}
                </Text>
                <Ionicons name="calendar-outline" size={16} color="#00A884" />
              </TouchableOpacity>
            </View>

            {/* Date Pickers */}
            {(state.isStartDatePickerVisible ||
              state.isEndDatePickerVisible) && (
              <DateTimePicker
                value={
                  state.isStartDatePickerVisible
                    ? state.startDate || new Date()
                    : state.endDate || new Date()
                }
                mode="date"
                display="default"
                onChange={(event, selectedDate) =>
                  handleDateConfirm(
                    event,
                    selectedDate,
                    state.isStartDatePickerVisible ? "start" : "end"
                  )
                }
              />
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Days</Text>
            <View style={styles.daysContainer}>
              {days.map((day) => (
                <Pressable
                  key={day}
                  onPress={() => toggleDay(day)}
                  style={styles.dayWrapper}
                >
                  <View
                    style={[
                      styles.dayButton,
                      state.selectedDays.includes(day) &&
                        styles.dayButtonSelected,
                    ]}
                  >
                    {state.selectedDays.includes(day) && (
                      <View style={styles.innerCircle} />
                    )}
                  </View>
                  <Text style={styles.dayText}>{day}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Time Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Time</Text>

            {state.selectedTimes.length === 0 ? (
              // Show this when no times are added
              <TouchableOpacity
                style={styles.addTimeButtonEmpty}
                onPress={() =>
                  setState((prev) => ({ ...prev, isTimePickerVisible: true }))
                }
              >
                <Ionicons name="add" size={16} color="#00A991" />
                <Text style={styles.addTimeText}>Add Time</Text>
              </TouchableOpacity>
            ) : (
              // Show this when times are added
              <View style={styles.timeContainer}>
                {state.selectedTimes.map((time, index) => (
                  <View key={index} style={styles.timeChip}>
                    <Text style={styles.timeChipText}>{time}</Text>
                    <TouchableOpacity
                      onPress={() => removeTime(time)}
                      style={styles.removeTimeButton}
                    >
                      <Ionicons name="close" size={16} color="#00A991" />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.addTimeButton}
                  onPress={() =>
                    setState((prev) => ({ ...prev, isTimePickerVisible: true }))
                  }
                >
                  <Ionicons name="add" size={16} color="#00A991" />
                </TouchableOpacity>
              </View>
            )}

            {state.isTimePickerVisible && (
              <DateTimePicker
                value={new Date()}
                mode="time"
                display="default"
                onChange={handleTimeConfirm}
              />
            )}
          </View>

          {/* Add Medication Button */}
          <TouchableOpacity
            style={styles.addMedicationButton}
            onPress={handleSubmit}
          >
            <Text style={styles.addMedicationText}>Save & Continue</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "DMSans600",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  dayText: {
    fontSize: 14,
    fontFamily: "Inter400",
    color: "#7B7B7B",
  },
  input: {
    borderWidth: 1,
    height: 45,
    paddingLeft: 12,
    color: "#00A991",
    fontSize: 14,
    fontFamily: "Inter400",
    borderRadius: 8,
    borderColor: "#E5E5E5",
  },
  section: {
    // marginBottom: 24,
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  dayWrapper: {
    alignItems: "center",
    gap: 8,
  },
  dayButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  dayButtonSelected: {
    borderColor: "#00A991",
    backgroundColor: "#00A991",
  },
  innerCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "white",
  },
  addTimeText: {
    color: "#00A991",
    fontSize: 14,
    marginLeft: 4,
    fontWeight: "500",
  },
  addTimeButtonEmpty: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9F2EF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 12,
    fontFamily: "Inter500",
    color: "#373737",
  },
  dateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    height: 45,
  },
  dateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#D9F2EF",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dateButtonText: {
    fontSize: 14,
    fontFamily: "Inter400",
    color: "#00A991",
  },
  dateButtonPlaceholder: {
    color: "#7B7B7B",
  },
  dayButtonText: {
    fontSize: 16,
    color: "#333",
  },
  dayButtonTextSelected: {
    color: "white",
  },
  timeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E6F6F4",
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#B0E4DD",
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 20,
  },
  timeChipText: {
    color: "#00A991",
    fontSize: 14,
    fontFamily: "Inter500",
    marginRight: 4,
  },
  removeTimeButton: {
    padding: 2,
  },
  addTimeButton1: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#D9F2EF",
    padding: 8,
    borderRadius: 20,
    height: 36,
    width: 36,
    justifyContent: "center",
  },
  timePickerIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5FFFD",
    borderWidth: 1,
    borderColor: "#D9F2EF",
    justifyContent: "center",
    alignItems: "center",
  },
  addTimeButton: {
    borderWidth: 1,
    borderColor: "#D9F2EF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5FFFD",
    // paddingVertical: 12,
    height: 40,
    width: 40,
    // paddingHorizontal: 14,
    borderRadius: 20,
  },
  addMedicationButton: {
    backgroundColor: "#00A991",
    borderWidth: 1,
    borderColor: "#B0E4DD",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 30,
    marginTop: 20,
    marginBottom: 20,
  },
  addMedicationText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Inter500",
    marginLeft: 8,
  },
});
