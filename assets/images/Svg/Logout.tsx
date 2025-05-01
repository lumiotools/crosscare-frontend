import * as React from "react";
import Svg, { Path, Polyline, Line } from "react-native-svg";
const Logout = (props:any) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#434343"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-log-out-icon lucide-log-out"
    {...props}
  >
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Polyline points="16 17 21 12 16 7" />
    <Line x1={21} x2={9} y1={12} y2={12} />
  </Svg>
);
export default Logout;
