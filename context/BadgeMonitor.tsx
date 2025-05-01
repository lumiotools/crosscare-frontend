import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useBadge } from '@/context/BadgeContext';
import { checkForNewBadges } from './badgeService';

export const BadgeMonitor: React.FC = () => {
  const { showBadge } = useBadge();
  const user = useSelector((state: any) => state.user);
  const token = useSelector((state: any) => state.user.token);
  
  useEffect(() => {
    if (!user?.user_id || !token) {
      console.log("User or token not available, skipping badge check");
      return;
    }
    
    console.log("Setting up badge monitoring");
    
    // Check for badges immediately
    checkForNewBadges(user.user_id, token, showBadge);
    
    // Set up interval to check periodically
    const intervalId = setInterval(() => {
      checkForNewBadges(user.user_id, token, showBadge);
    }, 300000); // Check every 30 seconds
    
    return () => {
      clearInterval(intervalId);
      console.log("Badge monitoring stopped");
    };
  }, [user?.user_id, token, showBadge]);
  
  // This component doesn't render anything
  return null;
};