"use client"

import React, { useEffect, useState } from "react"
import { StyleSheet, Text, View, StatusBar, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native"
import { Feather, Ionicons } from "@expo/vector-icons"
import { SafeAreaView } from "react-native-safe-area-context"
import { router } from "expo-router"
import MedicationIcon from "@/assets/images/Svg/MedicationIcon"
import DateRangePicker from "@/components/DateRangePicker"
import DateRangeButton from "@/components/DateRangeButton"
import { useSelector } from "react-redux"

// First, let's update the interfaces to include dates
interface MedicationTime {
  time: string
  isCompleted: boolean
}

interface Medication {
  id: string
  name: string
  date: string // Add date field
  originalDate: string
  times: MedicationTime[]
}
function AlertDialog({ visible, onClose, onConfirm, medicationName }: { visible: boolean, onClose: () => void, onConfirm: () => void, medicationName: string }) {
  const user = useSelector((state: any) => state.user)
  const [userName, setUserName] = useState(user?.user_name || "")

  useEffect(() => {
    if (user && user.user_name) {
      setUserName(user.user_name)
    }
  }, [user])

  if (!visible) return null

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
              {`Hi ${userName}`}
            </Text>
            <Text
              style={{
                textAlign: "center",
              }}
            >
              {medicationName} medication was missed, would you like to mark as complete?
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
                  boxShadow: "0px 0px 4px 0px rgba(0, 0, 0, 0.25) inset, 0px 0px 2.6px 0px rgba(0, 0, 0, 0.32);",
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
  )
}

