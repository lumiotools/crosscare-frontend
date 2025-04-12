//

import BananaIcon from "@/assets/images/Svg/FruitsIcons/BananaIcon"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { View, TouchableOpacity, Text, ScrollView, StyleSheet, Animated, Image, Dimensions } from "react-native"
import { width, height } from '../constants/helper';
import BlueBerryIcon from "@/assets/images/Svg/FruitsIcons/BlueBerryIcon";
import GrapesIcon from "@/assets/images/Svg/FruitsIcons/GrapesIcon";
import PeachIcon from "@/assets/images/Svg/FruitsIcons/PeachIcon";
import LemonIcon from "@/assets/images/Svg/FruitsIcons/LemonIcon";
import AppleIcons from "@/assets/images/Svg/FruitsIcons/AppleIcons";
import AvocadoIcon from "@/assets/images/Svg/FruitsIcons/AvocadoIcon";
import PearIcon from "@/assets/images/Svg/FruitsIcons/PearIcon";
import MangoIcon from "@/assets/images/Svg/FruitsIcons/MangoIcon";
import PomegranateIcon from "@/assets/images/Svg/FruitsIcons/PomegranateIcon";
import GrapesFruitIcon from "@/assets/images/Svg/FruitsIcons/GrapesFruitsIcon";
import CoconutIcon from "@/assets/images/Svg/FruitsIcons/CoconutIcon";
import PineAppleIcon from "@/assets/images/Svg/FruitsIcons/PineAppleIcon";
import WaterMelonIcon from "@/assets/images/Svg/FruitsIcons/WaterMelonIcon";
import StrawBerry from "@/assets/images/Svg/FruitsIcons/StrawBerry";
import PoppySeedIcon from "@/assets/images/Svg/FruitsIcons/PoppySeedIcon";
import SesameSeedIcon from "@/assets/images/Svg/FruitsIcons/SesameSeedIcon";
import LentilIcon from "@/assets/images/Svg/FruitsIcons/LentilIcon";
import AppleSeedIcon from "@/assets/images/Svg/FruitsIcons/AppleSeedIcon";
import PeaIcon from "@/assets/images/Svg/FruitsIcons/PeaIcon";
import RaspBerryIcon from "@/assets/images/Svg/FruitsIcons/RaspBerryIcon";
import Kumquat from "@/assets/images/Svg/FruitsIcons/Kumquat";
import PlumIcon from "@/assets/images/Svg/FruitsIcons/PlumIcon";
import LimeIcon from "@/assets/images/Svg/FruitsIcons/LimeIcon";
import SweetPotato from "@/assets/images/Svg/FruitsIcons/SweetPotato";
import Papaya from "@/assets/images/Svg/FruitsIcons/Papaya";
import Cantaloupe from "@/assets/images/Svg/FruitsIcons/Cantaloupe";
import Cauliflower from "@/assets/images/Svg/FruitsIcons/Cauliflower";
import Lettuce from "@/assets/images/Svg/FruitsIcons/Lettuce";
import Eggplant from "@/assets/images/Svg/FruitsIcons/Eggplant";
import ButterSquash from "@/assets/images/Svg/FruitsIcons/ButterSquash";
import Cucumber from "@/assets/images/Svg/FruitsIcons/Cucumber";
import Durian from "@/assets/images/Svg/FruitsIcons/Durian";
import HoneyDewMelon from "@/assets/images/Svg/FruitsIcons/HoneyDewMelon";
import SwissChard from "@/assets/images/Svg/FruitsIcons/SwissChard";
import Pumpkin from "@/assets/images/Svg/FruitsIcons/Pumpkin";

interface WeekSelectorProps {
  onWeekChange?: (week: string, fruitData: FruitData) => void
  initialWeek?: string
}

