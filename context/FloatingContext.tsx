import React, { createContext, useContext, ReactNode, useState, useCallback } from "react";
import FloatingButton from "@/components/FloatingButton";
import { useRouter } from "expo-router";

interface FloatingContextType {
  handleButtonPress: () => void;
  updatePosition: (position: { x: number, y: number }) => void;
}

const FloatingContext = createContext<FloatingContextType | undefined>(undefined);

export const useFloating = () => {
  const context = useContext(FloatingContext);
  if (!context) {
    throw new Error("useFloating must be used within a FloatingProvider");
  }
  return context;
};

interface FloatingProviderProps {
  children: ReactNode;
}

export const FloatingProvider: React.FC<FloatingProviderProps> = ({ children }) => {
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const router = useRouter();

  // Use useCallback to prevent unnecessary re-renders
  const handleButtonPress = useCallback(() => {
    try {
      // Navigate to home page or perform any other action
      router.push('/patient/askdoula');
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [router]);

  const updatePosition = useCallback((position: { x: number, y: number }) => {
    setButtonPosition(position);
  }, []);

  return (
    <FloatingContext.Provider value={{ handleButtonPress, updatePosition }}>
      {children}
      <FloatingButton 
        onPress={handleButtonPress} 
        onPositionChange={updatePosition}
      />
    </FloatingContext.Provider>
  );
};