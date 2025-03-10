import * as React from "react";
import Svg, { Path } from "react-native-svg";
const WaterIcon = (props:any) => (
  <Svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5 2H19L17.3602 18.398C17.1557 20.4428 15.4351 22 13.38 22H10.62C8.56494 22 6.84428 20.4428 6.6398 18.398L5 2ZM8 12.5L7.20998 4H16.79L16 12.5H8Z"
      fill="#67B6FF"
    />
    <Path
      d="M17.0008 10.1865C17.0008 11.5672 15.2623 14.1866 12.5009 14.1866C9.73944 14.1866 8.00007 13.8807 8.00007 12.5C8.00007 11.1193 4.73916 9.5 7.50059 9.5C12.0009 11.5 17.5008 7.50005 17.0008 10.1865Z"
      fill="#67B6FF"
    />
  </Svg>
);
export default WaterIcon;
