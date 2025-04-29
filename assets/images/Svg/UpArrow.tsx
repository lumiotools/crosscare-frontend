import * as React from "react";
import Svg, { Path } from "react-native-svg";
const UpArrow = (props:any) => (
  <Svg
    width={23}
    height={9}
    viewBox="0 0 23 9"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <Path
      opacity={0.4}
      d="M21.5 7.71875L12.0145 2.02745C11.6978 1.83744 11.3022 1.83744 10.9855 2.02745L1.5 7.71875"
      stroke="#7B7B7B"
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);
export default UpArrow;
