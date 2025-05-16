import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

// Replace these with your actual Supabase URL and Anon Key from your Supabase dashboard
const SUPABASE_URL = 'https://jgpjbgkjttaztoaztxht.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || undefined;

// Create a Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY!, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Initialize session restoration and token refresh
const initializeAuth = async () => {
  try {
    // Wait for the session to be fully retrieved
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session retrieval error:', error);
      return;
    }
    
    if (session) {
      console.log('Session restored:', session.user.id);
      // Ensure we have valid access token
      if (session.access_token) {
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token!,
        });
        supabase.auth.startAutoRefresh();
      } else {
        console.warn('Session exists but no access token found');
      }
    } else {
      console.log('No session found');
    }
  } catch (error) {
    console.error('Error initializing auth:', error);
  }
};

// Make initialization function return a promise
export const initSupabase = async () => {
  await initializeAuth();
  return supabase;
};

// // Handle app state changes
// AppState.addEventListener('change', (state) => {
//   if (state === 'active') {
//     console.log('App has come to the foreground, refreshing session...');
//     supabase.auth.refreshSession();
//     supabase.auth.startAutoRefresh();
//   } else if (state === 'background' || state === 'inactive') {
//     console.log('App went into background');
//     supabase.auth.stopAutoRefresh();
//   }
// });
