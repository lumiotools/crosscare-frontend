import * as React from "react";
import Svg, { G, Ellipse, Defs } from "react-native-svg";
/* SVGR has dropped some elements not supported by react-native-svg: filter */
const Blur = (props:any) => (
  <Svg
    width={178}
    height={74}
    viewBox="0 0 178 74"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <G filter="url(#filter0_f_27_423)">
      <Ellipse cx={89} cy={37} rx={59} ry={7} fill="#FFB4EA" opacity={0.5}/>
    </G>
    <Defs></Defs>
  </Svg>
);
export default Blur;
