import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  StatusBar,
  Easing,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native"; // Add Lottie import
import { Dimensions } from "react-native";

// Import your badge images
const BADGE_IMAGES: Record<string, any> = {
  TRIVIA_QUEEN: require("../assets/images/badge/trivia.png"),
  HOT_MAMA: require("../assets/images/badge/Hot Mama.png"),
  SNAPSHOT: require("../assets/images/badge/snapshot queen.png"),
  HYDRATED_QUEEN: require("../assets/images/badge/Hydrated Queen.png"),
  HEART_SCRIBE: require("../assets/images/badge/heart.png"),
  EXPLORER: require("../assets/images/badge/explorer.png"),
  RESTED_DIVA: require("../assets/images/badge/diva.png"),
  SLEEP_WIZARD_I: require("../assets/images/badge/Sleep Wizard 1.png"),
  SLEEP_WIZARD_II: require("../assets/images/badge/Sleep Wizard 2.png"),
  SLEEP_WIZARD_III: require("../assets/images/badge/Sleep Wizard 3.png"),
  SLEEP_WIZARD_IV: require("../assets/images/badge/Sleep Wizard 4.png"),
  SLEEP_WIZARD_V: require("../assets/images/badge/Sleep Wizard 5.png"),
  SLEEP_WIZARD_VI: require("../assets/images/badge/Sleep Wizard 6.png"),
  SLEEP_WIZARD_VII: require("../assets/images/badge/Sleep Wizard 7.png"),
  SLEEP_WIZARD_VIII: require("../assets/images/badge/Sleep Wizard 8.png"),
  SLEEP_WIZARD_IX: require("../assets/images/badge/Sleep Wizard 9.png"),
  WATER_WIZARD_I: require("../assets/images/badge/Water Wizard 1.png"),
  WATER_WIZARD_II: require("../assets/images/badge/Water Wizard 2.png"),
  WATER_WIZARD_III: require("../assets/images/badge/Water Wizard 3.png"),
  WATER_WIZARD_IV: require("../assets/images/badge/Water Wizard 4.png"),
  WATER_WIZARD_V: require("../assets/images/badge/Water Wizard 5.png"),
  WATER_WIZARD_VI: require("../assets/images/badge/Water Wizard 6.png"),
  WATER_WIZARD_VII: require("../assets/images/badge/Water Wizard 7.png"),
  WATER_WIZARD_VIII: require("../assets/images/badge/Water Wizard 8.png"),
  WATER_WIZARD_IX: require("../assets/images/badge/Water Wizard 9.png"),
  HEALTH_QUEEN_I: require("../assets/images/badge/Health Wizard 1.png"),
  HEALTH_QUEEN_II: require("../assets/images/badge/Health Wizard 2.png"),
  HEALTH_QUEEN_III: require("../assets/images/badge/Health Wizard 3.png"),
  HEALTH_QUEEN_IV: require("../assets/images/badge/Health Wizard 4.png"),
  HEALTH_QUEEN_V: require("../assets/images/badge/Health Wizard 5.png"),
  HEALTH_QUEEN_VI: require("../assets/images/badge/Health Wizard 6.png"),
  HEALTH_QUEEN_VII: require("../assets/images/badge/Health Wizard 7.png"),
  HEALTH_QUEEN_VIII: require("../assets/images/badge/Health Wizard 8.png"),
  HEALTH_QUEEN_IX: require("../assets/images/badge/Health Wizard 9.png"),
  ON_THE_MOVE_I: require("../assets/images/badge/On The Move 1.png"),
  ON_THE_MOVE_II: require("../assets/images/badge/On The Move 2.png"),
  ON_THE_MOVE_III: require("../assets/images/badge/On The Move 3.png"),
  ON_THE_MOVE_IV: require("../assets/images/badge/On The Move 4.png"),
  ON_THE_MOVE_V: require("../assets/images/badge/On The Move 5.png"),
  ON_THE_MOVE_VI: require("../assets/images/badge/On The Move 6.png"),
  ON_THE_MOVE_VII: require("../assets/images/badge/On The Move 7.png"),
  ON_THE_MOVE_VIII: require("../assets/images/badge/On The Move 8.png"),
  ON_THE_MOVE_IX: require("../assets/images/badge/On The Move 9.png"),
};

// Define badge type to match your API response structure
export type Badge = {
  id: string;
  type: keyof typeof BADGE_IMAGES;
  title?: string;
  name?: string;
  description?: string;
  badge?: {
    type: keyof typeof BADGE_IMAGES;
    title: string;
    description: string;
  };
};