interface FruitData {
  name: string
  imageUrl: string | React.ReactNode
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
    "1": {
      name: "Poppy seed",
      imageUrl: <PoppySeedIcon width={40} height={40}/>,
      weight: "<1g",
      length: "0.1cm",
    },
    "2": {
      name: "Sesame seed",
      imageUrl: <SesameSeedIcon width={42} height={42}/>,
      weight: "<1g",
      length: "0.1cm",
    },
    "3": {
      name: "Lnetil seed",
      imageUrl: <LentilIcon width={44} height={44}/>,
      weight: "<1g",
      length: "0.1cm",
    },
    "4": {
      name: "Poppy seed",
      imageUrl: <PoppySeedIcon width={46} height={46}/>,
      weight: "<1g",
      length: "0.1cm",
    },
    "5": {
      name: "Apple Seed",
      imageUrl: <AppleSeedIcon width={48} height={48}/>,
      weight: "<1g",
      length: "0.2cm",
    },
    "6": {
      name: "Pea",
      imageUrl: <PeaIcon width={50} height={50}/>,
      weight: "<1g",
      length: "0.4cm",
    },
    "7": {
      name: "Blueberry",
      imageUrl: <BlueBerryIcon width={52} height={52}/>,
      weight: "<1g",
      length: "1cm",
    },
    "8": {
      name: "Raspberry",
      imageUrl: <RaspBerryIcon width={54} height={54}/>,
      weight: "1g",
      length: "1.6cm",
    },
    "9": {
      name: "Grape",
      imageUrl: <GrapesIcon width={56} height={56}/>,
      weight: "2g",
      length: "2.3cm",
    },
    "10": {
      name: "Kumquat",
      imageUrl: <Kumquat width={58} height={58}/>,
      weight: "5g",
      length: "3.1cm",
    },
    "11": {
      name: "Lime",
      imageUrl: <LimeIcon width={60} height={60}/>,
      weight: "14g",
      length: "5.4cm",
    },
    "12": {
      name: "Plum",
      imageUrl: <PlumIcon width={62} height={62}/>,
      weight: "14g",
      length: "5.4cm",
    },
    "13": {
      name: "Peach",
      imageUrl: <PeachIcon width={64} height={64}/>,
      weight: "23g",
      length: "7.4cm",
    },
    "14": {
      name: "Lemon",
      imageUrl: <LemonIcon width={66} height={66}/>,
      weight: "43g",
      length: "8.7cm",
    },
    "15": {
      name: "Apple",
      imageUrl: <AppleIcons width={68} height={68}/>,
      weight: "70g",
      length: "10.1cm",
    },
    "16": {
      name: "Avocado",
      imageUrl: <AvocadoIcon width={70} height={70}/>,
      weight: "100g",
      length: "11.6cm",
    },
    "17": {
      name: "Pear",
      imageUrl: <PearIcon width={72} height={72}/>,
      weight: "140g",
      length: "13cm",
    },
    "18": {
      name: "Sweet Potato",
      imageUrl: <SweetPotato width={74} height={74}/>,
      weight: "190g",
      length: "14.2cm",
    },
    "19": {
      name: "Mango",
      imageUrl: <MangoIcon width={76} height={76}/>,
      weight: "240g",
      length: "15.3cm",
    },
    "20": {
      name: "Banana",
      imageUrl: <BananaIcon width={78} height={78} />,
      weight: "300g",
      length: "16.4cm",
    },
    "21": {
      name: "Pomegranate",
      imageUrl: <PomegranateIcon width={80} height={80}/>,
      weight: "360g",
      length: "26.7cm",
    },
    "22": {
      name: "Papaya",
      imageUrl: <Papaya width={83} height={83}/>,
      weight: "430g",
      length: "27.8cm",
    },
    "23": {
      name: "Grapefruit",
      imageUrl: <GrapesFruitIcon width={86} height={86}/>,
      weight: "500g",
      length: "28.9cm",
    },
    "24": {
      name: "Cantaloupe",
      imageUrl: <Cantaloupe width={89} height={89}/>,
      weight: "600g",
      length: "30cm",
    },
    "25": {
      name: "Cauliflower",
      imageUrl: <Cauliflower width={92} height={92}/>,
      weight: "660g",
      length: "34.6cm",
    },
    "26": {
      name: "Lettuce",
      imageUrl: <Lettuce width={95} height={95}/>,
      weight: "760g",
      length: "35.6cm",
    },
    "27": {
      name: "Eggplant",
      imageUrl: <Eggplant width={98} height={98}/>,
      weight: "875g",
      length: "36.6cm",
    },
    "28": {
      name: "Coconut",
      imageUrl: <CoconutIcon width={102} height={102}/>,
      weight: "1kg",
      length: "37.6cm",
    },
    "29": {
      name: "Butternut Squash",
      imageUrl: <ButterSquash width={105} height={105}/>,
      weight: "1.15kg",
      length: "38.6cm",
    },
    "30": {
      name: "Cabbage",
      imageUrl: <Cucumber width={108} height={108}/>,
      weight: "1.3kg",
      length: "39.9cm",
    },
    "31": {
      name: "Pineapple",
      imageUrl: <PineAppleIcon width={111} height={111}/>,
      weight: "1.5kg",
      length: "41.1cm",
    },
    "32": {
      name: "Squash",
      imageUrl: <ButterSquash width={114} height={114}/>,
      weight: "1.7kg",
      length: "42.4cm",
    },
    "33": {
      name: "Durian",
      imageUrl: <Durian width={117} height={117}/>,
      weight: "1.9kg",
      length: "43.7cm",
    },
    "34": {
      name: "HoneyDew Melon",
      imageUrl: <HoneyDewMelon width={125} height={125}/>,
      weight: "2.1kg",
      length: "45cm",
    },
    "35": {
      name: "Coconut",
      imageUrl: <CoconutIcon width={130} height={130}/>,
      weight: "2.4kg",
      length: "46.2cm",
    },
    "36": {
      name: "Watermelon",
      imageUrl: <WaterMelonIcon width={135} height={135}/>,
      weight: "2.6kg",
      length: "47.4cm",
    },
    "37": {
      name: "Swiss Chard",
      imageUrl: <SwissChard width={140} height={140}/>,
      weight: "2.9kg",
      length: "48.6cm",
    },
    "38": {
      name: "Pumpkin",
      imageUrl: <Pumpkin width={145} height={145}/>,
      weight: "3.1kg",
      length: "49.8cm",
    },
    "39": {
      name: "Watermelon",
      imageUrl: <WaterMelonIcon width={150} height={150}/>,
      weight: "3.3kg",
      length: "50.7cm",
    },
    "40": {
      name: "Small Pumpkin",
      imageUrl: <Pumpkin width={155} height={155}/>,
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
      {getFruitForWeek(selectedWeek).imageUrl}
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

