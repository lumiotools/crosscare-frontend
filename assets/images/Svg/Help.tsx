import * as React from "react";
import Svg, { Path } from "react-native-svg";
const Help = (props:any) => (
  <Svg
    width={40}
    height={40}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <Path
      d="M20 33.5C27.1797 33.5 33 27.6797 33 20.5C33 13.3203 27.1797 7.5 20 7.5C12.8203 7.5 7 13.3203 7 20.5C7 27.6797 12.8203 33.5 20 33.5Z"
      stroke="#AF4D93"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16.2168 16.6C16.5224 15.7311 17.1257 14.9985 17.9197 14.5318C18.7138 14.0652 19.6474 13.8946 20.5551 14.0503C21.4629 14.206 22.2863 14.6779 22.8794 15.3825C23.4725 16.0871 23.7972 16.9789 23.7958 17.9C23.7958 20.5 19.8958 21.8 19.8958 21.8"
      stroke="#AF4D93"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M20 27H20.013"
      stroke="#AF4D93"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
export default Help;
