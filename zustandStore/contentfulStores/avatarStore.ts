import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';

// Constants for Contentful
const SPACE_ID = 'ar5yaphmi182';
const ACCESS_TOKEN = '9g_w7hnzte5Uwu_-6ZhwMb8WCeF-9c7lQyJUoTYbip4';
const CONTENT_PREVIEW_TOKEN = 'UVZsv9lhp8bF19ZCGpMYApn323EnTRQqgiNhT9iGaSE';
const HAIRSTYLE_CONTENT_TYPE = 'avatarHairstyle';
const OUTFIT_CONTENT_TYPE = 'avatarOutfit';
const COMBO_CONTENT_TYPE = 'avatarCombination';
const CACHE_KEY_HAIRSTYLES = 'avatarHairstyles';
const CACHE_KEY_OUTFITS = 'avatarOutfits';
const CACHE_KEY_COMBOS = 'avatarCombinations';
const CACHE_EXPIRY_MS = 12 * 60 * 60 * 1000; // 12 hours

// Define TypeScript interfaces
interface Hairstyle {
  id: string;
  title: string;
  image: string;
  localImagePath?: string;
  locked: boolean;
  grayScale: boolean;
  order: number;
}

interface Outfit {
  id: string;
  title: string;
  image: string;
  localImagePath?: string;
  locked: boolean;
  grayScale: boolean;
  order: number;
}

interface AvatarCombination {
  hairstyleId: string;
  outfitId: string;
  combinedImage: string;
  faceImage: string;
  localCombinedImagePath?: string;
  localFaceImagePath?: string;
}

interface UnlockResult {
  hairstyles: string[];
  outfits: string[];
}

interface AvatarState {
  hairstyles: Hairstyle[];
  outfits: Outfit[];
  combinations: AvatarCombination[];
  isLoadingHairstyles: boolean;
  isLoadingOutfits: boolean;
  isLoadingCombinations: boolean;
  error: string | null;
  
  fetchHairstyles: () => Promise<void>;
  fetchOutfits: () => Promise<void>;
  fetchCombinations: () => Promise<void>;
  fetchAllAvatarAssets: () => Promise<void>;
  
  getHairstyleById: (id: string) => Hairstyle | null;
  getOutfitById: (id: string) => Outfit | null;
  getCombination: (hairstyleId: string, outfitId: string) => AvatarCombination | null;
  
  downloadImage: (imageUrl: string, prefix: string) => Promise<string | null>;
  downloadHairstyleImage: (hairstyleId: string) => Promise<string | null>;
  downloadOutfitImage: (outfitId: string) => Promise<string | null>;
  downloadCombinationImages: (hairstyleId: string, outfitId: string) => Promise<{combinedImage: string | null, faceImage: string | null}>;
  
  updateUnlockedItems: (unlockResult: UnlockResult) => void;
}

// Helper function to fetch hairstyles from Contentful
const fetchHairstylesFromContentful = async (): Promise<Hairstyle[]> => {
  try {
    const response = await axios.get(
      `https://cdn.contentful.com/spaces/${SPACE_ID}/environments/master/entries`,
      {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
        params: { content_type: HAIRSTYLE_CONTENT_TYPE, include: 10 },
      }
    );

    const includes = response.data.includes?.Asset || [];
    const assetMap = {};

    includes.forEach((asset) => {
      assetMap[asset.sys.id] = `https:${asset.fields.file.url}`;
    });

    return response.data.items.map((item) => {
      const fields = item.fields;
      return {
        id: fields.id || item.sys.id,
        title: fields.title || "Hairstyle",
        image: fields.image?.sys?.id 
          ? assetMap[fields.image.sys.id] 
          : null,
        locked: !(fields.isDefault || false),
        grayScale: !(fields.isDefault || false),
        order: fields.order || 999,
      };
    }).sort((a, b) => a.order - b.order);
  } catch (e) {
    console.error('Error fetching hairstyles from Contentful:', e);
    throw e;
  }
};

// Helper function to fetch outfits from Contentful
const fetchOutfitsFromContentful = async (): Promise<Outfit[]> => {
  try {
    const response = await axios.get(
      `https://cdn.contentful.com/spaces/${SPACE_ID}/environments/master/entries`,
      {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
        params: { content_type: OUTFIT_CONTENT_TYPE, include: 10 },
      }
    );

    const includes = response.data.includes?.Asset || [];
    const assetMap = {};

    includes.forEach((asset) => {
      assetMap[asset.sys.id] = `https:${asset.fields.file.url}`;
    });

    return response.data.items.map((item) => {
      const fields = item.fields;
      return {
        id: fields.id || item.sys.id,
        title: fields.title || "Outfit",
        image: fields.image?.sys?.id 
          ? assetMap[fields.image.sys.id] 
          : null,
        locked: !(fields.isDefault || false),
        grayScale: !(fields.isDefault || false),
        order: fields.order || 999,
      };
    }).sort((a, b) => a.order - b.order);
  } catch (e) {
    console.error('Error fetching outfits from Contentful:', e);
    throw e;
  }
};

