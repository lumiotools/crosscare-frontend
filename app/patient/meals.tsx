//

import { StyleSheet, Text, View, StatusBar, ScrollView, Animated, Dimensions } from "react-native"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { TouchableOpacity } from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import { Feather, FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons"
import FoodIcon from "@/assets/images/Svg/FoodIcon"
import { LinearGradient } from "expo-linear-gradient"
import CalorieGoalModal from "./modal/caloriegoalmodal"

// Import DateTimePicker at the top of the file
import DateTimePicker from "@react-native-community/datetimepicker"
import { Platform } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { useSelector } from "react-redux"

const MAX_HEIGHT = 200
const BAR_WIDTH = 20
const SPACING = (Dimensions.get("window").width - BAR_WIDTH * 10) / 8

interface DataItem {
  day: string
  calories: number
  date: string
}

interface CustomBarProps {
  item: DataItem
  index: number
  isSelected: boolean
}

interface Food {
  name: string
  portion: string
  calories: number
}

interface Meal {
  title: string
  goalCalories: number
  totalCalories: number
  foods: Food[]
  description: string
}

const CustomProgressBar = ({ progress }: { progress: number }) => {
  // Cap the progress at 100% to prevent overflow
  const cappedProgress = Math.min(progress, 1)

  return (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${cappedProgress * 100}%` }]} />
      </View>
    </View>
  )
}

const FoodItem = ({ name, portion, calories, onDelete }: Food & { onDelete: () => void }) => {
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    if (menuVisible) {
      timeoutId = setTimeout(() => {
        setMenuVisible(false)
      }, 3000) // Close after 3 seconds
    }

    // Clean up the timeout when component unmounts or menuVisible changes
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [menuVisible])

  

  return (
    <View style={styles.foodItem}>
      <View style={styles.foodItemLeft}>
        <Text style={styles.foodName}>{name}</Text>
        <Text style={styles.foodPortion}>{portion}</Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Text style={styles.foodCalories}>{calories} Cal</Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Feather name="more-vertical" size={14} color="#E5E5E5" />
        </TouchableOpacity>

        {/* Popup Menu */}
        {menuVisible && (
          <View style={styles.popupMenuOverlay}>
            <TouchableOpacity style={styles.popupMenuBackdrop} onPress={() => setMenuVisible(false)} />
            <View style={styles.popupMenu}>
              <TouchableOpacity
                style={styles.popupMenuItem}
                onPress={() => {
                  onDelete()
                  setMenuVisible(false)
                }}
              >
                <Text style={styles.popupMenuItemTextDelete}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  )
}

const MealItem = ({
  meal,
  index,
  onAddPress,
  onDeleteFood,
}: {
  meal: Meal
  index: number
  onAddPress: (mealType: string) => void
  onDeleteFood: (mealType: string, foodIndex: number) => void
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasFoods = meal.foods && meal.foods.length > 0

  return (
    <View style={[styles.mealItem, index !== 0 && styles.mealItemWithBorder]}>
      <TouchableOpacity style={styles.mealHeader} onPress={() => setIsExpanded(!isExpanded)} activeOpacity={0.7}>
        <Text style={styles.mealTitle}>{meal.title}</Text>
        <View style={styles.mealCaloriesContainer}>
          <Text style={styles.mealCalories}>
            {meal.totalCalories} of {meal.goalCalories} Cal
          </Text>
          <TouchableOpacity style={styles.addButton} onPress={() => onAddPress(meal.title)}>
            <Ionicons name="add-circle" size={20} color="#38C472" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Show description by default if no foods */}
      {!hasFoods && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.mealDescription}>{meal.description}</Text>
        </View>
      )}

      {/* Show foods only when expanded and foods exist */}
      {hasFoods && (
        <View style={styles.expandedContent}>
          {meal.foods.map((food, idx) => (
            <FoodItem
              key={idx}
              name={food.name}
              portion={food.portion}
              calories={food.calories}
              onDelete={() => onDeleteFood(meal.title, idx)}
            />
          ))}
          <TouchableOpacity style={styles.saveAsMealButton}>
            <Text style={styles.saveAsMealText}>Save as Meal</Text>
            <Ionicons name="chevron-forward" size={16} color="#434343" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const meals = () => {
  const params = useLocalSearchParams()
  const selectedFoodJson = params.selectedFood as string
  const selectedFood = selectedFoodJson ? JSON.parse(selectedFoodJson) : null
  const mealType = params.mealType as string
  const [progress, setProgress] = React.useState(0)
  const [isGoalModalVisible, setIsGoalModalVisible] = useState(false)
  const [calorieGoal, setCalorieGoal] = useState("")
  const user = useSelector((state:any)=>state.user);
  const userId = user?.user_id;

  useEffect(() => {
      const setMealVisited = async () => {
        await AsyncStorage.setItem('meal_1', 'true');
      };
      
      setMealVisited();
    }, [userId]);

  // Add these state variables after the other useState declarations
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Flag to track if we've processed the current food params
  const [processedCurrentParams, setProcessedCurrentParams] = useState(false)

  // Initialize meal data
  const [mealData, setMealData] = useState<Meal[]>([
    {
      title: "Breakfast",
      goalCalories: 169,
      totalCalories: 0,
      foods: [],
      description: "Get energized by grabbing a morning breakfast",
    },
    {
      title: "Lunch",
      goalCalories: 169,
      totalCalories: 0,
      foods: [],
      description: "Don't miss the lunch it's time to get a tasty meal",
    },
    {
      title: "Snacks",
      goalCalories: 169,
      totalCalories: 0,
      foods: [],
      description: "Refuel your body with a delicious evening snack",
    },
    {
      title: "Dinner",
      goalCalories: 338,
      totalCalories: 0,
      foods: [],
      description: "An early dinner can help you sleep better",
    },
  ])

  // Use a ref to track processed food items
  const processedFoodRef = useRef(new Set())

  // Replace the useEffect hook that handles receiving selected food with this updated version
  // Handle receiving selected food from food search screen
  useEffect(() => {
    if (params.selectedFood && params.mealType) {
      try {
        const selectedFood = JSON.parse(params.selectedFood as string)
        const mealType = params.mealType as string

        // Use a ref to track if we've already processed this specific food item
        const foodKey = `${mealType}-${JSON.stringify(selectedFood)}`

        // Check if we've already processed this exact food item
        if (!processedFoodRef.current.has(foodKey)) {
          // Mark this food as processed
          processedFoodRef.current.add(foodKey)

          // Add the food to the appropriate meal
          setMealData((prevMeals) => {
            return prevMeals.map((meal) => {
              if (meal.title === mealType) {
                // Add the food and update total calories
                const updatedFoods = [...meal.foods, selectedFood]
                const updatedTotalCalories = updatedFoods.reduce((sum, food) => sum + food.calories, 0)

                return {
                  ...meal,
                  foods: updatedFoods,
                  totalCalories: updatedTotalCalories,
                }
              }
              return meal
            })
          })

          // Clear the URL parameters after processing to prevent re-processing on reload
          // Use Expo Router's setParams to clear the parameters
          router.setParams({})
        }
      } catch (error) {
        console.error("Error parsing selected food:", error)
      }
    }
  }, [params.selectedFood, params.mealType])

  const [tooltipAnim] = useState(new Animated.Value(0)) // Start with 0 opacity
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const handleOpenGoalModal = () => {
    setIsGoalModalVisible(true)
  }

  const handleCloseGoalModal = () => {
    setIsGoalModalVisible(false)
  }

  const handleSaveGoal = (newGoal: string) => {
    setCalorieGoal(newGoal)
    setIsGoalModalVisible(false)
  }

  const handleAddFood = (mealType: string) => {
    // Navigate to food search screen with meal type
    router.push({
      pathname: "/patient/addmeals",
      params: { mealType },
    })
  }

  const handleDeleteFood = (mealType: string, foodIndex: number) => {
    setMealData((prevMeals) => {
      return prevMeals.map((meal) => {
        if (meal.title === mealType) {
          // Remove the food at the specified index
          const updatedFoods = [...meal.foods]
          updatedFoods.splice(foodIndex, 1)

          // Recalculate total calories
          const updatedTotalCalories = updatedFoods.reduce((sum, food) => sum + food.calories, 0)

          return {
            ...meal,
            foods: updatedFoods,
            totalCalories: updatedTotalCalories,
          }
        }
        return meal
      })
    })
  }

  // Sample data for the last 7 days (in calories)
  const data = [
    { day: "S", calories: 9400, date: "FEB 25, 2025" },
    { day: "M", calories: 9350, date: "FEB 26, 2025" },
    { day: "T", calories: 9500, date: "FEB 27, 2025" },
    { day: "W", calories: 9450, date: "FEB 28, 2025" },
    { day: "T", calories: 9600, date: "FEB 29, 2025" },
    { day: "F", calories: 9700, date: "MAR 1, 2025" },
    { day: "S", calories: 9300, date: "MAR 2, 2025" },
  ]

  // Convert calories to kilocalories for display
  const formatToKcal = (calories: number) => {
    return (calories / 1000).toFixed(1)
  }

  // Calculate y-axis values using useMemo to prevent recalculation on every render
  const { yAxisLabels, roundedMax, roundedMin } = useMemo(() => {
    // Get min and max calories
    const maxCalories = Math.max(...data.map((item) => item.calories))
    const minCalories = Math.min(...data.map((item) => item.calories))

    // Convert to kcal for rounding
    const maxKcal = maxCalories / 1000
    const minKcal = minCalories / 1000

    // Round to nearest 0.1 for kcal
    const roundedMaxKcal = Math.ceil(maxKcal * 10) / 10
    const roundedMinKcal = Math.floor(minKcal * 10) / 10

    // Convert back to calories for internal calculations
    const roundedMax = roundedMaxKcal * 1000
    const roundedMin = roundedMinKcal * 1000

    // Create appropriate y-axis labels based on data range
    const rangeKcal = roundedMaxKcal - roundedMinKcal
    const stepKcal = rangeKcal / 4 // We want about 4 labels

    const labels = []
    for (let i = 0; i <= 4; i++) {
      const valueKcal = roundedMinKcal + stepKcal * i
      if (valueKcal <= roundedMaxKcal) {
        // Format to 1 decimal place
        labels.push(valueKcal.toFixed(1))
      }
    }

    // Make sure max value is included
    if (Number.parseFloat(labels[labels.length - 1]) < roundedMaxKcal) {
      labels.push(roundedMaxKcal.toFixed(1))
    }

    return {
      yAxisLabels: labels.reverse(), // Reverse for top-to-bottom display
      roundedMax,
      roundedMin,
    }
  }, [data]) // Only recalculate when data changes

  // Function to hide tooltip after a delay
  const hideTooltipAfterDelay = () => {
    // Clear any existing timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current)
    }

    // Set a new timeout to hide the tooltip after 3 seconds
    tooltipTimeoutRef.current = setTimeout(() => {
      Animated.timing(tooltipAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setSelectedIndex(null)
      })
    }, 3000)
  }

  const handleBarPress = (index: number): void => {
    if (selectedIndex === index) {
      return // Already selected
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
    ]).start()

    setSelectedIndex(index)

    Animated.timing(tooltipAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start()

    // Set timeout to hide tooltip after delay
    hideTooltipAfterDelay()
  }

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current)
      }
    }
  }, [])

  const CustomBar = ({ item, index, isSelected }: CustomBarProps) => {
    // Calculate bar height based on data range
    const dataRange = roundedMax - roundedMin
    const normalizedCalories = item.calories - roundedMin // Adjust for minimum value
    const barHeight = (normalizedCalories / dataRange) * MAX_HEIGHT

    return (
      <TouchableOpacity activeOpacity={0.8} onPress={() => handleBarPress(index)} style={styles.barContainer}>
        <View style={styles.barLabelContainer}>
          <Text style={styles.barLabel}>{item.day}</Text>
        </View>

        <View style={[styles.barWrapper, { height: barHeight }]}>
          <LinearGradient
            colors={isSelected ? ["#38C472", "#38C472"] : ["#A3E4BE", "#A3E4BE"]}
            style={[styles.bar, { height: "100%" }]}
          />
        </View>

        {isSelected && (
          <Animated.View style={[styles.tooltip, { opacity: tooltipAnim }]}>
            <View style={styles.tooltipContent}>
              <Text style={styles.tooltipTitle}>CALORIES</Text>
              <Text style={styles.tooltipWeight}>
                {formatToKcal(item.calories)}
                <Text
                  style={{
                    fontSize: 16,
                    color: "#38C472",
                  }}
                >
                  {" "}
                  kcal
                </Text>
              </Text>
              <Text style={styles.tooltipDate}>{item.date}</Text>
            </View>
            <View style={[styles.tooltipArrow, { borderTopColor: "#38C472" }]} />
          </Animated.View>
        )}
      </TouchableOpacity>
    )
  }

  // Calculate total calories for the day
  const totalCalories = mealData.reduce((sum, meal) => sum + meal.totalCalories, 0)

  // Calculate consumed calories (for now it's 0)
  const consumedCalories = totalCalories

  // Get the calorie goal value to display
  const displayCalorieGoal = calorieGoal
    ? calorieGoal
    : mealData.reduce((sum, meal) => sum + meal.goalCalories, 0).toString()

  // Calculate progress for the progress bar
  const calorieProgress =
    Number.parseInt(displayCalorieGoal) > 0 ? consumedCalories / Number.parseInt(displayCalorieGoal) : 0

  useEffect(() => {
    setProgress(calorieProgress)
  }, [calorieProgress, calorieGoal, mealData])

  // Add this function before the return statement
  const handleDateChange = (event, date) => {
    setShowDatePicker(false)
    if (date) {
      setSelectedDate(date)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Food</Text>
        <TouchableOpacity>
          <Feather name="more-vertical" size={20} color="#E5E5E5" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Food Icon Section */}
        <View style={styles.mealContainer}>
          <View style={styles.mealCircleContainer}>
            <View style={styles.mealCircle}>
              <FoodIcon width={80} height={80} />
            </View>
          </View>

          <CustomProgressBar progress={progress} />

          <View style={styles.calorieInfoContainer}>
            <Text style={styles.calorieText}>
              {consumedCalories}{" "}
              <Text
                style={{
                  color: "#333",
                  fontSize: 14,
                  fontFamily: "Inter400",
                }}
              >
                of {displayCalorieGoal} Cal Consumed
              </Text>
            </Text>
            <TouchableOpacity style={styles.editButton} onPress={handleOpenGoalModal}>
              <FontAwesome5 name="pen" size={15} color="#707070" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Replace the Today Dropdown TouchableOpacity with this: */}
        <TouchableOpacity style={styles.todayContainer} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.todayText}>
            {selectedDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </Text>
          <View
            style={{
              width: 16,
              height: 16,
              backgroundColor: "#E5E5E5",
              borderRadius: 50,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MaterialIcons name="keyboard-arrow-down" size={13} color="#666666" />
          </View>
        </TouchableOpacity>

        {/* Meal List */}
        <View style={styles.mealList}>
          {mealData.map((meal, index) => (
            <MealItem
              key={index}
              meal={meal}
              index={index}
              onAddPress={handleAddFood}
              onDeleteFood={handleDeleteFood}
            />
          ))}
        </View>

        <View style={styles.analysisContainer}>
          <View style={styles.analysisHeader}>
            <View style={styles.analysisTab}>
              <MaterialIcons name="bar-chart" size={18} color="#A3E4BE" />
              <Text style={styles.analysisTabText}>Analysis</Text>
            </View>
            <TouchableOpacity style={styles.periodSelector}>
              <Text style={styles.periodText}>Last 7 Days</Text>
              <Ionicons name="chevron-down" size={14} color="#38C472" />
            </TouchableOpacity>
          </View>
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
              <View key={index} style={[styles.gridLine, { top: (index / (yAxisLabels.length - 1)) * MAX_HEIGHT }]} />
            ))}

            {/* Bars */}
            <View style={styles.barsContainer}>
              {data.map((item, index) => (
                <CustomBar key={index} item={item} index={index} isSelected={selectedIndex === index} />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.bottomContainer}>
          <View style={styles.messageContainer}>
            <Text style={styles.messageTitle}>Track Your Weight Progress</Text>
            <Text style={styles.messageSubtitle}>Set a reminder and stay on track.</Text>
          </View>
          <TouchableOpacity style={styles.reminderButton}>
            <Ionicons name="alarm" size={16} color="white" />
            <Text style={styles.reminderButtonText}>Set Reminder</Text>
          </TouchableOpacity>
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === "android" ? "calendar" : "default"}
            onChange={handleDateChange}
            // iOS specific props
            textColor="#38C472"
            accentColor="#38C472"
            // Android specific props
            themeVariant="light"
            // For Android, you can use the style prop for basic styling
            style={{ backgroundColor: "#FFFFFF" }}
          />
        )}

        <CalorieGoalModal visible={isGoalModalVisible} onClose={handleCloseGoalModal} onSave={handleSaveGoal} />
      </ScrollView>
    </SafeAreaView>
  )
}

export default meals

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
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
  mealContainer: {
    paddingHorizontal: 30,
    marginTop: 10,
    marginBottom: 20,
  },
  mealCircleContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  mealCircle: {
    width: 180,
    height: 180,
    borderWidth: 4,
    borderColor: "#FFF",
    borderRadius: 100,
    backgroundColor: "#EBF9F1",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressBarContainer: {
    width: "100%",
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "#E6E6E6",
    borderRadius: 999,
  },
  progressBarFill: {
    height: "100%",
    width: "100%",
    backgroundColor: "#38C472",
    borderRadius: 999,
  },
  calorieInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  calorieText: {
    fontSize: 17,
    fontFamily: "Inter600",
    color: "#333",
  },
  editButton: {
    padding: 4,
  },
  todayContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 30,
    paddingVertical: 8,
    width: 100,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "rgba(229, 229, 229, 0.39)",
  },
  todayText: {
    fontSize: 16,
    fontFamily: "Inter600",
    color: "#373737",
    marginRight: 4,
  },
  mealList: {
    paddingHorizontal: 16,
  },
  mealItem: {
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  mealItemWithBorder: {
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  mealTitle: {
    fontSize: 16,
    fontFamily: "DMSans600",
    color: "#434343",
  },
  mealCaloriesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mealCalories: {
    fontSize: 12,
    fontFamily: "Inter400",
    color: "#7B7B7B",
  },
  addButton: {
    padding: 2,
  },
  expandedContent: {
    backgroundColor: "rgba(232, 232, 232, 0.25);",
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "#E8E8E8",
  },
  foodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // paddingVertical: 8,

    paddingBottom: 12,
  },
  foodItemLeft: {
    flex: 1,
  },
  foodName: {
    fontSize: 14,
    fontFamily: "Inter400",
    color: "#373737",
    marginBottom: 4,
  },
  foodPortion: {
    fontSize: 12,
    fontFamily: "Inter400",
    color: "#7B7B7B",
  },
  foodCalories: {
    fontSize: 12,
    fontFamily: "Inter400",
    color: "#7B7B7B",
  },
  saveAsMealButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // paddingVertical: 10,

    paddingTop: 20,
    // paddingHorizontal: 16,

    // backgroundColor: "#FFFFFF",

    borderTopWidth: 0.5,
    borderTopColor: "#E6E6E6",
  },
  saveAsMealText: {
    fontSize: 14,
    fontFamily: "Inter500",
    color: "#38C472",
  },
  descriptionContainer: {
    backgroundColor: "rgba(232, 232, 232, 0.25)",
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "#E8E8E8",
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  mealDescription: {
    fontSize: 12,
    textAlign: "center",
    fontFamily: "Inter400",
    color: "#7B7B7B",
  },
  analysisContainer: {
    marginTop: 40,
    paddingHorizontal: 16,
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
    backgroundColor: "#EBF9F1",
    borderWidth: 1,
    borderColor: "#A3E4BE",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    borderRadius: 8,
  },
  periodText: {
    fontSize: 12,
    letterSpacing: 0.28,
    fontFamily: "Inter500",
    color: "#38C472",
  },
  chartTitle: {
    fontSize: 16,
    fontFamily: "Inter600",
    color: "#373737",
  },
  barContainer: {
    width: BAR_WIDTH,
    marginRight: SPACING,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  barsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: "100%",
    paddingLeft: SPACING,
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
  yAxisContainer: {
    width: 40,
    height: MAX_HEIGHT,
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingRight: 5,
  },
  customChartContainer: {
    flexDirection: "row",
    marginTop: 10,
    height: MAX_HEIGHT + 40, // Add extra height for labels
    marginRight: 16,
    // marginBottom: 30,
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
    borderTopColor: "#38C472",
    marginTop: -1,
  },
  tooltipTitle: {
    fontSize: 12,
    color: "#434343",
    fontFamily: "Inter500",
  },
  tooltipWeight: {
    fontSize: 22,
    color: "#38C472",
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
    borderColor: "#38C472",
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
    color: "#38C472",
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
    backgroundColor: "#38C472",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#60D08E",
    paddingVertical: 10,
    borderRadius: 20,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    boxShadow: "0px 0px 4px 0px rgba(0, 0, 0, 0.25) inset, 0px 0px 2.6px 0px rgba(0, 0, 0, 0.32);",
  },
  reminderButtonText: {
    color: "#FEF8FD",
    marginLeft: 8,
    fontSize: 12,
    fontFamily: "Inter500",
  },
  popupMenuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  popupMenuBackdrop: {
    position: "absolute",
    top: -100,
    left: -100,
    right: -100,
    bottom: -100,
    backgroundColor: "transparent",
  },
  popupMenu: {
    position: "absolute",
    right: 0,
    top: 20,
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    width: 120,
    zIndex: 1001,
  },
  popupMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 8,
  },
  popupMenuItemTextDelete: {
    color: "#FF3B30",
    fontSize: 14,
    fontFamily: "Inter400",
  },
})

