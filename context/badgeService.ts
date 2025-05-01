import { Badge } from '@/context/BadgeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Function to get previously shown badges
export const getShownBadges = async (): Promise<string[]> => {
  try {
    const shownBadges = await AsyncStorage.getItem('shownBadges');
    const result = shownBadges ? JSON.parse(shownBadges) : [];
    console.log("Retrieved shown badges:", result);
    return result;
  } catch (error) {
    console.error('Error getting shown badges:', error);
    return [];
  }
};

// Function to fetch badges from API
export const fetchUserBadges = async (userId: string, token: string): Promise<any[]> => {
  try {
    const response = await fetch(
      `https://crosscare-backends.onrender.com/api/user/${userId}`,
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
    return data;
  } catch (error) {
    console.error('Error fetching badges:', error);
    return [];
  }
};

// Function to check for new badges and show them
export const checkForNewBadges = async (
  userId: string, 
  token: string, 
  showBadge: (badge: Badge) => void
): Promise<void> => {
  try {
    // Get previously shown badges
    const shownBadgeIds = await getShownBadges();
    
    // Fetch all user badges
    const allBadges = await fetchUserBadges(userId, token);
    
    if (!allBadges || allBadges.length === 0) {
      console.log("No badges found");
      return;
    }
    
    // Find badges that haven't been shown yet
    const newBadges = allBadges.filter(badge => !shownBadgeIds.includes(badge.id));
    console.log(`Found ${newBadges.length} new badges to show out of ${allBadges.length} total badges`);
    
    if (newBadges.length > 0) {
      // Show the first new badge
      const badgeToShow = newBadges[0];
      
      if (badgeToShow.badge) {
        const badge: Badge = {
          id: badgeToShow.id,
          type: badgeToShow.badge.type,
          title: badgeToShow.badge.title,
          description: badgeToShow.badge.description,
          badge: badgeToShow.badge
        };
        
        console.log("Showing new badge:", badge.title);
        showBadge(badge);
      } else {
        console.error("Badge data is missing the badge property:", badgeToShow);
      }
    }
  } catch (error) {
    console.error('Error checking for new badges:', error);
  }
};

// Clear badge history (for testing)
export const clearBadgeHistory = async () => {
  try {
    await AsyncStorage.removeItem('shownBadges');
    console.log("Badge history cleared");
  } catch (error) {
    console.error('Error clearing badge history:', error);
  }
};