// Helper function to fetch combinations from Contentful
const fetchCombinationsFromContentful = async (): Promise<AvatarCombination[]> => {
  try {
    const response = await axios.get(
      `https://cdn.contentful.com/spaces/${SPACE_ID}/environments/master/entries`,
      {
        headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
        params: { content_type: COMBO_CONTENT_TYPE, include: 2 },
      }
    );

    const includes = response.data.includes?.Asset || [];
    const assetMap = {};

    includes.forEach((asset) => {
      assetMap[asset.sys.id] = `https:${asset.fields.file.url}`;
    });

    return response.data.items.map((item) => {
      const fields = item.fields;
      console.log(fields.combinedImage, "this is the combined image")
      return {
        hairstyleId: fields.hairstyleId || "",
        outfitId: fields.outfitId || "",
        combinedImage: fields.combinedImage?.sys?.id 
          ? assetMap[fields.combinedImage.sys.id] 
          : null,
        faceImage: fields.faceImage?.sys?.id 
          ? assetMap[fields.faceImage.sys.id] 
          : null,
      };
    });
  } catch (e) {
    console.error('Error fetching combinations from Contentful:', e);
    throw e;
  }
};

// Create the Zustand store
export const useAvatarStore = create<AvatarState>((set, get) => ({
  hairstyles: [],
  outfits: [],
  combinations: [],
  isLoadingHairstyles: false,
  isLoadingOutfits: false,
  isLoadingCombinations: false,
  error: null,
  
  fetchHairstyles: async () => {
    set({ isLoadingHairstyles: true, error: null });
    
    try {
      // First check if we have cached data
      const cachedData = await AsyncStorage.getItem(CACHE_KEY_HAIRSTYLES);
      const currentTime = Date.now();
      
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        
        // Use cache if it's still valid
        if (currentTime - parsedData.timestamp < CACHE_EXPIRY_MS) {
          set({ 
            hairstyles: parsedData.data,
            isLoadingHairstyles: false 
          });
          return;
        }
      }
      
      // Fetch fresh data from Contentful
      const hairstyles = await fetchHairstylesFromContentful();
      set({ hairstyles, isLoadingHairstyles: false });
      
      // Update the cache
      await AsyncStorage.setItem(
        CACHE_KEY_HAIRSTYLES,
        JSON.stringify({ data: hairstyles, timestamp: currentTime })
      );
    } catch (error) {
      console.error('Error fetching hairstyles:', error);
      set({ 
        isLoadingHairstyles: false,
        error: 'Failed to load hairstyles. Please try again later.'
      });
      
      // On error, try to use cached data if available
      try {
        const cachedData = await AsyncStorage.getItem(CACHE_KEY_HAIRSTYLES);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          set({ hairstyles: parsedData.data });
        }
      } catch (e) {
        console.error('Error reading hairstyles cache:', e);
      }
    }
  },

  fetchOutfits: async () => {
    set({ isLoadingOutfits: true, error: null });
    
    try {
      // First check if we have cached data
      const cachedData = await AsyncStorage.getItem(CACHE_KEY_OUTFITS);
      const currentTime = Date.now();
      
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        
        // Use cache if it's still valid
        if (currentTime - parsedData.timestamp < CACHE_EXPIRY_MS) {
          set({ 
            outfits: parsedData.data,
            isLoadingOutfits: false 
          });
          return;
        }
      }
      
      // Fetch fresh data from Contentful
      const outfits = await fetchOutfitsFromContentful();
      set({ outfits, isLoadingOutfits: false });
      
      // Update the cache
      await AsyncStorage.setItem(
        CACHE_KEY_OUTFITS,
        JSON.stringify({ data: outfits, timestamp: currentTime })
      );
    } catch (error) {
      console.error('Error fetching outfits:', error);
      set({ 
        isLoadingOutfits: false,
        error: 'Failed to load outfits. Please try again later.'
      });
      
      // On error, try to use cached data if available
      try {
        const cachedData = await AsyncStorage.getItem(CACHE_KEY_OUTFITS);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          set({ outfits: parsedData.data });
        }
      } catch (e) {
        console.error('Error reading outfits cache:', e);
      }
    }
  },

  fetchCombinations: async () => {
    set({ isLoadingCombinations: true, error: null });
    
    try {
      // First check if we have cached data
      const cachedData = await AsyncStorage.getItem(CACHE_KEY_COMBOS);
      const currentTime = Date.now();
      
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        
        // Use cache if it's still valid
        if (currentTime - parsedData.timestamp < CACHE_EXPIRY_MS) {
          set({ 
            combinations: parsedData.data,
            isLoadingCombinations: false 
          });
          return;
        }
      }
      
      // Fetch fresh data from Contentful
      const combinations = await fetchCombinationsFromContentful();
      set({ combinations, isLoadingCombinations: false });
      
      // Update the cache
      await AsyncStorage.setItem(
        CACHE_KEY_COMBOS,
        JSON.stringify({ data: combinations, timestamp: currentTime })
      );
    } catch (error) {
      console.error('Error fetching combinations:', error);
      set({ 
        isLoadingCombinations: false,
        error: 'Failed to load avatar combinations. Please try again later.'
      });
      
      // On error, try to use cached data if available
      try {
        const cachedData = await AsyncStorage.getItem(CACHE_KEY_COMBOS);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          set({ combinations: parsedData.data });
        }
      } catch (e) {
        console.error('Error reading combinations cache:', e);
      }
    }
  },

  fetchAllAvatarAssets: async () => {
    const { fetchHairstyles, fetchOutfits, fetchCombinations } = get();
    
    // Run all fetches in parallel
    await Promise.all([
      fetchHairstyles(),
      fetchOutfits(),
      fetchCombinations()
    ]);
  },
  
  getHairstyleById: (id) => {
    const { hairstyles } = get();
    return hairstyles.find(h => h.id === id) || null;
  },
  
  getOutfitById: (id) => {
    const { outfits } = get();
    return outfits.find(o => o.id === id) || null;
  },
  
  getCombination: (hairstyleId, outfitId) => {
    const { combinations } = get();
    return combinations.find(c => 
      c.hairstyleId === hairstyleId && c.outfitId === outfitId
    ) || null;
  },
  
  downloadImage: async (imageUrl, prefix) => {
    if (!imageUrl) {
      console.log('Cannot download: No image URL provided');
      return null;
    }
    
    try {
      // Create a unique filename based on the URL
      const fileName = `${prefix}_${imageUrl.split('/').pop()}`;
      const localPath = `${FileSystem.documentDirectory}${fileName}`;
      
      // Check if file already exists
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists) {
        console.log('Using existing file:', localPath);
        return localPath;
      }
      
      console.log('Downloading image to:', localPath);
      
      // Download the file
      const downloadResult = await FileSystem.downloadAsync(
        imageUrl,
        localPath
      );
      
      if (downloadResult.status !== 200) {
        console.error('Download failed with status:', downloadResult.status);
        return null;
      }
      
      return localPath;
    } catch (error) {
      console.error('Error downloading image:', error);
      return null;
    }
  },
  
  downloadHairstyleImage: async (hairstyleId) => {
    const { hairstyles, downloadImage } = get();
    const hairstyle = hairstyles.find(h => h.id === hairstyleId);
    
    if (!hairstyle || !hairstyle.image) {
      return null;
    }
    
    const localPath = await downloadImage(hairstyle.image, `hairstyle_${hairstyleId}`);
    
    if (localPath) {
      // Update the hairstyle with the local path
      set(state => ({
        hairstyles: state.hairstyles.map(h => 
          h.id === hairstyleId 
            ? { ...h, localImagePath: localPath }
            : h
        )
      }));
      
      // Update the cache
      try {
        const cachedData = await AsyncStorage.getItem(CACHE_KEY_HAIRSTYLES);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          const updatedData = {
            ...parsedData,
            data: parsedData.data.map(h => 
              h.id === hairstyleId
                ? { ...h, localImagePath: localPath }
                : h
            )
          };
          
          await AsyncStorage.setItem(CACHE_KEY_HAIRSTYLES, JSON.stringify(updatedData));
        }
      } catch (e) {
        console.error('Error updating hairstyles cache:', e);
      }
    }
    
    return localPath;
  },
  
  downloadOutfitImage: async (outfitId) => {
    const { outfits, downloadImage } = get();
    const outfit = outfits.find(o => o.id === outfitId);
    
    if (!outfit || !outfit.image) {
      return null;
    }
    
    const localPath = await downloadImage(outfit.image, `outfit_${outfitId}`);
    
    if (localPath) {
      // Update the outfit with the local path
      set(state => ({
        outfits: state.outfits.map(o => 
          o.id === outfitId 
            ? { ...o, localImagePath: localPath }
            : o
        )
      }));
      
      // Update the cache
      try {
        const cachedData = await AsyncStorage.getItem(CACHE_KEY_OUTFITS);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          const updatedData = {
            ...parsedData,
            data: parsedData.data.map(o => 
              o.id === outfitId
                ? { ...o, localImagePath: localPath }
                : o
            )
          };
          
          await AsyncStorage.setItem(CACHE_KEY_OUTFITS, JSON.stringify(updatedData));
        }
      } catch (e) {
        console.error('Error updating outfits cache:', e);
      }
    }
    
    return localPath;
  },
  
  downloadCombinationImages: async (hairstyleId, outfitId) => {
    const { combinations, downloadImage } = get();
    
    // Add this debug logging
    console.log(`Looking for combination: hairstyle=${hairstyleId}, outfit=${outfitId}`);
    console.log('Available combinations:', combinations.map(c => 
      `${c.hairstyleId}+${c.outfitId}`).join(', '));
    
    const combination = combinations.find(c => 
      c.hairstyleId === hairstyleId && c.outfitId === outfitId
    );
    
    // Add this check
    if (!combination) {
      console.log(`No combination found for hairstyle=${hairstyleId}, outfit=${outfitId}`);
      return { combinedImage: null, faceImage: null };
    } else {
      console.log('Found combination:', combination);
    }
    
    // Download both images in parallel
    const [combinedLocalPath, faceLocalPath] = await Promise.all([
      downloadImage(combination.combinedImage, `combo_${hairstyleId}_${outfitId}`),
      downloadImage(combination.faceImage, `face_${hairstyleId}_${outfitId}`)
    ]);
    
    if (combinedLocalPath || faceLocalPath) {
      // Update the combination with the local paths
      set(state => ({
        combinations: state.combinations.map(c => 
          (c.hairstyleId === hairstyleId && c.outfitId === outfitId)
            ? { 
                ...c, 
                localCombinedImagePath: combinedLocalPath || c.localCombinedImagePath,
                localFaceImagePath: faceLocalPath || c.localFaceImagePath
              }
            : c
        )
      }));
      
      // Update the cache
      try {
        const cachedData = await AsyncStorage.getItem(CACHE_KEY_COMBOS);
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          const updatedData = {
            ...parsedData,
            data: parsedData.data.map(c => 
              (c.hairstyleId === hairstyleId && c.outfitId === outfitId)
                ? { 
                    ...c, 
                    localCombinedImagePath: combinedLocalPath || c.localCombinedImagePath,
                    localFaceImagePath: faceLocalPath || c.localFaceImagePath
                  }
                : c
            )
          };
          
          await AsyncStorage.setItem(CACHE_KEY_COMBOS, JSON.stringify(updatedData));
        }
      } catch (e) {
        console.error('Error updating combinations cache:', e);
      }
    }
    
    return { 
      combinedImage: combinedLocalPath, 
      faceImage: faceLocalPath
    };
  },
  
  updateUnlockedItems: (unlockResult) => {
    set(state => ({
      hairstyles: state.hairstyles.map(h => 
        unlockResult.hairstyles.includes(h.id)
          ? { ...h, locked: false, grayScale: false }
          : h
      ),
      outfits: state.outfits.map(o => 
        unlockResult.outfits.includes(o.id)
          ? { ...o, locked: false, grayScale: false }
          : o
      )
    }));
    
    // Update the caches
    Promise.all([
      (async () => {
        try {
          const cachedData = await AsyncStorage.getItem(CACHE_KEY_HAIRSTYLES);
          if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            const updatedData = {
              ...parsedData,
              data: parsedData.data.map(h => 
                unlockResult.hairstyles.includes(h.id)
                  ? { ...h, locked: false, grayScale: false }
                  : h
              )
            };
            await AsyncStorage.setItem(CACHE_KEY_HAIRSTYLES, JSON.stringify(updatedData));
          }
        } catch (e) {
          console.error('Error updating hairstyles cache after unlock:', e);
        }
      })(),
      
      (async () => {
        try {
          const cachedData = await AsyncStorage.getItem(CACHE_KEY_OUTFITS);
          if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            const updatedData = {
              ...parsedData,
              data: parsedData.data.map(o => 
                unlockResult.outfits.includes(o.id)
                  ? { ...o, locked: false, grayScale: false }
                  : o
              )
            };
            await AsyncStorage.setItem(CACHE_KEY_OUTFITS, JSON.stringify(updatedData));
          }
        } catch (e) {
          console.error('Error updating outfits cache after unlock:', e);
        }
      })()
    ]);
  }
}));