import React from "react";
import HomeIcon from "@/assets/images/Svg/HomeIcon";
import JournalIcon from "@/assets/images/Svg/JournalIcon";
import ProfileIcon from "@/assets/images/Svg/ProfileIcon";
import SelfCareIcon from "@/assets/images/Svg/SelfCareIcon";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

export default function TabLayout() {
  
  const {t} = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          height: 59, // Tab bar height
          paddingTop: 5, // Padding for the tab bar
          alignItems: "center",
          borderTopWidth:0,
          justifyContent: "center",
          paddingHorizontal: 20, // Horizontal padding for the tab bar
          elevation: 0, // Remove shadow on Android
        },
        tabBarActiveTintColor: "#F76CCF", // Active color for icon and label
        tabBarInactiveTintColor: "rgba(247, 108, 207, 0.50)", // Inactive color for icon and label
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="home"
        options={{
          title: t('home.title'),

          tabBarIcon: ({ color }) => (
            <HomeIcon
              color={color} // Use the passed color to set icon color
              size={24}
            />
          ),
        }}
      />

      {/* Self Care Tab */}
      <Tabs.Screen
        name="selfcare"
        options={{
          title: t('selfCare.title'),

          tabBarIcon: ({ color }) => (
            <SelfCareIcon
              size={25}
              color={color} // Use the passed color to set icon color
            />
          ),
        }}
      />

      {/* Journal Tab */}
      <Tabs.Screen
        name="journal"
        options={{
          title: t('journals'),

          tabBarIcon: ({ color }) => (
            <JournalIcon
              size={24}
              color={color} // Use the passed color to set icon color
            />
          ),
        }}
      />

      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile.title'),

          tabBarIcon: ({ color }) => (
            <ProfileIcon
              size={24}
              color={color} // Use the passed color to set icon color
            />
          ),
        }}
      />
    </Tabs>
  );
}
