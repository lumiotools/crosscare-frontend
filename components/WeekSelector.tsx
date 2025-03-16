//

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { View, TouchableOpacity, Text, ScrollView, StyleSheet, Animated, Image, Dimensions } from "react-native"

interface WeekSelectorProps {
  onWeekChange?: (week: string, fruitData: FruitData) => void
  initialWeek?: string
}

interface FruitData {
  name: string
  imageUrl: string
  weight: string
  length: string
}

// Update the WeekSelector component to handle undefined initialWeek
const WeekSelector: React.FC<WeekSelectorProps> = ({
  onWeekChange,
  initialWeek = "8", // Provide a default value of "8"
}) => {
  const [selectedWeek, setSelectedWeek] = useState(initialWeek || "8")
  const scrollViewRef = useRef<ScrollView>(null)
  const scaleValue = new Animated.Value(0)
  const screenWidth = Dimensions.get("window").width

  // Mapping of weeks to fruits/vegetables with their data
  const weekToFruitMap: Record<string, FruitData> = {
    "4": {
      name: "poppy seed",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/5016/5016784.png",
      weight: "<1g",
      length: "0.1cm",
    },
    "5": {
      name: "sesame seed",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/5016/5016784.png",
      weight: "<1g",
      length: "0.2cm",
    },
    "6": {
      name: "lentil",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/2224/2224241.png",
      weight: "<1g",
      length: "0.4cm",
    },
    "7": {
      name: "blueberry",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866569.png",
      weight: "<1g",
      length: "1cm",
    },
    "8": {
      name: "cherry",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/590/590685.png",
      weight: "1g",
      length: "1.6cm",
    },
    "9": {
      name: "grape",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/2224/2224116.png",
      weight: "2g",
      length: "2.3cm",
    },
    "10": {
      name: "kumquat",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866584.png",
      weight: "5g",
      length: "3.1cm",
    },
    "11": {
      name: "fig",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866594.png",
      weight: "8g",
      length: "4.1cm",
    },
    "12": {
      name: "lime",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866591.png",
      weight: "14g",
      length: "5.4cm",
    },
    "13": {
      name: "lemon",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866592.png",
      weight: "23g",
      length: "7.4cm",
    },
    "14": {
      name: "peach",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866595.png",
      weight: "43g",
      length: "8.7cm",
    },
    "15": {
      name: "apple",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/415/415682.png",
      weight: "70g",
      length: "10.1cm",
    },
    "16": {
      name: "avocado",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866572.png",
      weight: "100g",
      length: "11.6cm",
    },
    "17": {
      name: "pear",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866596.png",
      weight: "140g",
      length: "13cm",
    },
    "18": {
      name: "bell pepper",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866574.png",
      weight: "190g",
      length: "14.2cm",
    },
    "19": {
      name: "mango",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866593.png",
      weight: "240g",
      length: "15.3cm",
    },
    "20": {
      name: "banana",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866573.png",
      weight: "300g",
      length: "16.4cm",
    },
    "21": {
      name: "pomegranate",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866597.png",
      weight: "360g",
      length: "26.7cm",
    },
    "22": {
      name: "papaya",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866598.png",
      weight: "430g",
      length: "27.8cm",
    },
    "23": {
      name: "grapefruit",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866599.png",
      weight: "500g",
      length: "28.9cm",
    },
    "24": {
      name: "cantaloupe",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866600.png",
      weight: "600g",
      length: "30cm",
    },
    "25": {
      name: "cauliflower",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866601.png",
      weight: "660g",
      length: "34.6cm",
    },
    "26": {
      name: "lettuce",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866602.png",
      weight: "760g",
      length: "35.6cm",
    },
    "27": {
      name: "cabbage",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866603.png",
      weight: "875g",
      length: "36.6cm",
    },
    "28": {
      name: "eggplant",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866604.png",
      weight: "1kg",
      length: "37.6cm",
    },
    "29": {
      name: "butternut squash",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866605.png",
      weight: "1.15kg",
      length: "38.6cm",
    },
    "30": {
      name: "cucumber",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866606.png",
      weight: "1.3kg",
      length: "39.9cm",
    },
    "31": {
      name: "coconut",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866607.png",
      weight: "1.5kg",
      length: "41.1cm",
    },
    "32": {
      name: "pineapple",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866608.png",
      weight: "1.7kg",
      length: "42.4cm",
    },
    "33": {
      name: "honeydew melon",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866609.png",
      weight: "1.9kg",
      length: "43.7cm",
    },
    "34": {
      name: "cantaloupe",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866610.png",
      weight: "2.1kg",
      length: "45cm",
    },
    "35": {
      name: "honeydew melon",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866611.png",
      weight: "2.4kg",
      length: "46.2cm",
    },
    "36": {
      name: "romaine lettuce",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866612.png",
      weight: "2.6kg",
      length: "47.4cm",
    },
    "37": {
      name: "swiss chard",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866613.png",
      weight: "2.9kg",
      length: "48.6cm",
    },
    "38": {
      name: "leek",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866614.png",
      weight: "3.1kg",
      length: "49.8cm",
    },
    "39": {
      name: "watermelon",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866615.png",
      weight: "3.3kg",
      length: "50.7cm",
    },
    "40": {
      name: "pumpkin",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/6866/6866616.png",
      weight: "3.5kg",
      length: "51.2cm",
    },
  }

  // Default to week 8 if the selected week doesn't have data
  const getDefaultFruit = (): FruitData => {
    return {
      name: "cherry",
      imageUrl: "https://cdn-icons-png.flaticon.com/512/590/590685.png",
      weight: "1g",
      length: "1.6cm",
    }
  }

  // Get fruit data for the selected week
  const getFruitForWeek = (week: string): FruitData => {
    return weekToFruitMap[week] || getDefaultFruit()
  }

  useEffect(() => {
    // Notify parent component when week changes
    if (onWeekChange && selectedWeek) {
      onWeekChange(selectedWeek, getFruitForWeek(selectedWeek))
    }
  }, [selectedWeek])

  useEffect(() => {
    if (initialWeek && initialWeek !== selectedWeek) {
      setSelectedWeek(initialWeek)
    }
  }, [initialWeek])

  useEffect(() => {
    // Scroll to the selected week when component mounts
    if (scrollViewRef.current) {
      const weekNumber = Number.parseInt(selectedWeek)
      const scrollToX = (weekNumber - 1) * 60 // Approximate position

      // Add a small delay to ensure the ScrollView is fully rendered
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: scrollToX, animated: true })
      }, 100)
    }
  }, [])

  const handlePress = (week: string) => {
    setSelectedWeek(week)

    // Scroll to center the selected week
    if (scrollViewRef.current) {
      const weekNumber = Number.parseInt(week)
      const scrollToX = (weekNumber - 1) * 60 // Approximate position
      scrollViewRef.current.scrollTo({ x: scrollToX, animated: true })
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.fruitInfoContainer}>
        <Image source={{ uri: getFruitForWeek(selectedWeek).imageUrl }} style={styles.fruitImage} />
        <Text style={styles.fruitText}>Your baby is the size of a {getFruitForWeek(selectedWeek).name}!</Text>
      </View>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scaleValue } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {Array.from({ length: 40 }, (_, index) => index + 1).map((week) => {
          const weekStr = week.toString()
          const isSelected = weekStr === selectedWeek

          // Calculate scale based on scroll position
          const scale = scaleValue.interpolate({
            inputRange: [(week - 2) * 60, (week - 1) * 60, week * 60],
            outputRange: [1, 1.2, 1],
            extrapolate: "clamp",
          })

          return (
            <TouchableOpacity
              key={week}
              style={[
                styles.weekButton,
                {
                  borderWidth: 2,
                  borderColor: isSelected ? "white" : "#FFFFFF7C",
                  backgroundColor: isSelected ? "#F76CCF" : "#FFFFFF1A",
                  transform: [{ scale: isSelected ? 1 : 0.8 }],
                },
              ]}
              onPress={() => handlePress(weekStr)}
            >
              <Text style={styles.weekText}>{week}</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  scrollContainer: {
    flexDirection: "row",
    paddingHorizontal: 160,
    paddingVertical: 10,
  },
  weekButton: {
    alignItems: "center",
    borderRadius: 999,
    width: 50,
    height: 50,
    justifyContent: "center",
    margin: 5,
  },
  weekText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily:'Inter600'
  },
  fruitInfoContainer: {
    alignItems: "center",
    marginTop: 15,
    marginBottom: 10,
  },
  fruitImage: {
    width: 60,
    height: 60,
    marginBottom: 10,
  },
  fruitText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily:'Inter700',
    letterSpacing:1.26,
    textAlign: "center",
  },
})

export default WeekSelector

