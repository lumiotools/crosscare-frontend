"use client"

import type React from "react"
import { createContext, useContext, type ReactNode, useState, useCallback } from "react"
import { View, StyleSheet, TouchableOpacity } from "react-native"
import FloatingButton from "@/components/FloatingButton"
import AskDoula from "@/components/AskDoula"

interface FloatingContextType {
  handleButtonPress: () => void
  updatePosition: (position: { x: number; y: number }) => void
  closeModal: () => void
  isModalVisible: boolean
}

const FloatingContext = createContext<FloatingContextType | undefined>(undefined)

export const useFloating = () => {
  const context = useContext(FloatingContext)
  if (!context) {
    throw new Error("useFloating must be used within a FloatingProvider")
  }
  return context
}

interface FloatingProviderProps {
  children: ReactNode
}

export const FloatingProvider: React.FC<FloatingProviderProps> = ({ children }) => {
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 })
  const [isModalVisible, setIsModalVisible] = useState(false)

  // Function to open modal
  const handleButtonPress = useCallback(() => {
    console.log("Button pressed in context, opening modal")
    setIsModalVisible(true)
  }, [])

  // Function to close modal
  const closeModal = useCallback(() => {
    console.log("Closing modal")
    setIsModalVisible(false)
  }, [])

  const updatePosition = useCallback((position: { x: number; y: number }) => {
    setButtonPosition(position)
  }, [])

  return (
    <FloatingContext.Provider value={{ handleButtonPress, updatePosition, closeModal, isModalVisible }}>
      {children}

      {/* Custom Modal Implementation - Always rendered, conditionally visible */}
      {isModalVisible && (
        <View style={styles.absoluteFill}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeModal} />
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <AskDoula />
            </View>
          </View>
        </View>
      )}

      {/* The floating button - always visible on every screen */}
      <FloatingButton onPress={handleButtonPress} onPositionChange={updatePosition} />
    </FloatingContext.Provider>
  )
}

const styles = StyleSheet.create({
  absoluteFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9990,
    elevation: 9990,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 9991,
    elevation: 9991,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    zIndex: 9992,marginBottom: 40,
    elevation: 9992,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 30,
    width: "90%",
    height: "70%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 9993,
  }
})
