import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {BottomNavigation, Provider as PaperProvider} from 'react-native-paper';

// Import screens (we'll create these files later)
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import LocationScreen from '../screens/LocationScreen';
import OTPInputScreen from '../screens/OTPInputScreen';
import NewPasswordScreen from '../screens/NewPasswordScreen';
import FeedbackScreen from '../screens/FeedbackScreen';
import SplashScreen from '../screens/SplashScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import BottomNavigator from './BottomNavigator';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Splash"
            component={SplashScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Location"
            component={LocationScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="OTPInputScreen"
            component={OTPInputScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="NewPasswordScreen"
            component={NewPasswordScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="BottomNavigator"
            component={BottomNavigator}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="FeedbackScreen"
            component={FeedbackScreen}
            options={{headerShown: false}}
          />
          <Stack.Screen
            name="EditProfileScreen"
            component={EditProfileScreen}
            options={{headerShown: false}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
};

export default AppNavigator;
