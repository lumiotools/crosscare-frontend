import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import FoodIcon from '@/assets/images/Svg/FoodIcon';
import HeartIcon from '@/assets/images/Svg/HeartIcon';
import MedicationIcon from '@/assets/images/Svg/MedicationIcon';
import WeightIcon from '@/assets/images/Svg/WeightIcon';
import WaterIcon from '@/assets/images/Svg/WaterIcon';
import StepsIcon from '@/assets/images/Svg/StepsIcon';
import SleepIcon from '@/assets/images/Svg/SleepIcon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import i18n from 'i18next';
import { useTranslation } from 'react-i18next';




const TrackingOptionsScreen = () => {

  const user = useSelector((state:any) => state.user);
  const userId = user?.user_id;
  
  const {t} = useTranslation();

  useEffect(() => {
    const setHealthVisited = async () => {
      await AsyncStorage.setItem('health', 'true');
    };
    
    setHealthVisited();
  }, [userId]);

  const trackingOptions = [
  { 
    id: 'food', 
    title: t('food'), 
    icon: <FoodIcon width={24} height={24}  />,
    onPress: ()=> router.push('/patient/meals')
  },
  { 
    id: 'heart-rate', 
    title: t('heartRate'), 
    icon: <HeartIcon width={24} height={24}  />,
    onPress: () => router.push('/patient/heart'),
  },
  { 
    id: 'medication', 
    title: t('medication'), 
    icon: <MedicationIcon width={24} height={24}  />,
    onPress: ()=> router.push('/patient/medication/medications')
  },
  { 
    id: 'weight', 
    title: t('weight'),  
    icon: <WeightIcon width={24} height={24}  />,
    onPress: ()=> router.push('/patient/weight')
  },
  { 
    id: 'water', 
    title: t('water'),   
    icon: <WaterIcon width={24} height={24}  />,
    onPress : () => router.push('/patient/water'),
  },
  { 
    id: 'steps', 
    title: t('steps'), 
    icon: <StepsIcon width={24} height={24}  />,
    onPress : () => router.push('/patient/steps'),
  },
  { 
    id: 'sleep', 
    title: t('sleep'),  
    icon: <SleepIcon width={24} height={24}  />,
    onPress : () => router.push('/patient/sleep'),
  },
];


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={'white'} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
        
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      
      {/* Title */}
      <Text style={styles.title}>{t('track_title')}</Text>
      
      {/* Tracking Options List */}
      <View style={styles.optionsContainer}>
        {trackingOptions.map((option) => (
          <TouchableOpacity 
            key={option.id}
            style={styles.optionItem}
            onPress={option.onPress} // Navigate to the respective screen
          >
            <View style={styles.optionIconContainer}>
              {option.icon}
            </View>
            <Text style={styles.optionText}>{option.title}</Text>
            <Ionicons name="chevron-forward" size={20} color="black" />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    paddingTop: 15,
  },
  backButton: {
    // padding: 4,
  },
  title: {
    fontSize: 18,
    fontFamily:'DMSans600',
    marginTop: 8,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  optionsContainer: {
    paddingHorizontal: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  optionIconContainer: {
    width: 40,
    alignItems: 'flex-start',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
});

export default TrackingOptionsScreen;
