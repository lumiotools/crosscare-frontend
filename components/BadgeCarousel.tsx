import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TriviaQueen from "@/assets/images/Svg/Badges/TriviaQueen";

const { width } = Dimensions.get("window");

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

// Badge image mapping
export const getBadgeImage = (badgeType: string) => {
  switch (badgeType) {
    case "TRIVIA_QUEEN":
        return <TriviaQueen/>;
  }
};

interface BadgeCarouselProps {
  badges: Badge[];
  currentIndex: number;
  onChangeIndex: (index: number) => void;
}

const BadgeCarousel: React.FC<BadgeCarouselProps> = ({
  badges,
  currentIndex,
  onChangeIndex,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Handle scroll events to update the current index
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / width);
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < badges.length) {
      onChangeIndex(newIndex);
    }
  };

  // Scroll to a specific badge
  const scrollToBadge = (index: number) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * width,
        animated: true,
      });
    }
  };

  // Handle previous badge
  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      onChangeIndex(newIndex);
      scrollToBadge(newIndex);
    }
  };

  // Handle next badge
  const handleNext = () => {
    if (currentIndex < badges.length - 1) {
      const newIndex = currentIndex + 1;
      onChangeIndex(newIndex);
      scrollToBadge(newIndex);
    }
  };

  if (badges.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No badges earned yet</Text>
      </View>
    );
  }

  const renderPaginationDots = () => {
    const dots = [];
    for (let i = 0; i < badges.length; i++) {
      dots.push(
        <TouchableOpacity 
          key={i} 
          onPress={() => {
            onChangeIndex(i);
            scrollToBadge(i);
          }}
        >
          <View
            style={[
              styles.paginationDot,
              {
                backgroundColor: i === currentIndex ? "#E162BC" : "#E0E0E0",
                width: i === currentIndex ? 16 : 8,
              },
            ]}
          />
        </TouchableOpacity>
      );
    }
    return <View style={styles.paginationContainer}>{dots}</View>;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false, listener: handleScroll }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollViewContent}
        initialScrollIndex={currentIndex}
        onContentSizeChange={() => {
          // Scroll to the initial index when content size changes
          scrollToBadge(currentIndex);
        }}
      >
        {badges.map((badge, index) => (
          <View key={badge.id} style={styles.badgeSlide}>
            <View style={styles.badgeImageContainer}>
              {getBadgeImage(badge.badge.type)}
            </View>
            
            <Text style={styles.badgeTitle}>{badge.badge.title}</Text>
            <Text style={styles.badgeDescription}>
              {badge.badge.description}
            </Text>
            
            <TouchableOpacity style={styles.badgeRewardedButton}>
              <Text style={styles.badgeRewardedText}>Badge Rewarded</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {renderPaginationDots()}

      <View style={styles.navigationButtons}>
        <TouchableOpacity 
          style={[styles.navButton, currentIndex === 0 && styles.disabledButton]} 
          onPress={handlePrevious}
          disabled={currentIndex === 0}
        >
          <Ionicons name="chevron-back" size={24} color={currentIndex === 0 ? "#E0E0E0" : "#373737"} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.navButton, currentIndex === badges.length - 1 && styles.disabledButton]} 
          onPress={handleNext}
          disabled={currentIndex === badges.length - 1}
        >
          <Ionicons name="chevron-forward" size={24} color={currentIndex === badges.length - 1 ? "#E0E0E0" : "#373737"} />
        </TouchableOpacity>
      </View>

      <View style={styles.scrollIndicator}>
        <Ionicons name="chevron-down" size={24} color="#E0E0E0" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#7B7B7B",
    fontFamily: "DMSans500",
  },
  scrollViewContent: {
    alignItems: "center",
  },
  badgeSlide: {
    width: width,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  badgeImageContainer: {
    width: 200,
    height: 300,
    marginVertical: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeImage: {
    width: "100%",
    height: "100%",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  badgeTitle: {
    fontSize: 20,
    fontFamily: "DMSans700",
    color: "#E162BC",
    marginBottom: 10,
  },
  badgeDescription: {
    fontSize: 14,
    fontFamily: "DMSans400",
    color: "#7B7B7B",
    textAlign: "center",
    paddingHorizontal: 40,
    marginBottom: 30,
  },
  badgeRewardedButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "white",
  },
  badgeRewardedText: {
    fontSize: 14,
    fontFamily: "DMSans600",
    color: "#373737",
  },
  navigationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "60%",
    marginTop: 10,
  },
  navButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
  },
  disabledButton: {
    opacity: 0.5,
  },
  scrollIndicator: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
  },
});

export default BadgeCarousel;
