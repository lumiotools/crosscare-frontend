import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Dimensions,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Svg, { Path } from "react-native-svg";
import MoonIcon from "@/assets/images/Svg/MoonIcon";
import SunIcon from "@/assets/images/Svg/SunIcon";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2; // 2 columns with 16px padding on sides and middle

// Moon Icon Component
const HappyFace = (props: any) => (
  <Svg width="25" height="24" viewBox="0 0 25 24" fill="none">
    <Path
      d="M12.5 22C6.977 22 2.5 17.523 2.5 12C2.5 6.477 6.977 2 12.5 2C18.023 2 22.5 6.477 22.5 12C22.5 17.523 18.023 22 12.5 22ZM12.5 20C14.6217 20 16.6566 19.1571 18.1569 17.6569C19.6571 16.1566 20.5 14.1217 20.5 12C20.5 9.87827 19.6571 7.84344 18.1569 6.34315C16.6566 4.84285 14.6217 4 12.5 4C10.3783 4 8.34344 4.84285 6.84315 6.34315C5.34285 7.84344 4.5 9.87827 4.5 12C4.5 14.1217 5.34285 16.1566 6.84315 17.6569C8.34344 19.1571 10.3783 20 12.5 20ZM8.5 13H16.5C16.5 14.0609 16.0786 15.0783 15.3284 15.8284C14.5783 16.5786 13.5609 17 12.5 17C11.4391 17 10.4217 16.5786 9.67157 15.8284C8.92143 15.0783 8.5 14.0609 8.5 13ZM8.5 11C8.10218 11 7.72064 10.842 7.43934 10.5607C7.15804 10.2794 7 9.89782 7 9.5C7 9.10218 7.15804 8.72064 7.43934 8.43934C7.72064 8.15804 8.10218 8 8.5 8C8.89782 8 9.27936 8.15804 9.56066 8.43934C9.84196 8.72064 10 9.10218 10 9.5C10 9.89782 9.84196 10.2794 9.56066 10.5607C9.27936 10.842 8.89782 11 8.5 11ZM16.5 11C16.1022 11 15.7206 10.842 15.4393 10.5607C15.158 10.2794 15 9.89782 15 9.5C15 9.10218 15.158 8.72064 15.4393 8.43934C15.7206 8.15804 16.1022 8 16.5 8C16.8978 8 17.2794 8.15804 17.5607 8.43934C17.842 8.72064 18 9.10218 18 9.5C18 9.89782 17.842 10.2794 17.5607 10.5607C17.2794 10.842 16.8978 11 16.5 11Z"
      fill="#52E186"
    />
  </Svg>
);

const NeutralFace = (prop: any) => (
  <Svg width="25" height="24" viewBox="0 0 25 24" fill="none">
    <Path
      d="M12.5 22C6.977 22 2.5 17.523 2.5 12C2.5 6.477 6.977 2 12.5 2C18.023 2 22.5 6.477 22.5 12C22.5 17.523 18.023 22 12.5 22ZM12.5 20C14.6217 20 16.6566 19.1571 18.1569 17.6569C19.6571 16.1566 20.5 14.1217 20.5 12C20.5 9.87827 19.6571 7.84344 18.1569 6.34315C16.6566 4.84285 14.6217 4 12.5 4C10.3783 4 8.34344 4.84285 6.84315 6.34315C5.34285 7.84344 4.5 9.87827 4.5 12C4.5 14.1217 5.34285 16.1566 6.84315 17.6569C8.34344 19.1571 10.3783 20 12.5 20ZM8.5 14H16.5V16H8.5V14ZM8.5 11C8.10218 11 7.72064 10.842 7.43934 10.5607C7.15804 10.2794 7 9.89782 7 9.5C7 9.10218 7.15804 8.72064 7.43934 8.43934C7.72064 8.15804 8.10218 8 8.5 8C8.89782 8 9.27936 8.15804 9.56066 8.43934C9.84196 8.72064 10 9.10218 10 9.5C10 9.89782 9.84196 10.2794 9.56066 10.5607C9.27936 10.842 8.89782 11 8.5 11ZM16.5 11C16.1022 11 15.7206 10.842 15.4393 10.5607C15.158 10.2794 15 9.89782 15 9.5C15 9.10218 15.158 8.72064 15.4393 8.43934C15.7206 8.15804 16.1022 8 16.5 8C16.8978 8 17.2794 8.15804 17.5607 8.43934C17.842 8.72064 18 9.10218 18 9.5C18 9.89782 17.842 10.2794 17.5607 10.5607C17.2794 10.842 16.8978 11 16.5 11Z"
      fill="#FFD764"
    />
  </Svg>
);

