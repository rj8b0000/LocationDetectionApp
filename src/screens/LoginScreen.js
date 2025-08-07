import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {TextInput, Text, Button} from 'react-native-paper';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({navigation}) => {
  const [activeTab, setActiveTab] = useState('Login');
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Function to store user data in AsyncStorage
  const storeUser = async user => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
      console.log('User stored in AsyncStorage:', user);
    } catch (error) {
      console.error('Error storing user in AsyncStorage:', error);
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://10.0.2.2:8000/api/login', {
        mobile_number: mobileNumber,
        password: password,
      });
      console.log('Login Response:', response.data);
      // Store user in AsyncStorage
      await storeUser(response.data.user);
      Alert.alert('Success', response.data.message, [
        {
          text: 'OK',
          onPress: () => navigation.replace('Home', {user: response.data.user}),
        },
      ]);
    } catch (error) {
      console.log('Login Error:', error.response?.data?.error);
      let errorMessage = 'An error occurred during login.';
      if (error.response?.data?.errors) {
        errorMessage = Object.values(error.response.data.errors).join('\n');
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      Alert.alert('Error', errorMessage, [{text: 'OK'}]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://10.0.2.2:8000/api/register', {
        name: name,
        mobile_number: mobileNumber,
        password: password,
      });
      console.log('Register Response:', response.data);
      // Store user in AsyncStorage
      await storeUser(response.data.user);
      Alert.alert('Success', response.data.message, [
        {
          text: 'OK',
          onPress: () => navigation.replace('Home', {user: response.data.user}),
        },
      ]);
    } catch (error) {
      console.log('Register Error:', error.response?.data?.error);
      let errorMessage = 'An error occurred during registration.';
      if (error.response?.data?.errors) {
        errorMessage = Object.values(error.response.data.errors).join('\n');
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      Alert.alert('Error', errorMessage, [{text: 'OK'}]);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    console.log('Forgot Password pressed');
    navigation.navigate('ForgotPassword');
  };

  const handleFeedback = () => {
    console.log('Feedback pressed');
    navigation.navigate('Feedback');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            {/* Header */}
            <Text style={styles.title}>Welcome to Login/Register</Text>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'Login' && styles.activeTab]}
                onPress={() => setActiveTab('Login')}>
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'Login' && styles.activeTabText,
                  ]}>
                  Login
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === 'Register' && styles.activeTab,
                ]}
                onPress={() => setActiveTab('Register')}>
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 'Register' && styles.activeTabText,
                  ]}>
                  Register
                </Text>
              </TouchableOpacity>
            </View>

            {/* Input Fields */}
            <View style={styles.inputContainer}>
              {activeTab === 'Register' && (
                <TextInput
                  mode="outlined"
                  label="Name"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                  left={<TextInput.Icon icon="account-outline" />}
                  theme={{roundness: 12}}
                />
              )}

              <TextInput
                mode="outlined"
                label="Mobile Number"
                value={mobileNumber}
                onChangeText={setMobileNumber}
                keyboardType="phone-pad"
                style={styles.input}
                left={<TextInput.Icon icon="phone-outline" />}
                theme={{roundness: 12}}
              />

              <TextInput
                mode="outlined"
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                style={styles.input}
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? 'eye-off' : 'eye'}
                    onPress={togglePasswordVisibility}
                  />
                }
                theme={{roundness: 12}}
              />
            </View>

            {/* Action Button */}
            {activeTab === 'Login' ? (
              <Button
                mode="contained"
                onPress={handleSignIn}
                style={styles.actionButton}
                labelStyle={styles.actionButtonText}
                disabled={loading || !mobileNumber || !password}
                loading={loading}>
                Sign In
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={handleRegister}
                style={styles.actionButton}
                labelStyle={styles.actionButtonText}
                disabled={loading || !name || !mobileNumber || !password}
                loading={loading}>
                Register
              </Button>
            )}

            {/* Forgot Password and Feedback Links */}
            {activeTab === 'Login' && (
              <View style={styles.linkContainer}>
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: '15%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#2563EB',
  },
  inputContainer: {
    marginBottom: 32,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 4,
    marginBottom: 24,
    backgroundColor: '#2563EB',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  linkContainer: {
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  feedbackText: {
    color: '#2563EB',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default LoginScreen;
