import {
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  PanResponder,
  type ViewToken,
  Image,
} from "react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, SimpleLineIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSelector } from "react-redux";
import { Animated } from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { ActivityIndicator } from "react-native";
import UpArrow from "@/assets/images/Svg/UpArrow";
import { LinearGradient } from "expo-linear-gradient";
import PaginationDot from "react-native-insta-pagination-dots"
import Lock from "@/assets/images/Svg/Lock";
import { useTranslation } from "react-i18next";


// Badge types constants
const REGULAR_BADGE_TYPES = [
  "HYDRATED_QUEEN",
  "SNAPSHOT",
  "TRIVIA_QUEEN",
  "HEART_SCRIBE",
  "RESTED_DIVA",
  "EXPLORER",
];

const STREAK_BADGE_TYPES = [
  "HOT_MAMA",
  "SLEEP_WIZARD_I",
  "SLEEP_WIZARD_II",
  "SLEEP_WIZARD_III",
  "SLEEP_WIZARD_IV",
  "SLEEP_WIZARD_V",
  "SLEEP_WIZARD_VI",
  "SLEEP_WIZARD_VII",
  "SLEEP_WIZARD_VIII",
  "SLEEP_WIZARD_IX",
  "WATER_WIZARD_I",
  "WATER_WIZARD_II",
  "WATER_WIZARD_III",
  "WATER_WIZARD_IV",
  "WATER_WIZARD_V",
  "WATER_WIZARD_VI",
  "WATER_WIZARD_VII",
  "WATER_WIZARD_VIII",
  "WATER_WIZARD_IX",
  "HEALTH_QUEEN_I",
  "HEALTH_QUEEN_II",
  "HEALTH_QUEEN_III",
  "HEALTH_QUEEN_IV",
  "HEALTH_QUEEN_V",
  "HEALTH_QUEEN_VI",
  "HEALTH_QUEEN_VII",
  "HEALTH_QUEEN_VIII",
  "HEALTH_QUEEN_IX",
  "ON_THE_MOVE_I",
  "ON_THE_MOVE_II",
  "ON_THE_MOVE_III",
  "ON_THE_MOVE_IV",
  "ON_THE_MOVE_V",
  "ON_THE_MOVE_VI",
  "ON_THE_MOVE_VII",
  "ON_THE_MOVE_VIII",
  "ON_THE_MOVE_IX",
];

// Map of badge types to their earned badge images
const BADGE_IMAGES: Record<string, any> = {
  TRIVIA_QUEEN: require("../../../assets/images/badge/trivia.png"),
  HOT_MAMA: require("../../../assets/images/badge/Hot Mama.png"),
  SNAPSHOT: require("../../../assets/images/badge/snapshot queen.png"),
  HYDRATED_QUEEN: require("../../../assets/images/badge/Hydrated Queen.png"),
  HEART_SCRIBE: require("../../../assets/images/badge/heart.png"),
  EXPLORER: require("../../../assets/images/badge/explorer.png"),
  RESTED_DIVA: require("../../../assets/images/badge/diva.png"),
  SLEEP_WIZARD_I: require("../../../assets/images/badge/Sleep Wizard 1.png"),
  SLEEP_WIZARD_II: require("../../../assets/images/badge/Sleep Wizard 2.png"),
  SLEEP_WIZARD_III: require("../../../assets/images/badge/Sleep Wizard 3.png"),
  SLEEP_WIZARD_IV: require("../../../assets/images/badge/Sleep Wizard 4.png"),
  SLEEP_WIZARD_V: require("../../../assets/images/badge/Sleep Wizard 5.png"),
  SLEEP_WIZARD_VI: require("../../../assets/images/badge/Sleep Wizard 6.png"),
  SLEEP_WIZARD_VII: require("../../../assets/images/badge/Sleep Wizard 7.png"),
  SLEEP_WIZARD_VIII: require("../../../assets/images/badge/Sleep Wizard 8.png"),
  SLEEP_WIZARD_IX: require("../../../assets/images/badge/Sleep Wizard 9.png"),
  WATER_WIZARD_I: require("../../../assets/images/badge/Water Wizard 1.png"),
  WATER_WIZARD_II: require("../../../assets/images/badge/Water Wizard 2.png"),
  WATER_WIZARD_III: require("../../../assets/images/badge/Water Wizard 3.png"),
  WATER_WIZARD_IV: require("../../../assets/images/badge/Water Wizard 4.png"),
  WATER_WIZARD_V: require("../../../assets/images/badge/Water Wizard 5.png"),
  WATER_WIZARD_VI: require("../../../assets/images/badge/Water Wizard 6.png"),
  WATER_WIZARD_VII: require("../../../assets/images/badge/Water Wizard 7.png"),
  WATER_WIZARD_VIII: require("../../../assets/images/badge/Water Wizard 8.png"),
  WATER_WIZARD_IX: require("../../../assets/images/badge/Water Wizard 9.png"),
  HEALTH_QUEEN_I: require("../../../assets/images/badge/Health Wizard 1.png"),
  HEALTH_QUEEN_II: require("../../../assets/images/badge/Health Wizard 2.png"),
  HEALTH_QUEEN_III: require("../../../assets/images/badge/Health Wizard 3.png"),
  HEALTH_QUEEN_IV: require("../../../assets/images/badge/Health Wizard 4.png"),
  HEALTH_QUEEN_V: require("../../../assets/images/badge/Health Wizard 5.png"),
  HEALTH_QUEEN_VI: require("../../../assets/images/badge/Health Wizard 6.png"),
  HEALTH_QUEEN_VII: require("../../../assets/images/badge/Health Wizard 7.png"),
  HEALTH_QUEEN_VIII: require("../../../assets/images/badge/Health Wizard 8.png"),
  HEALTH_QUEEN_IX: require("../../../assets/images/badge/Health Wizard 9.png"),
  ON_THE_MOVE_I: require("../../../assets/images/badge/On The Move 1.png"),
  ON_THE_MOVE_II: require("../../../assets/images/badge/On The Move 2.png"),
  ON_THE_MOVE_III: require("../../../assets/images/badge/On The Move 3.png"),
  ON_THE_MOVE_IV: require("../../../assets/images/badge/On The Move 4.png"),
  ON_THE_MOVE_V: require("../../../assets/images/badge/On The Move 5.png"),
  ON_THE_MOVE_VI: require("../../../assets/images/badge/On The Move 6.png"),
  ON_THE_MOVE_VII: require("../../../assets/images/badge/On The Move 7.png"),
  ON_THE_MOVE_VIII: require("../../../assets/images/badge/On The Move 8.png"),
  ON_THE_MOVE_IX: require("../../../assets/images/badge/On The Move 9.png"),
};

