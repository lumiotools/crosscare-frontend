import {
  StyleSheet,
  StatusBar,
  Text,
  View,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Dimensions,
  TouchableOpacity,
  Platform,
  FlatList,
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { SimpleLineIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { onBoardingData } from "@/constants/constant";
import { Image } from "react-native";
import { Colors } from "@/constants/Colors";
import { useNavigation } from "expo-router";
import LogoSvg from "@/assets/images/Svg/LogoSvg";
import { width } from "@/constants/helper";
import { SafeAreaView } from "react-native-safe-area-context";
import GradientText from "@/components/GradientText";
import { LinearGradient } from "expo-linear-gradient";
import { requestNotificationPermissions } from "@/utils/NotificationManager";

export default function OnBoardingScreen() {
  const router = useRouter();
  const [active, setActive] = useState(0);
  const screenWidth = Dimensions.get("window").width;
  const flatListRef = useRef<FlatList>(null);
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / screenWidth);
    setActive(currentIndex);
  };

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  const handleSkip = async () => {
    console.log("done");
    await AsyncStorage.setItem("hasOnboarded", "true");
    router.replace("/login");
  };

  const handleBack = () => {
    const nextIndex = active - 1;
    if (nextIndex >= 0) {
      setActive(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex });
    }
  };

  const handleNext = () => {
    const nextIndex = active + 1;
    if (nextIndex < onBoardingData.length) {
      setActive(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex });
    }
  };

  const handleGetStarted = () => {
    router.replace("/login");
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <View key={index} style={[styles.slide, { width: screenWidth }]}>
      <Image
        source={item.image}
        style={{
          width: Platform.OS === "ios" ? screenWidth * 0.85 : screenWidth * 0.9, // Responsive width
          height:
            Platform.OS === "ios" ? screenWidth * 0.85 : screenWidth * 0.9, // Responsive height
          alignSelf: "center",
          marginTop: Platform.OS === "android" ? 30 : 0,
        }}
      />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <LogoSvg width={width * 70} height={width * 70} />
        <Text onPress={handleSkip} style={styles.skip}>
          Skip
        </Text>
      </View>

      {/* Onboarding Content */}
      <View
        style={{
          flex: 1,
        }}
      >
        <FlatList
          ref={flatListRef}
          data={onBoardingData}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          onMomentumScrollEnd={handleScroll} // Update on scrolling completion
          scrollEventThrottle={16}
        />

        {/* Indicator Dots */}
        <View style={styles.indicatorContainer}>
          {onBoardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                {
                  width: index === active ? 10 : 8,
                  height: index === active ? 10 : 8,
                  backgroundColor:
                    index === active
                      ? Colors.secondaryColor_200
                      : Colors.neutralColor_50,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View
        style={[
          styles.footer,
          { justifyContent: active === 0 ? "flex-end" : "space-between" }, // Conditionally align items
        ]}
      >
        {active !== 0 && (
          <TouchableOpacity onPress={handleBack}>
            <Text
              style={{
                color: Colors.neutralColor_300,
                fontSize: width * 18,
              }}
            >
              Back
            </Text>
          </TouchableOpacity>
        )}
        {active !== 2 ? (
          <TouchableOpacity
            style={styles.nextText}
            onPress={handleNext}
          >
            <GradientText
              text="NEXT"
              colors={["#E05FA0", "#87247D"]}
              style={{ fontSize: width * 16, fontFamily: "DmSans500" }}
            />
            <SimpleLineIcons
              name="arrow-right"
              size={width * 16}
              color={Colors.primaryColor_500}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleGetStarted}>
            <LinearGradient
              colors={["#E05FA0", "#87247D"]}
              start={{
                x: 0,
                y: 0,
              }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingHorizontal: width * 16,
                paddingVertical: width * 10,
                backgroundColor: Colors.primaryColor_50,
                borderRadius: 99,
                borderWidth: 1,
                borderColor: Colors.primaryColor_200,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Text
                style={{
                  fontSize: width * 16,
                  fontFamily: "DmSans500",
                  color: Colors.neutralWhiteColor_100,
                }}
              >
                GET STARTED
              </Text>
              <SimpleLineIcons
                name="arrow-right"
                size={width * 16}
                color={Colors.neutralWhiteColor_100}
              />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  skip: {
    fontSize: 16,
    fontFamily: "DMSans500",
    color: Colors.neutralColor_200,
  },
  slide: {
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  nextText:{
    paddingHorizontal: width * 16,
    paddingVertical: width * 10,
    backgroundColor: Colors.primaryColor_50,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: Colors.primaryColor_300,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  title: {
    fontSize: width * 14,
    marginHorizontal: 40,
    // marginTop: 30,
    borderWidth: 1,
    padding: width * 16,
    borderBottomRightRadius: 32,
    borderBottomLeftRadius: 32,
    borderTopLeftRadius: 32,
    backgroundColor: Colors.primaryColor_50,
    fontFamily: "Satoshi500",
    borderColor: Colors.secondaryColor_100,
    color: Colors.primaryColor_600,
  },
  description: {
    fontSize: width * 14,
    color: Colors.neutralWhiteColor_900,
    textAlign: "left",
    fontFamily: "DMSans400",
    marginTop: 20,
    marginHorizontal: 40,
  },
  indicatorContainer: {
    bottom: 30,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: width * 20,
    paddingTop: Platform.OS === "android" ? width * 16 : width * 10,
    paddingBottom: Platform.OS === "android" ? width * 28 : width * 18,
    borderTopWidth: 1,
    borderTopColor: Colors.neutralWhiteColor_600,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 100,
  },
});
