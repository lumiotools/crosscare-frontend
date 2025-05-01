// import { create } from "zustand";
// import {
//     initialize,
//     requestPermission,
//     readRecords,
//     StepsRecord,
//     RecordResult,
// } from 'react-native-health-connect';
// import { Platform } from "react-native";
// import { TimeRangeFilter } from "react-native-health-connect/lib/typescript/types/base.types";

// interface HealthConnectState {
//     isInitialized: boolean;
//     isAvailable: boolean;
//     isConnected: boolean;
//     isLoading: boolean;
//     error: string | null;
    
//     initialize: () => Promise<boolean>;
//     requestPermissions: () => Promise<boolean>;
//     getStepsData: (startTime: string, endTime: string) => Promise<{ date: string, steps: number }[]>;
//     getTodaySteps: () => Promise<number>;
//     disconnect: () => Promise<void>;
// }

// export const useHealthConnectStore = create<HealthConnectState>((set, get) => ({
//     isInitialized: false,
//     isAvailable: false,
//     isConnected: false,
//     isLoading: false,
//     error: null,
    
//     initialize: async () => {
//         try {
//             // Health Connect is only available on Android
//             if (Platform.OS !== 'android') {
//                 set({ 
//                     isInitialized: true, 
//                     isAvailable: false,
//                     error: 'Health Connect is only available on Android'
//                 });
//                 return false;
//             }
            
//             // Initialize Health Connect
//             const isAvailable = await initialize();
            
//             set({ 
//                 isInitialized: true,
//                 isAvailable,
//                 error: null
//             });
            
//             return isAvailable;
//         } catch (error) {
//             console.error('Failed to initialize Health Connect:', error);
//             set({ 
//                 error: `Failed to initialize Health Connect: ${error}`,
//                 isInitialized: true,
//                 isAvailable: false
//             });
//             return false;
//         }
//     },
    
//     requestPermissions: async () => {
//         try {
//             set({ isLoading: true });
            
//             if (Platform.OS !== 'android') {
//                 set({ isLoading: false });
//                 return false;
//             }
            
//             // Initialize if not already done
//             const isAvailable = get().isAvailable || await get().initialize();
            
//             if (!isAvailable) {
//                 set({ isLoading: false });
//                 return false;
//             }
            
//             // Request the permissions
//             const granted = await requestPermission([
//                 { accessType: 'read', recordType: 'Steps' }
//             ]);
            
//             const hasPermission = granted.length > 0;
            
//             set({ 
//                 isConnected: hasPermission,
//                 isLoading: false,
//                 error: null
//             });
            
//             return hasPermission;
//         } catch (error) {
//             console.error('Failed to request Health Connect permissions:', error);
//             set({ 
//                 error: `Failed to request permissions: ${error}`,
//                 isLoading: false
//             });
//             return false;
//         }
//     },
    
//     getStepsData: async (startTime, endTime) => {
//         try {
//             if (Platform.OS !== 'android') return [];
            
//             // Make sure Health Connect is initialized
//             const isAvailable = get().isAvailable || await get().initialize();
            
//             if (!isAvailable) {
//                 throw new Error('Health Connect is not available');
//             }
            
//             // Request permissions if not already granted
//             if (!get().isConnected) {
//                 const granted = await get().requestPermissions();
//                 if (!granted) {
//                     throw new Error('Permission not granted');
//                 }
//             }
            
//             // Define time range filter
//             const timeRangeFilter: TimeRangeFilter = {
//                 operator: 'between',
//                 startTime,
//                 endTime,
//             };
            
//             // Read steps records
//             const { records } = await readRecords('Steps', {
//                 timeRangeFilter,
//             });
            
//             // Process the records
//             const stepsMap = new Map<string, number>();
            
//             records.forEach((record: RecordResult<"Steps">) => {
//                 const date = record.startTime.split('T')[0]; // Fix: get only the date part
//                 const steps = record.count || 0;
                
//                 // Aggregate steps for the same day
//                 if (stepsMap.has(date)) {
//                     stepsMap.set(date, stepsMap.get(date)! + steps);
//                 } else {
//                     stepsMap.set(date, steps);
//                 }
//             });
            
//             // Convert map to array
//             return Array.from(stepsMap.entries()).map(([date, steps]) => ({
//                 date,
//                 steps,
//             }));
//         } catch (error) {
//             console.error('Failed to read step data from Health Connect:', error);
//             set({ error: `Failed to read step data: ${error}` });
//             return [];
//         }
//     },
    
//     getTodaySteps: async () => {
//         try {
//             const today = new Date();
//             const todayString = today.toISOString().split('T')[0];
            
//             // Start time is the beginning of today
//             const startTime = new Date(today);
//             startTime.setHours(0, 0, 0, 0);
            
//             // End time is now
//             const endTime = today;
            
//             const stepsData = await get().getStepsData(
//                 startTime.toISOString(),
//                 endTime.toISOString()
//             );
            
//             // Find today's steps
//             const todayData = stepsData.find(item => item.date === todayString);
//             return todayData?.steps || 0;
//         } catch (error) {
//             console.error('Failed to get today\'s steps:', error);
//             return 0;
//         }
//     },
    
//     disconnect: async () => {
//         set({ 
//             isConnected: false,
//             error: null 
//         });
//     }
// }));