// Map of badge types to their locked/unearned badge images
const NOT_EARNED_BADGE: Record<string, any> = {
  HYDRATED_QUEEN: require("../../../assets/images/badge/Hydrated Queen locked.png"),
  RESTED_DIVA: require("../../../assets/images/badge/diva locked.png"),
  HEART_SCRIBE: require("../../../assets/images/badge/heart locked.png"),
  HOT_MAMA: require("../../../assets/images/badge/Hot Mama(lock).png"),
  TRIVIA_QUEEN: require("../../../assets/images/badge/trivia lcoked.png"),
  SNAPSHOT: require("../../../assets/images/badge/snapshot queen locked.png"),
  EXPLORER: require("../../../assets/images/badge/explorer locked.png"),
  SLEEP_WIZARD_I: require("../../../assets/images/badge/Sleep Wizard 1(lock).png"),
  SLEEP_WIZARD_II: require("../../../assets/images/badge/Sleep Wizard 2(lock).png"),
  SLEEP_WIZARD_III: require("../../../assets/images/badge/Sleep Wizard 3(lock).png"),
  SLEEP_WIZARD_IV: require("../../../assets/images/badge/Sleep Wizard 4(lock).png"),
  SLEEP_WIZARD_V: require("../../../assets/images/badge/Sleep Wizard 5(lock).png"),
  SLEEP_WIZARD_VI: require("../../../assets/images/badge/Sleep Wizard 6(lock).png"),
  SLEEP_WIZARD_VII: require("../../../assets/images/badge/Sleep Wizard 7(lock).png"),
  SLEEP_WIZARD_VIII: require("../../../assets/images/badge/Sleep Wizard 8(lock).png"),
  SLEEP_WIZARD_IX: require("../../../assets/images/badge/Sleep Wizard 9(lock).png"),
  HEALTH_QUEEN_I: require("../../../assets/images/badge/Health Wizard 1(lock).png"),
  HEALTH_QUEEN_II: require("../../../assets/images/badge/Health Wizard 2(lock).png"),
  HEALTH_QUEEN_III: require("../../../assets/images/badge/Health Wizard 3(lock).png"),
  HEALTH_QUEEN_IV: require("../../../assets/images/badge/Health Wizard 4(lock).png"),
  HEALTH_QUEEN_V: require("../../../assets/images/badge/Health Wizard 5(lock).png"),
  HEALTH_QUEEN_VI: require("../../../assets/images/badge/Health Wizard 6(lock).png"),
  HEALTH_QUEEN_VII: require("../../../assets/images/badge/Health Wizard 7(lock).png"),
  HEALTH_QUEEN_VIII: require("../../../assets/images/badge/Health Wizard 8(lock).png"),
  HEALTH_QUEEN_IX: require("../../../assets/images/badge/Health Wizard 9(lock).png"),
  WATER_WIZARD_I: require("../../../assets/images/badge/Water Wizard 1(lock).png"),
  WATER_WIZARD_II: require("../../../assets/images/badge/Water Wizard 2(lock).png"),
  WATER_WIZARD_III: require("../../../assets/images/badge/Water Wizard 3(lock).png"),
  WATER_WIZARD_IV: require("../../../assets/images/badge/Water Wizard 4(lock).png"),
  WATER_WIZARD_V: require("../../../assets/images/badge/Water Wizard 5(lock).png"),
  WATER_WIZARD_VI: require("../../../assets/images/badge/Water Wizard 6(lock).png"),
  WATER_WIZARD_VII: require("../../../assets/images/badge/Water Wizard 7(lock).png"),
  WATER_WIZARD_VIII: require("../../../assets/images/badge/Water Wizard 8(lock).png"),
  WATER_WIZARD_IX: require("../../../assets/images/badge/Water Wizard 9(lock).png"),
  ON_THE_MOVE_I: require("../../../assets/images/badge/On The Move 1(lock).png"),
  ON_THE_MOVE_II: require("../../../assets/images/badge/On The Move 2(lock).png"),
  ON_THE_MOVE_III: require("../../../assets/images/badge/On The Move 3(lock).png"),
  ON_THE_MOVE_IV: require("../../../assets/images/badge/On The Move 4(lock).png"),
  ON_THE_MOVE_V: require("../../../assets/images/badge/On The Move 5(lock).png"),
  ON_THE_MOVE_VI: require("../../../assets/images/badge/On The Move 6(lock).png"),
  ON_THE_MOVE_VII: require("../../../assets/images/badge/On The Move 7(lock).png"),
  ON_THE_MOVE_VIII: require("../../../assets/images/badge/On The Move 8(lock).png"),
  ON_THE_MOVE_IX: require("../../../assets/images/badge/On The Move 9(lock).png"),
};

