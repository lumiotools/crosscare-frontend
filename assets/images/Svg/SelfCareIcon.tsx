import * as React from "react";
import Svg, { Path } from "react-native-svg";
const SelfCareIcon = ({color, size}: {color: string, size: number}) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 25 25"
    fill="none"
    
  >
    <Path
      d="M6.5 2.5C9.19 2.5 11.524 4.017 12.697 6.241C13.874 4.583 15.81 3.5 18 3.5H21.5V6C21.5 9.59 18.59 12.5 15 12.5H13.5V13.5H18.5V20.5C18.5 21.605 17.605 22.5 16.5 22.5H8.5C7.395 22.5 6.5 21.605 6.5 20.5V13.5H11.5V11.5H9.5C5.634 11.5 2.5 8.366 2.5 4.5V2.5H6.5ZM16.5 15.5H8.5V20.5H16.5V15.5ZM19.5 5.5H18C15.515 5.5 13.5 7.515 13.5 10V10.5H15C17.485 10.5 19.5 8.485 19.5 6V5.5ZM6.5 4.5H4.5C4.5 7.261 6.739 9.5 9.5 9.5H11.5C11.5 6.739 9.261 4.5 6.5 4.5Z"
      fill={color}
    />
  </Svg>
);
export default SelfCareIcon;
