import React, {useState, useRef} from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput as RNTextInput,
} from 'react-native';
import {Text, Button} from 'react-native-paper';

const OTPInputScreen = ({navigation}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef(otp.map(() => React.createRef()));

  const handleOTPChange = (value, index) => {
    if (/^[0-9]$/.test(value) || value === '') {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Move focus to the next input if a digit is entered
      if (value && index < 5) {
        inputRefs.current[index + 1].current.focus();
      }
    }
  };

  const handleKeyPress = (e, index) => {
    // Move focus to the previous input on backspace if the current input is empty
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].current.focus();
    }
  };

  const handlePaste = e => {
    const pastedText = e.nativeEvent.text;
    if (/^\d{6}$/.test(pastedText)) {
      const newOtp = pastedText.split('');
      setOtp(newOtp);
      // Move focus to the last input after pasting
      inputRefs.current[5].current.focus();
    }
  };

  const handleVerify = () => {
    const otpValue = otp.join('');
    navigation.navigate('NewPasswordScreen');
    console.log('Verify pressed', {otp: otpValue});
    // Add your API call for OTP verification here
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
            <Text style={styles.title}>Enter OTP</Text>

            {/* Instruction Text */}
            <Text style={styles.instructionText}>
              Enter the 6-digit OTP sent to your email.
            </Text>

            {/* OTP Input Fields */}
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <RNTextInput
                  key={index}
                  ref={inputRefs.current[index]}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={value => handleOTPChange(value, index)}
                  onKeyPress={e => handleKeyPress(e, index)}
                  onPaste={handlePaste}
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                  selectionColor="#2563EB"
                />
              ))}
            </View>

            {/* Verify Button */}
            <Button
              mode="contained"
              onPress={handleVerify}
              style={styles.actionButton}
              labelStyle={styles.actionButtonText}
              disabled={otp.some(digit => digit === '')}>
              Verify
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInput: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    fontSize: 18,
    fontWeight: '500',
    color: '#1F2937',
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

export default OTPInputScreen;
