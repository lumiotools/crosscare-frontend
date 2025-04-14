import type React from "react"
import { createContext, useContext, type ReactNode, useState, useCallback, useEffect } from "react"
import { View, StyleSheet, TouchableOpacity } from "react-native"
import FloatingButton from "@/components/FloatingButton"
import AskDoula from "@/components/AskDoula"
import { usePathname } from "expo-router"

interface FloatingContextType {
  handleButtonPress: () => void
  updatePosition: (position: { x: number; y: number }) => void
  closeModal: () => void
  isModalVisible: boolean
  showMessage: (message?: string) => void
  hideMessage: () => void
}

const EXCLUDED_ROUTES = ["/login", "/signup", "/forget-password"]

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
  autoShowMessage?: boolean
  messageDelay?: number
  initialMessage?: string
}

export const FloatingProvider: React.FC<FloatingProviderProps> = ({
  children,
  autoShowMessage = true,
  messageDelay = 5000,
  initialMessage = "Hey, do you have a minute?",
}) => {
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 })
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [showMessageBubble, setShowMessageBubble] = useState(false)
  const [currentMessage, setCurrentMessage] = useState(initialMessage)

  const pathname = usePathname()

  const shouldShowButton = !EXCLUDED_ROUTES.some((route) => pathname?.includes(route))

  // Function to open modal
  const handleButtonPress = useCallback(() => {
    console.log("Button pressed in context, opening modal")
    setIsModalVisible(true)
    // Hide message when modal is opened
    setShowMessageBubble(false)
  }, [])

  // Function to close modal
  const closeModal = useCallback(() => {
    console.log("Closing modal")
    setIsModalVisible(false)
  }, [])

  const updatePosition = useCallback((position: { x: number; y: number }) => {
    setButtonPosition(position)
  }, [])

  // Function to show message
  const showMessage = useCallback((message?: string) => {
    if (message) {
      setCurrentMessage(message)
    }
    setShowMessageBubble(true)
  }, [])

  // Function to hide message
  const hideMessage = useCallback(() => {
    setShowMessageBubble(false)
  }, [])

  // Auto show message after delay if enabled
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (autoShowMessage && shouldShowButton) {
      timer = setTimeout(() => {
        showMessage()
      }, messageDelay)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [autoShowMessage, messageDelay, showMessage, shouldShowButton])

  return (
    <FloatingContext.Provider
      value={{
        handleButtonPress,
        updatePosition,
        closeModal,
        isModalVisible,
        showMessage,
        hideMessage,
      }}
    >
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

      {/* The floating button with message bubble - always visible on every screen */}
      {shouldShowButton && (
        <FloatingButton
          onPress={handleButtonPress}
          onPositionChange={updatePosition}
          showMessage={showMessageBubble}
          message={currentMessage}
          onMessageDismiss={hideMessage}
        />
      )}
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
    zIndex: 9992,
    marginBottom: 40,
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
  },
})
