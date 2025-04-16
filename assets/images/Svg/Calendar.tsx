import * as React from "react";
import Svg, { G, Path, Defs, ClipPath, Rect } from "react-native-svg";
const Calendar = (props:any) => (
  <Svg
    width={15}
    height={15}
    viewBox="0 0 15 15"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <G clipPath="url(#clip0_1070_3774)">
      <Path
        d="M11.5833 2.36023H3.41667C2.77233 2.36023 2.25 2.88256 2.25 3.5269V11.6936C2.25 12.3379 2.77233 12.8602 3.41667 12.8602H11.5833C12.2277 12.8602 12.75 12.3379 12.75 11.6936V3.5269C12.75 2.88256 12.2277 2.36023 11.5833 2.36023Z"
        stroke="#A855F7"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.83331 1.19348V3.52681"
        stroke="#A855F7"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2.25 5.86023H12.75"
        stroke="#A855F7"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5.16669 1.19348V3.52681"
        stroke="#A855F7"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.4167 8.19348H6.91669"
        stroke="#A855F7"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.08331 10.5269H4.58331"
        stroke="#A855F7"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4.58331 8.19348H4.58915"
        stroke="#A855F7"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.4167 10.5269H10.4225"
        stroke="#A855F7"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_1070_3774">
        <Rect
          width={14}
          height={14}
          fill="white"
          transform="translate(0.5 0.0268555)"
        />
      </ClipPath>
    </Defs>
  </Svg>
);
export default Calendar;