const SadFace = (props: any) => (
  <Svg width="25" height="24" viewBox="0 0 25 24" fill="none">
    <Path
      d="M12.5 2C18.023 2 22.5 6.477 22.5 12C22.5 12.727 22.423 13.435 22.275 14.118L20.493 12.335C20.5664 10.5798 20.0599 8.84915 19.0519 7.41037C18.0438 5.97159 16.5902 4.90464 14.9154 4.37422C13.2406 3.84381 11.4377 3.87943 9.78521 4.47559C8.13267 5.07175 6.72231 6.19529 5.77187 7.67277C4.82143 9.15025 4.38375 10.8995 4.5264 12.6505C4.66905 14.4015 5.3841 16.0568 6.56116 17.361C7.73822 18.6651 9.31184 19.5455 11.0391 19.8664C12.7663 20.1872 14.5511 19.9305 16.118 19.136C16.4997 19.7409 17.0367 20.2323 17.673 20.559C16.1132 21.5041 14.3238 22.0025 12.5 22C6.977 22 2.5 17.523 2.5 12C2.5 6.477 6.977 2 12.5 2ZM19.5 14.172L20.914 15.586C21.1893 15.8612 21.3783 16.2107 21.4578 16.5916C21.5374 16.9726 21.504 17.3685 21.3619 17.7309C21.2198 18.0932 20.975 18.4062 20.6576 18.6314C20.3402 18.8567 19.964 18.9845 19.5751 18.9991C19.1861 19.0137 18.8014 18.9145 18.468 18.7136C18.1346 18.5128 17.8671 18.2191 17.6982 17.8684C17.5293 17.5178 17.4664 17.1255 17.5171 16.7396C17.5679 16.3537 17.7301 15.991 17.984 15.696L18.086 15.586L19.5 14.172ZM12.5 15C13.966 15 15.285 15.631 16.2 16.637L15.255 17.497C14.465 17.182 13.518 17 12.5 17C11.482 17 10.535 17.183 9.745 17.496L8.8 16.636C9.26821 16.1199 9.83937 15.7077 10.4767 15.426C11.1139 15.1442 11.8032 14.9991 12.5 15ZM9 10C9.39782 10 9.77936 10.158 10.0607 10.4393C10.342 10.7206 10.5 11.1022 10.5 11.5C10.5 11.8978 10.342 12.2794 10.0607 12.5607C9.77936 12.842 9.39782 13 9 13C8.60218 13 8.22064 12.842 7.93934 12.5607C7.65804 12.2794 7.5 11.8978 7.5 11.5C7.5 11.1022 7.65804 10.7206 7.93934 10.4393C8.22064 10.158 8.60218 10 9 10ZM16 10C16.3978 10 16.7794 10.158 17.0607 10.4393C17.342 10.7206 17.5 11.1022 17.5 11.5C17.5 11.8978 17.342 12.2794 17.0607 12.5607C16.7794 12.842 16.3978 13 16 13C15.6022 13 15.2206 12.842 14.9393 12.5607C14.658 12.2794 14.5 11.8978 14.5 11.5C14.5 11.1022 14.658 10.7206 14.9393 10.4393C15.2206 10.158 15.6022 10 16 10Z"
      fill="#001F3E"
    />
  </Svg>
);

interface WakeUpTime {
  time: string;
  cycles: number;
  hours: number;
  mood: "happy" | "neutral" | "sad";
  color: string;
}

