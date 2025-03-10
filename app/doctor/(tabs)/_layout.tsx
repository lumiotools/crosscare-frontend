import { HapticTab } from '@/components/HapticTab';
import TabBarIcon from '@/components/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false, 
        tabBarStyle: {
          backgroundColor: 'white',  // White background for the bottom tab bar
          borderTopWidth: 0,  // No border at the top of the tab bar
          height: 60,      
          paddingTop: 10,   // Height of the tab bar (Instagram typically has a smaller height)
          alignItems: 'center',
          shadowColor: "#000",  // Add shadow for floating effect
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3.84,
          elevation: 5,  // Elevation for iOS and Android shadow
          position: Platform.OS === 'ios' ? 'absolute' : 'relative', // Combine the position logic here
        },
        tabBarActiveTintColor: Colors.primaryColor_400,
        tabBarButton: HapticTab,
        tabBarLabel: '',
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="home"
        options={{
          title: '',
          tabBarIcon: ({ color, size }) => (
            <Feather name='home' size={24} color={color}/> // Larger icon for the center tab
          ),
        }}
      />

      
      
      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: '',
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