const ALL_BADGE = [...REGULAR_BADGE_TYPES, ...STREAK_BADGE_TYPES];

const BADGE_TIPS: Record<string, string> = {
  HOT_MAMA: 'badgeTips.HOT_MAMA',
  HYDRATED_QUEEN: "badgeTips.HYDRATED_QUEEN",
  RESTED_DIVA: "badgeTips.RESTED_DIVA",
  HEART_SCRIBE: "badgeTips.HEART_SCRIBE",
  TRIVIA_QUEEN: "badgeTips.TRIVIA_QUEEN",
  SNAPSHOT: "badgeTips.SNAPSHOT",
  EXPLORER: "badgeTips.EXPLORER",
  SLEEP_WIZARD_I: "badgeTips.SLEEP_WIZARD_I",
  SLEEP_WIZARD_II: "badgeTips.SLEEP_WIZARD_II",
  SLEEP_WIZARD_III: "badgeTips.SLEEP_WIZARD_III",
  SLEEP_WIZARD_IV: "badgeTips.SLEEP_WIZARD_IV",
  SLEEP_WIZARD_V: "badgeTips.SLEEP_WIZARD_V",
  SLEEP_WIZARD_VI:"badgeTips.SLEEP_WIZARD_VI",
  SLEEP_WIZARD_VII: "badgeTips.SLEEP_WIZARD_VII",
  SLEEP_WIZARD_VIII:"badgeTips.SLEEP_WIZARD_VIII",
  SLEEP_WIZARD_IX:"badgeTips.SLEEP_WIZARD_IX",
  WATER_WIZARD_I:"badgeTips.WATER_WIZARD_I",
  WATER_WIZARD_II:"badgeTips.WATER_WIZARD_II",
  WATER_WIZARD_III:"badgeTips.WATER_WIZARD_III",
  WATER_WIZARD_IV:"badgeTips.WATER_WIZARD_IV",
  WATER_WIZARD_V:"badgeTips.WATER_WIZARD_V",
  WATER_WIZARD_VI:"badgeTips.WATER_WIZARD_VI",
  WATER_WIZARD_VII:"badgeTips.WATER_WIZARD_VII",
  WATER_WIZARD_VIII:"badgeTips.WATER_WIZARD_VIII",
  WATER_WIZARD_IX:"badgeTips.WATER_WIZARD_IX",
  HEALTH_QUEEN_I: "badgeTips.HEALTH_QUEEN_I",
  HEALTH_QUEEN_II: "badgeTips.HEALTH_QUEEN_II",
  HEALTH_QUEEN_III: "badgeTips.HEALTH_QUEEN_III",
  HEALTH_QUEEN_IV: "badgeTips.HEALTH_QUEEN_IV",
  HEALTH_QUEEN_V: "badgeTips.HEALTH_QUEEN_V",
  HEALTH_QUEEN_VI: "badgeTips.HEALTH_QUEEN_VI",
  HEALTH_QUEEN_VII: "badgeTips.HEALTH_QUEEN_VII",
  HEALTH_QUEEN_VIII: "badgeTips.HEALTH_QUEEN_VIII",
  HEALTH_QUEEN_IX: "badgeTips.HEALTH_QUEEN_IX",
  ON_THE_MOVE_I:"badgeTips.ON_THE_MOVE_I",
  ON_THE_MOVE_II:"badgeTips.ON_THE_MOVE_II",
  ON_THE_MOVE_III:"badgeTips.ON_THE_MOVE_III",
  ON_THE_MOVE_IV:"badgeTips.ON_THE_MOVE_IV",
  ON_THE_MOVE_V:"badgeTips.ON_THE_MOVE_V",
  ON_THE_MOVE_VI:"badgeTips.ON_THE_MOVE_VI",
  ON_THE_MOVE_VII:"badgeTips.ON_THE_MOVE_VII",
  ON_THE_MOVE_VIII:"badgeTips.ON_THE_MOVE_VIII",
  ON_THE_MOVE_IX:"badgeTips.ON_THE_MOVE_IX",
};

