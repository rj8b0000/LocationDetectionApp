import React, {useEffect, useState} from 'react';
import {View, StyleSheet, Image, ActivityIndicator} from 'react-native';
import {Text} from 'react-native-paper';
import {getSplashImage, BASE_URL} from '../config/api';

const SplashScreen = ({navigation}) => {
  const [splashImageUrl, setSplashImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchSplashImage();
  }, []);

  useEffect(() => {
    // Navigate after image is loaded or after timeout
    const timer = setTimeout(() => {
      navigation.replace('Location');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation]);

  const fetchSplashImage = async () => {
    try {
      setLoading(true);
      const response = await getSplashImage();
      
      if (response.splashImageUrl) {
        // Construct full URL if it's a relative path
        const fullImageUrl = response.splashImageUrl.startsWith('http') 
          ? response.splashImageUrl 
          : `${BASE_URL}${response.splashImageUrl}`;
        setSplashImageUrl(fullImageUrl);
      }
    } catch (err) {
      console.error('Failed to fetch splash image:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const renderImage = () => {
    if (loading) {
      return <ActivityIndicator size="large" color="#000" style={styles.splashImage} />;
    }
    
    if (error || !splashImageUrl) {
      // Fallback to local image if API fails
      return (
        <Image
          source={require('../assets/splash.png')}
          style={styles.splashImage}
          resizeMode="contain"
        />
      );
    }
    
    return (
      <Image
        source={{uri: splashImageUrl}}
        style={styles.splashImage}
        resizeMode="contain"
        onError={() => setError(true)}
      />
    );
  };

  return (
    <View style={styles.container}>
      {renderImage()}
      <Text style={styles.title}>Ganesh Bhise - Social Worker</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashImage: {
    width: 200,
    height: 200,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
});

export default SplashScreen;
