import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator
} from "react-native";
import React, { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSelfCareStore } from "@/zustandStore/contentfulStores/selfCareStore";
import { Ionicons } from "@expo/vector-icons";

const SelfCare = () => {
  const router = useRouter();
  const { routines, isLoading, error, fetchRoutines, downloadAudio, setCurrentRoutine } = useSelfCareStore();
  

  useEffect(() => {
    fetchRoutines();
  }, []);

  const handleRoutinePress = async (routineId: string) => {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;
    
    setCurrentRoutine(routine);
    
    try {
      // Pre-download the audio if possible
      const audioPath = await downloadAudio(routineId);
      
      // Navigate to audio player with all required data
      router.push({
        pathname: "/patient/excerises/audio_player",
        params: {
          title: routine.title,
          duration: routine.duration || "5 min", // Fallback duration if not set
          url: audioPath || routine.audioUrl, // Use local path if available, otherwise remote URL
          gradientColors: JSON.stringify(routine.gradientColors || ["#7B96FF", "#0039C6"]),
          description: routine.description,
          id: routine.id
        }
      });
    } catch (err) {
      console.error("Error navigating to audio player:", err);
    }
  };

  const renderRoutineCard = (routine) => {
    return (
      <TouchableOpacity
        key={routine.id}
        style={styles.routineCard}
        onPress={() => handleRoutinePress(routine.id)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: routine.routineImage }}
          style={styles.routineImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
          style={styles.overlay}
        >
          <View style={styles.cardContent}>
            <Text style={styles.routineTitle}>{routine.title} &gt;</Text>
            {/* <Text style={styles.routineDescription} numberOfLines={2}>
              {routine.description}
            </Text> */}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A6FE1" />
            <Text style={styles.loadingText}>Loading routines...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={24} color="#d32f2f" />
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
            {routines.map(routine => renderRoutineCard(routine))}
            
            {routines.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>No routines found</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollContent: {
    paddingVertical: 20,
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
    color: "#ff6b6b",
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
});

export default SelfCare;