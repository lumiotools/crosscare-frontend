"use client";

import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import MedicationIcon from "@/assets/images/Svg/MedicationIcon";
import DateRangePicker from "@/components/DateRangePicker";
import DateRangeButton from "@/components/DateRangeButton";

// First, let's update the interfaces to include dates
interface MedicationTime {
  time: string;
  isCompleted: boolean;
}

interface Medication {
  id: string;
  name: string;
  date: string; // Add date field
  times: MedicationTime[];
}

interface AlertDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  medicationName: string;
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  visible,
  onClose,
  onConfirm,
  medicationName,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.alertOverlay}>
      <View style={styles.alertContainer}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={14} color="#00A991" />
        </TouchableOpacity>
        <View style={styles.alertContent}>
          <View
            style={{
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontFamily: "Inter700",
                color: "#7B7B7B",
              }}
            >
              Hi Name!
            </Text>
            <Text
              style={{
                textAlign: "center",
              }}
            >
              {medicationName} medication was missed, would you like to mark as
              complete?
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignContent: "center",
                gap: 36,
                paddingHorizontal: 20,
              }}
            >
              <TouchableOpacity
                style={{
                  paddingHorizontal: 40,
                  paddingVertical: 8,
                }}
                onPress={onClose}
              >
                <Text
                  style={{
                    color: "#7B7B7B",
                    fontSize: 14,
                    fontFamily: "Inter400",
                  }}
                >
                  No
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  paddingHorizontal: 40,
                  paddingVertical: 8,
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor: "#00A991",
                  borderRadius: 14,
                  boxShadow:
                    "0px 0px 4px 0px rgba(0, 0, 0, 0.25) inset, 0px 0px 2.6px 0px rgba(0, 0, 0, 0.32);",
                  backgroundColor: "#009883",
                }}
                onPress={onConfirm}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                  }}
                >
                  Yes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default function medications() {
  const [activeTab, setActiveTab] = useState("All");

  // Update the medications data structure
  const [medications, setMedications] = useState<Medication[]>([
    {
      id: "1",
      name: "Pill",
      date: "10 Jun, 24",
      times: [
        { time: "10:00 AM", isCompleted: true },
        { time: "09:00 PM", isCompleted: false },
      ],
    },
    {
      id: "2",
      name: "Pill",
      date: "10 Jun, 24",
      times: [
        { time: "10:00 AM", isCompleted: true },
        { time: "09:00 PM", isCompleted: false },
      ],
    },
    {
      id: "3",
      name: "Pill",
      date: "11 Jun, 24",
      times: [
        { time: "10:00 AM", isCompleted: true },
        { time: "09:00 PM", isCompleted: true },
      ],
    },
    {
      id: "4",
      name: "Pill",
      date: "11 Jun, 24",
      times: [
        { time: "10:00 AM", isCompleted: true },
        { time: "09:00 PM", isCompleted: true },
      ],
    },
  ]);

  const [alertVisible, setAlertVisible] = useState(false);
  const [pendingMedication, setPendingMedication] = useState({
    id: "",
    time: "",
  });

  // Add this state variable to track the button position
  const [buttonPosition, setButtonPosition] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  const handleToggleComplete = (medicationId: string, timeToToggle: string) => {
    const medication = medications.find((m) => m.id === medicationId);
    const time = medication?.times.find((t) => t.time === timeToToggle);

    if (!time?.isCompleted) {
      setPendingMedication({ id: medicationId, time: timeToToggle });
      setAlertVisible(true);
    } else {
      updateMedicationStatus(medicationId, timeToToggle);
    }
  };

  const updateMedicationStatus = (
    medicationId: string,
    timeToToggle: string
  ) => {
    setMedications((prevMedications) =>
      prevMedications.map((medication) => {
        if (medication.id === medicationId) {
          return {
            ...medication,
            times: medication.times.map((time) => {
              if (time.time === timeToToggle) {
                return { ...time, isCompleted: !time.isCompleted };
              }
              return time;
            }),
          };
        }
        return medication;
      })
    );
  };

  // Render medication time item
  const renderMedicationTime = (time: MedicationTime, medicationId: string) => (
    <View style={styles.timeContainer}>
      <Text style={styles.timeText}>{time.time}</Text>
      <TouchableOpacity
        style={[
          styles.completionButton,
          time.isCompleted ? styles.completedButton : styles.incompleteButton,
        ]}
        onPress={() => handleToggleComplete(medicationId, time.time)}
      >
        <Ionicons
          name="checkmark"
          size={14}
          color={time.isCompleted ? "#00A991" : "#666666"}
          style={styles.checkIcon}
        />
        <Text
          style={[
            styles.completionText,
            time.isCompleted ? styles.completedText : styles.incompleteText,
          ]}
        >
          {time.isCompleted ? "Completed" : "Mark as Complete"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Filter medications with missed doses (not completed)
  const getMissedMedications = () => {
    return medications.filter((medication) =>
      medication.times.some((time) => !time.isCompleted)
    );
  };

  const [isVisible, setIsVisible] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const handleSelectRange = (start: Date | null, end: Date | null) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Add this function to handle the button layout
  const handleButtonLayout = (event) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    setButtonPosition({ x, y, width, height });
  };

  const missedMedications = getMissedMedications();

  // Add a function to group medications by date
  const groupMedicationsByDate = (meds: Medication[]) => {
    const grouped = meds.reduce((acc, med) => {
      if (!acc[med.date]) {
        acc[med.date] = [];
      }
      acc[med.date].push(med);
      return acc;
    }, {} as Record<string, Medication[]>);

    return Object.entries(grouped);
  };

  // Update the render section for medications
  const renderMedicationsByDate = () => {
    const groupedMedications = groupMedicationsByDate(
      activeTab === "All" ? medications : getMissedMedications()
    );

    return groupedMedications.map(([date, meds], dateIndex) => (
      <View key={date} style={styles.dateGroup}>
        <Text style={styles.dateHeader}>{date}</Text>
        {meds.map((medication, medIndex) => (
          <View key={medication.id}>
            <View style={styles.medicationItemContainer}>
              <View
                style={[
                  styles.medicationNameContainer,
                  medIndex === 0 && styles.firstMedicationNameContainer,
                ]}
              >
                <Text style={styles.medicationName}>{medication.name}</Text>
              </View>
              {medication.times.map((time) => (
                <React.Fragment key={`${medication.id}-${time.time}`}>
                  {renderMedicationTime(time, medication.id)}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}
      </View>
    ));
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
        <Text style={styles.headerTitle}>Medications</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Feather name="more-vertical" size={20} color="#E5E5E5" />
        </TouchableOpacity>
      </View>

      {/* Medication Icon */}
      <ScrollView
        style={styles.medicationList}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <View style={styles.medicationIconGroup}>
              <MedicationIcon width={80} height={80} />
            </View>
          </View>
        </View>

        {/* Add New Medication Button */}
        <View style={styles.addButtonContainer}>
          <TouchableOpacity
            onPress={() => router.push("/patient/medication/addmedication")}
            style={styles.addButton}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.addButtonText}>Add New Medication</Text>
          </TouchableOpacity>
        </View>

        <DateRangeButton
          onPress={() => setIsVisible(true)}
          startDate={startDate}
          endDate={endDate}
          // onLayout={handleButtonLayout}
        />

        <DateRangePicker
          visible={isVisible}
          onClose={() => setIsVisible(false)}
          onSelectRange={handleSelectRange}
          initialStartDate={startDate || undefined}
          initialEndDate={endDate || undefined}
          // buttonPosition={buttonPosition}
        />

        {/* Medication List */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "All" && styles.activeTab]}
            onPress={() => setActiveTab("All")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "All" && styles.activeTabText,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "Missed" && styles.activeTab]}
            onPress={() => setActiveTab("Missed")}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "Missed" && styles.activeTabText,
              ]}
            >
              Missed
            </Text>
          </TouchableOpacity>
        </View>

        {/* Update the JSX to use the new rendering function */}
        {activeTab === "All" && (
          <View style={styles.medicationsContainer}>
            {groupMedicationsByDate(medications).map(([date, meds]) => (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateHeader}>{date}</Text>
                {meds.map((medication, index) => (
                  <View key={medication.id}>
                    <View style={styles.medicationItemContainer}>
                      <View
                        style={[styles.medicationNameContainer, index === 0 && styles.firstMedicationNameContainer]}
                      >
                        <Text style={styles.medicationName}>{medication.name}</Text>
                      </View>
                      {medication.times.map((time, timeIndex) => (
                        <React.Fragment key={`${medication.id}-${time.time}`}>
                          {renderMedicationTime(time, medication.id)}
                        </React.Fragment>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {activeTab === "Missed" && (
          <View style={styles.medicationsContainer}>
            {missedMedications.length > 0 ? (
              groupMedicationsByDate(missedMedications).map(([date, meds]) => (
                <View key={date} style={styles.dateGroup}>
                  <Text style={styles.dateHeader}>{date}</Text>
                  {meds.map((medication, index) => (
                    <View key={medication.id}>
                      <View style={styles.medicationItemContainer}>
                        <View
                          style={[styles.medicationNameContainer, index === 0 && styles.firstMedicationNameContainer]}
                        >
                          <Text style={styles.medicationName}>{medication.name}</Text>
                        </View>
                        {medication.times
                          .filter((time) => !time.isCompleted)
                          .map((time, timeIndex, filteredTimes) => (
                            <React.Fragment key={`${medication.id}-${time.time}`}>
                              {renderMedicationTime(time, medication.id)}
                            </React.Fragment>
                          ))}
                      </View>
                    </View>
                  ))}
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No missed medications</Text>
            )}
          </View>
        )}

        {/* {activeTab === "All" && (
          <View style={styles.medicationsContainer}>
            {renderMedicationsByDate()}
          </View>
        )}

        {activeTab === "Missed" && (
          <View style={styles.medicationsContainer}>
            {missedMedications.length > 0 ? (
              renderMedicationsByDate()
            ) : (
              <Text style={styles.emptyText}>No missed medications</Text>
            )}
          </View>
        )} */}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Reminder On By Default.
          <Text style={styles.footerLink}> Turn Off Reminder</Text>
        </Text>
      </View>

      <AlertDialog
        visible={alertVisible}
        onClose={() => setAlertVisible(false)}
        onConfirm={() => {
          updateMedicationStatus(pendingMedication.id, pendingMedication.time);
          setAlertVisible(false);
        }}
        medicationName={
          medications.find((m) => m.id === pendingMedication.id)?.name || ""
        }
      />
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
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#00A991",
  },
  tabText: {
    fontSize: 16,
    color: "#757575",
  },
  activeTabText: {
    color: "#00A991",
    fontWeight: "500",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "DMSans600",
  },
  menuButton: {
    padding: 8,
  },
  iconContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  iconCircle: {
    width: 180,
    height: 180,
    borderRadius: 100,
    backgroundColor: "#D9F2EF",
    justifyContent: "center",
    borderWidth: 5,
    borderColor: "#FFFAFD",
    boxShadow: "0px 0px 4px 0px rgba(0, 0, 0, 0.10);",
    alignItems: "center",
  },
  medicationIconGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  secondPillIcon: {
    transform: [{ rotate: "45deg" }],
    marginLeft: -15,
  },
  addButtonContainer: {
    alignItems: "flex-start",
    marginBottom: 20,
    marginTop: 20,
  },
  addButton: {
    flexDirection: "row",
    backgroundColor: "#009883",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#B0E4DD",
    boxShadow:
      "0px 0px 4px 0px rgba(0, 0, 0, 0.25) inset, 0px 0px 2.6px 0px rgba(0, 0, 0, 0.32);",
    paddingHorizontal: 16,
    borderRadius: 25,
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
    fontFamily: "Inter400",
    fontSize: 14,
    marginLeft: 5,
  },
  medicationList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    color: "#373737",
    fontFamily: "Inter500",
    marginBottom: 15,
  },
  medicationItem: {
    paddingVertical: 15,
    paddingHorizontal: 16,
    
  },
  medicationNameContainer: {
    // borderTopWidth: 1,
    
    paddingTop: 16,
  },
  firstMedicationNameContainer: {
    borderTopWidth: 0,
  },
  medicationName: {
    fontSize: 14,
    color: "#434343",
    fontFamily: "Inter500",
  },
  medicationTime: {
    fontSize: 12,
    fontFamily: "Inter500",
    color: "#7B7B7B",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    fontFamily: "Inter500",
    color: "#8A8A8A",
    textTransform: "capitalize",
  },
  footerLink: {
    color: "#00A991",
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  timeText: {
    fontSize: 12,
    fontFamily: "Inter500",
    color: "#7B7B7B",
  },
  completionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    // gap: 4,
    width: 140,
    minWidth: 140,
  },
  completedButton: {
    backgroundColor: "#E6F6F4",
  },
  incompleteButton: {
    backgroundColor: "rgba(229, 229, 229, 0.50)",
  },
  completionText: {
    fontSize: 12,
    fontFamily: "Inter500",
  },
  checkIcon: {
    marginRight: 4,
  },
  completedText: {
    color: "#00A991",
  },
  incompleteText: {
    color: "#7B7B7B",
  },
  emptyText: {
    textAlign: "center",
    color: "#7B7B7B",
    fontSize: 14,
    fontFamily: "Inter400",
    marginTop: 24,
  },
  medicationsContainer: {
    marginTop: 0,
    marginHorizontal: 16,
  },
  medicationItemContainer: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth:1,
    borderBottomColor: "#EEEEEE",
  },
  alertOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  alertContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    width: "90%",
    // maxWidth: 400,
    padding: 16,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    padding: 5,
  },
  alertContent: {
    width: "100%",
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 16,
  },
  alertIcon: {
    marginRight: 12,
  },
  alertText: {
    flex: 1,
    fontSize: 16,
    color: "#666666",
    fontFamily: "Inter400",
    lineHeight: 24,
  },
  alertButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 16,
  },
  alertButtonNo: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  alertButtonYes: {
    backgroundColor: "#00A991",
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 100,
  },
  alertButtonTextNo: {
    color: "#666666",
    fontSize: 16,
    fontFamily: "Inter500",
  },
  alertButtonTextYes: {
    color: "white",
    fontSize: 16,
    fontFamily: "Inter500",
  },
  dateGroup: {
    marginBottom: 24,
    
  },
  dateHeader: {
    fontSize: 14,
    color: "#434343",
    fontFamily: "Inter600",
    // marginBottom: 16,
    marginTop:20,
  },
  medicationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});
