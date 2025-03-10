import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useTheme } from "react-native-paper";
import { Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import ContentCard1 from "@/components/ContentCard1";
import ContentCard from "@/components/ContentCard";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

// Define types
interface NoteItem {
  id: string;
  title: string;
  description: string;
  date: string;
}

interface Section {
  title: string;
  items: NoteItem[];
}

interface RootState {
  user: {
    user_id: string;
  };
}

export default function Journal() {
  // State management
  const [activeTab, setActiveTab] = useState<"Notes" | "Photos">("Notes");
  const [notesSearchQuery, setNotesSearchQuery] = useState("");
  const [photosSearchQuery, setPhotosSearchQuery] = useState("");
  const [contentSections, setContentSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Hooks
  const theme = useTheme();
  const user = useSelector((state: RootState) => state.user);

  // Filter notes based on search query
  const filteredSections = notesSearchQuery.trim() === ""
    ? contentSections
    : contentSections
        .map((section) => ({
          title: section.title,
          items: section.items.filter(
            (item) =>
              item.title
                .toLowerCase()
                .includes(notesSearchQuery.toLowerCase()) ||
              item.description
                .toLowerCase()
                .includes(notesSearchQuery.toLowerCase())
          ),
        }))
        .filter((section) => section.items.length > 0);

  // API call to fetch notes
  const getNotes = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://a5c1-45-117-109-34.ngrok-free.app/api/user/activity/${user.user_id}/notes`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        }
      );

      const data = await response.json();

      if (data.success) {
        console.log("Fetched notes:", data.data);
        setContentSections(data.data);
      } else {
        setError(data.message || "Failed to fetch notes");
      }
    } catch (err: any) {
      console.error("Error fetching notes:", err);
      if (err.name === 'AbortError') {
        setError("Request timed out - please try again");
      } else {
        setError("Network error - please check your connection");
      }
    } finally {
      setLoading(false);
      clearTimeout(timeoutId);
    }
  };

  // Initial data fetch
  useFocusEffect(
    useCallback(() => {
      getNotes();
    }, [])
  );

  // Handle manual refresh
  const handleRefresh = () => {
    getNotes();
  };

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await getNotes();
    setRefreshing(false);
  };

  // Render notes sections based on state
  const renderNotesSections = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f06292" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (filteredSections.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {notesSearchQuery.trim() !== ""
              ? "No notes match your search"
              : "No notes yet. Click 'Add new' to create your first note."}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.sectionsContainer}>
        {filteredSections.map((section, sectionIndex) => (
          <View key={`section-${sectionIndex}`}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item) => (
              <ContentCard
                key={item.id}
                id={item.id}
                title={item.title}
                description={item.description}
                date={item.date}
              />
            ))}
          </View>
        ))}
      </View>
    );
  };

  // Render photos section
  const renderPhotosSection = () => {
    return (
      <View style={styles.sectionsContainer}>
        <View>
          <Text style={styles.sectionTitle}>Today</Text>
          <ContentCard1
            title="Vacation Photo"
            imageSource={{ uri: "https://via.placeholder.com/100" }}
          />
        </View>

        <View>
          <Text style={styles.sectionTitle}>Previously</Text>
          <ContentCard1
            title="Family Reunion"
            imageSource={{ uri: "https://via.placeholder.com/100" }}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Journal</Text>
        <TouchableOpacity style={styles.menuButton}>
          <Feather name="more-vertical" size={20} color="#E5E5E5" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Notes" && styles.activeTab]}
          onPress={() => setActiveTab("Notes")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Notes" && styles.activeTabText,
            ]}
          >
            Notes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Photos" && styles.activeTab]}
          onPress={() => setActiveTab("Photos")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "Photos" && styles.activeTabText,
            ]}
          >
            Photos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <Feather name="search" size={20} color="rgba(60, 60, 67, 0.60)" />
        {activeTab === "Notes" ? (
          <TextInput
            placeholder="Search Notes"
            value={notesSearchQuery}
            onChangeText={setNotesSearchQuery}
            placeholderTextColor="rgba(60, 60, 67, 0.60)"
            style={styles.searchbar}
          />
        ) : (
          <TextInput
            placeholder="Search Photos"
            value={photosSearchQuery}
            onChangeText={setPhotosSearchQuery}
            placeholderTextColor="rgba(60, 60, 67, 0.60)"
            style={styles.searchbar}
          />
        )}
        <FontAwesome
          name="microphone"
          size={20}
          color="rgba(60, 60, 67, 0.60)"
          style={{ paddingRight: 6 }}
        />
      </View>

      {/* Tab Content */}
      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === "Notes" ? renderNotesSections() : renderPhotosSection()}
      </ScrollView>

      {/* Add New Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            activeTab === "Notes"
              ? router.push("/patient/newnotes")
              : router.push("/patient/newphotos");
          }}
        >
          <Feather name="plus" size={16} color="white" />
          <Text style={styles.fabText}>Add new</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  appbar: {
    backgroundColor: "#fff",
    elevation: 0,
  },
  title: {
    color: "#373737",
    fontSize: 16,
    fontFamily: "OpenSans600",
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  menuButton: {
    padding: 8,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "OpenSans600",
  },
  moreButton: {
    padding: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#f06292",
  },
  tabText: {
    fontSize: 16,
    color: "#757575",
  },
  activeTabText: {
    color: "#000",
    fontWeight: "500",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 24,
    backgroundColor: "white",
    elevation: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    height: 48,
    paddingRight: 10,
  },
  searchbar: {
    flex: 1,
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  sectionsContainer: {
    flexDirection: "column",
    gap: 32,
    marginTop: 20,
  },
  section1: {
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: "Inter700",
    marginBottom: 8,
    borderBottomWidth: 1,
    paddingBottom: 32,
    borderBottomColor: "#f0f0f0",
    color: "#333",
  },
  content: {
    alignItems: "center",
  },
  textContent: {
    flex: 1,
  },
  fabContainer: {
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f06292",
    borderWidth: 1,
    borderColor: "#FCD2F0",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 50,
  },
  fabText: {
    color: "white",
    fontSize: 12,
    fontFamily: "Inter700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  errorText: {
    fontSize: 16,
    color: "#f06292",
    marginBottom: 15,
    textAlign: "center",
  },
  refreshButton: {
    backgroundColor: "#f06292",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  refreshButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
    paddingHorizontal: 30,
  },
});