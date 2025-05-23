import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { removeToken, setToken } from "../store/userSlice";
import {jwtDecode} from "jwt-decode";

const Index = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.user);
  console.log(user)
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      const storedToken = await AsyncStorage.getItem("userToken");
      if (storedToken) {
        try {
          const decoded: any = jwtDecode(storedToken);

          // Check if the token is expired
          console.log(decoded.exp);
          if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            await AsyncStorage.removeItem("userToken");
            dispatch(removeToken());
          } else {
            dispatch(setToken(storedToken));
          }
        } catch (error) {
          console.log("Invalid token");
          await AsyncStorage.removeItem("userToken");
          dispatch(removeToken());
        }
      }
      setIsLoading(false);
    };

    loadToken();
  }, [dispatch]);

  if (isLoading) return null; // Prevent rendering until token is checked
  

  return (
  <Redirect href={user?.token ? "/patient/(tabs)/home" : "/login"} />
  // <Redirect href={'/avatar'}/>
);
};

export default Index;
