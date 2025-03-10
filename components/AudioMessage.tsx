// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   TouchableOpacity,
//   StyleSheet,
//   ActivityIndicator,
//   Text,
// } from 'react-native';
// import { Audio } from 'expo-av';
// import { Feather } from '@expo/vector-icons';

// interface AudioMessageProps {
//   audioUri: string;
//   isUser: boolean;
// }

// export default function AudioMessage({ audioUri, isUser }: AudioMessageProps) {
//   const [sound, setSound] = useState<Audio.Sound | null>(null);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [duration, setDuration] = useState(0);
//   const [position, setPosition] = useState(0);

//   useEffect(() => {
//     return () => {
//       if (sound) {
//         sound.unloadAsync();
//       }
//     };
//   }, [sound]);

//   const formatTime = (seconds: number) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = Math.floor(seconds % 60);
//     return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
//   };

//   const loadAudio = async () => {
//     try {
//       setIsLoading(true)
//       const { sound: audioSound } = await Audio.Sound.createAsync(
//         { uri: audioUri },
//         { shouldPlay: false },
//         onPlaybackStatusUpdate,
//       )
//       setSound(audioSound)
//       setIsLoading(false)
//     } catch (error) {
//       console.error("Error loading audio:", error)
//       setIsLoading(false)
//     }
//   }

//   const onPlaybackStatusUpdate = (status: any) => {
//     if (status.isLoaded) {
//       setDuration(status.durationMillis / 1000)
//       setPosition(status.positionMillis / 1000)
//       setIsPlaying(status.isPlaying)

//       if (status.didJustFinish) {
//         setIsPlaying(false)
//         setPosition(0)

//         // Reset the sound position to the beginning when finished
//         if (sound) {
//           sound.setPositionAsync(0).catch((error) => console.error("Error resetting position:", error))
//         }
//       }
//     }
//   }

//   const handlePlayPause = async () => {
//     try {
//       if (!sound) {
//         await loadAudio()
//         return
//       }

//       if (isPlaying) {
//         await sound.pauseAsync()
//       } else {
//         // If we're at or near the end, start from the beginning
//         if (position >= duration - 0.5) {
//           await sound.setPositionAsync(0)
//           setPosition(0)
//         }
//         await sound.playFromPositionAsync(position * 1000)
//       }
//     } catch (error) {
//       console.error("Error playing/pausing audio:", error)
//     }
//   }

//   return (
//     <View
//       style={[
//         styles.container,
//         isUser ? styles.userContainer : styles.doulaContainer,
//       ]}
//     >
//       {isLoading ? (
//         <ActivityIndicator color={isUser ? '#E162BC' : '#E162BC'} />
//       ) : (
//         <TouchableOpacity
//           style={[
//             styles.playButton,
//             isUser ? styles.userPlayButton : styles.doulaPlayButton,
//           ]}
//           onPress={handlePlayPause}
//         >
//           <Feather
//             name={isPlaying ? 'pause' : 'play'}
//             size={20}
//             color={isUser ? '#E162BC' : '#E162BC'}
//           />
//         </TouchableOpacity>
//       )}
//       <View style={styles.audioInfo}>
//         <View
//           style={[
//             styles.progressBar,
//             {
//               backgroundColor: isUser ? 'rgba(251, 187, 233, 0.3)' : 'rgba(251, 187, 233, 0.3)',
//             },
//           ]}
//         >
//           <View
//             style={[
//               styles.progress,
//               {
//                 width: `${(position / (duration || 1)) * 100}%`,
//                 backgroundColor: isUser ? '#FBBBE9' : '#FBBBE9',
//               },
//             ]}
//           />
//         </View>
//         <Text style={[styles.timeText, isUser ? styles.userTimeText : styles.doulaTimeText]}>
//           {formatTime(position)} / {formatTime(duration)}
//         </Text>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 12,
//     borderRadius: 20,
//     maxWidth: '75%',
//   },
//   userContainer: {
//     backgroundColor: '#FEF0FA',
//     borderBottomRightRadius: 4,
//     borderWidth: 1,
//     borderColor: '#FBBBE9',
//     marginRight: 8,
//   },
//   doulaContainer: {
//     backgroundColor: '#FFF',
//     borderTopLeftRadius: 4,
//     borderWidth: 0.5,
//     borderColor: '#E5E5E5',
//     marginLeft: 8,
//   },
//   playButton: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 8,
//   },
//   userPlayButton: {
//     backgroundColor: 'rgba(251, 187, 233, 0.2)',
//   },
//   doulaPlayButton: {
//     backgroundColor: 'rgba(251, 187, 233, 0.1)',
//   },
//   audioInfo: {
//     flex: 1,
//   },
//   progressBar: {
//     height: 4,
//     borderRadius: 2,
//     overflow: 'hidden',
//     marginBottom: 4,
//   },
//   progress: {
//     height: '100%',
//   },
//   timeText: {
//     fontSize: 12,
//     fontFamily: 'Inter400',
//   },
//   userTimeText: {
//     color: '#E162BC',
//   },
//   doulaTimeText: {
//     color: '#434343',
//   },
// });




import type React from "react"
import { useState } from "react"
import { View, StyleSheet, TouchableOpacity, Text } from "react-native"
import { Audio } from "expo-av"
import { Ionicons } from "@expo/vector-icons"

interface AudioMessageProps {
  audioUri: string
  isUser: boolean
  transcript?: string // Optional transcript to display
}

const AudioMessage: React.FC<AudioMessageProps> = ({ audioUri, isUser, transcript }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [sound, setSound] = useState<Audio.Sound | null>(null)

  const playSound = async () => {
    try {
      if (sound) {
        await sound.unloadAsync()
      }

      const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUri }, { shouldPlay: true })
      setSound(newSound)
      setIsPlaying(true)

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false)
        }
      })

      await newSound.playAsync()
    } catch (error) {
      console.error("Failed to play sound:", error)
    }
  }

  const stopSound = async () => {
    if (sound) {
      await sound.stopAsync()
      setIsPlaying(false)
    }
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      stopSound()
    } else {
      playSound()
    }
  }

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.doulaContainer]}>
      <TouchableOpacity onPress={handlePlayPause}>
        <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={30} color={isUser ? "#E162BC" : "#434343"} />
      </TouchableOpacity>
      <Text style={styles.audioText}>{isPlaying ? "Playing..." : "Audio Message"}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 20,
  },
  userContainer: {
    backgroundColor: "#FEF0FA",
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: "#FBBBE9",
    marginRight: 8,
  },
  doulaContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 4,
    borderWidth: 0.5,
    borderColor: "#E5E5E5",
    marginLeft: 8,
  },
  audioText: {
    fontSize: 14,
    lineHeight: 22,
    marginLeft:8,
    color: "#E162BC",
    fontFamily: "Inter400",
  },
})

export default AudioMessage

