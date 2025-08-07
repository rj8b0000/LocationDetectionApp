import {useNavigation} from '@react-navigation/native';
import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {TextInput, Text, Button} from 'react-native-paper';

const ForgotPasswordScreen = ({navigation}) => {
  const [email, setEmail] = useState('');

  const handleSend = () => {
    navigation.navigate('OTPInputScreen');
    // Add your API call for sending password reset email here
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
            <Text style={styles.title}>Forgot Password</Text>

            {/* Instruction Text */}
            <Text style={styles.instructionText}>
              Enter your email address to receive a password reset link.
            </Text>

            {/* Input Field */}
            <View style={styles.inputContainer}>
              <TextInput
                mode="outlined"
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                style={styles.input}
                left={<TextInput.Icon icon="email-outline" />}
                theme={{roundness: 12}}
              />
            </View>

            {/* Send Button */}
            <Button
              mode="contained"
              onPress={handleSend}
              style={styles.actionButton}
              labelStyle={styles.actionButtonText}>
              Send
            </Button>
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
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#F9FAFB',
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 4,
    backgroundColor: '#2563EB',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;
