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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ViewShot from "react-native-view-shot";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "@/store/userSlice";
import { LinearGradient } from "expo-linear-gradient";

// Define TypeScript interfaces
interface Hairstyle {
  id: number;
  image: any;
  locked: boolean;
  grayScale: boolean;
}

interface Outfit {
  id: number;
  image: any;
  locked: boolean;
  grayScale: boolean;
}

interface Badge {
  id: string
  patientId: string
  badgeId: string
  awardedAt: string
  badge: {
    type: string
    title: string
    description: string
    createdAt: string
  }
}

interface UnlockResult {
  hairstyles: number[]
  outfits: number[]
}

// List of regular badge types
const REGULAR_BADGE_TYPES = [
  "HYDRATED_QUEEN",
  "SNAPSHOT",
  "MAMA_MILESTONE_I",
  "MAMA_MILESTONE_II",
  "MAMA_MILESTONE_III",
  "MAMA_MILESTONE_IV",
  "MAMA_MILESTONE_V",
  "MAMA_MILESTONE_VI",
  "HEART_SCRIBE",
  "RESTED_DIVA",
  "EXPLORER",
]

// List of streak badge types
const STREAK_BADGE_TYPES = ["WATER_WIZARD", "SLEEP_WIZARD", "HEALTH_QUEEN", "ON_THE_MOVE", "HOT_MAMA"]

// Mock data for hairstyles
const hairstyles: Hairstyle[] = [
  {
    id: 1,
    image: require("../assets/images/only_hairs/h1.png"),
    locked: false,
    grayScale: false,
  },
  {
    id: 2,
    image: require("../assets/images/only_hairs/h2.png"),
    locked: false,
    grayScale: false,
  },
  {
    id: 3,
    image: require("../assets/images/only_hairs/h3.png"),
    locked: false,
    grayScale: false,
  },
  {
    id: 4,
    image: require("../assets/images/only_hairs/h4.png"),
    locked: false,
    grayScale: false,
  },
  {
    id: 5,
    image: require("../assets/images/only_hairs/h5.png"),
    locked: false,
    grayScale: false,
  },
  {
    id: 6,
    image: require("../assets/images/only_hairs/h6.png"),
    locked: true,
    grayScale: true,
  },
  {
    id: 7,
    image: require("../assets/images/only_hairs/h7.png"),
    locked: true,
    grayScale: true,
  },
  {
    id: 8,
    image: require("../assets/images/only_hairs/h8.png"),
    locked: true,
    grayScale: true,
  },
  {
    id: 9,
    image: require("../assets/images/only_hairs/h9.png"),
    locked: true,
    grayScale: true,
  },
  {
    id: 10,
    image: require("../assets/images/only_hairs/h10.png"),
    locked: true,
    grayScale: true,
  },
];

// Mock data for outfits
const outfits: Outfit[] = [
  {
    id: 1,
    image: require("../assets/images/only_costumes/c1.png"),
    locked: false,
    grayScale: false,
  },
  {
    id: 2,
    image: require("../assets/images/only_costumes/c2.png"),
    locked: false,
    grayScale: false,
  },
  {
    id: 3,
    image: require("../assets/images/only_costumes/c3.png"),
    locked: false,
    grayScale: false,
  },
  {
    id: 4,
    image: require("../assets/images/only_costumes/c4.png"),
    locked: false,
    grayScale: false,
  },
  {
    id: 5,
    image: require("../assets/images/only_costumes/c5.png"),
    locked: false,
    grayScale: false,
  },
  {
    id: 6,
    image: require("../assets/images/only_costumes/c6.png"),
    locked: true,
    grayScale: true,
  },
  {
    id: 7,
    image: require("../assets/images/only_costumes/c7.png"),
    locked: true,
    grayScale: true,
  },
  {
    id: 8,
    image: require("../assets/images/only_costumes/c8.png"),
    locked: true,
    grayScale: true,
  },
  {
    id: 9,
    image: require("../assets/images/only_costumes/c9.png"),
    locked: true,
    grayScale: true,
  },
  {
    id: 10,
    image: require("../assets/images/only_costumes/c10.png"),
    locked: true,
    grayScale: true,
  },
];

