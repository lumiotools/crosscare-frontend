import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  StatusBar,
  Animated,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ViewShot from "react-native-view-shot";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "@/store/userSlice";
import { LinearGradient } from "expo-linear-gradient";
import { useAvatarStore } from "@/zustandStore/contentfulStores/avatarStore";
import Lock from "@/assets/images/Svg/Lock";
import { useTranslation } from "react-i18next";

// List of regular badge types
const REGULAR_BADGE_TYPES = [
  "HYDRATED_QUEEN",
  "SNAPSHOT",
  "TRIVIA_QUEEN",
  "HEART_SCRIBE",
  "RESTED_DIVA",
  "EXPLORER",
];

// List of streak badge types
const STREAK_BADGE_TYPES = [
  "HEALTH_QUEEN",
  "ON_THE_MOVE",
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

// Define Badge interface
interface Badge {
  id: string;
  patientId: string;
  badgeId: string;
  awardedAt: string;
  badge: {
    type: string;
    title: string;
    description: string;
    createdAt: string;
  };
}

interface UnlockResult {
  hairstyles: string[];
  outfits: string[];
}

export default function AvatarSelectionScreen() {
  // Get avatar data from the Contentful store
  const { 
    hairstyles, 
    outfits, 
    combinations,
    isLoadingHairstyles,
    isLoadingOutfits,
    isLoadingCombinations,
    fetchAllAvatarAssets,
    downloadHairstyleImage,
    downloadOutfitImage,
    downloadCombinationImages,
    updateUnlockedItems,
    getCombination
  } = useAvatarStore();

  const [activeTab, setActiveTab] = useState("Hairstyle");
  const [selectedHairstyleId, setSelectedHairstyleId] = useState<string | null>(null);
  const [selectedOutfitId, setSelectedOutfitId] = useState<string | null>(null);
  const [previewHairstyleId, setPreviewHairstyleId] = useState<string | null>(null);
  const [previewOutfitId, setPreviewOutfitId] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [lockedHairstyleSelected, setLockedHairstyleSelected] = useState(false);
  const [lockedOutfitSelected, setLockedOutfitSelected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [badgeData, setBadgeData] = useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [unlockResult, setUnlockResult] = useState<UnlockResult | null>(null);

  const {t} = useTranslation();
  
  // Track image URLs
  const [previewFaceImageUrl, setPreviewFaceImageUrl] = useState<string | null>(null);
  const [previewCombinedImageUrl, setPreviewCombinedImageUrl] = useState<string | null>(null);
  const [finalFaceImageUrl, setFinalFaceImageUrl] = useState<string | null>(null);
  const [finalCombinedImageUrl, setFinalCombinedImageUrl] = useState<string | null>(null);
  
  const token = useSelector((state: any) => state.user.token);
  const user = useSelector((state: any) => state.user);
  const dispatch = useDispatch();

  // Reference for ViewShot
  const viewShotRef = useRef(null);
  // Reference for avatar ViewShot
  const avatarViewShotRef = useRef(null);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const previewScaleAnim = useRef(new Animated.Value(0.8)).current;
  const previewOpacityAnim = useRef(new Animated.Value(0)).current;

  // Loading state
  const isLoading = isLoadingHairstyles || isLoadingOutfits || isLoadingCombinations;


  // useEffect(()=>{
  //   const Avatar = async ()=>{
  //     const response = await fetch(`https://crosscare-backends.onrender.com/api/user/${user?.user_id}/profile`, {
  //       method: "GET",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${user?.token}`,
  //       },
  //     });

  //     const data = await response.json();

  //     console.log("API Response:", data);
  //     if(data.avatarUrl){
  //       router.replace("/patient/(tabs)/home");
  //     }
  //   }
  //   Avatar();
  // },[user?.user_id])

  // Fetch all avatar assets on component mount
  useEffect(() => {
    fetchAllAvatarAssets();
    fetchBadges();
  }, []);

  // Initialize default selections once data is loaded
  useEffect(() => {
    if (hairstyles.length > 0 && !selectedHairstyleId) {
      const defaultHairstyle = hairstyles.find(h => !h.locked);
      if (defaultHairstyle) {
        setSelectedHairstyleId(defaultHairstyle.id);
        setPreviewHairstyleId(defaultHairstyle.id);
        
        // Pre-download the hairstyle image
        downloadHairstyleImage(defaultHairstyle.id);
      }
    }
    
    if (outfits.length > 0 && !selectedOutfitId) {
      const defaultOutfit = outfits.find(o => !o.locked);
      if (defaultOutfit) {
        setSelectedOutfitId(defaultOutfit.id);
        setPreviewOutfitId(defaultOutfit.id);
        
        // Pre-download the outfit image
        downloadOutfitImage(defaultOutfit.id);
      }
    }
  }, [hairstyles, outfits]);

  // Download combination images when both selections are made
  useEffect(() => {
    if (previewHairstyleId && previewOutfitId) {
      downloadCombinationImages(previewHairstyleId, previewOutfitId)
        .then(({combinedImage, faceImage}) => {
          if (combinedImage) setPreviewCombinedImageUrl(combinedImage);
          if (faceImage) setPreviewFaceImageUrl(faceImage);
        });
    }
  }, [previewHairstyleId, previewOutfitId]);

  // Download final images for the preview modal
  useEffect(() => {
    if (selectedHairstyleId && selectedOutfitId && showPreviewModal) {
      downloadCombinationImages(selectedHairstyleId, selectedOutfitId)
        .then(({combinedImage, faceImage}) => {
          if (combinedImage) setFinalCombinedImageUrl(combinedImage);
          if (faceImage) setFinalFaceImageUrl(faceImage);
        });
    }
  }, [selectedHairstyleId, selectedOutfitId, showPreviewModal]);

  // Effect to handle tab changes and update locked status
  useEffect(() => {
    // When switching tabs, check if a locked item is selected
    if (activeTab === "Hairstyle" && lockedOutfitSelected) {
      // We switched to hairstyle tab and a locked outfit is selected
      // Mark hairstyles as locked with this outfit
      setLockedHairstyleSelected(true);
    } else if (activeTab === "Outfit" && lockedHairstyleSelected) {
      // We switched to outfit tab and a locked hairstyle is selected
      // Mark outfits as locked with this hairstyle
      setLockedOutfitSelected(true);
    }
  }, [activeTab]);

  // Run animation when hairstyle or outfit changes
  useEffect(() => {
    // First shrink and fade out
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.5,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Then pop up and fade in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [previewHairstyleId, previewOutfitId, activeTab]);

  // Animation for preview modal
  useEffect(() => {
    if (showPreviewModal) {
      Animated.parallel([
        Animated.spring(previewScaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(previewOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animation values when modal is closed
      previewScaleAnim.setValue(0.8);
      previewOpacityAnim.setValue(0);
    }
  }, [showPreviewModal]);

  const fetchBadges = async () => {
    if (!token || !user?.user_id) {
      console.log("User not authenticated, cannot fetch badges");
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

      if (!response.ok) {
        throw new Error(`Failed to fetch badges: ${response.status}`);
      }

      const data = await response.json();
      console.log("Badge data:", data);
      if (data && Array.isArray(data)) {
        setBadgeData(data);

        // Extract badge names from the data
        const badgeNames = data.map((badge) => badge.badge.title);
        setEarnedBadges(badgeNames);

        const unlockableItems = calculateUnlockableItems(data);
        if (
          unlockableItems.hairstyles.length > 0 ||
          unlockableItems.outfits.length > 0
        ) {
          setUnlockResult(unlockableItems);
          // Update the unlocked items
          updateUnlockedItems(unlockableItems);
        }
      }
    } catch (error) {
      console.error("Error fetching badges:", error);
    }
  };

  const calculateUnlockableItems = (badges: Badge[]): UnlockResult => {
    // Count regular badges and streak badges
    const regularBadges = badges.filter((badge) => REGULAR_BADGE_TYPES.includes(badge.badge.type));
    const streakBadges = badges.filter((badge) => STREAK_BADGE_TYPES.includes(badge.badge.type));
  
    console.log("Regular badges:", regularBadges.length, regularBadges.map((b) => b.badge.type));
    console.log("Streak badges:", streakBadges.length, streakBadges.map((b) => b.badge.type));
  
    // Calculate unlockable items based on rules:
    // - 1 hair OR 1 outfit for every 3 regular badges
    // - 1 hair OR 1 outfit for every streak badge
  
    // Number of unlocks for regular badges (1 unlock per 3 regular badges)
    const regularUnlocks = Math.floor(regularBadges.length / 3);
    console.log("Regular unlocks:", regularUnlocks);
  
    // Number of unlocks for streak badges (1 unlock per streak badge)
    const streakUnlocks = streakBadges.length;
    console.log("Streak unlocks:", streakUnlocks);
  
    // For regular unlocks: Alternate between hair and outfit
    let regularHairs = Math.floor(regularUnlocks / 2); // Half for hair
    let regularOutfits = regularUnlocks - regularHairs; // Remaining for outfits
  
    // For streak unlocks: Alternate between hair and outfit
    let streakHairs = Math.floor(streakUnlocks / 2); // Half for hair
    let streakOutfits = streakUnlocks - streakHairs; // Remaining for outfits
  
    console.log("Regular hairs:", regularHairs, "Regular outfits:", regularOutfits);
    console.log("Streak hairs:", streakHairs, "Streak outfits:", streakOutfits);
  
    // Calculate the total hairs and outfits to unlock
    const totalHairsToUnlock = regularHairs + streakHairs;
    const totalOutfitsToUnlock = regularOutfits + streakOutfits;
  
    console.log("Total hairs to unlock:", totalHairsToUnlock, "Total outfits to unlock:", totalOutfitsToUnlock);
  
    // Get locked hairstyles and outfits from Contentful data
    const lockedHairstyleIds = hairstyles
      .filter((h) => h.locked)
      .map((h) => h.id)
      .slice(0, totalHairsToUnlock);
  
    const lockedOutfitIds = outfits
      .filter((o) => o.locked)
      .map((o) => o.id)
      .slice(0, totalOutfitsToUnlock);
  
    console.log("Hairstyles to unlock:", lockedHairstyleIds);
    console.log("Outfits to unlock:", lockedOutfitIds);
  
    return {
      hairstyles: lockedHairstyleIds,
      outfits: lockedOutfitIds,
    };
  };
  

  const handleHairstyleSelect = (hairstyleId: string): void => {
    // Always update the preview hairstyle
    setPreviewHairstyleId(hairstyleId);

    // Check if the selected hairstyle is locked
    const isLocked = hairstyles.find((h) => h.id === hairstyleId)?.locked;

    // Update locked state
    setLockedHairstyleSelected(!!isLocked);

    // Only update the selected hairstyle if it's not locked
    if (hairstyleId !== selectedHairstyleId && !isLocked) {
      setSelectedHairstyleId(hairstyleId);
    }

    // Pre-download the hairstyle image
    downloadHairstyleImage(hairstyleId);
  };

  const handleOutfitSelect = (outfitId: string): void => {
    // Always update the preview outfit
    setPreviewOutfitId(outfitId);

    // Check if the selected outfit is locked
    const isLocked = outfits.find((o) => o.id === outfitId)?.locked;

    // Update locked state
    setLockedOutfitSelected(!!isLocked);

    // Only update the selected outfit if it's not locked
    if (outfitId !== selectedOutfitId && !isLocked) {
      setSelectedOutfitId(outfitId);
    }

    // Pre-download the outfit image
    downloadOutfitImage(outfitId);
  };

  // Get current avatar image based on active tab
  const getCurrentAvatarImage = () => {
    if (!previewHairstyleId || !previewOutfitId) {
      return null;
    }

    // Get the appropriate image based on which tab is active
    if (activeTab === "Hairstyle") {
      return previewFaceImageUrl || null;
    } else {
      return previewCombinedImageUrl || null;
    }
  };

  // Check if the current preview item is locked
  const isPreviewLocked = () => {
    if (activeTab === "Hairstyle") {
      // If a locked outfit is selected, show hairstyles as locked
      if (lockedOutfitSelected) {
        return true;
      }
      return hairstyles.find((h) => h.id === previewHairstyleId)?.locked;
    } else {
      // If a locked hairstyle is selected, show outfits as locked
      if (lockedHairstyleSelected) {
        return true;
      }
      return outfits.find((o) => o.id === previewOutfitId)?.locked;
    }
  };

  // Handle done button press
  const handleDonePress = () => {
    setShowPreviewModal(true);
  };

  // Function to save avatar to AsyncStorage
  const saveAvatarToStorage = async () => {
    try {
      setIsSaving(true);

      if (!avatarViewShotRef.current) {
        throw new Error("Avatar ViewShot reference is not available");
      }

      if (!finalFaceImageUrl) {
        throw new Error("Final avatar image is not available");
      }

      // Capture the avatar image from the viewshot
      const uri = await avatarViewShotRef.current.capture();

      // Save avatar data to AsyncStorage as a backup
      const avatarData = {
        imageUri: uri,
        hairstyleId: selectedHairstyleId,
        outfitId: selectedOutfitId,
        timestamp: new Date().toISOString(),
      };

      // Save to AsyncStorage first (as a backup)
      await AsyncStorage.setItem("userAvatar", JSON.stringify(avatarData));

      // Check if we have the necessary user data for API upload
      if (!token || !user?.user_id) {
        throw new Error("User authentication data is missing");
      }

      // Create FormData for the API request
      const formData = new FormData();

      // Append the image file with proper metadata
      formData.append("avatarUrl", {
        uri: avatarData.imageUri,
        type: "image/jpeg",
        name: "avatar-image.jpg",
      } as any); // Type assertion needed for React Native FormData

      console.log("Uploading avatar data:", avatarData);

      // Make the API request
      const response = await fetch(
        `https://crosscare-backends.onrender.com/api/user/${user.user_id}/avatar`,
        {
          method: "POST",
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      // Check if the request was successful
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Server response:", data);

      // Update user state with new avatar URL
      if (data.data && data.data.avatarUrl) {
        dispatch(
          setUser({
            ...user,
            avatar_url: data.data.avatarUrl,
          })
        );
      }

      // Show success message
      Alert.alert("Success", "Avatar saved successfully!");

      // Close the modal
      setShowPreviewModal(false);

      // Navigate back or to the next screen
      router.back();
    } catch (error) {
      console.error("Error saving avatar:", error);

      // Show more specific error message if available
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save avatar. Please try again.";

      Alert.alert("Error", errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const isAnySelectedItemLocked = () => {
    const isHairstyleLocked = hairstyles.find(
      (h) => h.id === previewHairstyleId
    )?.locked;
    const isOutfitLocked = outfits.find(
      (o) => o.id === previewOutfitId
    )?.locked;
    return (
      isHairstyleLocked ||
      isOutfitLocked ||
      lockedHairstyleSelected ||
      lockedOutfitSelected
    );
  };

  // Function to check if an item should be displayed as locked in the grid
  const shouldDisplayAsLocked = (itemId: string, isHairstyle: boolean) => {
    // If it's a hairstyle and a locked outfit is selected
    if (isHairstyle && lockedOutfitSelected) {
      return true;
    }

    // If it's an outfit and a locked hairstyle is selected
    if (!isHairstyle && lockedHairstyleSelected) {
      return true;
    }

    // Otherwise, check the item's own locked status
    return isHairstyle
      ? hairstyles.find((h) => h.id === itemId)?.locked
      : outfits.find((o) => o.id === itemId)?.locked;
  };

  const renderHairstyleLoadingSkeleton = () => {
    return (
      <View style={styles.optionsGrid}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((index) => (
          <View key={index} style={styles.optionItem}>
            <View
              style={[styles.optionImageContainer, styles.skeletonContainer]}
            >
              <ActivityIndicator size="small" color="#FF69B4" />
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderOutfitLoadingSkeleton = () => {
    return (
      <View style={styles.optionsGrid}>
        {[1, 2, 3, 4, 5, 6].map((index) => (
          <View key={index} style={styles.optionItem1}>
            <View
              style={[styles.optionImageContainer1, styles.skeletonContainer]}
            >
              <ActivityIndicator size="small" color="#FF69B4" />
            </View>
          </View>
        ))}
      </View>
    );
  };

  // Add this just before the return statement
  useEffect(() => {
    console.log("Current app state:");
    // console.log("Hairstyles:", hairstyles.map(h => h.id));
    // console.log("Outfits:", outfits.map(o => o.id));
    // console.log("Combinations:", combinations);
    // console.log("Selected/Preview IDs:", {
    //   selectedHairstyleId,
    //   selectedOutfitId,
    //   previewHairstyleId,
    //   previewOutfitId
    // });
    // console.log("Image URLs:", {
    //   previewFaceImageUrl,
    //   previewCombinedImageUrl
    // });
  }, [
    hairstyles,
    outfits,
    combinations,
    selectedHairstyleId,
    selectedOutfitId,
    previewHairstyleId,
    previewOutfitId,
    previewFaceImageUrl,
    previewCombinedImageUrl
  ]);
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelButton}>{t('cancel')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}> {t('customize.avatar')}</Text>
        <TouchableOpacity
          onPress={handleDonePress}
          disabled={isAnySelectedItemLocked()}
        >
          <Text
            style={[
              styles.doneButton,
              isAnySelectedItemLocked() && styles.disabledButton,
            ]}
          >
            {t('customize.done')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Avatar Preview */}
      <View style={styles.avatarContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#FF69B4" />
        ) : (
          <Animated.View
            style={{
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            }}
          >
            {getCurrentAvatarImage() ? (
              <Image
                source={{ uri: getCurrentAvatarImage() || ""}}
                style={[
                  styles.avatarImage,
                  isPreviewLocked() && styles.grayscaleImage,
                ]}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <ActivityIndicator size="small" color="#FF69B4" />
              </View>
            )}
            
            {isPreviewLocked() && (
              <View style={styles.lockBadgeContainer}>
                <View style={styles.lockBadge}>
                  <Lock width={16} height={16} />
                </View>
              </View>
            )}
            {isPreviewLocked() && (
              <View style={styles.levelUpContainer}>
                <Text style={styles.levelUpText}> {t('customize.levelUpToUnlock')}</Text>
              </View>
            )}
          </Animated.View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Hairstyle" && styles.activeTab1]}
          onPress={() => setActiveTab("Hairstyle")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Hairstyle" && styles.activeTabText,
            ]}
          >
             {t('customize.hairstyle')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Outfit" && styles.activeTab]}
          onPress={() => setActiveTab("Outfit")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Outfit" && styles.activeTabText,
            ]}
          >
            {t('customize.outfit')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Options Container */}
      <ScrollView style={styles.optionsContainer}>
        {activeTab === "Hairstyle" ? (
          isLoadingHairstyles ? (
            renderHairstyleLoadingSkeleton()
          ) : (
            <View style={styles.optionsGrid}>
              {hairstyles.map((hairstyle) => (
                <TouchableOpacity
                  key={hairstyle.id}
                  style={[
                    styles.optionItem,
                    previewHairstyleId === hairstyle.id &&
                      styles.selectedOptionItem,
                  ]}
                  onPress={() => handleHairstyleSelect(hairstyle.id)}
                >
                  <View
                    style={[
                      styles.optionImageContainer,
                      previewHairstyleId === hairstyle.id &&
                        styles.selectedImageContainer,
                      (hairstyle.locked ||
                        (lockedOutfitSelected &&
                          previewHairstyleId === hairstyle.id)) &&
                        styles.lockedImageContainer,
                      lockedOutfitSelected &&
                        previewHairstyleId === hairstyle.id &&
                        styles.lockedOptionItem,
                    ]}
                  >
                    {hairstyle.localImagePath ? (
                      <Image
                        source={{ uri: hairstyle.localImagePath }}
                        style={[
                          styles.optionImage,
                          hairstyle.grayScale && styles.grayscaleImage,
                        ]}
                        resizeMode="contain"
                      />
                    ) : (
                      <Image
                        source={{ uri: hairstyle.image }}
                        style={[
                          styles.optionImage,
                          hairstyle.grayScale && styles.grayscaleImage,
                        ]}
                        resizeMode="contain"
                        onLoad={() => downloadHairstyleImage(hairstyle.id)}
                      />
                    )}
                    {hairstyle.locked && (
                      <View style={styles.lockIconContainer}>
                        <Lock width={12} height={12} />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )
        ) : isLoadingOutfits ? (
          renderOutfitLoadingSkeleton()
        ) : (
          <View style={styles.optionsGrid}>
            {outfits.map((outfit) => (
              <TouchableOpacity
                key={outfit.id}
                style={[
                  styles.optionItem1,
                  previewOutfitId === outfit.id && styles.selectedOptionItem,
                ]}
                onPress={() => handleOutfitSelect(outfit.id)}
              >
                <View
                  style={[
                    styles.optionImageContainer1,
                    previewOutfitId === outfit.id &&
                      styles.selectedImageContainer,
                    (outfit.locked ||
                      (lockedHairstyleSelected &&
                        previewOutfitId === outfit.id)) &&
                      styles.lockedImageContainer,
                    lockedHairstyleSelected &&
                      previewOutfitId === outfit.id &&
                      styles.lockedOptionItem,
                  ]}
                >
                  {outfit.localImagePath ? (
                    <Image
                      source={{ uri: outfit.localImagePath }}
                      style={[
                        styles.outfitImage,
                        outfit.grayScale && styles.grayscaleImage,
                      ]}
                      resizeMode="contain"
                    />
                  ) : (
                    <Image
                    source={{ uri: outfit.image }}
                    style={[
                      styles.outfitImage,
                      outfit.grayScale && styles.grayscaleImage,
                    ]}
                    resizeMode="contain"
                    onLoad={() => downloadOutfitImage(outfit.id)}
                  />
                )}
                {outfit.locked && (
                  <View style={styles.lockIconContainer}>
                    <Lock width={12} height={12} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>

    {/* Preview Modal */}
    <Modal
      visible={showPreviewModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowPreviewModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}> {t('customize.title')}</Text>

          {/* Hidden ViewShot for capturing the avatar with face */}
          <View style={styles.hiddenViewShot}>
            <ViewShot
              ref={avatarViewShotRef}
              options={{ format: "jpg", quality: 0.9 }}
              style={styles.viewShotContainer}
            >
              <View style={styles.conicGradientContainer}>
                <View style={styles.avatarImageContainer}>
                  {finalFaceImageUrl ? (
                    <Image
                      source={{ uri: finalFaceImageUrl }}
                      style={styles.capturedAvatarImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <ActivityIndicator size="small" color="#FF69B4" />
                  )}
                </View>
              </View>
            </ViewShot>
          </View>

          {/* Visible avatar preview */}
          <ViewShot
            ref={viewShotRef}
            options={{ format: "jpg", quality: 0.9 }}
            style={styles.viewShotContainer}
          >
            <Animated.View
              style={{
                transform: [{ scale: previewScaleAnim }],
                opacity: previewOpacityAnim,
              }}
            >
              {finalCombinedImageUrl ? (
                <Image
                  source={{ uri: finalCombinedImageUrl }}
                  style={styles.previewAvatarImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.previewAvatarLoading}>
                  <ActivityIndicator size="large" color="#FF69B4" />
                  <Text style={styles.loadingText}>Loading avatar...</Text>
                </View>
              )}
            </Animated.View>
          </ViewShot>

          <View style={styles.modalButtonsContainer}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowPreviewModal(false)}
              disabled={isSaving}
            >
              <Text style={styles.modalButtonText}>{t('customize.edit')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={saveAvatarToStorage}
              disabled={isSaving || !finalFaceImageUrl}
            >
              {isSaving ? (
                <Text style={styles.saveButtonText}>{t('customize.saving')}</Text>
              ) : (
                <Text style={styles.saveButtonText}>{t('customize.save')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
container: {
  flex: 1,
  backgroundColor: "#FFFFFF",
},
header: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: 16,
  paddingVertical: 15,
},
skeletonContainer: {
  backgroundColor: "#F7F7F780",
  justifyContent: "center",
  alignItems: "center",
},
cancelButton: {
  fontSize: 15,
  fontFamily: "OpenSans500",
  color: "#F76CCFCC",
},
headerTitle: {
  fontSize: 16,
  color: "#373737",
  fontFamily: "OpenSans700",
},
doneButton: {
  fontSize: 16,
  color: "#FF69B4",
  fontFamily: "OpenSans600",
},
disabledButton: {
  color: "#CACACA", // Gray color for disabled state
},
avatarContainer: {
  alignItems: "center",
  justifyContent: "center",
  marginVertical: 12,
  height: 240, // Fixed height to prevent layout shift
},
avatarImage: {
  width: 200,
  height: 240,
},
capturedAvatarImage: {
  width: 180, // Smaller size for the captured image
  height: 200,
},
placeholderImage: {
  width: 200,
  height: 240,
  backgroundColor: "#F7F7F720",
  justifyContent: "center",
  alignItems: "center",
  borderRadius: 12,
},
lockBadgeContainer: {
  position: "absolute",
  bottom: 30,
  right: 20,
  zIndex: 10,
},
lockedOptionItem: {
  borderWidth: 2,
  backgroundColor: "#F7F7F780",
  borderColor: "rgba(247, 108, 207, 0.5)",
},
lockBadge: {
  width: 32,
  height: 32,
  borderRadius: 20,
  backgroundColor: "#FFEAF9",
  alignItems: "center",
  justifyContent: "center",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
},
levelUpContainer: {
  alignItems: "center",
},
levelUpText: {
  fontSize: 13,
  color: "#7B7B7B",
  fontFamily: "Inter500",
},
shadowContainer: {
  position: "absolute",
  bottom: 5,
  left: 0,
  right: 0,
  alignItems: "center",
  zIndex: -1,
},
shadow: {
  width: 100, // Wider to create the elliptical effect
  height: 20, // Smaller height for the ellipse
  backgroundColor: "#FFB4EA",
  borderRadius: 50, // Rounded edges for the elliptical shadow
  opacity: 0.15, // Soft opacity for the shadow
},
tabContainer: {
  flexDirection: "row",
  borderBottomWidth: 1,
  marginTop:5,
  borderBottomColor: "#F76CCF4D",
},
tab: {
  flex: 1,
  height: 40,
  justifyContent: "center",
  alignItems: "center",
},
activeTab: {
  borderBottomWidth: 2,
  borderTopLeftRadius: 5,
  borderBottomColor: "#F76CCF",
  backgroundColor: "#FFD4F3",
},
activeTab1: {
  borderBottomWidth: 2,
  borderTopRightRadius: 5,
  borderBottomColor: "#F76CCF",
  backgroundColor: "#FFD4F3",
},
tabText: {
  fontSize: 14,
  fontFamily: "Inter400",
  color: "#373737",
},
activeTabText: {
  color: "#373737",
  fontFamily: "Inter700",
},
optionsContainer: {
  flex: 1,
},
optionsGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  padding: 10,
},
optionItem: {
  width: "33.33%",
  padding: 8,
},
selectedOptionItem: {
  // No background color change, just the border on the inner container
},
optionItem1: {
  width: "50%",
  padding: 8,
},
optionImageContainer: {
  width: "100%",
  height: 122,
  borderRadius: 12,
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  backgroundColor: "white",
},
optionImageContainer1: {
  width: "100%",
  aspectRatio: 3 / 4,
  borderRadius: 12,
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  backgroundColor: "white",
},
selectedImageContainer: {
  borderWidth: 2,
  backgroundColor: "rgba(255, 240, 251, 0.15)",
  borderColor: "rgba(247, 108, 207, 0.5)",
},
lockedImageContainer: {
  backgroundColor: "#F7F7F780",
  borderWidth: 0.5,
  borderColor: "#CCCCCC52",
},
optionImage: {
  aspectRatio: 1,
  width: "100%",
  height: 72,
},
outfitImage: {
  width: "90%", 
  height: "90%",
},
grayscaleImage: {
  opacity: 0.8,
},
lockIconContainer: {
  position: "absolute",
  top: 5,
  right: 5,
  backgroundColor: "#FFECF5",
  borderRadius: 15,
  width: 20,
  height: 20,
  alignItems: "center",
  justifyContent: "center",
},
previewLockContainer: {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: [{ translateX: -50 }, { translateY: -50 }],
  backgroundColor: "rgba(255, 236, 245, 0.8)",
  borderRadius: 20,
  padding: 10,
  alignItems: "center",
  justifyContent: "center",
},
unlockText: {
  marginTop: 5,
  fontSize: 12,
  color: "#F76CCF",
  fontFamily: "OpenSans600",
},
// Modal styles
modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "center",
  alignItems: "center",
},
modalContent: {
  width: "80%",
  backgroundColor: "white",
  borderRadius: 20,
  padding: 20,
  alignItems: "center",
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,
  elevation: 5,
},
modalTitle: {
  fontSize: 20,
  fontFamily: "OpenSans700",
  color: "#373737",
  marginBottom: 20,
},
viewShotContainer: {
  alignItems: "center",
  justifyContent: "center",
},
conicGradientContainer: {
  width: 200,
  height: 200,
  borderRadius: 100,
  overflow: "hidden",
  backgroundColor: "#FA9DDF", // Fallback color
  shadowColor: "#000",
  shadowOffset: {
    width: 0,
    height: 0,
  },
  shadowOpacity: 0.3,
  shadowRadius: 2,
  elevation: 5,
},
previewConicGradientContainer: {
  width: 200,
  height: 200,
  overflow: "hidden",
  marginBottom: 20,
},
avatarImageContainer: {
  width: "100%",
  height: "100%",
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "transparent",
},
hiddenViewShot: {
  position: "absolute",
  width: 200,
  height: 200,
  opacity: 0,
  zIndex: -1,
  overflow: "hidden",
},
previewAvatarImage: {
  width: 180, // Smaller size for preview
  height: 220,
},
previewAvatarLoading: {
  width: 180,
  height: 220,
  justifyContent: "center",
  alignItems: "center",
},
loadingText: {
  marginTop: 10,
  color: "#FF69B4",
  fontFamily: "DMSans400",
  fontSize: 14,
},
modalButtonsContainer: {
  flexDirection: "row",
  justifyContent: "space-between",
  width: "100%",
},
modalButton: {
  flex: 1,
  padding: 12,
  borderRadius: 10,
  marginHorizontal: 5,
  marginTop: 10,
  alignItems: "center",
  borderWidth: 1,
  borderColor: "#F76CCF",
},
modalButtonText: {
  color: "#F76CCF",
  fontSize: 14,
  fontFamily: "DMSans500",
},
saveButton: {
  backgroundColor: "#F76CCF",
  borderColor: "#FFD4F3",
},
saveButtonText: {
  color: "white",
  fontSize: 14,
  fontFamily: "DMSans500",
},
});