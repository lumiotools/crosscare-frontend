import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
  Image,
  ScrollView,
  Alert,
  Keyboard,
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useDispatch, useSelector } from "react-redux";
import { StatusBar } from "react-native";
import { TextInput } from "react-native";
import * as Notifications from "expo-notifications";
import { requestNotificationPermissions } from "../../../utils/NotificationManager";
import { router } from "expo-router";
import { removeToken, setToken, setUser } from "@/store/userSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Person from "@/assets/images/Svg/Person";
import PregrantWomen from "@/assets/images/Svg/PregrantsWomen";
import AvatarIcon from "@/assets/images/Svg/AvatarIcon";
import Badge from "@/assets/images/Svg/Badge";
import Globe from "@/assets/images/Svg/Globe";
import Notification from "@/assets/images/Svg/Notification";
import Help from "@/assets/images/Svg/Help";
import Terms from "@/assets/images/Svg/Terms";
import Logout from "@/assets/images/Svg/Logout";
import { width, height } from '../../../constants/helper';
import { useTranslation } from "react-i18next";

const Profile = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [profile, setProfile] = useState();
  const user = useSelector((state: any) => state.user);
  const [name, setName] = useState(user?.user_name);
  const [age, setAge] = useState(0);
  const [email, setEmail] = useState(user?.user_email);
  const [pregnancyWeek, setPregnancyWeek] = useState(0);
  const [permissionStatus, setPermissionStatus] =
    useState<Notifications.PermissionStatus | null>(null);
  const token = useSelector((state: any) => state.user.token);
  console.log("token", token);
  console.log("userData1", user);
  const dispatch = useDispatch();
  const {t } = useTranslation();

  // State for edit modes

  const getProfile = async () => {
    const response = await fetch(
      `https://crosscare-backends.onrender.com/api/user/${user?.user_id}/profile`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    console.log("Profile data:", data.name);
    setAge(data.age || 0);
    setName(data.name || "");
    setEmail(data.email || "");
    setPregnancyWeek(data.week || 0);

    // Extract and log question responses
    setProfile(data);
  };

  useEffect(() => {
    if (user?.user_id) {
      getProfile();
    }
  }, [user?.user_id]);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        setPermissionStatus(status);
        setNotificationsEnabled(status === "granted");
      } catch (error) {
        console.error("Error checking notification permissions:", error);
      }
    };

    checkPermissions();
  }, []);

  const logout = async () => {
    Alert.alert(
      t('profile.confirmLogout'),
      t('profile.logoutMessage'),
      [
        {
          text: t('profile.no'),
          onPress: () => console.log("Logout Cancelled"),
          style: "cancel"
        },
        {
          text: t('profile.logoutSuccess'),
          onPress: async () => {
            await AsyncStorage.removeItem("userToken");
            await AsyncStorage.removeItem("user");
            await AsyncStorage.removeItem('explorerBadgeAwarded');
            setToken(null);
            setUser(null);
            dispatch(removeToken());
            // await AsyncStorage.removeItem('health');
            // await AsyncStorage.removeItem('journal');
            // await AsyncStorage.removeItem('self-care');
            // await AsyncStorage.removeItem('heart_2');
            // await AsyncStorage.removeItem('meal_1');
            // await AsyncStorage.removeItem('medication_3');
            // const weightVisited = await AsyncStorage.getItem('weight_4');
            // const waterVisited = await AsyncStorage.getItem('water_5');
            // const stepVisited = await AsyncStorage.getItem('step_6');
            // const sleepVisited = await AsyncStorage.getItem('sleep_7');
            router.replace("/login");
          }
        }
      ],
      { cancelable: false } // Makes the alert non-dismissible unless they confirm or cancel
    );
  };

  const MenuItem = ({
    icon,
    title,
    subtitle,
    onPress,
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onPress: () => void;
  }) => {
    return (
      <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={styles.iconContainer}>{icon}</View>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuTitle}>{title}</Text>
          <Text style={styles.menuSubtitle} numberOfLines={1}>{subtitle}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={"white"} />
      <View style={styles.header}>
        <View
          style={{
            width: 20,
          }}
        />
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        <TouchableOpacity onPress={logout}>
          <Logout width={20} height={20}/>
        </TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <MenuItem
            icon={<Person />}
            title={t('profile.account')}
            subtitle={`${t('profile.name')}, ${t('profile.age')}, ${t('profile.email')}`}
            onPress={()=>router.push('/patient/profile-setting/name')}
          />
          <MenuItem
            icon={<PregrantWomen />}
            title={t('profile.yourpregnancy')}
            subtitle={`${t('profile.weekofpregnancy')}, ${t('profile.progresstracking')}`}
            onPress={() =>router.push('/patient/profile-setting/pregrancy')}
          />
          <MenuItem
            icon={<AvatarIcon/>}
            title={t('profile.customizeyourdoula')}
            subtitle={`${t('profile.voicetone')}, ${t('profile.hair')}, ${t('profile.dress')}, ${t('profile.language')}, ${t('profile.skintone')}`}
            onPress={() =>router.push('/avatar')}
          />
          <MenuItem
            icon={<Badge/>}
            title={t('profile.halloffame')}
            subtitle={`${t('profile.earnbadge')}, ${t('profile.rewards')}`}
            onPress={() => router.push('/patient/profile-setting/earnbadge')}
          />
          <MenuItem
            icon={<Globe/>}
            title={t('profile.language')}
            subtitle={`${t('profile.changedoulalanguage')}`}
            onPress={() => router.push('/patient/profile-setting/language')}
          />

          <MenuItem
            icon={<Notification/>}
            title={t('profile.notifications')}
            subtitle={`${t('profile.messages')}, ${t('profile.alerts')}`}
            onPress={() => router.push('/patient/profile-setting/notification')}
          />

          <MenuItem
            icon={<Help/>}
            title={`${t('profile.help')}`}
            subtitle={`${t('profile.helpcenter')}, ${t('profile.support')}, ${t('profile.contactus')}`}
            onPress={() => router.push('/patient/profile-setting/help')}
          />

          <MenuItem
            icon={<Terms/>}
            title={`${t('profile.tnc')}`}
            subtitle={`${t('profile.privacy')}, ${t('profile.Termsofuse')}`}
            onPress={() => router.push('/patient/profile-setting/tnc')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "DMSans600",
    color: "#373737",
  },
  content: {
    paddingHorizontal: 20,
    // paddingTop: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    // borderBottomWidth: 1,
    // borderBottomColor: "#F0F0F0",
  },
  iconContainer: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontFamily:'DMSans600',
    color: "#F66DCE", // Magenta/purple color from the image
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    fontFamily:'DMSans500',
    color: "#7B7B7B",
  },
  fieldContainer: {
    backgroundColor: "rgba(229, 229, 229, 0.20)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  fieldContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    color: "#7B7B7B",
    fontFamily: "DMSans500",
  },
  editActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    padding: 4,
  },
  separator: {
    height: 1,
    backgroundColor: "#7B7B7B29",
    marginBottom: 12,
  },
  fieldInput: {
    fontSize: 16,
    color: "#373737",
    fontFamily: "DMSans600",
    padding: 0,
  },
  fieldValue: {
    fontSize: 16,
    color: "#373737",
    fontFamily: "DMSans600",
  },
  avatarContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(229, 229, 229, 0.20)",
    alignItems: "center",
    height: 53,
    marginBottom: 24,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  avatarText: {
    fontSize: 16,
    color: "#333",
    fontFamily: "DMSans600",
  },
  avatarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 25,
  },
  ageInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ageInput: {
    fontSize: 16,
    color: "#373737",
    fontFamily: "DMSans600",
    padding: 0,
    // minWidth: 30,
  },
  notificationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(229, 229, 229, 0.20)",
    borderRadius: 12,
    height: 53,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  notificationText: {
    fontSize: 15,
    color: "#333",
    fontFamily: "DMSans600",
  },
  termsContainer: {
    backgroundColor: "rgba(229, 229, 229, 0.20)",
    height: 53,
    marginBottom: 20,
    justifyContent: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  termsText: {
    fontSize: 16,
    color: "#E162BC",
    fontFamily: "DMSans600",
  },
});
