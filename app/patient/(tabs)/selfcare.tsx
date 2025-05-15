import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Easing,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native"
import { useState, useRef, useEffect } from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { Animated } from "react-native"
import { Feather } from "@expo/vector-icons"
import '../../../translation/i18next'
import { useTranslation } from "react-i18next"
import AsyncStorage from "@react-native-async-storage/async-storage"

// Enable LayoutAnimation for Android
if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true)
  }
}

interface ToggleSectionProps {
  index: number
}

interface ContentItem {
  subtitle: string
  text: string
}

interface AccordionProps {
  title: string
  content: ContentItem[]
  active: boolean
  onPress: () => void
}

const SelfCare = () => {
  const router = useRouter();
  const { t, i18n } = useTranslation()
  // Commented out store functionality as in the original code
  // const {
  //   routines,
  //   isLoading,
  //   error,
  //   fetchRoutines,
  //   downloadAudio,
  //   setCurrentRoutine,
  // } = useSelfCareStore();

  useEffect(() => {
    const setSelfCareVisited = async () => {
      await AsyncStorage.setItem('self-care', 'true');
    };
    setSelfCareVisited();
  }, [])

  // useEffect(() => {
  //   fetchRoutines();
  // }, []);

  // const handleRoutinePress = async (routineId: string) => {
  //   const routine = routines.find((r) => r.id === routineId);
  //   if (!routine) return;

  //   setCurrentRoutine(routine);

  //   try {
  //     // Pre-download the audio if possible
  //     const audioPath = await downloadAudio(routineId);

  //     // Navigate to audio player with all required data
  //     router.push({
  //       pathname: "/patient/excerises/audio_player",
  //       params: {
  //         title: routine.title,
  //         duration: routine.duration || "5 min", // Fallback duration if not set
  //         url: audioPath || routine.audioUrl, // Use local path if available, otherwise remote URL
  //         gradientColors: JSON.stringify(
  //           routine.gradientColors || ["#7B96FF", "#0039C6"]
  //         ),
  //         description: routine.description,
  //         id: routine.id,
  //       },
  //     });
  //   } catch (err) {
  //     console.error("Error navigating to audio player:", err);
  //   }
  // };

  // const renderRoutineCard = (routine) => {
  //   return (
  //     <TouchableOpacity
  //       key={routine.id}
  //       style={styles.routineCard}
  //       onPress={() => handleRoutinePress(routine.id)}
  //       activeOpacity={0.8}
  //     >
  //       <Image
  //         source={{ uri: routine.routineImage }}
  //         style={styles.routineImage}
  //         resizeMode="cover"
  //       />
  //       <LinearGradient
  //         colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.7)"]}
  //         style={styles.overlay}
  //       >
  //         <View style={styles.cardContent}>
  //           <Text style={styles.routineTitle}>{routine.title} &gt;</Text>
  //           {/* <Text style={styles.routineDescription} numberOfLines={2}>
  //             {routine.description}
  //           </Text> */}
  //         </View>
  //       </LinearGradient>
  //     </TouchableOpacity>
  //   );
  // };

  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [contentHeights, setContentHeights] = useState<{ [key: number]: number }>({})

  const toggleSection = (index: ToggleSectionProps["index"]): void => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setActiveIndex(activeIndex === index ? null : index)
  }

  const measureContentHeight = (index: number, event: any) => {
    const { height } = event.nativeEvent.layout
    setContentHeights((prev) => ({
      ...prev,
      [index]: height,
    }))
  }

  const [forceUpdate, setForceUpdate] = useState(0)

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      console.log("Language changed to:", lng)
      setForceUpdate((prev) => prev + 1)
    }

    i18n.on("languageChanged", handleLanguageChange)

    return () => {
      i18n.off("languageChanged", handleLanguageChange)
    }
  }, [i18n])

  const Accordion = ({ title, content, active, onPress }: AccordionProps) => {
    const [animation] = useState(new Animated.Value(0))
    const contentRef = useRef<View>(null)
    const [contentHeight, setContentHeight] = useState(0)

    // Measure content height when content changes
    useEffect(() => {
      if (contentRef.current && active) {
        contentRef.current.measure((x, y, width, height) => {
          setContentHeight(height)
        })
      }
    }, [content, active])

    useEffect(() => {
      Animated.timing(animation, {
        toValue: active ? 1 : 0,
        duration: 300,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1),
        useNativeDriver: false,
      }).start()
    }, [active])

    const animatedHeight = animation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, contentHeight || 1000], // Use measured height or fallback
    })

    const rotateZ = animation.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "180deg"],
    })

    return (
      <View style={styles.accordionSection}>
        <TouchableOpacity style={styles.accordionHeader} activeOpacity={0.8} onPress={onPress}>
          <Text style={styles.accordionTitle}>{title}</Text>
          <Animated.View style={{ transform: [{ rotateZ }] }}>
            <Feather name="chevron-down" size={18} color="#883B72" />
          </Animated.View>
        </TouchableOpacity>

        <Animated.View style={[styles.accordionContent, { height: animatedHeight, opacity: animation }]}>
          <View
            ref={contentRef}
            style={{ position: active ? "relative" : "absolute", opacity: active ? 1 : 0 }}
            onLayout={(e) => active && setContentHeight(e.nativeEvent.layout.height)}
          >
            {content.map((item, index) => (
              <View key={index} style={styles.contentItem}>
                <Text style={styles.contentSubtitle}>{item.subtitle}</Text>
                <Text style={styles.contentText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    )
  }

   const sections = [
    {
      title: t("selfCare.physicalHealth.title"),
      content: [
        {
          subtitle: t("selfCare.physicalHealth.nutrition.title"),
          text: t("selfCare.physicalHealth.nutrition.description"),
        },
        {
          subtitle: t("selfCare.physicalHealth.exercise.title"),
          text: t("selfCare.physicalHealth.exercise.description"),
        },
        {
          subtitle: t("selfCare.physicalHealth.hydration.title"),
          text: t("selfCare.physicalHealth.hydration.description"),
        },
        {
          subtitle: t("selfCare.physicalHealth.sleep.title"),
          text: t("selfCare.physicalHealth.sleep.description"),
        },
      ],
    },
    {
      title: t("selfCare.emotionalWellbeing.title"),
      content: [
        {
          subtitle: t("selfCare.emotionalWellbeing.stressManagement.title"),
          text: t("selfCare.emotionalWellbeing.stressManagement.description"),
        },
        {
          subtitle: t("selfCare.emotionalWellbeing.socialSupport.title"),
          text: t("selfCare.emotionalWellbeing.socialSupport.description"),
        },
        {
          subtitle: t("selfCare.emotionalWellbeing.selfReflection.title"),
          text: t("selfCare.emotionalWellbeing.selfReflection.description"),
        },
        {
          subtitle: t("selfCare.emotionalWellbeing.education.title"),
          text: t("selfCare.emotionalWellbeing.education.description"),
        },
      ],
    },
    {
      title: t("selfCare.others.title"),
      content: [
        {
          subtitle: t("selfCare.others.prenatalCare.title"),
          text: t("selfCare.others.prenatalCare.description"),
        },
        {
          subtitle: t("selfCare.others.limitStressors.title"),
          text: t("selfCare.others.limitStressors.description"),
        },
        {
          subtitle: t("selfCare.others.listenToBody.title"),
          text: t("selfCare.others.listenToBody.description"),
        },
      ],
    },
  ]

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t("selfCare.title")}</Text>
      </View>
      {/* <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F66DCE" />
            <Text style={styles.loadingText}>Loading routines...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={24} color="#F66DCE" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchRoutines}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {routines.map((routine) => renderRoutineCard(routine))}

            {routines.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No routines found</Text>
              </View>
            )}
          </>
        )}
      </ScrollView> */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
        <View
          style={{
            gap: 15,
          }}
        >
          <Text
            style={{
              fontFamily: "DMSans500",
              fontSize: 14,
              color: "#883B72",
            }}
          >
            {t("selfCare.intro")}
          </Text>
          <Text
            style={{
              fontFamily: "DMSans500",
              fontSize: 14,
              color: "#883B72",
            }}
          >
            {t("selfCare.intro2")}
          </Text>
          <Text
            style={{
              fontFamily: "DMSans500",
              fontSize: 14,
              color: "#883B72",
            }}
          >
            {t("selfCare.intro3")}
          </Text>
        </View>

        <View style={styles.accordionContainer}>
          {sections.map((section, index) => (
            <Accordion
              key={index}
              title={section.title}
              content={section.content}
              active={activeIndex === index}
              onPress={() => toggleSection(index)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const { width } = Dimensions.get("window")

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF8FD",
  },
  header: {
    paddingVertical: 15,
    alignItems: "center",
  },
  accordionContainer: {
    width: "100%",
    marginTop: 25,
  },
  accordionSection: {
    marginBottom: 15,
    overflow: "hidden",
    borderRadius: 30,
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#FDDDF4",
    borderRadius: 30,
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#883B72",
    fontFamily: "DMSans500",
  },
  accordionContent: {
    overflow: "hidden",
    backgroundColor: "#fff",
    paddingHorizontal: 15,
  },
  contentItem: {
    marginVertical: 10,
  },
  contentSubtitle: {
    fontSize: 15,
    color: "#883B72",
    marginBottom: 5,
    fontFamily: "DMSans500",
  },
  contentText: {
    fontSize: 14,
    color: "#373737",
    // lineHeight: 20,
    fontFamily: "DMSans400",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "OpenSans700",
    color: "#883B72",
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  routineCard: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
  },
  routineImage: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "100%",
    justifyContent: "flex-end",
  },
  cardContent: {
    padding: 16,
  },
  routineTitle: {
    color: "white",
    fontSize: 24,
    fontFamily: "DMSans600",
  },
  routineDescription: {
    color: "white",
    fontSize: 16,
    fontFamily: "DMSans400",
    opacity: 0.9,
  },
  loadingContainer: {
    paddingVertical: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: "DMSans400",
    color: "white",
  },
  errorContainer: {
    paddingVertical: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: "DMSans400",
    color: "#F66DCE",
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#4A6FE1",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "DMSans500",
  },
  emptyContainer: {
    paddingVertical: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: "DMSans400",
    color: "#ccc",
    textAlign: "center",
  },
})

export default SelfCare