const BADGE_DESCRIPTION: Record<string, string> = {
  HOT_MAMA: "badgeDescription.HOT_MAMA",
  HYDRATED_QUEEN: "badgeDescription.HYDRATED_QUEEN",
  RESTED_DIVA:"badgeDescription.RESTED_DIVA",
  HEART_SCRIBE:"badgeDescription.HEART_SCRIBE",
  TRIVIA_QUEEN:"badgeDescription.TRIVIA_QUEEN",
  SNAPSHOT:"badgeDescription.SNAPSHOT",
  EXPLORER:"badgeDescription.EXPLORER",
  SLEEP_WIZARD_I:"badgeDescription.SLEEP_WIZARD_I",
  SLEEP_WIZARD_II:"badgeDescription.SLEEP_WIZARD_II",
  SLEEP_WIZARD_III:"badgeDescription.SLEEP_WIZARD_III",
  SLEEP_WIZARD_IV:"badgeDescription.SLEEP_WIZARD_IV",
  SLEEP_WIZARD_V:"badgeDescription.SLEEP_WIZARD_V",
  SLEEP_WIZARD_VI:"badgeDescription.SLEEP_WIZARD_VI",
  SLEEP_WIZARD_VII:"badgeDescription.SLEEP_WIZARD_VII",
  SLEEP_WIZARD_VIII:"badgeDescription.SLEEP_WIZARD_VIII",
  SLEEP_WIZARD_IX:"badgeDescription.SLEEP_WIZARD_IX",
  WATER_WIZARD_I:"badgeDescription.WATER_WIZARD_I",
  WATER_WIZARD_II:"badgeDescription.WATER_WIZARD_II",
  WATER_WIZARD_III:"badgeDescription.WATER_WIZARD_III",
  WATER_WIZARD_IV:"badgeDescription.WATER_WIZARD_IV",
  WATER_WIZARD_V:"badgeDescription.WATER_WIZARD_V",
  WATER_WIZARD_VI:"badgeDescription.WATER_WIZARD_VI",
  WATER_WIZARD_VII:"badgeDescription.WATER_WIZARD_VII",
  WATER_WIZARD_VIII:"badgeDescription.WATER_WIZARD_VIII",
  WATER_WIZARD_IX:"badgeDescription.WATER_WIZARD_IX",
  HEALTH_QUEEN_I: "badgeDescription.HEALTH_QUEEN_I",
  HEALTH_QUEEN_II: "badgeDescription.HEALTH_QUEEN_II",
  HEALTH_QUEEN_III: "badgeDescription.HEALTH_QUEEN_III",
  HEALTH_QUEEN_IV: "badgeDescription.HEALTH_QUEEN_IV",
  HEALTH_QUEEN_V: "badgeDescription.HEALTH_QUEEN_V",
  HEALTH_QUEEN_VI: "badgeDescription.HEALTH_QUEEN_VI",
  HEALTH_QUEEN_VII: "badgeDescription.HEALTH_QUEEN_VII",
  HEALTH_QUEEN_VIII: "badgeDescription.HEALTH_QUEEN_VIII",
  HEALTH_QUEEN_IX: "badgeDescription.HEALTH_QUEEN_IX",
  ON_THE_MOVE_I:"badgeDescription.ON_THE_MOVE_I",
  ON_THE_MOVE_II: "badgeDescription.ON_THE_MOVE_II",
  ON_THE_MOVE_III:"badgeDescription.ON_THE_MOVE_III",
  ON_THE_MOVE_IV:"badgeDescription.ON_THE_MOVE_IV",
  ON_THE_MOVE_V: "badgeDescription.ON_THE_MOVE_V",
  ON_THE_MOVE_VI: "badgeDescription.ON_THE_MOVE_VI",
  ON_THE_MOVE_VII: "badgeDescription.ON_THE_MOVE_VII",
  ON_THE_MOVE_VIII:"badgeDescription.ON_THE_MOVE_VIII",
  ON_THE_MOVE_IX:"badgeDescription.ON_THE_MOVE_IX",
};

const getBadgeDescription = (badgeType: string): string => {
  return BADGE_DESCRIPTION[badgeType] || DEFAULT_TIP;
};

const getBadgeTip = (badgeType: string): string => {
  return BADGE_TIPS[badgeType] || DEFAULT_TIP;
};

// Default tip for badges without specific tips
const DEFAULT_TIP =
  "Complete the required activities consistently to unlock this badge.";

// Badge interface
interface Badge {
  awardedAt: string;
  badge: {
    createdAt: string;
    description: string;
    title: string;
    type: string;
  };
  badgeId: string;
  id: string;
  patientId: string;
}

// Virtual badge interface for unearned badges
interface VirtualBadge {
  isVirtual: boolean;
  badge: {
    type: string;
    description: string;
    title?: string;
  };
  id: string;
}

// Get device width for ScrollView dimensions
const { width, height } = Dimensions.get("window");
const BADGE_SLIDE_WIDTH = width * 0.58;
const BADGE_SPACING = 0;

