import React from 'react';
import {Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useRoute} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import HomeScreen from '../screens/HomeScreen';
import ServicesScreen from '../screens/ServicesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import UserProfile from '../screens/UserProfile';

const Tab = createBottomTabNavigator();

const BottomNavigator = () => {
  const route = useRoute();
  const {user} = route.params; // ✅ receive user from previous screen
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === 'ios';
  const TAB_HEIGHT = 80;
  const SIDE_MARGIN = 16;
  const bottomSpace = Math.max(
    isIOS ? 20 : 12,
    insets.bottom + (isIOS ? 8 : 4),
  );
  const paddingBottom =
    (insets.bottom > 0 ? Math.ceil(insets.bottom * 0.5) : 0) + (isIOS ? 6 : 4);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#4B5563',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          bottom: bottomSpace,
          left: SIDE_MARGIN,
          right: SIDE_MARGIN,
          height: TAB_HEIGHT,
          borderRadius: 24,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#D1D5DB',
          overflow: 'visible',
          paddingBottom,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 8,
        },
        tabBarLabelPosition: 'below-icon',
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '600',
          marginBottom: 4,
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        initialParams={{user}} // ✅ pass user
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({color, size}) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Services"
        component={ServicesScreen}
        initialParams={{user}} // ✅ pass user
        options={{
          tabBarLabel: 'Services',
          tabBarIcon: ({color, size}) => (
            <SimpleLineIcons name="social-dropbox" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        initialParams={{user}}
        options={{
          tabBarLabel: 'Notifications',
          tabBarIcon: ({color, size}) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="UserProfile"
        component={UserProfile}
        initialParams={{user}}
        options={{
          tabBarLabel: 'User Profile',
          tabBarIcon: ({color, size}) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomNavigator;
