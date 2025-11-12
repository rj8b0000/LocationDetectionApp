import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import {TextInput, Button, Text} from 'react-native-paper';
import axios from 'axios';

const FeedbackScreen = ({route, navigation}) => {
  const {user} = route.params; // <-- user object from navigation
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // ------------------------------------------------------------
  // 1. NEW API CALL
  // ------------------------------------------------------------
  const handleSubmitFeedback = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter your feedback message.', [
        {text: 'OK'},
      ]);
      return;
    }

    setLoading(true);

    try {
      // ---- NEW ENDPOINT & PAYLOAD ----
      const payload = {
        userName: user.fullName ?? user.username ?? 'Anonymous', // pick whatever you have
        message: message.trim(),
      };
      console.log('Payload: ', payload);

      const response = await axios.post(
        'http://147.93.110.242:8080/api/feedback',
        payload,
        {headers: {'Content-Type': 'application/json'}},
      );

      console.log('Feedback Response:', response.data);

      // ---- SUCCESS (201 or 200 – both are fine) ----
      if (response.status === 201 || response.status === 200) {
        Alert.alert('Success', 'Thank you! Your feedback has been submitted.', [
          {
            text: 'OK',
            onPress: () => {
              setMessage(''); // clear textarea
              navigation.goBack(); // back to previous screen
            },
          },
        ]);
      } else {
        throw new Error('Unexpected status code');
      }
    } catch (error) {
      console.error('Feedback Error:', error.response?.data || error.message);

      let errorMessage = 'An error occurred while submitting feedback.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = Object.values(error.response.data.errors).join('\n');
      }

      Alert.alert('Error', errorMessage, [{text: 'OK'}]);
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------
  // UI (unchanged except for a tiny style tweak)
  // ------------------------------------------------------------
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={styles.title}>Submit Your Feedback</Text>
            <Text style={styles.subtitle}>
              We value your opinion! Let us know how we can improve.
            </Text>

            <TextInput
              mode="outlined"
              label="Your Feedback"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={5}
              theme={{roundness: 12}}
              placeholder="Enter your feedback here..."
              style={styles.textArea}
            />

            <Button
              mode="contained"
              onPress={handleSubmitFeedback}
              style={styles.submitButton}
              labelStyle={styles.submitButtonText}
              disabled={loading || !message.trim()}
              loading={loading}>
              Submit Feedback
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FFFFFF'},
  scrollContent: {flexGrow: 1, justifyContent: 'center'},
  content: {flex: 1, paddingHorizontal: 24, paddingVertical: 40},
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 4,
    backgroundColor: '#2563EB',
  },
  submitButtonText: {fontSize: 16, fontWeight: '600'},
  textArea: {
    backgroundColor: '#F9FAFB',
    minHeight: 120,
    marginBottom: 24,
  },
});

export default FeedbackScreen;
