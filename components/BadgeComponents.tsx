import HeartScribe from "@/assets/images/Svg/Badges/HeartScribe";
import Hydratedqueen from "@/assets/images/Svg/Badges/HydratedQueen";
import RestedDiva from "@/assets/images/Svg/Badges/RestedDiva";
import SleepWizard from "@/assets/images/Svg/Badges/SleepWizard";
import SnapShotQueen from "@/assets/images/Svg/Badges/SnapShotQueen";
import TriviaQueen from "@/assets/images/Svg/Badges/TriviaQueen";
import type React from "react"
import { View, Text, StyleSheet } from "react-native"


// Map badge types to SVG components
const BADGE_IMAGES: Record<string, React.FC<{ width?: number; height?: number; }>> = {
  TRIVIA_QUEEN: (props) => <TriviaQueen {...props} />,
  SNAPSHOT: (props) => <SnapShotQueen {...props} />,
  HYDRATED_QUEEN: (props) => <Hydratedqueen {...props} />,
  HEART_SCRIBE: (props) => <HeartScribe {...props}/>,
  RESTED_DIVA: (props) => <RestedDiva {...props} />,
//   EXPLORER: Explorer,
//   ON_THE_MOVE: OnTheMove,
//   HOT_MAMA: HotMama,
  SLEEP_WIZARD_I: (props) => <SleepWizard {...props} />,
//   SLEEP_WIZARD_II: (props) => <SleepWizard {...props} level={2} />,
//   SLEEP_WIZARD_III: (props) => <SleepWizard {...props} level={3} />,
//   SLEEP_WIZARD_IV: (props) => <SleepWizard {...props} level={4} />,
//   SLEEP_WIZARD_V: (props) => <SleepWizard {...props} level={5} />,
//   SLEEP_WIZARD_VI: (props) => <SleepWizard {...props} level={6} />,
//   SLEEP_WIZARD_VII: (props) => <SleepWizard {...props} level={7} />,
//   SLEEP_WIZARD_VIII: (props) => <SleepWizard {...props} level={8} />,
//   SLEEP_WIZARD_IX: (props) => <SleepWizard {...props} level={9} />,
//   WATER_WIZARD_I: (props) => <WaterWizard {...props} level={1} />,
//   WATER_WIZARD_II: (props) => <WaterWizard {...props} level={2} />,
//   WATER_WIZARD_III: (props) => <WaterWizard {...props} level={3} />,
//   WATER_WIZARD_IV: (props) => <WaterWizard {...props} level={4} />,
//   WATER_WIZARD_V: (props) => <WaterWizard {...props} level={5} />,
//   WATER_WIZARD_VI: (props) => <WaterWizard {...props} level={6} />,
//   WATER_WIZARD_VII: (props) => <WaterWizard {...props} level={7} />,
//   WATER_WIZARD_VIII: (props) => <WaterWizard {...props} level={8} />,
//   WATER_WIZARD_IX: (props) => <WaterWizard {...props} level={9} />,
//   HEALTH_QUEEN_I: (props) => <HealthQueen {...props} />,
//   HEALTH_QUEEN_II: (props) => <HealthQueen {...props} />,
//   HEALTH_QUEEN_III: (props) => <HealthQueen {...props} />,
//   HEALTH_QUEEN_IV: (props) => <HealthQueen {...props} />,
//   HEALTH_QUEEN_V: (props) => <HealthQueen {...props} />,
//   HEALTH_QUEEN_VI: (props) => <HealthQueen {...props} />,
//   HEALTH_QUEEN_VII: (props) => <HealthQueen {...props} />,
//   HEALTH_QUEEN_VIII: (props) => <HealthQueen {...props} />,
//   HEALTH_QUEEN_IX: (props) => <HealthQueen {...props} />,
//   ON_THE_MOVE_I: (props) => <OnTheMove {...props} />,
//   ON_THE_MOVE_II: (props) => <OnTheMove {...props} />,
//   ON_THE_MOVE_III: (props) => <OnTheMove {...props} />,
//   ON_THE_MOVE_IV: (props) => <OnTheMove {...props} />,
//   ON_THE_MOVE_V: (props) => <OnTheMove {...props} />,
//   ON_THE_MOVE_VI: (props) => <OnTheMove {...props} />,
//   ON_THE_MOVE_VII: (props) => <OnTheMove {...props} />,
//   ON_THE_MOVE_VIII: (props) => <OnTheMove {...props} />,
//   ON_THE_MOVE_IX: (props) => <OnTheMove {...props} />,
}

// Badge component that renders the appropriate SVG based on badge type
interface BadgeProps {
  type: string
  width?: number
  height?: number
}

export const Badge: React.FC<BadgeProps> = ({ type, width = 100, height = 100 }) => {
  const BadgeComponent = BADGE_IMAGES[type]

  if (!BadgeComponent) {
    return (
      <View style={[styles.placeholderBadge, { width, height }]}>
        <Text style={styles.placeholderText}>{type}</Text>
      </View>
    )
  }

  return <BadgeComponent width={width} height={height} />
}

const styles = StyleSheet.create({
  placeholderBadge: {
    backgroundColor: "#f0f0f0",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 10,
    textAlign: "center",
    padding: 5,
  },
})

export default BADGE_IMAGES
