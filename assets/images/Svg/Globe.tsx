import * as React from "react";
import Svg, { Path } from "react-native-svg";
const Globe = (props:any) => (
  <Svg
    width={40}
    height={41}
    viewBox="0 0 40 41"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <Path
      d="M20 32.5C26.6274 32.5 32 27.1274 32 20.5C32 13.8726 26.6274 8.5 20 8.5C13.3726 8.5 8 13.8726 8 20.5C8 27.1274 13.3726 32.5 20 32.5Z"
      stroke="#F66DCE"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19.9973 8.5C16.9159 11.7354 15.1973 16.0321 15.1973 20.5C15.1973 24.9679 16.9159 29.2646 19.9973 32.5C23.0786 29.2646 24.7973 24.9679 24.7973 20.5C24.7973 16.0321 23.0786 11.7354 19.9973 8.5Z"
      stroke="#F66DCE"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 20.4998H32"
      stroke="#F66DCE"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export default Globe;