// Format badge title (e.g., TRIVIA_QUEEN -> Trivia Queen)
const formatBadgeTitle = (type: string | undefined): string => {
  if (!type) return "";
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const extractRomanNumeral = (type: string | undefined): string => {
  if (!type) return "";
  const match = type.match(/_([IVXLCDM]+)$/);
  return match ? match[1] : "";
};

interface BadgeCarouselProps {
  badges: (Badge | VirtualBadge)[];
  currentBadgeIndex: number;
  badgeTranslateY: Animated.Value;
  onChevronSlide: (gestureState: any) => void;
  earnedBadgeTypes: string[];
}

const PaginationDots = ({
  totalDots,
  activeDotIndex,
  onDotPress,
}: {
  totalDots: number;
  activeDotIndex: number;
  onDotPress: (index: number) => void;
}) => {
  // Always show 5 dots, with the active dot in the middle when possible
  const maxVisibleDots = totalDots;
  const halfVisible = Math.floor(maxVisibleDots / 2);

  let startDot = Math.max(0, activeDotIndex - halfVisible);
  const endDot = Math.min(totalDots - 1, startDot + maxVisibleDots - 1);

  // Adjust if we're near the end
  if (endDot - startDot + 1 < maxVisibleDots) {
    startDot = Math.max(0, endDot - maxVisibleDots + 1);
  }

  // Create an array of visible dot indices
  const visibleDots = Array.from(
    { length: Math.min(maxVisibleDots, totalDots) },
    (_, i) => {
      if (totalDots <= maxVisibleDots) {
        return i;
      } else {
        return Math.min(Math.max(0, startDot + i), totalDots - 1);
      }
    }
  );

  return (
    <View style={styles.pagination}>
      {visibleDots.map((dotIndex) => (
        <TouchableOpacity
          key={dotIndex}
          onPress={() => onDotPress(dotIndex)}
          activeOpacity={0.8}
        >
          {activeDotIndex === dotIndex ? (
            <LinearGradient
              colors={["rgba(250, 181, 232, 1)", "rgba(247, 108, 207, 1)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.paginationDotActive}
            />
          ) : (
            <View style={styles.paginationDot} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Interface for FlatList viewable items
interface ViewableItemsChangedInfo {
  viewableItems: ViewToken[];
  changed: ViewToken[];
}

const BadgeCarousel: React.FC<BadgeCarouselProps> = ({
  badges,
  // onPageChange,
  currentBadgeIndex,
  badgeTranslateY,
  onChevronSlide,
  earnedBadgeTypes,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentPage, setCurrentPage] = useState(
    currentBadgeIndex < badges.length ? currentBadgeIndex : 0
  );

  const {t} = useTranslation();

  // Get current badge information with safety check
  const currentBadge =
    badges &&
    badges.length > 0 &&
    currentPage >= 0 &&
    currentPage < badges.length
      ? badges[currentPage]
      : null;

  const getTranslatedBadgeTip = (badgeType: string): string => {
    const tipKey = BADGE_TIPS[badgeType] || DEFAULT_TIP
    return t(tipKey)
  }

  const getTranslatedBadgeDescription = (badgeType: string): string => {
    const descriptionKey = BADGE_DESCRIPTION[badgeType] || DEFAULT_TIP
    return t(descriptionKey)
  }

  // Handle scroll event to update current page
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / BADGE_SLIDE_WIDTH);
    if (page !== currentPage && page >= 0 && page < badges.length) {
      setCurrentPage(page);
    }
  };

  // Scroll to a specific badge index
  const scrollToPage = (index: number): void => {
    if (scrollViewRef.current && index >= 0 && index < badges.length) {
      scrollViewRef.current.scrollTo({
        x: index * BADGE_SLIDE_WIDTH,
        animated: true,
      });
    }
  };


  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to significant upward swipes
        return Math.abs(gestureState.dy) > 10 && gestureState.dy < 0;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only respond to upward swipes
        if (gestureState.dy < 0) {
          onChevronSlide(gestureState);
        }
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  const animatedContainerStyle = {
    transform: [{ translateY: badgeTranslateY }],
  };

  // Effect to scroll to the current badge index when it changes externally
  React.useEffect(() => {
    if (
      currentBadgeIndex !== currentPage &&
      currentBadgeIndex >= 0 &&
      currentBadgeIndex < badges.length
    ) {
      scrollToPage(currentBadgeIndex);
      setCurrentPage(currentBadgeIndex);
    }
  }, [currentBadgeIndex, badges.length]);

  // Safety check for empty badges array
  if (!badges || badges.length === 0) {
    return (
      <View style={styles.noBadgesContainer}>
        <Text style={styles.noBadgesText}>No badges available</Text>
      </View>
    );
  }

  const badgeType = currentBadge?.badge.type || "";
  const isEarned = earnedBadgeTypes.includes(badgeType);

  return (
    <View style={styles.carouselContainer}>
      <Animated.View style={animatedContainerStyle}>
        <ScrollView
          showsHorizontalScrollIndicator={false}
          ref={scrollViewRef}
          horizontal
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            {
              useNativeDriver: false,
              listener: handleScroll,
            }
          )}
          scrollEventThrottle={16}
          contentContainerStyle={[
            styles.scrollViewContent,
            { paddingHorizontal: (width - BADGE_SLIDE_WIDTH) / 2 },
          ]}
          decelerationRate="normal"
          snapToInterval={BADGE_SLIDE_WIDTH}
          // snapToAlignment="center"
          contentOffset={{ x: currentBadgeIndex * BADGE_SLIDE_WIDTH, y: 0 }}
        >
          {badges.map((badge, index) => {
            // Calculate the scale for each badge based on its position
            const inputRange = [
              (index - 1) * BADGE_SLIDE_WIDTH,
              index * BADGE_SLIDE_WIDTH,
              (index + 1) * BADGE_SLIDE_WIDTH,
            ];

            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [0.6, 1, 0.6],
              extrapolate: "clamp",
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.6, 1, 0.6],
              extrapolate: "clamp",
            });

            const badgeType = badge.badge.type;
            const isEarned = earnedBadgeTypes.includes(badgeType);

            return (
              <View
                key={badge.id}
                style={[styles.badgeSlide, { width: BADGE_SLIDE_WIDTH }]}
              >
                <Animated.View
                  style={[
                    styles.badgeImageContainer,
                    {
                      transform: [{ scale }],
                      opacity,
                    },
                  ]}
                >
                  {isEarned ? (
                    // Earned badge
                    BADGE_IMAGES[badgeType] ? (
                      <Image
                        source={BADGE_IMAGES[badgeType]}
                        style={{ width: 250, height: 250 }}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.placeholderBadge}>
                        <Text style={styles.placeholderText}>
                          {badgeType || "Unknown Badge"}
                        </Text>
                      </View>
                    )
                  ) : (
                    // Unearned badge
                    <View style={styles.carouselLockedBadgeContainer}>
                      {NOT_EARNED_BADGE[badgeType] ? (
                        <Image
                          source={NOT_EARNED_BADGE[badgeType]}
                          style={{ width: 250, height: 250 }}
                          resizeMode="contain"
                        />
                      ) : BADGE_IMAGES[badgeType] ? (
                        <Image
                          source={BADGE_IMAGES[badgeType]}
                          style={{ width: 250, height: 250, opacity: 0.5 }}
                          resizeMode="contain"
                        />
                      ) : (
                        <View
                          style={[styles.placeholderBadge, { opacity: 0.5 }]}
                        >
                          <Text style={styles.placeholderText}>
                            {badgeType || "Unknown Badge"}
                          </Text>
                        </View>
                      )}
                      <View style={styles.carouselLockIconContainer}>
                        <Lock/>
                      </View>
                    </View>
                  )}
                </Animated.View>
              </View>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Pagination dots */}
      {/* <PaginationDots
        totalDots={badges.length}
        activeDotIndex={currentPage}
        onDotPress={scrollToPage}
      /> */}

      <View style={styles.paginationContainer}>
        <PaginationDot
          maxPage={badges.length}
          curPage={currentPage}
          activeDotColor='rgba(247, 108, 207, 1)'
          inactiveDotColor='rgba(123, 123, 123, 0.8)'
        />
      </View>

      {/* Badge details */}
      {currentBadge && (
        <>
          <Text style={styles.badgeTitle}>
            {`${formatBadgeTitle(
              currentBadge.badge.type.replace(/_([IVXLCDM]+)$/, "")
            )} ${extractRomanNumeral(currentBadge.badge.title)}`}
          </Text>

          <Text style={styles.badgeDescription}>
            {currentBadge.badge.description}
          </Text>

          {!isEarned && (
            <View style={styles.tipContainer}>
              <Text style={styles.tipLabel}>
                {t('tip')}: {" "}
                <Text style={styles.tipText}>{getTranslatedBadgeTip(badgeType)}</Text>
              </Text>
            </View>
          )}

          {isEarned && (
            <TouchableOpacity style={styles.badgeButton}>
              <Text style={styles.badgeButtonText}>{t('earnBagdes.badgeRewarded')}</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {/* <View {...panResponder.panHandlers} style={styles.expandButton}>
        <UpArrow width={24} height={24} color="#FF69B4" />
      </View> */}
    </View>
  );
};

const EarnBadge = () => {
  const token = useSelector((state: any) => state.user?.token);
  const user = useSelector((state: any) => state.user);
  const [badgeData, setBadgeData] = useState<Badge[]>([]);
  const [allBadges, setAllBadges] = useState<(Badge | VirtualBadge)[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<number>(0);
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["50%", "90%"], []);

  // Animation value for badge translation
  const badgeTranslateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to significant upward swipes
        return Math.abs(gestureState.dy) > 10 && gestureState.dy < 0
      },
      onPanResponderMove: (_, gestureState) => {
        // Only respond to upward swipes
        if (gestureState.dy < 0) {
          handleChevronSlide(gestureState)
        }
      },
      onPanResponderRelease: () => {},
    }),
  ).current

  const handleChevronSlide = useCallback((gestureState: any) => {
    // If sliding up with enough velocity or distance, open the bottom sheet
    if (gestureState.dy < -20 || gestureState.vy < -0.5) {
      // Animate the badge moving up
      Animated.timing(badgeTranslateY, {
        toValue: -20, // Move up by 20 units
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Open the bottom sheet
      bottomSheetRef.current?.expand();
    }
  }, []);

  // Handle bottom sheet changes
  const handleSheetChanges = useCallback((index: number) => {
    console.log("Sheet index changed:", index);
    // When sheet is closed (index -1), reset badge position
    if (index === -1) {
      Animated.timing(badgeTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, []);

  const handleSelectBadge = (index: number) => {
    if (index >= 0 && index < allBadges.length) {
      setCurrentBadgeIndex(index);

      // Close the bottom sheet after selecting a badge
      bottomSheetRef.current?.close();
      console.log("Selected badge index:", index);
    }
  };

  // Handle page change
  // const handlePageChange = (page: number) => {
  //   if (page >= 0 && page < allBadges.length) {
  //     // setCurrentBadgeIndex(page);
  //     console.log("Current badge index:", page);
  //   }
  // };

  const {t} = useTranslation();

   const getTranslatedBadgeTip = (badgeType: string): string => {
    const tipKey = BADGE_TIPS[badgeType] || DEFAULT_TIP
    return t(tipKey)
  }

  const getTranslatedBadgeDescription = (badgeType: string): string => {
    const descriptionKey = BADGE_DESCRIPTION[badgeType] || DEFAULT_TIP
    return t(descriptionKey)
  }

  // Fetch badges from API
  const fetchBadges = async () => {
    setIsLoading(true);

    if (!token || !user?.user_id) {
      console.log("User not authenticated, cannot fetch badges");
      // Even if not authenticated, create virtual badges for all badge types

      setBadgeData([]);
      setEarnedBadges(0);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://crosscare-backends.onrender.com/api/user/${user.user_id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log(data);

      if (data && Array.isArray(data) && data.length > 0) {
        // Extract badge names from the data
        const badgeTypes = data.map((badge) => badge.badge.type);
        setEarnedBadges(badgeTypes.length);
        setBadgeData(data);

        // Create arrays to hold earned and unearned badges
        const earnedBadgesData: Badge[] = [];
        const unearnedBadgesData: VirtualBadge[] = [];

        // First add all earned badges
        data.forEach((earnedBadge) => {
          earnedBadgesData.push(earnedBadge);
        });

        // Then add all unearned badges
        ALL_BADGE.forEach((badgeType) => {
          // Check if this badge type is already earned
          if (!badgeTypes.includes(badgeType)) {
            // If not earned, create a virtual badge
            const virtualBadge = {
              isVirtual: true,
              awardedAt: "",
              badge: {
                createdAt: "",
                description: getTranslatedBadgeDescription(badgeType),
                title: formatBadgeTitle(badgeType),
                type: badgeType,
              },
              badgeId: `virtual-${badgeType}`,
              id: `virtual-${badgeType}`,
              patientId: user.user_id,
            };
            unearnedBadgesData.push(virtualBadge);
          }
        });

        // Combine earned and unearned badges, with earned ones first
        setAllBadges([...earnedBadgesData, ...unearnedBadgesData]);
      } else {

        const badgeTypes = data.map((badge) => badge.badge.type);
        setEarnedBadges(badgeTypes.length);
        setBadgeData(data);

        // Create arrays to hold earned and unearned badges
        const earnedBadgesData: Badge[] = [];
        const unearnedBadgesData: VirtualBadge[] = [];

        // First add all earned badges
        data.forEach((earnedBadge) => {
          earnedBadgesData.push(earnedBadge);
        });
        // If no data, create virtual badges for all badge types
        ALL_BADGE.forEach((badgeType) => {
          // Check if this badge type is already earned
          if (!badgeTypes.includes(badgeType)) {
            // If not earned, create a virtual badge
            const virtualBadge = {
              isVirtual: true,
              awardedAt: "",
              badge: {
                createdAt: "",
                description: getTranslatedBadgeDescription(badgeType),
                title: formatBadgeTitle(badgeType),
                type: badgeType,
              },
              badgeId: `virtual-${badgeType}`,
              id: `virtual-${badgeType}`,
              patientId: user.user_id,
            };
            unearnedBadgesData.push(virtualBadge);
          }
        });

        setAllBadges([...earnedBadgesData, ...unearnedBadgesData]);

        setBadgeData([]);
        setEarnedBadges(0);
      }
    } catch (error) {
      console.error("Error fetching badges:", error);
      // Use empty data on error, but still create virtual badges for all badge types

      setBadgeData([]);
      setEarnedBadges(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBadges();
  }, []);

  // Helper function to determine if a badge is earned
  const isBadgeEarned = useCallback(
    (badgeType: string) => {
      return badgeData.some((badge) => badge.badge.type === badgeType);
    },
    [badgeData]
  );

  // Get array of earned badge types
  const earnedBadgeTypes = useMemo(() => {
    return badgeData.map((badge) => badge.badge.type);
  }, [badgeData]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={"white"} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('earnBagdes.hallOfFame')}</Text>
        <View style={{ width: 20 }} />
      </View>

      {/* Badge count display */}
      <View style={styles.badgeCountContainer}>
        <Text style={styles.badgeCountText}>
          {t('earnBagdes.badgesEarned')}{" "}
          <Text style={styles.badgeCountNumber}>{earnedBadges}</Text>
        </Text>
      </View>

      {/* Badge carousel */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={"large"} color={"#E162BC"} />
        </View>
      ) : allBadges.length > 0 ? (
        <BadgeCarousel
          badges={allBadges}
          // onPageChange={handlePageChange}
          currentBadgeIndex={currentBadgeIndex}
          badgeTranslateY={badgeTranslateY}
          onChevronSlide={handleChevronSlide}
          earnedBadgeTypes={earnedBadgeTypes}
        />
      ) : (
        <BadgeCarousel
        badges={allBadges}
        // onPageChange={handlePageChange}
        currentBadgeIndex={currentBadgeIndex}
        badgeTranslateY={badgeTranslateY}
        onChevronSlide={handleChevronSlide}
        earnedBadgeTypes={earnedBadgeTypes}
      />
      )}

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        handleIndicatorStyle={styles.bottomSheetIndicator}
        backgroundStyle={styles.bottomSheetBackground}
        onChange={handleSheetChanges}
      >
        <BottomSheetScrollView
          contentContainerStyle={styles.badgeGridContainer}
        >
          {/* All Badges Section */}
          {ALL_BADGE.length > 0 && (
            <View style={styles.badgeCategoryContainer}>
              <View style={styles.badgeGridRow}>
                {[...ALL_BADGE]
                  .sort((a, b) => {
                    const aEarned = isBadgeEarned(a);
                    const bEarned = isBadgeEarned(b);

                    // If one is earned and the other is not, the earned one comes first
                    if (aEarned && !bEarned) return -1;
                    if (!aEarned && bEarned) return 1;

                    // If both are earned or both are not earned, maintain original order
                    return ALL_BADGE.indexOf(a) - ALL_BADGE.indexOf(b);
                  })
                  .map((badgeType, index) => {
                    const isEarned = isBadgeEarned(badgeType);
                    const badgeIndex = allBadges.findIndex(
                      (badge) => badge.badge.type === badgeType
                    );

                    return (
                      <TouchableOpacity
                        key={badgeType}
                        style={[
                          styles.badgeGridItem,
                          badgeIndex === currentBadgeIndex &&
                            styles.selectedBadgeGridItem,
                          !isEarned &&
                            badgeIndex !== currentBadgeIndex &&
                            styles.lockedBadgeWrapper,
                        ]}
                        onPress={() => {
                          if (badgeIndex !== -1) {
                            handleSelectBadge(badgeIndex);
                            console.log("Badge selected:", badgeIndex);
                          }
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.badgeWrapper]}>
                          {!isEarned ? (
                            // Use the locked badge image if available
                            <View style={styles.pinkBorderContainer}>
                              {NOT_EARNED_BADGE[badgeType] ? (
                                <Image
                                  source={NOT_EARNED_BADGE[badgeType]}
                                  style={{ width: 72, height: 72 }}
                                  resizeMode="contain"
                                />
                              ) : BADGE_IMAGES[badgeType] ? (
                                <Image
                                  source={BADGE_IMAGES[badgeType]}
                                  style={[
                                    { width: 72, height: 72 },
                                    { opacity: 0.5 },
                                  ]}
                                  resizeMode="contain"
                                />
                              ) : (
                                <View style={styles.placeholderBadge}>
                                  <Text style={styles.placeholderText}>
                                    {formatBadgeTitle(badgeType)}
                                  </Text>
                                </View>
                              )}
                              <View style={styles.lockIconContainer}>
                                <Lock width={12} height={12}/>
                              </View>
                            </View>
                          ) : // Use the earned badge image
                          BADGE_IMAGES[badgeType] ? (
                            <Image
                              source={BADGE_IMAGES[badgeType]}
                              style={{ width: 72, height: 72 }}
                              resizeMode="contain"
                            />
                          ) : (
                            <View style={styles.placeholderBadge}>
                              <Text style={styles.placeholderText}>
                                {formatBadgeTitle(badgeType)}
                              </Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
              </View>
            </View>
          )}
          {/* Show message if no badges */}
          {allBadges.length === 0 && (
            <View style={styles.noBadgesContainer}>
              <Text style={styles.noBadgesText}>No badges available</Text>
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
      <View
        {...panResponder.panHandlers}
        style={{
          position: "absolute",
          bottom: 20,
          left: 0,
          right: 0,
          height: 50,
          alignItems: "center",
          justifyContent: "center",
          zIndex: -1,
        }}
      >
        <UpArrow width={24} height={24} color="#FF69B4" />
      </View>
    </SafeAreaView>
  );
};

export default EarnBadge;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollViewContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "DMSans600",
    color: "#373737",
  },
  badgeCountContainer: {
    alignItems: "center",
    marginTop: 5,
  },
  badgeCountText: {
    fontSize: 14,
    color: "#7B7B7B",
    fontFamily: "DMSans500",
  },
  badgeCountNumber: {
    fontSize: 16,
    color: "#E162BC",
    fontFamily: "DMSans700",
  },
  carouselContainer: {
    height: 300,
    flexGrow: 0,
    alignItems: "center",
  },
  badgeSlide: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: BADGE_SPACING / 2,
  },
  badgeImageContainer: {
    width: width * 0.3,
    height: width * 0.3,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeTitle: {
    fontSize: 22,
    fontFamily: "DMSans700",
    color: "#E162BC",
    marginTop: 10,
    marginBottom: 10,
  },
  badgeDescription: {
    fontSize: 16,
    fontFamily: "DMSans500",
    color: "#7B7B7B",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  badgeButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    marginTop: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 24,
    boxShadow: "0px 0px 4px 0px rgba(0, 0, 0, 0.25)",
    // shadowColor: '#000',
    // shadowOffset: { width: 10, height: 50 },
    // shadowOpacity: 0.25,
    // shadowRadius: 4,
    // elevation: 4,
  },
  badgeButtonText: {
    fontSize: 14,
    fontFamily: "DMSans600",
    color: "#373737",
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 15,
    marginBottom: 44,
  },
  paginationDot: {
    width: 7,
    height: 7,
    borderRadius: 5,
    backgroundColor: "#DDDDDD",
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: "#FF69B4",
    width: 10,
    height: 10,
    marginHorizontal: 3,
    borderRadius: 5,
  },
  noBadgesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noBadgesText: {
    fontSize: 16,
    fontFamily: "DMSans500",
    color: "#7B7B7B",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  expandButton: {
    padding: 5,
    width: '100%',
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  // Bottom sheet styles
  bottomSheetBackground: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E162BC",
    borderTopRightRadius: 20,
  },
  bottomSheetIndicator: {
    backgroundColor: "#E0E0E0",
    width: 30,
    height: 5,
  },
  bottomSheetHeader: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontFamily: "DMSans600",
    color: "#373737",
    textAlign: "center",
  },
  badgeGridContainer: {
    paddingHorizontal: 10,
    paddingVertical: 15,
  },
  badgeGridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  badgeGridItem: {
    width: width / 3 - 20,
    height: width / 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    padding: 5,
  },
  selectedBadgeGridItem: {
    borderWidth: 2,
    borderColor: "#F76CCF80",
    borderRadius: 10,
  },
  badgeWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  lockedBadgeWrapper: {
    position: "relative",
    borderRadius: 15,
    borderWidth: 0.5,
    borderColor: "#CCCCCC52",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F7F780",
    opacity: 0.5,
  },

  pinkBorderContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  lockIconContainer: {
    position: "absolute",
    bottom: -1,
    right: -9,
    backgroundColor: "#FFEAF9",
    borderRadius: 10,
    padding: 2,
  },
  carouselLockedBadgeContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  carouselLockIconContainer: {
    position: "absolute",
    bottom: -10,
    right: 20,
    backgroundColor: "#FFEAF9",
    borderRadius: 20,
    padding: 6,
  },
  instaDotContainer: {
    // You can customize the container style here
    // paddingVertical: 10,
  },
  paginationContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 15,
    marginBottom: 25,
  },
  placeholderBadge: {
    width: 72,
    height: 72,
    backgroundColor: "#f0f0f0",
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 10,
    textAlign: "center",
    padding: 5,
    color: "#666",
  },
  badgeGridItemText: {
    fontSize: 10,
    fontFamily: "DMSans500",
    color: "#373737",
    textAlign: "center",
    marginTop: 5,
  },
  lockedBadgeText: {
    color: "#888888",
  },
  badgeCategoryContainer: {
    marginBottom: 20,
  },
  badgeCategoryTitle: {
    fontSize: 16,
    fontFamily: "DMSans600",
    color: "#E162BC",
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  tipContainer: {
    backgroundColor: "#ffffff",
    // borderWidth: 1,
    // borderColor: "#FFD6E8",
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: "#000",
    width: width * 0.85,  // 90% of the screen width
    alignSelf: "center",
    boxShadow: "0px 0px 4px 0px rgba(0, 0, 0, 0.25)",
  },
  tipLabel: {
    fontSize: 14,
    fontFamily: "DMSans700",
    color: "#373737",
  },
  tipText: {
    // flex: 1,
    fontSize: 14,
    fontFamily: "DMSans500",
    color: "#7B7B7B",
  },
});


