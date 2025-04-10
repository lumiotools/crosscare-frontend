import * as React from "react";
import Svg, { Path } from "react-native-svg";
const HeartIcon = (props:any) => (
  <Svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <Path
      d="M16.5 3C19.538 3 22 5.5 22 9C22 16 14.5 20 12 21.5C10.022 20.313 4.916 17.563 2.868 13H7.566L8.5 11.444L11.5 16.444L13.566 13H17V11H12.434L11.5 12.556L8.5 7.556L6.434 11H2.21C2.074 10.363 2 9.696 2 9C2 5.5 4.5 3 7.5 3C9.36 3 11 4 12 5C13 4 14.64 3 16.5 3Z"
      fill="#D53E4F"
    />
  </Svg>
);
export default HeartIcon;
