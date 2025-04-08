"use client"

import { useRef, useEffect, useState } from "react"
import { StyleSheet, Text, View, TouchableOpacity, Image, Animated, StatusBar, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useLocalSearchParams, useRouter } from "expo-router"

// Define the exercise item interface
interface ExerciseItem {
  id: string
  type: string
  title: string
  duration: string
  image: string
  isLocked: boolean
  isFavorite: boolean
  content?: string
}

interface AudioItem {
    id: string
    title: string
    url: string
    duration: string
    image: string | null
    categoryId: string
    createdAt: string
    updatedAt: string
  }

// Define the category interface
interface Category {
  id: string
  title: string
  iconType: string
  count: number
  contentType: string
  gradientColors: string[]
  content: ExerciseItem[] | AudioItem[]
}

const ExerciseDetailScreen = () => {
  const router = useRouter()
  const params = useLocalSearchParams()

  // Parse params (all params come as strings in Expo Router)
  const title = (params.title as string) || "Exercise Details"
  const count = Number.parseInt((params.count as string) || "0", 10)
  const contentType = (params.contentType as string) || "EXERCISES"

  // Parse gradient colors from params or use default blue gradient
  let gradientColors: string[] = ["#0039C6", "#0039C6", "#7B96FF"]
  try {
    if (params.gradientColors) {
      const parsedColors = JSON.parse(params.gradientColors as string)
      if (Array.isArray(parsedColors) && parsedColors.length >= 2) {
        gradientColors = parsedColors
      }
    }
  } catch (error) {
    console.log("Error parsing gradient colors:", error)
  }

  const [categoryData, setCategoryData] = useState<Category | null>(null)
  const [exercises, setExercises] = useState<ExerciseItem[] | AudioItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get the 'id' from params
  const id = params.id as string

  console.log("Exercise ID:", id) // Log the exercise ID

  // Fetch the exercise details using the `id` from URL params
  useEffect(() => {
    const fetchExerciseDetails = async () => {
      setIsLoading(true)
      setError(null)

      try {
        if (!id) {
          console.log("No category ID provided")
          setExercises([])
          setIsLoading(false)
          return
        }

        // Use the correct API URL and endpoint
        const response = await fetch(`https://crosscare-backends.onrender.com/api/categories/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`API responded with status: ${response.status}`)
        }

        // Get response as text first to debug
        const responseText = await response.text()
        console.log("Exercise Details:", responseText)

        // Check if response is empty or "null"
        if (!responseText || responseText.trim() === "null") {
          console.log("Empty or null response received")
          setExercises([])
          setIsLoading(false)
          return
        }

        // Try to parse the text as JSON
        let data
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.error("JSON parse error:", parseError)
        //   throw new Error(`Failed to parse JSON: ${parseError.message}`)
        }

        // Check if data has the expected structure
        if (data && data.content && Array.isArray(data.content)) {
          setCategoryData(data)
          setExercises(data.content)
        } else {
          console.log("Unexpected data structure")
          setExercises([])
        }
      } catch (fetchError) {
        console.error("Error fetching exercise details:", fetchError)
        // setError(fetchError.message)
        setExercises([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchExerciseDetails()
  }, [id])

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scrollY = useRef(new Animated.Value(0)).current

  useEffect(() => {
    StatusBar.setBarStyle("light-content")
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start()

    return () => {
      StatusBar.setBarStyle("dark-content")
    }
  }, [])

  // Header background color animation
  const headerBackgroundColor = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: ["transparent", "white"],
    extrapolate: "clamp",
  })

  // Header title opacity animation
  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, 80, 100],
    outputRange: [0, 0.5, 1],
    extrapolate: "clamp",
  })

  const handleExercisePress = (exercise: ExerciseItem | AudioItem) => {
    if (!exercise.isLocked) {
      router.push({
        pathname: "/patient/excerises/audio_player", // Changed to match your existing route
        params: {
          title: exercise.title,
          duration: exercise.duration,
          contentType: "Exercise",
          gradientColors: JSON.stringify(gradientColors),
        },
      })
    }
  }

  // Render empty state when no exercises are available
  const renderEmptyState = () => {
    return (
      <View style={styles.emptyContainer}>
        {/* <Ionicons name="folder-open-outline" size={64} color="#ccc" /> */}
        <Text style={styles.emptyTitle}>No Exercises Found</Text>
        <Text style={styles.emptyText}>There are no exercises available for this category yet.</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Fixed Header with Back Arrow and Animated Title */}
      <SafeAreaView style={styles.headerContainer}>
        <Animated.View
          style={[
            styles.header,
            {
              backgroundColor: headerBackgroundColor,
              borderBottomWidth: 1,
              borderBottomColor: scrollY.interpolate({
                inputRange: [0, 100],
                outputRange: ["transparent", "#eee"],
                extrapolate: "clamp",
              }),
            },
          ]}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Animated.Text
              style={{
                color: scrollY.interpolate({
                  inputRange: [0, 100],
                  outputRange: ["white", "#000"],
                  extrapolate: "clamp",
                }),
              }}
            >
              <Ionicons name="arrow-back" size={24} />
            </Animated.Text>
          </TouchableOpacity>

          {/* Fixed header title that appears when scrolling */}
          <Animated.Text
            style={[
              styles.headerTitle,
              {
                opacity: headerTitleOpacity,
                color: scrollY.interpolate({
                  inputRange: [0, 100],
                  outputRange: ["white", "#000"],
                  extrapolate: "clamp",
                }),
              },
            ]}
            numberOfLines={1}
          >
            {categoryData?.title || title}
          </Animated.Text>
        </Animated.View>
      </SafeAreaView>

      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        <LinearGradient colors={gradientColors} style={styles.gradientContainer}>
          <View style={styles.headerContent}>
            <Animated.Text
              style={[
                styles.contentCount,
                {
                  opacity: scrollY.interpolate({
                    inputRange: [0, 50],
                    outputRange: [1, 0],
                    extrapolate: "clamp",
                  }),
                },
              ]}
            >
              {categoryData?.count || count} {categoryData?.contentType || contentType}
            </Animated.Text>
            <Animated.Text
              style={[
                styles.title,
                {
                  opacity: scrollY.interpolate({
                    inputRange: [0, 80],
                    outputRange: [1, 0],
                    extrapolate: "clamp",
                  }),
                },
              ]}
            >
              {categoryData?.title || title}
            </Animated.Text>
            <Animated.View
              style={{
                opacity: scrollY.interpolate({
                  inputRange: [0, 50],
                  outputRange: [1, 0],
                  extrapolate: "clamp",
                }),
              }}
            >
              <TouchableOpacity style={styles.unlockButton}>
                <Text style={styles.unlockButtonText}>UNLOCK ALL</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </LinearGradient>

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={gradientColors[0]} />
            <Text style={styles.loadingText}>Loading exercises...</Text>
          </View>
        )}

        {/* Error Message */}
        {error && !isLoading && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={24} color="#f06292" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.exerciseList}>
          {!isLoading && exercises.length === 0
            ? renderEmptyState()
            : exercises.map((exercise) => (
                <TouchableOpacity
                  key={exercise.id}
                  onPress={() => handleExercisePress(exercise)}
                  activeOpacity={exercise.isLocked ? 1 : 0.7} // Only show press effect if not locked
                >
                  <Animated.View style={[styles.exerciseCard, { opacity: fadeAnim }]}>
                    <Image source={{ uri: exercise.image }} style={styles.exerciseImage} />
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseType}>{exercise.type}</Text>
                      <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                      <Text style={styles.exerciseDuration}>{exercise.duration}</Text>
                      {/* {exercise.content && (
                        <Text style={styles.exerciseContent} numberOfLines={2}>
                          {exercise.content}
                        </Text>
                      )} */}
                    </View>
                    <View style={styles.exerciseActions}>
                      {!exercise.isLocked && (
                        <TouchableOpacity style={styles.actionButton}>
                          <Ionicons
                            name={exercise.isFavorite ? "heart" : "heart-outline"}
                            size={24}
                            color={exercise.isFavorite ? "#f06292" : "#666"}
                          />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={styles.actionButton}>
                        <Ionicons name="information-circle-outline" size={24} color="#666" />
                      </TouchableOpacity>
                      {exercise.isLocked && (
                        <View style={styles.lockContainer}>
                          <Ionicons name="lock-closed" size={18} color="white" />
                        </View>
                      )}
                    </View>
                  </Animated.View>
                </TouchableOpacity>
              ))}
        </View>
      </Animated.ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Inter600",
    marginLeft: 10,
  },
  scrollView: {
    flex: 1,
  },
  gradientContainer: {
    paddingTop: 120,
    paddingBottom: 40,
    alignItems: "center",
  },
  headerContent: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  contentCount: {
    fontSize: 16,
    color: "white",
    marginBottom: 8,
    fontFamily: "Inter500",
  },
  title: {
    fontSize: 32,
    color: "white",
    textAlign: "center",
    fontFamily: "Inter700",
    marginBottom: 32,
  },
  unlockButton: {
    backgroundColor: "white",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    minWidth: 200,
    alignItems: "center",
  },
  unlockButtonText: {
    color: "#C25E00",
    fontSize: 16,
    fontFamily: "Inter500",
  },
  exerciseList: {
    padding: 16,
    backgroundColor: "white",
    minHeight: 300, // Ensure there's space for the empty state
  },
  exerciseCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
  },
  exerciseInfo: {
    flex: 1,
    marginLeft: 16,
  },
  exerciseType: {
    fontSize: 14,
    color: "#666",
    fontFamily: "OpenSans500",
    marginBottom: 4,
  },
  exerciseTitle: {
    fontSize: 18,
    color: "#000",
    fontFamily: "OpenSans600",
    marginBottom: 4,
  },
  exerciseDuration: {
    fontSize: 14,
    color: "#666",
    fontFamily: "OpenSans500",
    marginBottom: 4,
  },
  exerciseContent: {
    fontSize: 12,
    color: "#888",
    fontFamily: "OpenSans400",
    marginTop: 4,
  },
  exerciseActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  lockContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#999",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "white",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: "OpenSans400",
    color: "#666",
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#ffebee",
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    marginLeft: 10,
    fontSize: 14,
    fontFamily: "OpenSans400",
    color: "#d32f2f",
    flex: 1,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "OpenSans600",
    color: "#666",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "OpenSans400",
    color: "#888",
    textAlign: "center",
    maxWidth: "80%",
  },
})

export default ExerciseDetailScreen
