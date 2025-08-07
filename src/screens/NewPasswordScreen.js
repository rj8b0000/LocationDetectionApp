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

const NewPasswordScreen = ({navigation}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleUpdate = () => {
    console.log('Update pressed', {newPassword, confirmPassword});
    // Add your API call for updating the password here
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
            <Text style={styles.title}>Set New Password</Text>

            {/* Instruction Text */}
            <Text style={styles.instructionText}>
              Enter and confirm your new password.
            </Text>

            {/* Input Fields */}
            <View style={styles.inputContainer}>
              <TextInput
                mode="outlined"
                label="Enter New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                style={styles.input}
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={showNewPassword ? 'eye-off' : 'eye'}
                    onPress={toggleNewPasswordVisibility}
                  />
                }
                theme={{roundness: 12}}
              />

              <TextInput
                mode="outlined"
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                style={styles.input}
                left={<TextInput.Icon icon="lock-outline" />}
                right={
                  <TextInput.Icon
                    icon={showConfirmPassword ? 'eye-off' : 'eye'}
                    onPress={toggleConfirmPasswordVisibility}
                  />
                }
                theme={{roundness: 12}}
              />
            </View>

            {/* Update Button */}
            <Button
              mode="contained"
              onPress={handleUpdate}
              style={styles.actionButton}
              labelStyle={styles.actionButtonText}
              disabled={!newPassword || !confirmPassword}>
              Update
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
    marginBottom: 16,
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

export default NewPasswordScreen;
