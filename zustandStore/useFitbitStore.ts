import { useState, useEffect } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';

// Ensure the browser can complete the auth session
WebBrowser.maybeCompleteAuthSession();

// Fitbit API configuration - replace with your values
const FITBIT_CLIENT_ID = "23QC62";
const FITBIT_CLIENT_SECRET = "8424a72f8e691b958ab909fd833e2b9f";
const FITBIT_AUTH_ENDPOINT = "https://www.fitbit.com/oauth2/authorize";
const FITBIT_TOKEN_ENDPOINT = "https://api.fitbit.com/oauth2/token";
const REDIRECT_URI = AuthSession.makeRedirectUri({
  native: "com.crosscare.tech://auth"
});

export function useFitbit() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if we're already connected on mount
  useEffect(() => {
    checkConnection();
  }, []);
  
  // Check if we have a valid token
  const checkConnection = async () => {
    try {
      const token = await AsyncStorage.getItem('fitbitAccessToken');
      setIsConnected(!!token);
      return !!token;
    } catch (error) {
      console.error('Error checking connection:', error);
      setIsConnected(false);
      return false;
    }
  };
  
  // Connect to Fitbit
  const connect = async () => {
    try {
      setIsLoading(true);
      
      // Create auth request
      const request = new AuthSession.AuthRequest({
        clientId: FITBIT_CLIENT_ID,
        scopes: ['activity', 'heartrate', 'weight', 'profile', 'settings', 'sleep'],
        redirectUri: REDIRECT_URI,
        responseType: AuthSession.ResponseType.Code,
        usePKCE: false // Simplify by not using PKCE
      });
      
      // Start auth flow
      const result = await request.promptAsync({
        authorizationEndpoint: FITBIT_AUTH_ENDPOINT
      });
      
      console.log("Auth result:", result);
      
      if (result.type === 'success' && result.params.code) {
        // Exchange code for token
        const tokenResult = await exchangeCodeForToken(result.params.code);
        await checkConnection();
        setIsLoading(false);
        return tokenResult;
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Error connecting to Fitbit:', error);
      setIsLoading(false);
      return false;
    }
  };
  
  // Exchange authorization code for token
  const exchangeCodeForToken = async (code: string) => {
    try {
      const tokenResponse = await fetch(FITBIT_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI
        }).toString()
      });
      
      const tokenData = await tokenResponse.json();
      console.log("Token data:", tokenData);
      
      if (tokenData.access_token) {
        await AsyncStorage.setItem('fitbitAccessToken', tokenData.access_token);
        if (tokenData.refresh_token) {
          await AsyncStorage.setItem('fitbitRefreshToken', tokenData.refresh_token);
        }
        if (tokenData.expires_in) {
          const expiryTime = Date.now() + (tokenData.expires_in * 1000);
          await AsyncStorage.setItem('fitbitTokenExpiry', expiryTime.toString());
        }
        
        setIsConnected(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      return false;
    }
  };
  
  // Disconnect from Fitbit
  const disconnect = async () => {
    await AsyncStorage.removeItem('fitbitAccessToken');
    await AsyncStorage.removeItem('fitbitRefreshToken');
    await AsyncStorage.removeItem('fitbitTokenExpiry');
    setIsConnected(false);
  };
  
  // Get Fitbit data
  const getFitbitData = async (endpoint: string) => {
    try {
      const token = await AsyncStorage.getItem('fitbitAccessToken');
      if (!token) return null;
      
      const response = await fetch(`https://api.fitbit.com/${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Raw Fitbit data:", JSON.stringify(data));
        return data;
      }
      
      
      // If unauthorized, token might be expired
      if (response.status === 401) {
        const refreshed = await refreshToken();
        if (refreshed) {
          // Try again with new token
          return await getFitbitData(endpoint);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching Fitbit data:', error);
      return null;
    }
  };
  
  // Refresh token
  const refreshToken = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('fitbitRefreshToken');
      if (!refreshToken) return false;
      
      const response = await fetch(FITBIT_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`).toString('base64')}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }).toString()
      });
      
      const data = await response.json();
      
      if (data.access_token) {
        await AsyncStorage.setItem('fitbitAccessToken', data.access_token);
        if (data.refresh_token) {
          await AsyncStorage.setItem('fitbitRefreshToken', data.refresh_token);
        }
        if (data.expires_in) {
          const expiryTime = Date.now() + (data.expires_in * 1000);
          await AsyncStorage.setItem('fitbitTokenExpiry', expiryTime.toString());
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  };
  
  // Get heart rate data
  const getHeartRateData = async (dateStr: string) => {
    // Default to today if no date specified
    const date = dateStr || new Date().toISOString().split('T')[0];
    return getFitbitData(`1/user/-/activities/heart/date/${date}/1d.json`);
  };
  
  // Get steps data
  const getStepsData = async (dateStr: string) => {
    // Default to today if no date specified
    const date = dateStr || new Date().toISOString().split('T')[0];
    return getFitbitData(`1/user/-/activities/steps/date/${date}/1d.json`);
  };
  
  // Get data for a date range
  const getDataForRange = async (endpoint: string, startDate: string, endDate: string) => {
    return getFitbitData(`1/user/-/${endpoint}/date/${startDate}/${endDate}.json`);
  };
  
  return {
    isConnected,
    isLoading,
    connect,
    disconnect,
    getHeartRateData,
    getStepsData,
    getDataForRange
  };
}