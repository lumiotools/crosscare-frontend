import React from "react";
import Svg, { Circle, Path, G } from "react-native-svg";

interface DayNightIconProps {
  width?: number;
  height?: number;
}

const DayNight: React.FC<DayNightIconProps> = ({ 
  width = 200, 
  height = 200 
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 200">
      {/* White border circle */}
      <Circle
        cx="100"
        cy="100"
        r="98"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="4"
      />

      {/* Left half - Day */}
      <Path
        d="M100,2 A98,98 0 0,0 100,198 L100,2"
        fill="#FFB84C"
      />

      {/* Right half - Night */}
      <Path
        d="M100,2 A98,98 0 0,1 100,198 L100,2"
        fill="#547698"
      />

      {/* Sun Icon */}
      <G transform="translate(50, 100)">
        <Circle cx="0" cy="0" r="20" fill="#FFD700" />
        {/* Sun rays */}
        <Path
          d="M-5,-5 L5,5 M-5,5 L5,-5 M-7,0 L7,0 M0,-7 L0,7"
          stroke="#FFD700"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </G>

      {/* Moon and Stars */}
      <G transform="translate(150, 100)">
        {/* Moon */}
        <Path
          d="M-15,-10 
             C-5,-10 5,-5 5,0 
             C5,5 -5,10 -15,10 
             C-5,10 5,5 5,0 
             C5,-5 -5,-10 -15,-10"
          fill="#E6EBF0"
        />
        {/* Stars */}
        <Circle cx="-20" cy="-15" r="2" fill="#E6EBF0" />
        <Circle cx="0" cy="-12" r="2" fill="#E6EBF0" />
        <Circle cx="-10" cy="15" r="2" fill="#E6EBF0" />
      </G>
    </Svg>
  );
};

export default DayNight;