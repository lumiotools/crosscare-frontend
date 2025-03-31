import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { DailyTriggerInput, SchedulableTriggerInputTypes } from 'expo-notifications';

// Define constants
const REMINDER_STORAGE_KEY = 'health_reminders';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface ReminderSettings {
  id: string;
  type: 'water' | 'steps' | 'medication' | 'sleep' | 'heart' | 'weight';
  time: string; // Format: 'HH:MM'
  enabled: boolean;
  days: number[]; // 0-6 for days of week (0 = Sunday)
  message: string;
}

// Request permissions
export async function requestNotificationPermissions() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Schedule a daily reminder
export async function scheduleDailyReminder(reminder: ReminderSettings): Promise<string> {
  // Cancel any existing notification with this ID
  try {
    await Notifications.cancelScheduledNotificationAsync(reminder.id);
  } catch (error) {
    console.log("No existing notification to cancel");
  }
  
  if (!reminder.enabled) {
    return reminder.id;
  }
  
  // Parse time string
  const [hours, minutes] = reminder.time.split(':').map(Number);
  
  // Create trigger for daily notification at specified time
  
  try {
    // Schedule the notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: getReminderTitle(reminder.type),
        body: reminder.message || `Time to track your ${reminder.type}!`,
        data: { 
          type: reminder.type,
          screen: getScreenForType(reminder.type)
        },
        sound: true,
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      },
      identifier: reminder.id,
    });
    
    console.log(`Scheduled reminder: ${reminder.type} at ${hours}:${minutes}`);
    return reminder.id;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
}

// Helper functions for notifications
function getReminderTitle(type: string): string {
  switch (type) {
    case 'water':
      return '💧 Water Reminder';
    case 'steps':
      return '👟 Steps Reminder';
    case 'medication':
      return '💊 Medication Reminder';
    case 'sleep':
      return '😴 Sleep Reminder';
    case 'heart':
      return '❤️ Heart Rate Reminder';
    case 'weight':
      return '⚖️ Weight Reminder';
    default:
      return 'Health Reminder';
  }
}

function getColorForType(type: string): string {
  switch (type) {
    case 'water':
      return '#67B6FF';
    case 'steps':
      return '#7B9E6B';
    case 'sleep':
      return '#9E6BB7';
    case 'heart':
      return '#E16262';
    case 'weight':
      return '#62A9E1';
    case 'medication':
      return '#E79D42';
    default:
      return '#E162BC';
  }
}

function getScreenForType(type: string): string {
  switch (type) {
    case 'water':
      return '/patient/water';
    case 'steps':
      return '/patient/steps';
    case 'sleep':
      return '/patient/sleep';
    case 'heart':
      return '/patient/heart';
    case 'weight':
      return '/patient/weight';
    default:
      return '/patient/(tabs)/home';
  }
}

// Save reminders to storage
export async function saveReminders(reminders: ReminderSettings[]) {
  await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(reminders));
}

// Load reminders from storage
export async function loadReminders(): Promise<ReminderSettings[]> {
  try {
    const storedReminders = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
    return storedReminders ? JSON.parse(storedReminders) : [];
  } catch (error) {
    console.error('Error loading reminders:', error);
    return [];
  }
}

// Reschedule all active reminders (useful on app startup)
export async function rescheduleAllReminders() {
  try {
    const reminders = await loadReminders();
    
    // Cancel all existing notifications first
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Reschedule enabled reminders
    const activeReminders = reminders.filter(r => r.enabled);
    for (const reminder of activeReminders) {
      await scheduleDailyReminder(reminder);
    }
    
    return activeReminders.length;
  } catch (error) {
    console.error('Error rescheduling reminders:', error);
    return 0;
  }
}

// Helper to generate default reminders for a user
export function generateDefaultReminders(): ReminderSettings[] {
  return [
    {
      id: 'water-morning',
      type: 'water',
      time: '09:00',
      enabled: true,
      days: [],
      message: 'Time to track your morning water intake!'
    },
    {
      id: 'steps-evening',
      type: 'steps',
      time: '19:00',
      enabled: true,
      days: [],
      message: 'Don\'t forget to log your steps for today!'
    },
    {
      id: 'sleep-morning',
      type: 'sleep',
      time: '08:00',
      enabled: true,
      days: [],
      message: 'How did you sleep last night? Tap to log your sleep.'
    }
  ];
}

// Listen for notification responses
export function setNotificationResponseHandler(
  handler: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

// Display a test notification
export async function displayTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Test Notification",
      body: "This is a test notification from Expo Notifications",
      data: { screen: '/patient/(tabs)/home' },
      sound: true,
    },
    trigger: null, // null means the notification will fire immediately
  });
}

// Get all scheduled notifications (for debugging)
export async function getAllScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}