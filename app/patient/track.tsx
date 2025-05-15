import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import WeekSelector from "@/components/WeekSelector";
import { useTranslation } from "react-i18next";

interface Section {
  id: number
  title: string
  content?: string
  backgroundColor: string
}

interface FruitData {
  name: string
  imageUrl: string | React.ReactNode
  weight: string
  length: string
}

export default function track() {
  const router = useRouter();
  const {t} = useTranslation();

  const [selectedWeek, setSelectedWeek] = useState<string | undefined>(undefined);
  const [babyData, setBabyData] = useState<FruitData>({
    name: "cherry",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/590/590685.png",
    weight: "1g",
    length: "1.6cm",
  })

  const pregnancyStartDate = new Date();  // You can use a fixed date if needed, for now using the current date

  // Calculate weeks remaining
  const calculateWeeksRemaining = (week: number) => {
    const weeksRemaining = 40 - week
    return `${weeksRemaining} weeks`
  }


  const calculateDueDate = (selectedWeek: number) => {
    const startDate = new Date(pregnancyStartDate); // Use the fixed start date
    const dueDate = new Date(startDate.setDate(startDate.getDate() + (40 - selectedWeek) * 7));
  
    const day = dueDate.getDate().toString().padStart(2, '0');
    const month = dueDate.toLocaleString('default', { month: 'short' });
    const year = dueDate.getFullYear();
  
    const dueDateString = `${day}-${month}-${year}`;
    return dueDateString;
  };
  
  

  const handleWeekChange = (week: string, fruitData: FruitData) => {
    // Only update if the week actually changed
    if (week !== selectedWeek) {
      setSelectedWeek(week)
      setBabyData(fruitData)

      // Update progress bar based on selected week (out of 40 weeks)
      const weekProgress = Number.parseInt(week) / 40 // 40 weeks is full term

      // Stop any existing animation
      progress.stopAnimation()

      // Start new animation to the correct progress value
      Animated.timing(progress, {
        toValue: weekProgress,
        duration: 500,
        useNativeDriver: false,
      }).start()
    }
  }

  const sections = [
    {
      id: 1,
      title: `${selectedWeek} ${t("weeksRemaining")}`,
      backgroundColor: "#6ED7E9",
    },
    {
      id: 2,
      title: t('baby'),
      content: t('babyDescription'),
      backgroundColor: "#F989D9", // Pink background for Baby section
    },
    {
      id: 3,
      title: t('mom'),
      content: t('momDescription'),
      backgroundColor: "#6ED7E9", // Teal background for Mom section
    },
    {
      id: 4,
      title: t('funFact'),
      content: t('funFactDescription'),
      backgroundColor: "#F989D9", // White background for Fun Fact section
    },
  ];

  const [progress] = useState(new Animated.Value(0));

  useEffect(() => {
    // Set initial progress based on default week (8/40)
    const initialWeekNumber = 8
    const initialProgress = initialWeekNumber / 40

    Animated.timing(progress, {
      toValue: initialProgress,
      duration: 1000,
      useNativeDriver: false,
    }).start()
  }, [])

  interface RenderCustomProgressBarProps {
    progressValue: Animated.Value;
  }

  const renderCustomProgressBar = ({
    progressValue,
  }: RenderCustomProgressBarProps) => {
    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
      </View>
    );
  };

  

  return (
    <SafeAreaView
      style={{
        flex: 1,
      }}
    >
      <StatusBar style="dark" />
      <LinearGradient
        colors={["#FA9DDF", "#FAB5E8"]}
        start={{
          x: 0,
          y: 0,
        }}
        end={{
          x: 1,
          y: 1,
        }}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{babyData.weight}</Text>
              <Text style={styles.statLabel}>{t("weight")}</Text>
            </View>

            <View style={styles.statBox1}>
              <Text style={styles.statValue}>{babyData.length}</Text>
              <Text style={styles.statLabel}>{t("length")}</Text>
            </View>
          </View>

          <WeekSelector onWeekChange={handleWeekChange} initialWeek={selectedWeek} />
          <Text style={styles.currentWeekText}>{t("currentWeek")}</Text>

          <FlatList
            data={sections}
            renderItem={({ item }) => (
              <View
                style={[styles.card, { backgroundColor: item.backgroundColor }]}
              >
                {item.id === 1 && (
                  <View style={styles.progressContainer}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text style={styles.progressText}>{item.title}</Text>
                      <Text style={styles.trimesterText}>
                          {Number.parseInt(selectedWeek ?? "0") <= 13
                          ? t("trimester1")
                          : Number.parseInt(selectedWeek ?? "0") <= 26
                          ? t("trimester2")
                          : t("trimester3")}
                      </Text>
                    </View>
                    {renderCustomProgressBar({ progressValue: progress })}
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 10,
                      }}
                    >
                      <Text style={styles.dueDate}>
                        {t('dateOfLabor')} {calculateDueDate(Number(selectedWeek ?? "0"))}
                      </Text>
                      <Text style={styles.timeLeft}>
                      {calculateWeeksRemaining(Number.parseInt(selectedWeek ?? "0"))}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Conditionally render the title based on id */}
                {item.id !== 1 && (
                  <Text style={styles.cardTitle}>{item.title}</Text>
                )}
                <Text style={styles.cardText}>{item.content}</Text>
              </View>
            )}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={{ marginTop: 30 }}
          />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    // paddingTop: 10,
    flexDirection: "row",
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: 25,
  },
  card: {
    backgroundColor: "#FFFFFF5B",
    // borderRadius:13,
    borderTopLeftRadius: 23,
    borderTopRightRadius: 23,
    paddingHorizontal: 30,
    paddingVertical: 30,
    marginTop: -14,
  },
  progressText: {
    fontSize: 20,
    color: "#fff",
    fontFamily: "Inter600",
  },
  trimesterText: {
    fontSize: 14,
    color: "#fff",
    fontFamily: "Inter600",
  },
  dueDate: {
    fontSize: 12,
    color: "#fff",
    fontFamily: "Inter600",
  },
  timeLeft: {
    fontSize: 12,
    color: "#fff",
    fontFamily: "Inter400",
  },
  progressBarContainer: {
    width: "100%",
    height: 7,
    borderRadius: 10,
    overflow: "hidden",
    marginTop: 10,
  },
  progressBarBackground: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.10)",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },
  statBox: {
    alignItems: "flex-start",
    width: 87,
    paddingHorizontal: 10,
    paddingVertical: 20,
    borderRadius: 13,
    justifyContent: "center",
    backgroundColor: "#FFFFFF5B",
  },
  progressContainer: {
    flexDirection: "column",
    // marginBottom: 20,
    gap: 10,
  },
  statBox1: {
    alignItems: "flex-end",
    justifyContent: "center",
    borderRadius: 13,
    width: 87,
    paddingHorizontal: 10,
    paddingVertical: 20,
    backgroundColor: "#FFFFFF5B",
  },
  statValue: {
    color: "white",
    fontSize: 21,
    fontFamily: "Inter600",
  },
  statLabel: {
    color: "white",
    fontSize: 13,
    fontFamily: "Inter600",
  },
  cherryContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  cherryImage: {
    width: 60,
    height: 60,
    marginBottom: 40,
  },
  cherryText: {
    color: "white",
    fontSize: 14,
    textAlign: "center",
    maxWidth: 150,
  },
  weekSelector: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    // marginTop: 40,
    paddingHorizontal: 10,
  },
  weekButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  weekButtonActive: {
    backgroundColor: "#FF85C0",
  },
  weekButtonText: {
    color: "white",
    fontSize: 16,
  },
  weekButtonTextActive: {
    color: "#fff",
  },
  currentWeekText: {
    color: "white",
    textAlign: "center",
    fontFamily: "Inter700",
    // marginTop: 8,
    fontSize: 16,
  },
  progressCard: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  progressSubtitle: {
    color: "white",
    fontSize: 16,
    marginTop: 4,
  },
  progressDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
    width: "100%",
    marginVertical: 10,
  },
  progressDate: {
    color: "white",
    fontSize: 14,
  },
  progressTimeLeft: {
    color: "white",
    fontSize: 14,
    marginTop: 4,
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoCardTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 20,
    color: "#FFFFFF",
    fontFamily: "Inter700",
  },
  cardText: {
    fontSize: 13,
    color: "#FFFFFF",
    // marginTop: 10,
  },
});
