import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setToken } from "../store/userSlice";

const Index = () => {
  const dispatch = useDispatch();
  const user = useSelector((state: any) => state.user);
  console.log(user)
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadToken = async () => {
      const storedToken = await AsyncStorage.getItem("userToken");
      if (storedToken) {
        dispatch(setToken(storedToken));
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