// Avatar images with different hairstyles
const avatarImages: { [outfitId: number]: { [hairstyleId: number]: any } } = {
  1: {
    1: require("../assets/images/hairs/h1/face/c1.png"),
    2: require("../assets/images/hairs/h2/face/c1.png"),
    3: require("../assets/images/hairs/h3/face/c1.png"),
    4: require("../assets/images/hairs/h4/face/c1.png"),
    5: require("../assets/images/hairs/h5/face/c1.png"),
    6: require("../assets/images/hairs/h6/face/c1.png"),
    7: require("../assets/images/hairs/h7/face/c1.png"),
    8: require("../assets/images/hairs/h8/face/c1.png"),
    9: require("../assets/images/hairs/h9/face/c1.png"),
    10: require("../assets/images/hairs/h10/face/c1.png"),
  },
  2: {
    1: require("../assets/images/hairs/h1/face/c2.png"),
    2: require("../assets/images/hairs/h2/face/c2.png"),
    3: require("../assets/images/hairs/h3/face/c2.png"),
    4: require("../assets/images/hairs/h4/face/c2.png"),
    5: require("../assets/images/hairs/h5/face/c2.png"),
    6: require("../assets/images/hairs/h6/face/c2.png"),
    7: require("../assets/images/hairs/h7/face/c2.png"),
    8: require("../assets/images/hairs/h8/face/c2.png"),
    9: require("../assets/images/hairs/h9/face/c2.png"),
    10: require("../assets/images/hairs/h10/face/c2.png"),
  },
  3: {
    1: require("../assets/images/hairs/h1/face/c3.png"),
    2: require("../assets/images/hairs/h2/face/c3.png"),
    3: require("../assets/images/hairs/h3/face/c3.png"),
    4: require("../assets/images/hairs/h4/face/c3.png"),
    5: require("../assets/images/hairs/h5/face/c3.png"),
    6: require("../assets/images/hairs/h6/face/c3.png"),
    7: require("../assets/images/hairs/h7/face/c3.png"),
    8: require("../assets/images/hairs/h8/face/c3.png"),
    9: require("../assets/images/hairs/h9/face/c3.png"),
    10: require("../assets/images/hairs/h10/face/c3.png"),
  },
  4: {
    1: require("../assets/images/hairs/h1/face/c4.png"),
    2: require("../assets/images/hairs/h2/face/c4.png"),
    3: require("../assets/images/hairs/h3/face/c4.png"),
    4: require("../assets/images/hairs/h4/face/c4.png"),
    5: require("../assets/images/hairs/h5/face/c4.png"),
    6: require("../assets/images/hairs/h6/face/c4.png"),
    7: require("../assets/images/hairs/h7/face/c4.png"),
    8: require("../assets/images/hairs/h8/face/c4.png"),
    9: require("../assets/images/hairs/h9/face/c4.png"),
    10: require("../assets/images/hairs/h10/face/c4.png"),
  },
  5: {
    1: require("../assets/images/hairs/h1/face/c5.png"),
    2: require("../assets/images/hairs/h2/face/c5.png"),
    3: require("../assets/images/hairs/h3/face/c5.png"),
    4: require("../assets/images/hairs/h4/face/c5.png"),
    5: require("../assets/images/hairs/h5/face/c5.png"),
    6: require("../assets/images/hairs/h6/face/c5.png"),
    7: require("../assets/images/hairs/h7/face/c5.png"),
    8: require("../assets/images/hairs/h8/face/c5.png"),
    9: require("../assets/images/hairs/h9/face/c5.png"),
    10: require("../assets/images/hairs/h10/face/c5.png"),
  },
  6: {
    1: require("../assets/images/hairs/h1/face/c6.png"),
    2: require("../assets/images/hairs/h2/face/c6.png"),
    3: require("../assets/images/hairs/h3/face/c6.png"),
    4: require("../assets/images/hairs/h4/face/c6.png"),
    5: require("../assets/images/hairs/h5/face/c6.png"),
    6: require("../assets/images/hairs/h6/face/c6.png"),
    7: require("../assets/images/hairs/h7/face/c6.png"),
    8: require("../assets/images/hairs/h8/face/c6.png"),
    9: require("../assets/images/hairs/h9/face/c6.png"),
    10: require("../assets/images/hairs/h10/face/c6.png"),
  },
  7: {
    1: require("../assets/images/hairs/h1/face/c7.png"),
    2: require("../assets/images/hairs/h2/face/c7.png"),
    3: require("../assets/images/hairs/h3/face/c7.png"),
    4: require("../assets/images/hairs/h4/face/c7.png"),
    5: require("../assets/images/hairs/h5/face/c7.png"),
    6: require("../assets/images/hairs/h6/face/c7.png"),
    7: require("../assets/images/hairs/h7/face/c7.png"),
    8: require("../assets/images/hairs/h8/face/c7.png"),
    9: require("../assets/images/hairs/h9/face/c7.png"),
    10: require("../assets/images/hairs/h10/face/c7.png"),
  },
  8: {
    1: require("../assets/images/hairs/h1/face/c8.png"),
    2: require("../assets/images/hairs/h2/face/c8.png"),
    3: require("../assets/images/hairs/h3/face/c8.png"),
    4: require("../assets/images/hairs/h4/face/c8.png"),
    5: require("../assets/images/hairs/h5/face/c8.png"),
    6: require("../assets/images/hairs/h6/face/c8.png"),
    7: require("../assets/images/hairs/h7/face/c8.png"),
    8: require("../assets/images/hairs/h8/face/c8.png"),
    9: require("../assets/images/hairs/h9/face/c8.png"),
    10: require("../assets/images/hairs/h10/face/c8.png"),
  },
  9: {
    1: require("../assets/images/hairs/h1/face/c9.png"),
    2: require("../assets/images/hairs/h2/face/c9.png"),
    3: require("../assets/images/hairs/h3/face/c9.png"),
    4: require("../assets/images/hairs/h4/face/c9.png"),
    5: require("../assets/images/hairs/h5/face/c9.png"),
    6: require("../assets/images/hairs/h6/face/c9.png"),
    7: require("../assets/images/hairs/h7/face/c9.png"),
    8: require("../assets/images/hairs/h8/face/c9.png"),
    9: require("../assets/images/hairs/h9/face/c9.png"),
    10: require("../assets/images/hairs/h10/face/c9.png"),
  },
  10: {
    1: require("../assets/images/hairs/h1/face/c10.png"),
    2: require("../assets/images/hairs/h2/face/c10.png"),
    3: require("../assets/images/hairs/h3/face/c10.png"),
    4: require("../assets/images/hairs/h4/face/c10.png"),
    5: require("../assets/images/hairs/h5/face/c10.png"),
    6: require("../assets/images/hairs/h6/face/c10.png"),
    7: require("../assets/images/hairs/h7/face/c10.png"),
    8: require("../assets/images/hairs/h8/face/c10.png"),
    9: require("../assets/images/hairs/h9/face/c10.png"),
    10: require("../assets/images/hairs/h10/face/c10.png"),
  },
};

