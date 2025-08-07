// import React, {useState} from 'react';
// import {
//   View,
//   StyleSheet,
//   SafeAreaView,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
// } from 'react-native';
// import {TextInput, Text, Button} from 'react-native-paper';

// const FeedbackScreen = ({navigation}) => {
//   const [feedback, setFeedback] = useState('');

//   const handleSubmit = () => {
//     console.log('Submit pressed', {feedback});
//     // Add your API call for submitting feedback here
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <KeyboardAvoidingView
//         style={styles.container}
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
//         <ScrollView contentContainerStyle={styles.scrollContent}>
//           <View style={styles.content}>
//             {/* Header */}
//             <Text style={styles.title}>Feedback</Text>

//             {/* Instruction Text */}
//             <Text style={styles.instructionText}>
//               We’d love to hear your thoughts! Please share your feedback below.
//             </Text>

//             {/* Text Area */}
//             <View style={styles.inputContainer}>
//               <TextInput
//                 mode="outlined"
//                 label="Your Feedback"
//                 value={feedback}
//                 onChangeText={setFeedback}
//                 multiline
//                 numberOfLines={6}
//                 style={styles.textArea}
//                 theme={{roundness: 12}}
//               />
//             </View>

//             {/* Submit Button */}
//             <Button
//               mode="contained"
//               onPress={handleSubmit}
//               style={styles.actionButton}
//               labelStyle={styles.actionButtonText}
//               disabled={!feedback}>
//               Submit
//             </Button>
//           </View>
//         </ScrollView>
//       </KeyboardAvoidingView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//   },
//   scrollContent: {
//     flexGrow: 1,
//     justifyContent: 'center',
//   },
//   content: {
//     flex: 1,
//     paddingHorizontal: 24,
//     paddingVertical: '15%',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#1F2937',
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   instructionText: {
//     fontSize: 16,
//     color: '#6B7280',
//     textAlign: 'center',
//     marginBottom: 32,
//   },
//   inputContainer: {
//     marginBottom: 32,
//   },
//   textArea: {
//     backgroundColor: '#F9FAFB',
//     minHeight: 120,
//   },
//   actionButton: {
//     borderRadius: 12,
//     paddingVertical: 4,
//     backgroundColor: '#2563EB',
//   },
//   actionButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });

// export default FeedbackScreen;
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
  const {user} = route.params;
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitFeedback = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter your feedback message.', [
        {text: 'OK'},
      ]);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://10.0.2.2:8000/api/feedback', {
        user_id: user.id,
        message: message.trim(),
      });

      console.log('Feedback Response:', response.data);

      if (response.status === 201) {
        Alert.alert('Success', response.data.message, [
          {
            text: 'OK',
            onPress: () => {
              setMessage(''); // Clear the input
              navigation.goBack(); // Navigate back to HomeScreen
            },
          },
        ]);
      } else {
        Alert.alert('Error', 'Failed to submit feedback. Please try again.', [
          {text: 'OK'},
        ]);
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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            {/* Header */}
            <Text style={styles.title}>Submit Your Feedback</Text>
            <Text style={styles.subtitle}>
              We value your opinion! Let us know how we can improve.
            </Text>

            {/* Feedback Input */}
            <TextInput
              mode="outlined"
              label="Your Feedback"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={5}
              // style={styles.input}
              theme={{roundness: 12}}
              placeholder="Enter your feedback here..."
              style={styles.textArea}
            />

            {/* Submit Button */}
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
    paddingVertical: 40,
  },
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
  input: {
    backgroundColor: '#F9FAFB',
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 4,
    backgroundColor: '#2563EB',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  textArea: {
    backgroundColor: '#F9FAFB',
    minHeight: 120,
    marginBottom: 24,
  },
});

export default FeedbackScreen;
