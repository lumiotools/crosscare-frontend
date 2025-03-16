//

import React from "react"
import { TouchableOpacity, StyleSheet, View, Text, TextInput } from "react-native"
import { Ionicons } from "@expo/vector-icons"

interface ColorPickerProps {
  selectedColor: string
  onColorChange: (color: string) => void
}

// Organized color palettes with labels
const COLOR_PALETTES = [
  {
    name: "Skin Tones",
    colors: [
      "#FFDBB4",
      "#EDB98A",
      "#D08B5B",
      "#AE5D29",
      "#614335",
      "#F8D25C",
      "#FFDBAC",
      "#F1C27D",
      "#E0AC69",
      "#C68642",
      "#8D5524",
      "#5C3836",
    ],
  },
  {
    name: "Hair Colors",
    colors: [
      "#000000",
      "#4A312C",
      "#8D4A43",
      "#D2691E",
      "#B87333",
      "#F4C2C2",
      "#FFDB58",
      "#C19A6B",
      "#E6BE8A",
      "#FFFFFF",
      "#808080",
      "#A52A2A",
    ],
  },
  {
    name: "Vibrant Colors",
    colors: [
      "#3C4F5C",
      "#1E90FF",
      "#FF6347",
      "#32CD32",
      "#9370DB",
      "#FF69B4",
      "#FFD700",
      "#8B4513",
      "#FF4500",
      "#2E8B57",
      "#4682B4",
      "#DC143C",
    ],
  },
  {
    name: "Pastels",
    colors: [
      "#FFAD08",
      "#EDD75A",
      "#73B06F",
      "#0C8F8F",
      "#405059",
      "#CD5554",
      "#FD7F20",
      "#FC2E20",
      "#8ED2C9",
      "#00A0D1",
      "#3E5641",
      "#A12568",
    ],
  },
]

const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onColorChange }) => {
  const [expandedPalette, setExpandedPalette] = React.useState<string | null>("Skin Tones")
  const [customColor, setCustomColor] = React.useState("")

  const togglePalette = (paletteName: string) => {
    setExpandedPalette(expandedPalette === paletteName ? null : paletteName)
  }

  const handleCustomColorChange = (text: string) => {
    setCustomColor(text)
    if (text.startsWith("#") && (text.length === 7 || text.length === 4)) {
      onColorChange(text)
    }
  }

  return (
    <View style={styles.container}>
      {COLOR_PALETTES.map((palette) => (
        <View key={palette.name} style={styles.paletteContainer}>
          <TouchableOpacity style={styles.paletteHeader} onPress={() => togglePalette(palette.name)}>
            <Text style={styles.paletteName}>{palette.name}</Text>
            <Ionicons name={expandedPalette === palette.name ? "chevron-up" : "chevron-down"} size={20} color="#555" />
          </TouchableOpacity>

          {expandedPalette === palette.name && (
            <View style={styles.colorsGrid}>
              {palette.colors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColor,
                  ]}
                  onPress={() => onColorChange(color)}
                />
              ))}
            </View>
          )}
        </View>
      ))}

      <View style={styles.customColorContainer}>
        <Text style={styles.paletteName}>Custom Color</Text>
        <View style={styles.customColorInputContainer}>
          <TextInput
            style={styles.customColorInput}
            value={customColor}
            onChangeText={handleCustomColorChange}
            placeholder="#RRGGBB"
            maxLength={7}
          />
          {customColor.startsWith("#") && (customColor.length === 7 || customColor.length === 4) && (
            <View style={[styles.customColorPreview, { backgroundColor: customColor }]} />
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  paletteContainer: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  paletteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f0f0f0",
  },
  paletteName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
  },
  colorsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 6,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  customColorContainer: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  customColorInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  customColorInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    marginRight: 10,
  },
  customColorPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
})

export default ColorPicker

