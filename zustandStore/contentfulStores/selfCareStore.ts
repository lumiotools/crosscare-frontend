import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as FileSystem from 'expo-file-system'

const SPACE_ID = 'ar5yaphmi182';
const ACCESS_TOKEN = '9g_w7hnzte5Uwu_-6ZhwMb8WCeF-9c7lQyJUoTYbip4';
const CONTENT_PREVIEW_TOKEN = 'UVZsv9lhp8bF19ZCGpMYApn323EnTRQqgiNhT9iGaSE';
const CONTENT_TYPE = 'selfCareRoutine';
const CACHE_KEY = 'selfCareRoutines';
const CACHE_EXPIRY_MS = 0;

interface SelfCareRoutine {
    id: string;
    title: string;
    routineImage: string;
    description: string;
    audio: string;
    localAudioPath: string;
    gradientColors: string[];
}

interface SelfCareState {
    routines: SelfCareRoutine[];
    isLoading: boolean;
    error: string | null;
    currentRoutine: SelfCareRoutine | null;

    fetchRoutines: () => Promise<void>;
    getRoutineById: (id: string) => SelfCareRoutine | null;
    setCurrentRoutine: (routine: SelfCareRoutine | null) => void;
    downloadAudio: (routineId: string) => Promise<string | null>;
}


const fetchRoutinesFromContentful = async () => {
    try {
        const response = await axios.get(
            `https://cdn.contentful.com/spaces/${SPACE_ID}/environments/master/entries`, {
                headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
                params: { content_type: CONTENT_TYPE, include: 10 },
            });

        const includes = response.data.includes.Asset;
        const assetMap = {};

        includes.forEach((asset) => {
            assetMap[asset.sys.id] = `https:${asset.fields.file.url}`;
        });

        return response.data.items.map((item) => {
            const fields = item.fields;
            return {
                id: fields.id || item.sys.id,
                title: fields.title || "Self Care Routine",
                routineImage: fields.routineImage?.sys?.id
                ? assetMap[fields.routineImage.sys.id]
                : null,
                description: fields.description || "",
                audio: fields.audio?.sys?.id 
                ? assetMap[fields.audio.sys.id] 
                : null,
                duration: fields.duration || "5 min",
                localAudioPath: null,
                gradientColors: fields.gradientColors?.gradientColors || ["#7B96FF", "#0039C6"]
            };
        })
    } catch (e) {
        console.error('Error fetching routines from Contentful:', e);
        throw e;
    }
}
export const useSelfCareStore = create<SelfCareState>((set, get) => ({
    routines: [],
    isLoading: false,
    error: null,
    currentRoutine: null,
    
    fetchRoutines: async () => {
        set({ isLoading: true, error: null });
        
        try {
            // First check if we have cached data
            const cachedData = await AsyncStorage.getItem(CACHE_KEY);
            const currentTime = Date.now();
            
            if (cachedData) {
                const parsedData = JSON.parse(cachedData);
                
                // Use cache if it's still valid
                if (currentTime - parsedData.timestamp < CACHE_EXPIRY_MS) {
                    set({ 
                        routines: parsedData.data,
                        isLoading: false 
                    });
                    return;
                }
            }
            
            // Fetch fresh data from Contentful
            const routines = await fetchRoutinesFromContentful();
            set({ routines, isLoading: false });
            
            // Update the cache
            await AsyncStorage.setItem(
                CACHE_KEY,
                JSON.stringify({ data: routines, timestamp: currentTime })
            );
        } catch (error) {
            console.error('Error fetching self-care routines:', error);
            set({ 
                isLoading: false,
                error: 'Failed to load self-care routines. Please try again later.'
            });
            
            // On error, try to use cached data if available
            try {
                const cachedData = await AsyncStorage.getItem(CACHE_KEY);
                if (cachedData) {
                    const parsedData = JSON.parse(cachedData);
                    set({ routines: parsedData.data });
                }
            } catch (e) {
                console.error('Error reading cache:', e);
            }
        }
    },
    
    getRoutineById: (id) => {
        const { routines } = get();
        return routines.find(routine => routine.id === id) || null;
    },
    
    setCurrentRoutine: (routine) => {
        set({ currentRoutine: routine });
    },
    
    downloadAudio: async (routineId) => {
        const { routines } = get();
        const routine = routines.find(r => r.id === routineId);
        
        if (!routine || !routine.audio) {
            console.log('Cannot download: No routine found or no audio URL');
            return null;
        }
        
        // Check if we already have the audio downloaded and it exists
        if (routine.localAudioPath) {
            try {
                const fileInfo = await FileSystem.getInfoAsync(routine.localAudioPath);
                if (fileInfo.exists) {
                    console.log('Using existing audio file:', routine.localAudioPath);
                    return routine.localAudioPath;
                }
            } catch (error) {
                console.error('Error checking file existence:', error);
                // Continue to download if checking fails
            }
        }
        
        try {
            // Create a unique filename based on the audio URL
            const audioFileName = `selfcare_${routineId}_${routine.audio.split('/').pop()}`;
            const localPath = `${FileSystem.documentDirectory}${audioFileName}`;
            
            console.log('Downloading audio to:', localPath);
            
            // Download the audio file
            const downloadResult = await FileSystem.downloadAsync(
                routine.audio,
                localPath
            );
            
            if (downloadResult.status !== 200) {
                console.error('Download failed with status:', downloadResult.status);
                return null;
            }
            
            // Update the routine in state with the local path
            set(state => ({
                routines: state.routines.map(r => 
                    r.id === routineId 
                        ? { ...r, localAudioPath: localPath }
                        : r
                ),
                // Also update current routine if it's the one we're downloading for
                currentRoutine: state.currentRoutine?.id === routineId
                    ? { ...state.currentRoutine, localAudioPath: localPath }
                    : state.currentRoutine
            }));
            
            // Update the cache with the new path
            try {
                const cachedData = await AsyncStorage.getItem(CACHE_KEY);
                if (cachedData) {
                    const parsedData = JSON.parse(cachedData);
                    const updatedData = {
                        ...parsedData,
                        data: parsedData.data.map(r => 
                            r.id === routineId
                                ? { ...r, localAudioPath: localPath }
                                : r
                        )
                    };
                    
                    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updatedData));
                }
            } catch (e) {
                console.error('Error updating cache with local path:', e);
            }
            
            return localPath;
        } catch (error) {
            console.error('Error downloading audio:', error);
            return null;
        }
    }
}));