const sleepup = () => {

    const params = useLocalSearchParams();
    console.log(params);
    const {t} = useTranslation();

  // Parse parameters passed from the previous screen
  const sleepTime = (params.sleepTime as string) || "11:00 PM"

  const wakeUpTimes = useMemo(() => {
      try {
        if (params.wakeupTimes) {
          return JSON.parse(params.wakeupTimes as string).map((item: any) => ({
            ...item,
            mood: item.mood as "happy" | "neutral" | "sad"
          })) as WakeUpTime[]
        }
      } catch (error) {
        console.error("Error parsing wakeupTimes:", error)
      }
  
      // Default times if parsing fails
      return [
        {
          time: "08:15 AM",
          cycles: 6,
          hours: 9,
          mood: "happy" as "happy",
          color: "#52E186",
        },
        {
          time: "06:45 AM",
          cycles: 5,
          hours: 7.5,
          mood: "happy" as "happy",
          color: "#52E186",
        },
        {
          time: "05:15 AM",
          cycles: 4,
          hours: 6,
          mood: "neutral" as "neutral",
          color: "#FFD764",
        },
        {
          time: "03:45 AM",
          cycles: 3,
          hours: 4.5,
          mood: "neutral" as "neutral",
          color: "#FFD764",
        },
        {
          time: "02:15 AM",
          cycles: 2,
          hours: 3,
          mood: "sad" as "sad",
          color: "#FF7575",
        },
        {
          time: "12:45 AM",
          cycles: 1,
          hours: 1.5,
          mood: "sad" as "sad",
          color: "#FF7575",
        },
      ]
    }, [params.wakeupTimes])

  const renderFace = (mood: "happy" | "neutral" | "sad"): JSX.Element | null => {
    switch (mood) {
      case "happy":
        return <HappyFace />
      case "neutral":
        return <NeutralFace />
      case "sad":
        return <SadFace />
      default:
        return null
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("wakeup.trackSleep")}</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Feather name="more-vertical" size={20} color="#E5E5E5" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Moon Icon Circle */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <View style={styles.moonIcon}>
              <MoonIcon width={88} height={88} />
            </View>
          </View>
        </View>

        {/* Sleep Time */}
        <View style={styles.sleepTimeContainer}>
          <Text style={styles.sleepAtText}>{t("wakeup.sleepAt")}</Text>
          <TouchableOpacity
            style={{
              paddingHorizontal: 8,
              paddingVertical: 6,
              borderWidth: 2,
              borderColor: "#E6EBF0",
              borderRadius: 99,
              backgroundColor: "#547698",
              boxShadow: "0px 0px 4px 0px rgba(255, 255, 255, 0.25);",
            }}
            // onPress={() => setShowSleepPicker(true)}
          >
            <Text
              style={{
                color: "#E6EBF0",
                fontSize: 16,
                fontFamily: "Inter600",
              }}
            >
              {sleepTime}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Best Times Section */}
        <Text style={styles.sectionTitle}>{t("wakeup.bestTimesToWakeUp")}</Text>

        <View style={styles.gridContainer}>
          {wakeUpTimes.map((item, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.cardIcon}>{renderFace(item.mood)}</View>
              <Text style={styles.cardTime}>{item.time}</Text>
              <Text style={styles.cardCycles}>
                {item.cycles} {t("wakeup.cycles")}
              </Text>
              <Text style={styles.cardHours}>
                {item.hours} {t("wakeup.hr")}
              </Text>
            </View>
          ))}
        </View>

        {/* How It Works Section */}
        <View style={styles.howItWorksContainer}>
          <Text style={styles.howItWorksTitle}>{t("wakeup.howItWorks")}</Text>
         {(t("wakeup.howItWorksPoints", { returnObjects: true }) as string[]).map((point, index) => (
            <View key={index} style={styles.bulletPoint}>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.bulletText}>{point}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#001F3E",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
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
    backgroundColor: "#547698",
    justifyContent: "center",
    borderWidth: 5,
    borderColor: "#E6EBF0",
    boxShadow: "0px 0px 4px 0px rgba(0, 0, 0, 0.10);",
    alignItems: "center",
  },
  moonIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    color: "white",
    fontFamily: "DMSans600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  moonContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 32,
  },
  moonCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  sleepTimeContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 32,
    gap: 12,
    marginTop: 20,
  },
  menuButton: {
    padding: 8,
  },
  sleepAtText: {
    fontSize: 16,
    color: "#fff",
    fontFamily: "Inter600",
  },
  timeButton: {
    backgroundColor: "rgba(100, 181, 246, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timeText: {
    fontSize: 18,
    color: "#64B5F6",
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#fff",
    fontFamily: "Inter600",
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    // marginBottom: 32,
    paddingHorizontal:23,
    paddingVertical:23,
  },
  card: {
    width: 120,
    height:120,
    // marginHorizontal:20,
    backgroundColor: "rgba(138, 161, 185, 0.60);",
    borderRadius: 12,
    // padding: 16,
    justifyContent:'center',
    alignItems:'center',
    paddingHorizontal:21,
    paddingVertical:2,
    marginBottom: 18,
  },
  cardIcon: {
    width: 24,
    height: 24,
    borderRadius: 16,
    // backgroundColor: "rgba(100, 181, 246, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTime: {
    fontSize: 16,
    color: "#E5E5E5",
    marginBottom: 4,
    fontFamily:'Inter700'
  },
  cardCycles: {
    fontSize: 14,
    fontFamily:'Inter600',
    color: "#E5E5E5",
    marginBottom: 4,
  },
  cardHours: {
    fontSize: 12,
    color: "#E5E5E5",
    fontFamily:'Inter600',
  },
  howItWorksContainer: {
    marginBottom: 20,
    // paddingHorizontal:25,
  },
  howItWorksTitle: {
    fontSize: 12,
    lineHeight:22,
    fontFamily:'Inter400',
    color: "#E5E5E5",
    // marginBottom: ,
  },
  bulletPoint: {
    flexDirection: "row",
    // marginBottom: 4,
  },
  bulletDot: {
    fontSize: 16,
    color: "#E5E5E5",
    marginRight: 8,
    marginTop: 0,
  },
  bulletText: {
    fontSize: 12,
    lineHeight:22,
    color: "#E5E5E5",
    fontFamily:'Inter300',
    flex: 1,
  },
});

export default sleepup;