export default function medications() {
  const [activeTab, setActiveTab] = useState("All")
  const user = useSelector((state: any) => state.user)
  const [isLoading, setIsLoading] = useState(true)

  // Update the medications data structure
  const [medications, setMedications] = useState<Medication[]>([])
  const [allMedications, setAllMedications] = useState<Medication[]>([])

  const [alertVisible, setAlertVisible] = useState(false)
  const [pendingMedication, setPendingMedication] = useState({
    id: "",
    time: "",
  })

  // Add this state variable to track the button position
  const [buttonPosition, setButtonPosition] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  })

  const handleToggleComplete = (medicationId: string, timeToToggle: string) => {
    const medication = medications?.find((m) => m.id === medicationId)
    const time = medication?.times.find((t) => t.time === timeToToggle)

    if (!time?.isCompleted) {
      setPendingMedication({ id: medicationId, time: timeToToggle })
      setAlertVisible(true)
    } else {
      updateMedicationStatus(medicationId, timeToToggle)
    }
  }

  // Update the updateMedicationStatus function to call the API endpoint
  const updateMedicationStatus = async (medicationId: string, timeToToggle: string) => {
    if (!medications) return

    try {
      // The medicationId format is "uuid-date" (e.g., "ff3fefb7-65de-4ded-9741-628b3a25318c-2025-03-16")
      // We need to extract the UUID and date correctly

      // Extract the base medication ID and date
      // Look for the pattern where the date (YYYY-MM-DD) is at the end of the string
      const datePattern = /(\d{4}-\d{2}-\d{2})$/
      const match = medicationId.match(datePattern)

      let baseMedicationId = medicationId
      let medicationDate = new Date().toISOString().split("T")[0] // Default to today

      if (match && match[1]) {
        // If we found a date pattern at the end
        medicationDate = match[1]
        // Find the position where the date starts (including the hyphen)
        const dateStartPos = medicationId.lastIndexOf(medicationDate) - 1
        // Extract the base ID (everything before the date)
        baseMedicationId = medicationId.substring(0, dateStartPos)
      }

      console.log(`Base Medication ID: ${baseMedicationId}`)
      console.log(`Medication Date: ${medicationDate}`)

      // Find the medication and time to determine current completion status
      const medication = medications.find((m) => m.id === medicationId)
      const time = medication?.times.find((t) => t.time === timeToToggle)

      // Toggle the completion status
      const newCompletionStatus = !time?.isCompleted

      // Prepare the API request
      const userId = user?.user_id
      const endpoint = `http://192.168.1.102:8000/api/user/activity/${userId}/updateStatus/${baseMedicationId}/completed`

      console.log(`Sending request to: ${endpoint}`)
      console.log(`Request body:`, { completed: newCompletionStatus, date: medicationDate, time: timeToToggle })

      // Make the API call - using PUT method as specified
      const response = await fetch(endpoint, {
        method: "PATCH", // Changed from POST to PUT
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed: newCompletionStatus,
          date: medicationDate, // Using the YYYY-MM-DD format
          time: timeToToggle,
        }),
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()
      console.log("API response:", data)

      // Update local state after successful API call
      setMedications((prevMedications) =>
        prevMedications.map((medication) => {
          if (medication.id === medicationId) {
            return {
              ...medication,
              times: medication.times.map((time) => {
                if (time.time === timeToToggle) {
                  return { ...time, isCompleted: newCompletionStatus }
                }
                return time
              }),
            }
          }
          return medication
        }),
      )

      // Also update allMedications state to keep them in sync
      setAllMedications((prevMedications) =>
        prevMedications.map((medication) => {
          if (medication.id === medicationId) {
            return {
              ...medication,
              times: medication.times.map((time) => {
                if (time.time === timeToToggle) {
                  return { ...time, isCompleted: newCompletionStatus }
                }
                return time
              }),
            }
          }
          return medication
        }),
      )

      return true // Return success
    } catch (error) {
      console.error("Error updating medication status:", error)
      // You could add error handling here, such as showing a toast notification
      return false // Return failure
    }
  }

  // Render medication time item
  const renderMedicationTime = (time: MedicationTime, medicationId: string) => {
    // Extract the date from the medicationId (format: id-date)
    const parts = medicationId.split("-")
    const day = parts.length > 1 ? parts[1] : ""

    // Create a unique ID that includes both the day and medication ID
    const uniqueId = `${medicationId}-${time.time}`

    return (
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{time.time}</Text>
        <TouchableOpacity
          style={[styles.completionButton, time.isCompleted ? styles.completedButton : styles.incompleteButton]}
          onPress={() => handleToggleComplete(medicationId, time.time)}
        >
          <Ionicons
            name="checkmark"
            size={14}
            color={time.isCompleted ? "#00A991" : "#666666"}
            style={styles.checkIcon}
          />
          <Text style={[styles.completionText, time.isCompleted ? styles.completedText : styles.incompleteText]}>
            {time.isCompleted ? "Completed" : "Mark as Complete"}
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  // Filter medications with missed doses (not completed)
  const getMissedMedications = () => {
    if (!medications || !Array.isArray(medications)) {
      return []
    }
    return medications.filter((medication) => medication.times.some((time) => !time.isCompleted))
  }

  const [isVisible, setIsVisible] = useState(false)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  // Update the handleSelectRange function to filter medications by date range
  const handleSelectRange = (start: Date | null, end: Date | null) => {
    setStartDate(start)
    setEndDate(end)
    setIsVisible(false)

    if (start || end) {
      // Filter medications by date range
      filterMedicationsByDateRange(start, end)
    } else {
      // If both dates are null, show all medications
      setMedications(allMedications)
    }
  }

  // Add a function to filter medications by date range
  const filterMedicationsByDateRange = (start: Date | null, end: Date | null) => {
    if (!start && !end) {
      // If no date range is selected, show all medications
      setMedications(allMedications)
      return
    }

    // Convert start and end dates to timestamps for comparison
    const startTimestamp = start ? start.setHours(0, 0, 0, 0) : 0
    const endTimestamp = end ? end.setHours(23, 59, 59, 999) : Date.now() + 1000 * 60 * 60 * 24 * 365 // Default to a year from now

    // Filter medications by date range
    const filteredMedications = allMedications.filter((medication) => {
      // Convert medication date to timestamp
      const medicationDate = new Date(medication.originalDate)
      const medicationTimestamp = medicationDate.getTime()

      // Check if medication date is within the selected range
      return medicationTimestamp >= startTimestamp && medicationTimestamp <= endTimestamp
    })

    setMedications(filteredMedications)

    // Log for debugging
    console.log(`Filtered medications: ${filteredMedications.length} of ${allMedications.length}`)
    console.log(`Date range: ${start?.toDateString()} to ${end?.toDateString()}`)
  }

  // Add this helper function at the top of your component (before the return statement)
  const getDayOfWeekAbbr = (dayIndex: number): string => {
    const dayAbbreviations = ["SU", "M", "T", "W", "TH", "F", "SA"]
    return dayAbbreviations[dayIndex]
  }

  const getMedicationList = async () => {
    setIsLoading(true)
    try {
      if (!user || !user.user_id) {
        console.log("User ID not available")
        setIsLoading(false)
        return
      }

      // Construct API URL (without date filters - we'll filter client-side)
      const apiUrl = `http://192.168.1.102:8000/api/user/activity/${user.user_id}/getMedication`

      console.log("Fetching medications from:", apiUrl)
      const response = await fetch(apiUrl)

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const responseData = await response.json()
      console.log("API response:", responseData.data)

      if (responseData && responseData.data && Array.isArray(responseData.data)) {
        const formattedMedications: Medication[] = []

        // Mapping days to JS Date object days
        const dayMapping: { [key: string]: number } = {
          SU: 0,
          M: 1,
          T: 2,
          W: 3,
          TH: 4,
          F: 5,
          S: 6,
        }

        responseData.data.forEach((item: any) => {
          const startDate = new Date(item.startDate)
          const endDate = new Date(item.endDate)
          const allowedDays = item.days.map((d: string) => dayMapping[d]) // Convert days to numbers

          // Get the completed days of week for checking
          const completedDaysOfWeek = item.completedDaysOfWeek || []

          const currentDate = new Date(startDate)
          while (currentDate <= endDate) {
            if (allowedDays.includes(currentDate.getDay())) {
              // Store original date in "YYYY-MM-DD" format for sorting
              const originalDateStr = currentDate.toISOString().split("T")[0]

              // Format date as "18 Mar, 2025" with abbreviated month
              const day = currentDate.getDate()
              const month = currentDate.toLocaleString("en-US", { month: "short" })
              const year = currentDate.getFullYear()
              const formattedDate = `${day} ${month}, ${year}`

              // Get the day of week abbreviation for the current date
              const dayOfWeekAbbr = getDayOfWeekAbbr(currentDate.getDay())

              // Check if this specific date is in completedDates
              const dateStr = currentDate.toISOString().split("T")[0]
              const isDateCompleted =
                item.completedDates && item.completedDates.some((d:string) => d === dateStr || d.startsWith(dateStr))

              // Check if the day of week is in completedDaysOfWeek
              const isDayOfWeekCompleted = completedDaysOfWeek.includes(dayOfWeekAbbr)

              // A medication is completed if either the specific date or the day of week is marked as completed
              const isCompleted = isDateCompleted || isDayOfWeekCompleted || item.completed

              // Create a medication object for the allowed day
              formattedMedications.push({
                id: `${item.id}-${originalDateStr}`, // Unique ID
                name: item.medicationName,
                date: formattedDate, // Display formatted date
                originalDate: originalDateStr, // Keep original date for sorting
                times: Array.isArray(item.times)
                  ? item.times.map((timeString: string) => ({
                      time: timeString,
                      isCompleted: isCompleted,
                    }))
                  : [],
              })
            }
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1)
          }
        })

        // Sort medications by originalDate (which is still "YYYY-MM-DD")
        formattedMedications.sort((a, b) => new Date(a.originalDate).getTime() - new Date(b.originalDate).getTime())

        // Store all medications
        setAllMedications(formattedMedications)

        // Apply date filtering if dates are selected
        if (startDate || endDate) {
          filterMedicationsByDateRange(startDate, endDate)
        } else {
          setMedications(formattedMedications)
        }
      } else {
        console.error("API did not return expected data structure:", responseData)
        setAllMedications([])
        setMedications([])
      }
    } catch (error: any) {
      console.log("Error fetching medications:", error.message)
      setAllMedications([])
      setMedications([])
    } finally {
      setIsLoading(false)
    }
  }

  // Add this useEffect hook after your state declarations
  useEffect(() => {
    getMedicationList()
  }, [user])

  const missedMedications = getMissedMedications()

  // Add a function to group medications by date
  const groupMedicationsByDate = (meds: Medication[]) => {
    if (!meds || !Array.isArray(meds) || meds.length === 0) {
      return []
    }

    const grouped = meds.reduce(
      (acc, med) => {
        if (!acc[med.date]) {
          acc[med.date] = []
        }
        acc[med.date].push(med)
        return acc
      },
      {} as Record<string, Medication[]>,
    )

    return Object.entries(grouped)
  }

  // Update the render section for medications
  const renderMedicationsByDate = () => {
    const groupedMedications = groupMedicationsByDate(activeTab === "All" ? medications : getMissedMedications())

    return groupedMedications.map(([date, meds], dateIndex) => (
      <View key={date} style={styles.dateGroup}>
        <Text style={styles.dateHeader}>{date}</Text>
        {meds.map((medication, medIndex) => (
          <View key={medication.id}>
            <View style={styles.medicationItemContainer}>
              <View style={[styles.medicationNameContainer, medIndex === 0 && styles.firstMedicationNameContainer]}>
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
    ))
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Medications</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Feather name="more-vertical" size={20} color="#E5E5E5" />
        </TouchableOpacity>
      </View>

      {/* Medication Icon */}
      <ScrollView style={styles.medicationList} showsVerticalScrollIndicator={false}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <View style={styles.medicationIconGroup}>
              <MedicationIcon width={80} height={80} />
            </View>
          </View>
        </View>

        {/* Add New Medication Button */}
        <View style={styles.addButtonContainer}>
          <TouchableOpacity onPress={() => router.push("/patient/medication/addmedication")} style={styles.addButton}>
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
            <Text style={[styles.tabText, activeTab === "All" && styles.activeTabText]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "Missed" && styles.activeTab]}
            onPress={() => setActiveTab("Missed")}
          >
            <Text style={[styles.tabText, activeTab === "Missed" && styles.activeTabText]}>Missed</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00A991" />
            <Text style={styles.loadingText}>Loading medications...</Text>
          </View>
        ) : (
          <>
            {/* All medications tab */}
            {activeTab === "All" && (
              <View style={styles.medicationsContainer}>
                {medications && medications.length > 0 ? (
                  groupMedicationsByDate(medications).map(([date, meds]) => (
                    <View key={date} style={styles.dateGroup}>
                      <Text style={styles.dateHeader}>{date}</Text>
                      {meds.map((medication, index) => (
                        <View key={medication.id}>
                          <View style={styles.medicationItemContainer}>
                            <View
                              style={[
                                styles.medicationNameContainer,
                                index === 0 && styles.firstMedicationNameContainer,
                              ]}
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
                  ))
                ) : (
                  <Text style={styles.emptyText}>No medications found</Text>
                )}
              </View>
            )}

            {/* Missed medications tab */}
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
                              style={[
                                styles.medicationNameContainer,
                                index === 0 && styles.firstMedicationNameContainer,
                              ]}
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
          </>
        )}
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
        onConfirm={async () => {
          try {
            const success = await updateMedicationStatus(pendingMedication.id, pendingMedication.time)
            // Only close the dialog if the update was successful
            if (success) {
              setAlertVisible(false)
            }
          } catch (error) {
            console.error("Error in onConfirm handler:", error)
            // Keep dialog open if there's an error
          }
        }}
        medicationName={medications?.find((m) => m.id === pendingMedication.id)?.name || ""}
      />
    </SafeAreaView>
  )
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
    boxShadow: "0px 0px 4px 0px rgba(0, 0, 0, 0.25) inset, 0px 0px 2.6px 0px rgba(0, 0, 0, 0.32);",
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
    borderBottomWidth: 1,
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
    marginTop: 20,
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
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 200,
  },
  loadingText: {
    marginTop: 10,
    color: "#7B7B7B",
    fontSize: 14,
    fontFamily: "Inter400",
  },
  filterIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#EBF9F1",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  filterText: {
    color: "#00A991",
    fontSize: 12,
    fontFamily: "Inter400",
    flex: 1,
  },
  clearFilterButton: {
    paddingHorizontal: 10,
  },
  clearFilterText: {
    color: "#00A991",
    fontSize: 12,
    fontFamily: "Inter500",
  },
})