// Avatar images with different outfits and hairstyles
// First level key is the outfit ID, second level key is the hairstyle ID
const combinedAvatarImages: {
  [outfitId: number]: { [hairstyleId: number]: any };
} = {
  1: {
    1: require("../assets/images/hairs/h1/costume/c1.png"),
    2: require("../assets/images/hairs/h2/costume/c1.png"),
    3: require("../assets/images/hairs/h3/costume/c1.png"),
    4: require("../assets/images/hairs/h4/costume/c1.png"),
    5: require("../assets/images/hairs/h5/costume/c1.png"),
    6: require("../assets/images/hairs/h6/costume/c1.png"),
    7: require("../assets/images/hairs/h7/costume/c1.png"),
    8: require("../assets/images/hairs/h8/costume/c1.png"),
    9: require("../assets/images/hairs/h9/costume/c1.png"),
    10: require("../assets/images/hairs/h10/costume/c1.png"),
  },
  2: {
    1: require("../assets/images/hairs/h1/costume/c2.png"),
    2: require("../assets/images/hairs/h2/costume/c2.png"),
    3: require("../assets/images/hairs/h3/costume/c2.png"),
    4: require("../assets/images/hairs/h4/costume/c2.png"),
    5: require("../assets/images/hairs/h5/costume/c2.png"),
    6: require("../assets/images/hairs/h6/costume/c2.png"),
    7: require("../assets/images/hairs/h7/costume/c2.png"),
    8: require("../assets/images/hairs/h8/costume/c2.png"),
    9: require("../assets/images/hairs/h9/costume/c2.png"),
    10: require("../assets/images/hairs/h10/costume/c2.png"),
  },
  3: {
    1: require("../assets/images/hairs/h1/costume/c3.png"),
    2: require("../assets/images/hairs/h2/costume/c3.png"),
    3: require("../assets/images/hairs/h3/costume/c3.png"),
    4: require("../assets/images/hairs/h4/costume/c3.png"),
    5: require("../assets/images/hairs/h5/costume/c3.png"),
    6: require("../assets/images/hairs/h6/costume/c3.png"),
    7: require("../assets/images/hairs/h7/costume/c3.png"),
    8: require("../assets/images/hairs/h8/costume/c3.png"),
    9: require("../assets/images/hairs/h9/costume/c3.png"),
    10: require("../assets/images/hairs/h10/costume/c3.png"),
  },
  4: {
    1: require("../assets/images/hairs/h1/costume/c4.png"),
    2: require("../assets/images/hairs/h2/costume/c4.png"),
    3: require("../assets/images/hairs/h3/costume/c4.png"),
    4: require("../assets/images/hairs/h4/costume/c4.png"),
    5: require("../assets/images/hairs/h5/costume/c4.png"),
    6: require("../assets/images/hairs/h6/costume/c4.png"),
    7: require("../assets/images/hairs/h7/costume/c4.png"),
    8: require("../assets/images/hairs/h8/costume/c4.png"),
    9: require("../assets/images/hairs/h9/costume/c4.png"),
    10: require("../assets/images/hairs/h10/costume/c4.png"),
  },
  5: {
    1: require("../assets/images/hairs/h1/costume/c5.png"),
    2: require("../assets/images/hairs/h2/costume/c5.png"),
    3: require("../assets/images/hairs/h3/costume/c5.png"),
    4: require("../assets/images/hairs/h4/costume/c5.png"),
    5: require("../assets/images/hairs/h5/costume/c5.png"),
    6: require("../assets/images/hairs/h6/costume/c5.png"),
    7: require("../assets/images/hairs/h7/costume/c5.png"),
    8: require("../assets/images/hairs/h8/costume/c5.png"),
    9: require("../assets/images/hairs/h9/costume/c5.png"),
    10: require("../assets/images/hairs/h10/costume/c5.png"),
  },
  6: {
    1: require("../assets/images/hairs/h1/costume/c6.png"),
    2: require("../assets/images/hairs/h2/costume/c6.png"),
    3: require("../assets/images/hairs/h3/costume/c6.png"),
    4: require("../assets/images/hairs/h4/costume/c6.png"),
    5: require("../assets/images/hairs/h5/costume/c6.png"),
    6: require("../assets/images/hairs/h6/costume/c6.png"),
    7: require("../assets/images/hairs/h7/costume/c6.png"),
    8: require("../assets/images/hairs/h8/costume/c6.png"),
    9: require("../assets/images/hairs/h9/costume/c6.png"),
    10: require("../assets/images/hairs/h10/costume/c6.png"),
  },
  7: {
    1: require("../assets/images/hairs/h1/costume/c7.png"),
    2: require("../assets/images/hairs/h2/costume/c7.png"),
    3: require("../assets/images/hairs/h3/costume/c7.png"),
    4: require("../assets/images/hairs/h4/costume/c7.png"),
    5: require("../assets/images/hairs/h5/costume/c7.png"),
    6: require("../assets/images/hairs/h6/costume/c7.png"),
    7: require("../assets/images/hairs/h7/costume/c7.png"),
    8: require("../assets/images/hairs/h8/costume/c7.png"),
    9: require("../assets/images/hairs/h9/costume/c7.png"),
    10: require("../assets/images/hairs/h10/costume/c7.png"),
  },
  8: {
    1: require("../assets/images/hairs/h1/costume/c8.png"),
    2: require("../assets/images/hairs/h2/costume/c8.png"),
    3: require("../assets/images/hairs/h3/costume/c8.png"),
    4: require("../assets/images/hairs/h4/costume/c8.png"),
    5: require("../assets/images/hairs/h5/costume/c8.png"),
    6: require("../assets/images/hairs/h6/costume/c8.png"),
    7: require("../assets/images/hairs/h7/costume/c8.png"),
    8: require("../assets/images/hairs/h8/costume/c8.png"),
    9: require("../assets/images/hairs/h9/costume/c8.png"),
    10: require("../assets/images/hairs/h10/costume/c8.png"),
  },
  9: {
    1: require("../assets/images/hairs/h1/costume/c9.png"),
    2: require("../assets/images/hairs/h2/costume/c9.png"),
    3: require("../assets/images/hairs/h3/costume/c9.png"),
    4: require("../assets/images/hairs/h4/costume/c9.png"),
    5: require("../assets/images/hairs/h5/costume/c9.png"),
    6: require("../assets/images/hairs/h6/costume/c9.png"),
    7: require("../assets/images/hairs/h7/costume/c9.png"),
    8: require("../assets/images/hairs/h8/costume/c9.png"),
    9: require("../assets/images/hairs/h9/costume/c9.png"),
    10: require("../assets/images/hairs/h10/costume/c9.png"),
  },
  10: {
    1: require("../assets/images/hairs/h1/costume/c10.png"),
    2: require("../assets/images/hairs/h2/costume/c10.png"),
    3: require("../assets/images/hairs/h3/costume/c10.png"),
    4: require("../assets/images/hairs/h4/costume/c10.png"),
    5: require("../assets/images/hairs/h5/costume/c10.png"),
    6: require("../assets/images/hairs/h6/costume/c10.png"),
    7: require("../assets/images/hairs/h7/costume/c10.png"),
    8: require("../assets/images/hairs/h8/costume/c10.png"),
    9: require("../assets/images/hairs/h9/costume/c10.png"),
    10: require("../assets/images/hairs/h10/costume/c10.png"),
  },
};

