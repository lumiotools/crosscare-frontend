import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import {
  loadReminders,
  saveReminders,
  requestNotificationPermissions,
  scheduleDailyReminder,
  generateDefaultReminders,
  ReminderSettings,
  displayTestNotification,
  getAllScheduledNotifications,
} from '../../../utils/NotificationManager';
import { router, useLocalSearchParams } from 'expo-router';

export default function RemindersScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const [reminders, setReminders] = useState<ReminderSettings[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentReminder, setCurrentReminder] = useState<ReminderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReminderType, setNewReminderType] = useState<ReminderSettings['type']>(
    (params.type as any) || 'water'
  );
  const [newReminderMessage, setNewReminderMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState<ReminderSettings['type'] | 'all'>(
    (params.type as any) || 'all'
  );
  
  // Load reminders on mount
  useEffect(() => {
    loadExistingReminders();
  }, []);
  
  async function loadExistingReminders() {
    try {
      setLoading(true);
      
      // Check for permissions first
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please allow notifications to set up reminders',
          [{ text: 'OK' }]
        );
      }
      
      // Load saved reminders
      let savedReminders = await loadReminders();
      
      // If no reminders exist, create defaults
      if (savedReminders.length === 0) {
        savedReminders = generateDefaultReminders();
        await saveReminders(savedReminders);
      }
      
      setReminders(savedReminders);
    } catch (error) {
      console.error('Error loading reminders:', error);
      Alert.alert('Error', 'Could not load reminder settings');
    } finally {
      setLoading(false);
    }
  }
  
  async function toggleReminder(id: string) {
    const updatedReminders = reminders.map(reminder => {
      if (reminder.id === id) {
        return { ...reminder, enabled: !reminder.enabled };
      }
      return reminder;
    });
    
    setReminders(updatedReminders);
    await saveReminders(updatedReminders);
    
    // Schedule or cancel the reminder based on its new state
    const reminder = updatedReminders.find(r => r.id === id);
    if (reminder) {
      await scheduleDailyReminder(reminder);
    }
  }
  
  function showTimePickerFor(reminder: ReminderSettings) {
    setCurrentReminder(reminder);
    setShowTimePicker(true);
  }
  
  async function handleTimeChange(event: any, selectedDate?: Date) {
    setShowTimePicker(false);
    
    if (event.type === 'dismissed' || !selectedDate || !currentReminder) {
      return;
    }
    
    // Format time as HH:MM
    const hours = selectedDate.getHours().toString().padStart(2, '0');
    const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
    const newTime = `${hours}:${minutes}`;
    
    // Update the reminder
    const updatedReminders = reminders.map(reminder => {
      if (reminder.id === currentReminder.id) {
        return { ...reminder, time: newTime };
      }
      return reminder;
    });
    
    setReminders(updatedReminders);
    await saveReminders(updatedReminders);
    
    // Reschedule the updated reminder
    const updatedReminder = updatedReminders.find(r => r.id === currentReminder.id);
    if (updatedReminder) {
      await scheduleDailyReminder(updatedReminder);
    }
  }
  
  async function addNewReminder() {
    // Generate a unique ID
    const id = `${newReminderType}-${Date.now()}`;
    
    // Get current time
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const time = `${hours}:${minutes}`;
    
    // Create new reminder
    const newReminder: ReminderSettings = {
      id,
      type: newReminderType,
      time,
      enabled: true,
      days: [], // Empty array means every day
      message: newReminderMessage || `Time to track your ${newReminderType}!`,
    };
    
    // Add to list
    const updatedReminders = [...reminders, newReminder];
    setReminders(updatedReminders);
    await saveReminders(updatedReminders);
    
    // Schedule the new reminder
    await scheduleDailyReminder(newReminder);
    
    // Close modal and reset fields
    setShowAddModal(false);
    setNewReminderMessage('');
    
    // Show time picker for the new reminder
    setCurrentReminder(newReminder);
    setShowTimePicker(true);
  }
  
  async function deleteReminder(id: string) {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            const updatedReminders = reminders.filter(reminder => reminder.id !== id);
            setReminders(updatedReminders);
            await saveReminders(updatedReminders);
            await Notifications.cancelScheduledNotificationAsync(id);
          },
          style: 'destructive',
        },
      ]
    );
  }
  
  // Format time for display
  function formatTime(timeString: string) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }
  
  // Get reminder title
  function getReminderTitle(type: string) {
    switch(type) {
      case 'water': return '💧 Water Intake';
      case 'steps': return '👟 Steps';
      case 'weight': return '⚖️ Weight';
      case 'sleep': return '😴 Sleep';
      case 'heart': return '❤️ Heart Rate';
      case 'medication': return '💊 Medication';
      default: return 'Health Tracking';
    }
  }
  
  // Get icon for reminder type
  function getIconForType(type: string) {
    switch(type) {
      case 'water': return 'water-outline';
      case 'steps': return 'fitness-outline';
      case 'weight': return 'body-outline';
      case 'sleep': return 'moon-outline';
      case 'heart': return 'heart-outline';
      case 'medication': return 'medkit-outline';
      default: return 'notifications-outline';
    }
  }
  
  // Get color for reminder type
  function getColorForType(type: string): string {
    switch (type) {
      case 'water': return '#67B6FF';
      case 'steps': return '#7B9E6B';
      case 'sleep': return '#9E6BB7';
      case 'heart': return '#E16262';
      case 'weight': return '#62A9E1';
      case 'medication': return '#E79D42';
      default: return '#E162BC';
    }
  }
  
  // Debug function to show all scheduled notifications
  async function showAllScheduledNotifications() {
    const scheduledNotifications = await getAllScheduledNotifications();
    console.log('All scheduled notifications:', JSON.stringify(scheduledNotifications, null, 2));
    
    Alert.alert(
      'Scheduled Notifications',
      `Found ${scheduledNotifications.length} scheduled notifications.`,
      [{ text: 'OK' }]
    );
  }
  
  // Filter reminders based on active filter
  const filteredReminders = activeFilter === 'all' 
    ? reminders 
    : reminders.filter(reminder => reminder.type === activeFilter);
  
  // Render a reminder item
  const renderReminderItem = ({ item }: { item: ReminderSettings }) => (
    <View style={styles.reminderItem}>
      <View style={[styles.reminderIconContainer, { backgroundColor: `${getColorForType(item.type)}20` }]}>
        <Ionicons 
          name={getIconForType(item.type) as any} 
          size={24} 
          color={getColorForType(item.type)} 
        />
      </View>
      
      <View style={styles.reminderInfo}>
        <Text style={[styles.reminderTitle, { color: getColorForType(item.type) }]}>
          {getReminderTitle(item.type)}
        </Text>
        
        <TouchableOpacity onPress={() => showTimePickerFor(item)}>
          <Text style={styles.reminderTime}>{formatTime(item.time)}</Text>
        </TouchableOpacity>
        
        <Text style={styles.reminderMessage}>{item.message}</Text>
      </View>
      
      <View style={styles.reminderActions}>
        <Switch
          value={item.enabled}
          onValueChange={() => toggleReminder(item.id)}
          trackColor={{ false: '#E0E0E0', true: `${getColorForType(item.type)}80` }}
          thumbColor={item.enabled ? getColorForType(item.type) : '#f4f3f4'}
        />
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => deleteReminder(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color="#999" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Render filter buttons
  const renderFilterButton = (type: 'all' | ReminderSettings['type'], label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        activeFilter === type && { 
          backgroundColor: type === 'all' ? '#F3F3F3' : `${getColorForType(type)}20`,
          borderColor: type === 'all' ? '#DDD' : getColorForType(type),
        }
      ]}
      onPress={() => setActiveFilter(type)}
    >
      <Text 
        style={[
          styles.filterButtonText, 
          activeFilter === type && { 
            color: type === 'all' ? '#333' : getColorForType(type),
            fontWeight: '600'
          }
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#434343" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Health Reminders</Text>
        <TouchableOpacity onPress={() => {
          displayTestNotification();
          showAllScheduledNotifications();
        }}>
          <Ionicons name="notifications-outline" size={24} color="#434343" />
        </TouchableOpacity>
      </View>
      
      {/* Filter buttons */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderFilterButton('all', 'All')}
          {renderFilterButton('water', 'Water')}
          {renderFilterButton('steps', 'Steps')}
          {renderFilterButton('sleep', 'Sleep')}
          {renderFilterButton('heart', 'Heart Rate')}
          {renderFilterButton('weight', 'Weight')}
          {renderFilterButton('medication', 'Medication')}
        </ScrollView>
      </View>
      
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#E162BC" />
          <Text style={styles.loaderText}>Loading reminders...</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={filteredReminders}
            renderItem={renderReminderItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No reminders found.</Text>
                <Text style={styles.emptySubtext}>Tap the + button to create one!</Text>
              </View>
            }
          />
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </>
      )}
      
      {/* Time Picker */}
      {showTimePicker && currentReminder && (
        <DateTimePicker
          value={(() => {
            const [hours, minutes] = currentReminder.time.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes, 0, 0);
            return date;
          })()}
          mode="time"
          is24Hour={false}
          display="spinner"
          onChange={handleTimeChange}
        />
      )}
      
      {/* Add Reminder Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Create New Reminder</Text>
            
            <Text style={styles.modalLabel}>Reminder Type</Text>
            <View style={styles.typeButtons}>
              {['water', 'steps', 'sleep', 'heart', 'weight', 'medication'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    newReminderType === type && {
                      backgroundColor: `${getColorForType(type)}20`,
                      borderColor: getColorForType(type),
                    }
                  ]}
                  onPress={() => setNewReminderType(type as ReminderSettings['type'])}
                >
                  <Ionicons 
                    name={getIconForType(type) as any} 
                    size={24} 
                    color={getColorForType(type)} 
                  />
                  <Text style={styles.typeButtonText}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.modalLabel}>Custom Message (Optional)</Text>
            <TextInput
              style={styles.messageInput}
              value={newReminderMessage}
              onChangeText={setNewReminderMessage}
              placeholder={`Time to track your ${newReminderType}!`}
              placeholderTextColor="#999"
              multiline
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.createButton, { backgroundColor: getColorForType(newReminderType) }]}
                onPress={addNewReminder}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'DMSans600',
    color: '#434343',
  },
  filterContainer: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80, // Space for floating button
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reminderIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontFamily: 'DMSans600',
    marginBottom: 4,
  },
  reminderTime: {
    fontSize: 24,
    fontFamily: 'DMSans700',
    color: '#333',
    marginBottom: 6,
  },
  reminderMessage: {
    fontSize: 14,
    fontFamily: 'DMSans400',
    color: '#7B7B7B',
  },
  reminderActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    paddingVertical: 4,
  },
  deleteButton: {
    padding: 8,
    marginTop: 12,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: 'DMSans400',
    color: '#7B7B7B',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'DMSans500',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'DMSans400',
    color: '#999',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E162BC',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'DMSans600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 16,
    fontFamily: 'DMSans500',
    color: '#555',
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  typeButton: {
    width: '30%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  typeButtonText: {
    fontSize: 12,
    fontFamily: 'DMSans500',
    color: '#666',
    marginTop: 8,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: 'DMSans400',
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'DMSans500',
    color: '#999',
  },
  createButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: '#E162BC',
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'DMSans600',
    color: 'white',
  },
});