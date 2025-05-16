import { IntentClassification } from './types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry {
  classification: IntentClassification;
  timestamp: number;
}

const CACHE_EXPIRY = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds
const CACHE_KEY = 'intent_classification_cache';

// Load cache from storage
export const loadClassificationCache = async (): Promise<Record<string, CacheEntry>> => {
  try {
    const cacheJson = await AsyncStorage.getItem(CACHE_KEY);
    if (cacheJson) {
      return JSON.parse(cacheJson);
    }
    return {};
  } catch (error) {
    console.error('Error loading classification cache:', error);
    return {};
  }
};

// Save cache to storage
export const saveClassificationCache = async (cache: Record<string, CacheEntry>): Promise<void> => {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving classification cache:', error);
  }
};

// Get classification from cache or compute and cache it
export const getCachedClassification = async (
  responseKey: string,
  classifyFn: () => Promise<IntentClassification>
): Promise<IntentClassification> => {
  try {
    const cache = await loadClassificationCache();
    const now = Date.now();
    
    // Check if we have a valid cache entry
    if (
      cache[responseKey] && 
      now - cache[responseKey].timestamp < CACHE_EXPIRY
    ) {
      console.log('Using cached classification for:', responseKey);
      return cache[responseKey].classification;
    }
    
    // No valid cache entry, compute the classification
    console.log('Computing new classification for:', responseKey);
    const classification = await classifyFn();
    
    // Update the cache
    cache[responseKey] = {
      classification,
      timestamp: now
    };
    
    // Save the updated cache
    await saveClassificationCache(cache);
    
    return classification;
  } catch (error) {
    console.error('Error in cached classification:', error);
    // Still try to return a classification even if caching fails
    return classifyFn();
  }
};