// Create context
type BadgeContextType = {
  showBadge: (badge: Badge) => void;
};

const BadgeContext = createContext<BadgeContextType | undefined>(undefined);
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Create provider component
export const BadgeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [visible, setVisible] = useState(false);
  const [currentBadge, setCurrentBadge] = useState<Badge | null>(null);
  const [scale] = useState(new Animated.Value(0.5));
  const [opacity] = useState(new Animated.Value(0));
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const rotationAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const lottieRef = useRef<LottieView>(null);
  const [lottieFinished, setLottieFinished] = useState(false);

  // Animation values for badge flying to profile tab
  const [isAnimatingToTab, setIsAnimatingToTab] = useState(false);
  const badgeScaleAnim = useRef(new Animated.Value(1)).current;
  const badgePositionX = useRef(new Animated.Value(0)).current;
  const badgePositionY = useRef(new Animated.Value(0)).current;
  const badgeOpacity = useRef(new Animated.Value(1)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;

  const badgeContainerRef = useRef<View>(null);
  const [badgeInitialPosition, setBadgeInitialPosition] = useState({ x: 0, y: 0 });

  // Start rotation animation when badge is shown and lottie is finished
  useEffect(() => {
    if (visible && lottieFinished && !isAnimatingToTab) {
      // Stop any existing animation
      if (rotationAnimation.current) {
        rotationAnimation.current.stop();
      }
      
      // Reset rotation value
      rotateAnim.setValue(0);
      
      // Create and store the animation
      rotationAnimation.current = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 8000, // 8 seconds for a full rotation
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      
      // Start the animation
      rotationAnimation.current.start();
    } else if (!visible || isAnimatingToTab) {
      // Stop animation when modal is hidden or when animating to tab
      if (rotationAnimation.current) {
        rotationAnimation.current.stop();
      }
      
      if (!visible) {
        rotateAnim.setValue(0);
        // Reset lottie finished state
        setLottieFinished(false);
        // Reset animation to tab state
        setIsAnimatingToTab(false);
      }
    }
    
    // Clean up animation when component unmounts
    return () => {
      if (rotationAnimation.current) {
        rotationAnimation.current.stop();
      }
    };
  }, [visible, lottieFinished, rotateAnim, isAnimatingToTab]);

  // Handle Lottie animation when modal becomes visible
  useEffect(() => {
    if (visible && !isAnimatingToTab) {
      // Reset lottie finished state
      setLottieFinished(false);
      
      // Reset animation values
      badgeScaleAnim.setValue(1);
      badgePositionX.setValue(0);
      badgePositionY.setValue(0);
      badgeOpacity.setValue(1);
      contentOpacity.setValue(1);
      
      // Play Lottie animation if available
      if (lottieRef.current) {
        // Reset and play from the beginning
        lottieRef.current.reset();
        lottieRef.current.play();
      }
    } else if (!visible) {
      // Reset when modal is hidden
      if (lottieRef.current) {
        lottieRef.current.reset();
      }
    }
  }, [visible, isAnimatingToTab, badgeScaleAnim, badgePositionX, badgePositionY, badgeOpacity, contentOpacity]);

  // Interpolate rotation value
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Function to check if badge has been shown before
  const hasBeenShown = async (badgeId: string): Promise<boolean> => {
    try {
      const shownBadges = await AsyncStorage.getItem("shownBadges");
      if (shownBadges) {
        const badgeArray = JSON.parse(shownBadges);
        return badgeArray.includes(badgeId);
      }
      return false;
    } catch (error) {
      console.error("Error checking shown badges:", error);
      return false;
    }
  };

  // Function to mark badge as shown
  const markAsShown = async (badgeId: string) => {
    try {
      if (!badgeId) {
        console.error("Invalid badge ID:", badgeId);
        return;
      }

      const shownBadges = await AsyncStorage.getItem("shownBadges");
      let badgeArray = shownBadges ? JSON.parse(shownBadges) : [];

      // Only add if not already in the array
      if (!badgeArray.includes(badgeId)) {
        badgeArray.push(badgeId);
        await AsyncStorage.setItem("shownBadges", JSON.stringify(badgeArray));
        console.log(
          `Badge ${badgeId} marked as shown. Current shown badges:`,
          badgeArray
        );
      } else {
        console.log(`Badge ${badgeId} was already marked as shown`);
      }
    } catch (error) {
      console.error("Error marking badge as shown:", error);
    }
  };

  // Function to show badge
  const showBadge = async (badge: Badge) => {
    console.log("showBadge called with:", badge);

    if (!badge || !badge.id) {
      console.error("Invalid badge data:", badge);
      return;
    }

    // Check if this badge has already been shown
    const alreadyShown = await hasBeenShown(badge.id);
    if (alreadyShown) {
      console.log("Badge already shown, skipping:", badge.id);
      return;
    }

    console.log("Showing badge:", badge.id);
    setCurrentBadge(badge);
    setVisible(true);

    // Animate the badge appearance
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Mark this badge as shown immediately when showing it
    // This ensures it won't be shown again even if the user doesn't click "Claim"
    await markAsShown(badge.id);
  };

  const animateBadgeToTab = () => {
    if (!currentBadge) return;
    
    // Set the last claimed badge
    contentOpacity.setValue(0);

    // Set animating state
    setIsAnimatingToTab(true);
    
    // Stop star rotation animation
    if (rotationAnimation.current) {
      rotationAnimation.current.stop();
    }
    
    // Fade out other content
    Animated.timing(contentOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    const targetX = SCREEN_WIDTH; // Offset from center
    
    // Calculate the target Y position for the bottom tab bar
    // The tab bar is at the very bottom of the screen
    const targetY = SCREEN_HEIGHT+600;
    
    // Animate badge to profile tab (bottom right of screen)
    Animated.sequence([
      // First scale down slightly
      Animated.timing(badgeScaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      // Then animate to the tab position
      Animated.parallel([
        Animated.timing(badgePositionX, {
          toValue:targetX, // Adjust based on your tab position
          duration: 800,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(badgePositionY, {
          toValue: targetY, // Adjust based on your tab position
          duration: 800,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
        Animated.timing(badgeScaleAnim, {
          toValue: 0.3, // Scale down to tab icon size
          duration: 800,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          useNativeDriver: true,
        }),
      ]),
      // Finally fade out and close modal
      Animated.timing(badgeOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Close the modal after animation completes
      hideBadge();
    });
  };

  // Function to hide badge
  const hideBadge = () => {
    if (currentBadge) {
      console.log(`Hiding badge: ${currentBadge.id}`);
    }

    // Animated.parallel([
    //   Animated.timing(opacity, {
    //     toValue: 0,
    //     duration: 200,
    //     useNativeDriver: true,
    //   }),
    //   Animated.spring(scale, {
    //     toValue: 0.5,
    //     friction: 5,
    //     tension: 40,
    //     useNativeDriver: true,
    //   }),
    // ]).start(() => {
    //   setVisible(false);
    //   setCurrentBadge(null);
    //   // Reset animation values
    //   scale.setValue(0.5);
    //   opacity.setValue(0);
    // });

    setVisible(false);
    
    // Reset animation values after a short delay to ensure smooth transition
    setTimeout(() => {
      setCurrentBadge(null);
      setIsAnimatingToTab(false);
      scale.setValue(0.5);
      opacity.setValue(0);
      badgeScaleAnim.setValue(1);
      badgePositionX.setValue(0);
      badgePositionY.setValue(0);
      badgeOpacity.setValue(1);
      contentOpacity.setValue(1);
    }, 100);
  };

  // Get the badge type based on the structure
  const getBadgeType = (badge: Badge): keyof typeof BADGE_IMAGES => {
    if (badge.badge && badge.badge.type) {
      return badge.badge.type;
    }
    return badge.type;
  };

  // Get the badge title based on the structure
  const getBadgeTitle = (badge: Badge): string => {
    if (badge.badge && badge.badge.title) {
      return badge.badge.title;
    }
    return badge.title || badge.name || "New Badge";
  };

  const handleLottieFinish = () => {
    console.log("Lottie animation finished");
    setLottieFinished(true);
  };

  return (
    <BadgeContext.Provider value={{ showBadge }}>
      {children}

      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={hideBadge}
      >
        <BlurView
          intensity={10}
          experimentalBlurMethod="dimezisBlurView"
          tint="light"
          style={StyleSheet.absoluteFill}
        >
          <StatusBar barStyle="dark-content" />
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={['rgba(250, 181, 232, 1)', 'rgba(247, 108, 207, 1)']}
              start={{ x: 0.5, y: -0.1 }}
                        end={{ x: 0.5, y: 1 }}
              style={[StyleSheet.absoluteFill, { opacity:0.1 }]}
            />
            <View style={styles.overlay} />

            <Animated.View
              style={[
                styles.modalContent,
                {
                  opacity,
                  transform: [{ scale }],
                },
              ]}
            >
              {currentBadge && (
                <>

<View style={styles.badgeContainer} ref={badgeContainerRef}>

<LottieView
                      ref={lottieRef}
                      source={require('../assets/confetti.json')}
                      style={styles.lottieAnimation}
                      loop={false}
                      onAnimationFinish={handleLottieFinish}
                    />

{!isAnimatingToTab && (
                      <Animated.Image
                        source={require('../assets/images/Star 3.png')}
                        style={[
                          styles.starBackground,
                          {
                            transform: [{ rotate }],
                            opacity: lottieFinished ? 1 : 0, // Only show when Lottie is finished
                          },
                        ]}
                        resizeMode="contain"
                      />
                    )}

                    {/* <Animated.Image
                      source={require('../assets/images/Star 3.png')}
                      style={[
                        styles.starBackground,
                        {
                          transform: [{ rotate }],
                          opacity: lottieFinished ? 1 : 0, // Only show when Lottie is finished
                        },
                      ]}
                      resizeMode="contain"
                    /> */}
                    <Animated.Image
                      source={BADGE_IMAGES[getBadgeType(currentBadge)]}
                      style={[
                        styles.badgeImage,
                        {
                          transform: [
                            { scale: badgeScaleAnim },
                            { translateX: badgePositionX },
                            { translateY: badgePositionY },
                          ],
                          opacity: badgeOpacity,
                        },
                      ]}
                      resizeMode="contain"
                    />
                  </View>
                  <Animated.View style={[ styles.contentContainer, { opacity: contentOpacity }]}>

                  <View style={styles.badgeTextContainer}>
  <Text style={styles.badgeText}>New Badge Unlocked</Text>
</View>
                  <TouchableOpacity
                    style={{
                      height: 50,
                      width: 150,
                      marginTop: 30,
                    }}
                    onPress={animateBadgeToTab}
                  >
                    <LinearGradient
                      colors={[
                        "rgba(215, 17, 158, 1)",
                        "rgba(229, 154, 209, 1)",
                        "rgba(229, 154, 209, 1)",
                      ]}
                      style={styles.gradientBorder}
                    >
                      {/* Button gradient */}
                      <LinearGradient
                        colors={[
                          "rgba(255, 233, 249, 1)",
                          "rgba(229, 154, 209, 1)",
                          "rgba(247, 108, 207, 1)",
                          "rgba(215, 17, 158, 1)",
                          "rgba(215, 17, 158, 1)",
                        ]}
                        start={{ x: 0.5, y: -0.1 }}
                        end={{ x: 0.5, y: 1 }}
                        style={styles.gradientFill}
                      >
                        <Text style={styles.buttonText}>CLAIM</Text>
                      </LinearGradient>
                    </LinearGradient>
                  </TouchableOpacity>
                  </Animated.View>
                </>
              )}
            </Animated.View>
          </View>
        </BlurView>
      </Modal>
    </BadgeContext.Provider>
  );
};

// Custom hook to use the badge context
export const useBadge = () => {
  const context = useContext(BadgeContext);
  if (context === undefined) {
    throw new Error("useBadge must be used within a BadgeProvider");
  }
  return context;
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.10)",
  },
  modalContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeContainer: {
    width: 320,
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 30,

  },
  lottieAnimation: {
    position: 'absolute',
    width: 500,
    height: 500,
    zIndex: 0,
  },
  starBackground: {
    position: 'absolute',
    width: 400,
    height: 400,
    zIndex:0,
  },
  badgeImage: {
    width: 320,
    height: 260,
  },
  badgeTextContainer: {
    // backgroundColor: '#FEF0FA', // Background with opacity
    marginBottom: 30,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 20,
    fontFamily: 'DMSans700',
    color: '#373737', // Fully opaque text
    textAlign: 'center',
  },
  badgeTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 20,
    fontFamily: "DMSans500",
    color: "#333",
    backgroundColor: "#FEF0FA",
    textAlign: "center",
  },
  gradientBorder: {
    flex: 1,
    borderRadius: 25,
    padding: 2, // This is the border width
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  // New container specifically for the button to ensure proper centering
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 30,
  },
  gradientFill: {
    flex: 1,
    borderRadius: 23.5, // Slightly smaller to account for border
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontFamily: "GroBold",
    letterSpacing: 2,
  },
});