export default function AvatarSelectionScreen() {
  const [activeTab, setActiveTab] = useState("Hairstyle");
  const [selectedHairstyle, setSelectedHairstyle] = useState<number>(1);
  const [selectedOutfit, setSelectedOutfit] = useState<number>(1);
  const [previewOutfit, setPreviewOutfit] = useState<number>(1);
  const [previewHairstyle, setPreviewHairstyle] = useState<number>(1);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [lockedHairstyleSelected, setLockedHairstyleSelected] = useState(false);
  const [lockedOutfitSelected, setLockedOutfitSelected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const token = useSelector((state: any) => state.user.token);
  const user = useSelector((state: any) => state.user);
  const dispatch = useDispatch();
  const [badgeData, setBadgeData] = useState<Badge[]>([])
  const [earnedBadges, setEarnedBadges] = useState<string[]>([])
  const [unlockResult, setUnlockResult] = useState<UnlockResult | null>(null)
  const [localHairstyles, setLocalHairstyles] = useState<Hairstyle[]>(hairstyles)
  const [localOutfits, setLocalOutfits] = useState<Outfit[]>(outfits)

  // Reference for ViewShot
  const viewShotRef = useRef(null);
  // Reference for avatar ViewShot
  const avatarViewShotRef = useRef(null);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const previewScaleAnim = useRef(new Animated.Value(0.8)).current;
  const previewOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchBadges()
  }, [])

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

  const fetchBadges = async () => {
    if (!token || !user?.user_id) {
      console.log("User not authenticated, cannot fetch badges")
      return
    }

    try {
      const response = await fetch(`https://crosscare-backends.onrender.com/api/user/${user.user_id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch badges: ${response.status}`)
      }

      const data = await response.json()
      console.log(data)
      if (data && Array.isArray(data)) {
        setBadgeData(data)

        // Extract badge names from the data
        const badgeNames = data.map((badge) => badge.badge.title)
        setEarnedBadges(badgeNames)

        const unlockableItems = calculateUnlockableItems(data);
        if (unlockableItems.hairstyles.length > 0 || unlockableItems.outfits.length > 0) {
          setUnlockResult(unlockableItems)
          // Update the local arrays with unlocked items
          updateUnlockedItems(unlockableItems)
        }

      }
    } catch (error) {
      console.error("Error fetching badges:", error)
    }
  }

  const calculateUnlockableItems = (badges: Badge[]): UnlockResult => {
    // Count regular badges and streak badges
    const regularBadges = badges.filter((badge) => {
      // Check if the badge title is in our list of regular badge names
      return REGULAR_BADGE_TYPES.includes(badge.badge.type)
    })

    const streakBadges = badges.filter((badge) => STREAK_BADGE_TYPES.includes(badge.badge.type))

    console.log(
      "Regular badges:",
      regularBadges.length,
      regularBadges.map((b) => b.badge.type),
    )
    console.log(
      "Streak badges:",
      streakBadges.length,
      streakBadges.map((b) => b.badge.type),
    )

    // Calculate unlockable items based on rules:
    // - 1 hair & 1 outfit for every 3 regular badges
    // - 1 hair OR 1 outfit for every streak badge

    const regularUnlockPairs = Math.floor(regularBadges.length / 3)
    console.log("Regular unlock pairs:", regularUnlockPairs)

    // For streak badges, alternate between hair and outfit
    let streakHairs = 0
    let streakOutfits = 0

    for (let i = 0; i < streakBadges.length; i++) {
      if (i % 2 === 0) {
        streakHairs++
      } else {
        streakOutfits++
      }
    }

    console.log("Streak hairs:", streakHairs, "Streak outfits:", streakOutfits)

    // Calculate how many items should be unlocked in total
    const totalHairsToUnlock = regularUnlockPairs + streakHairs
    const totalOutfitsToUnlock = regularUnlockPairs + streakOutfits

    console.log("Total hairs to unlock:", totalHairsToUnlock, "Total outfits to unlock:", totalOutfitsToUnlock)

    // Define specific IDs to unlock based on the counts
    // Start from ID 6 since IDs 1-5 are already unlocked by default
    const hairstyleIdsToUnlock = []
    for (let i = 0; i < totalHairsToUnlock; i++) {
      // Start from ID 6 and go up
      const idToUnlock = 6 + i
      if (idToUnlock <= 10) {
        // Make sure we don't exceed the available IDs
        hairstyleIdsToUnlock.push(idToUnlock)
      }
    }

    const outfitIdsToUnlock = []
    for (let i = 0; i < totalOutfitsToUnlock; i++) {
      // Start from ID 6 and go up
      const idToUnlock = 6 + i
      if (idToUnlock <= 10) {
        // Make sure we don't exceed the available IDs
        outfitIdsToUnlock.push(idToUnlock)
      }
    }

    console.log("Hairstyles to unlock:", hairstyleIdsToUnlock)
    console.log("Outfits to unlock:", outfitIdsToUnlock)

    return {
      hairstyles: hairstyleIdsToUnlock,
      outfits: outfitIdsToUnlock,
    }
  }

  const updateUnlockedItems = (unlockableItems: UnlockResult) => {
    // Update hairstyles
    if (unlockableItems.hairstyles.length > 0) {
      const updatedHairstyles = [...localHairstyles]
      unlockableItems.hairstyles.forEach((id) => {
        const index = updatedHairstyles.findIndex((h) => h.id === id)
        if (index !== -1) {
          updatedHairstyles[index].locked = false
          updatedHairstyles[index].grayScale = false
        }
      })
      setLocalHairstyles(updatedHairstyles)
    }

    // Update outfits
    if (unlockableItems.outfits.length > 0) {
      const updatedOutfits = [...localOutfits]
      unlockableItems.outfits.forEach((id) => {
        const index = updatedOutfits.findIndex((o) => o.id === id)
        if (index !== -1) {
          updatedOutfits[index].locked = false
          updatedOutfits[index].grayScale = false
        }
      })
      setLocalOutfits(updatedOutfits)
    }
  }

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
  }, [previewHairstyle, previewOutfit, activeTab]);

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

  const handleHairstyleSelect = (hairstyleId: number): void => {
    // Always update the preview hairstyle
    setPreviewHairstyle(hairstyleId);
    
    // Check if the selected hairstyle is locked
    const isLocked = localHairstyles.find((h) => h.id === hairstyleId)?.locked;
    
    // Update locked state
    setLockedHairstyleSelected(!!isLocked);
    
    // Only update the selected hairstyle if it's not locked
    if (hairstyleId !== selectedHairstyle && !isLocked) {
      setSelectedHairstyle(hairstyleId);
    }
  };

  const handleOutfitSelect = (outfitId: number): void => {
    // Always update the preview outfit
    setPreviewOutfit(outfitId);
    
    // Check if the selected outfit is locked
    const isLocked = localOutfits.find((o) => o.id === outfitId)?.locked;
    
    // Update locked state
    setLockedOutfitSelected(!!isLocked);
    
    // Only update the selected outfit if it's not locked
    if (outfitId !== selectedOutfit && !isLocked) {
      setSelectedOutfit(outfitId);
    }
  };

  // Get current avatar image based on active tab
  const getCurrentAvatarImage = () => {
    if (activeTab === "Hairstyle") {
      try {
        return avatarImages[previewOutfit][previewHairstyle];
      } catch (error) {
        // Fallback to a default image if the specific combination doesn't exist
        return hairstyles.find((h) => h.id === previewHairstyle)?.image;
      }
    } else {
      // Use the combined image that has both the selected outfit and hairstyle
      try {
        return combinedAvatarImages[previewOutfit][previewHairstyle];
      } catch (error) {
        // Fallback to a default image if the specific combination doesn't exist
        return outfits.find((o) => o.id === previewOutfit)?.image;
      }
    }
  };

  // Get final avatar image for preview (using selected items, not preview items)
  const getFinalAvatarImage = () => {
    try {
      return combinedAvatarImages[selectedOutfit][selectedHairstyle];
    } catch (error) {
      // Fallback to a default image if the specific combination doesn't exist
      return outfits.find((o) => o.id === selectedOutfit)?.image;
    }
  };

  // Get the selected avatar image with face
  const getSelectedAvatarImage = () => {
    try {
      return avatarImages[selectedOutfit][selectedHairstyle];
    } catch (error) {
      // Fallback to a default image if the specific combination doesn't exist
      return hairstyles.find((h) => h.id === selectedHairstyle)?.image;
    }
  };

  // Check if the current preview item is locked
  const isPreviewLocked = () => {
    if (activeTab === "Hairstyle") {
      // If a locked outfit is selected, show hairstyles as locked
      if (lockedOutfitSelected) {
        return true;
      }
      return localHairstyles.find((h) => h.id === previewHairstyle)?.locked;
    } else {
      // If a locked hairstyle is selected, show outfits as locked
      if (lockedHairstyleSelected) {
        return true;
      }
      return localOutfits.find((o) => o.id === previewOutfit)?.locked;
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

      // Capture the avatar image with face
      const uri = await avatarViewShotRef.current.capture();

      // Save avatar data to AsyncStorage as a backup
      const avatarData = {
        imageUri: uri,
        hairstyleId: selectedHairstyle,
        outfitId: selectedOutfit,
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
    const isHairstyleLocked = localHairstyles.find((h) => h.id === previewHairstyle)?.locked;
    const isOutfitLocked = localOutfits.find((o) => o.id === previewOutfit)?.locked;
    return isHairstyleLocked || isOutfitLocked || lockedHairstyleSelected || lockedOutfitSelected;
  };

  // Function to check if an item should be displayed as locked in the grid
  const shouldDisplayAsLocked = (itemId: number, isHairstyle: boolean) => {
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
      ? localHairstyles.find(h => h.id === itemId)?.locked 
      : localOutfits.find(o => o.id === itemId)?.locked;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Avatar Selection</Text>
        <TouchableOpacity 
          onPress={handleDonePress}
          disabled={isAnySelectedItemLocked()}
        >
          <Text style={[
            styles.doneButton,
            isAnySelectedItemLocked() && styles.disabledButton
          ]}>
            Done
          </Text>
        </TouchableOpacity>
      </View>

      {/* Avatar Preview */}
      <View style={styles.avatarContainer}>
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }}
        >
          <Image
            source={getCurrentAvatarImage()}
            style={[
              styles.avatarImage,
              isPreviewLocked() && styles.grayscaleImage,
            ]}
            resizeMode="contain"
          />
          {isPreviewLocked() && (
            <View style={styles.lockBadgeContainer}>
              <View style={styles.lockBadge}>
                <Ionicons name="lock-closed" size={14} color="#FF68D4" />
              </View>
            </View>
          )}
          {isPreviewLocked() && (
            <View style={styles.levelUpContainer}>
              <Text style={styles.levelUpText}>Level Up to Unlock</Text>
            </View>
          )}
        </Animated.View>
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
            Hairstyle
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
            Outfit
          </Text>
        </TouchableOpacity>
      </View>

      {/* Options Container */}
      <ScrollView style={styles.optionsContainer}>
        {activeTab === "Hairstyle" ? (
          <View style={styles.optionsGrid}>
            {localHairstyles.map((hairstyle) => (
              <TouchableOpacity
                key={hairstyle.id}
                style={[
                  styles.optionItem,
                  previewHairstyle === hairstyle.id &&
                    styles.selectedOptionItem,
                ]}
                onPress={() => handleHairstyleSelect(hairstyle.id)}
              >
                <View
                  style={[
                    styles.optionImageContainer,
                    previewHairstyle === hairstyle.id &&
                      styles.selectedImageContainer,
                    (hairstyle.locked || (lockedOutfitSelected && previewHairstyle === hairstyle.id)) && 
                      styles.lockedImageContainer,
                    lockedOutfitSelected &&
                      previewHairstyle === hairstyle.id &&
                      styles.lockedOptionItem,
                  ]}
                >
                  <Image
                    source={hairstyle.image}
                    style={[
                      styles.optionImage,
                      (hairstyle.grayScale) && 
                        styles.grayscaleImage,
                    ]}
                    resizeMode="contain"
                  />
                  {hairstyle.locked && (
                    <View style={styles.lockIconContainer}>
                      <Ionicons name="lock-closed" size={12} color="#FF69B4" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.optionsGrid}>
            {localOutfits.map((outfit) => (
              <TouchableOpacity
                key={outfit.id}
                style={[
                  styles.optionItem1,
                  previewOutfit === outfit.id && styles.selectedOptionItem,
                ]}
                onPress={() => handleOutfitSelect(outfit.id)}
              >
                <View
                  style={[
                    styles.optionImageContainer1,
                    previewOutfit === outfit.id &&
                      styles.selectedImageContainer,
                    (outfit.locked || (lockedHairstyleSelected && previewOutfit === outfit.id)) && 
                      styles.lockedImageContainer,
                    lockedHairstyleSelected &&
                      previewOutfit === outfit.id &&
                      styles.lockedOptionItem,
                  ]}
                >
                  <Image
                    source={outfit.image}
                    style={[
                      styles.outfitImage,
                      (outfit.grayScale) && 
                        styles.grayscaleImage,
                    ]}
                    resizeMode="contain"
                  />
                  {outfit.locked && (
                    <View style={styles.lockIconContainer}>
                      <Ionicons name="lock-closed" size={12} color="#FF69B4" />
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
            <Text style={styles.modalTitle}>Your Avatar</Text>

            {/* Hidden ViewShot for capturing the avatar with face */}
            <View style={styles.hiddenViewShot}>
              <ViewShot
                ref={avatarViewShotRef}
                options={{ format: "jpg", quality: 0.9 }}
                style={styles.viewShotContainer}
              >
                <View style={styles.conicGradientContainer}>
                  <View style={styles.avatarImageContainer}>
                    <Image
                      source={getSelectedAvatarImage()}
                      style={styles.capturedAvatarImage}
                      resizeMode="contain"
                    />
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
                <Image
                  source={getFinalAvatarImage()}
                  style={styles.previewAvatarImage}
                  resizeMode="contain"
                />
              </Animated.View>
            </ViewShot>

            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowPreviewModal(false)}
                disabled={isSaving}
              >
                <Text style={styles.modalButtonText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveAvatarToStorage}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Text style={styles.saveButtonText}>Saving...</Text>
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
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
  },
  avatarImage: {
    width: 200,
    height: 240,
  },
  capturedAvatarImage: {
    width: 180, // Smaller size for the captured image
    height: 200,
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
    borderBottomColor: "#F76CCF4D",
  },
  tab: {
    flex: 1,
    // paddingVertical: 15,
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
    // borderWidth: 1,
    // borderColor: '#EEEEEE',
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
    width: 152,
    height: 152,
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
    // borderRadius: 100,
    overflow: "hidden",
    // backgroundColor: '#FA9DDF', // Fallback color
    marginBottom: 20,
    // shadowColor: "#000",
    // shadowOffset: {
    //   width: 0,
    //   height: 0,
    // },
    // shadowOpacity: 0.3,
    // shadowRadius: 2,
    // elevation: 5,
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
    marginTop:10,
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