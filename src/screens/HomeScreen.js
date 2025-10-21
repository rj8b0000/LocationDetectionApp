import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Image,
  Alert,
  Linking,
  RefreshControl,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import {heightPercentageToDP} from 'react-native-responsive-screen';

const {width} = Dimensions.get('window');

const HomeScreen = ({route, navigation}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [sliders, setSliders] = useState([]);
  const [statisticsData, setStatisticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef(null);
  const {user} = route.params;
  // Animation value for crawler
  const crawlAnimation = useRef(new Animated.Value(0)).current;

  // Base URL for slider images
  const BASE_URL = 'http://10.0.2.2:8000';

  // Default hero images (fallback if API fails)
  const defaultHeroImages = [
    'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
    'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=400&fit=crop',
  ];

  // Fetch sliders from API
  const fetchSliders = async () => {
    try {
      const response = await axios.get('http://10.0.2.2:8000/api/sliders');
      setSliders(response.data);
      console.log('Sliders fetched:', response.data);
    } catch (error) {
      console.error('Error fetching sliders:', error.message);
      Alert.alert('Error', 'Failed to load sliders. Using default images.', [
        {text: 'OK'},
      ]);
      setSliders(defaultHeroImages.map(url => ({id: url, image_url: url})));
    }
  };

  // Fetch statistics data from API
  const fetchStatistics = async () => {
    try {
      const response = await axios.get('http://10.0.2.2:8000/api/statistics');
      setStatisticsData(response.data);
      console.log('Statistics fetched:', response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error.message);
      Alert.alert('Error', 'Failed to load statistics data.', [{text: 'OK'}]);
      setStatisticsData({toggle: 0});
    }
  };

  // Fetch data (used for initial load, polling, and refresh)
  const fetchData = async () => {
    setRefreshing(true);
    await Promise.all([fetchSliders(), fetchStatistics()]);
    setRefreshing(false);
    setLoading(false);
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-scroll for slider
  useEffect(() => {
    if (sliders.length === 0) return;

    const intervalId = setInterval(() => {
      const nextIndex = (currentImageIndex + 1) % sliders.length;
      setCurrentImageIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    }, 3000);

    return () => clearInterval(intervalId);
  }, [currentImageIndex, sliders.length]);

  // Text crawler animation
  useEffect(() => {
    Animated.loop(
      Animated.timing(crawlAnimation, {
        toValue: -width, // Move text one screen width to the left
        duration: 7000, // 5 seconds for one full cycle
        useNativeDriver: true,
      }),
    ).start();

    return () => crawlAnimation.setValue(0); // Reset on unmount
  }, [crawlAnimation]);

  // Polling: Fetch data every 60 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      console.log('Polling for updates...');
      fetchData();
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  // Base activities array
  const baseActivities = [
    {
      id: 2,
      title: 'Reports',
      subtitle: 'Monthly summary',
      color: '#9333EA',
      icon: 'document-text',
    },
    {
      id: 3,
      title: 'Feedback',
      subtitle: 'Your Opinion matters',
      color: '#059669',
      icon: 'chatbubble-ellipses',
    },
    {
      id: 4,
      title: 'Help',
      subtitle: 'Get support',
      color: '#e67e22',
      icon: 'help-circle',
    },
  ];

  // Conditionally add Statistics to activities if toggle is 1
  const statisticsActivity = {
    id: 1,
    title: 'Statistics',
    subtitle: 'View activity status',
    color: '#2563EB',
    icon: 'stats-chart',
  };

  const activities =
    statisticsData?.toggle === 1
      ? [statisticsActivity, ...baseActivities]
      : baseActivities;

  const handleScroll = event => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentImageIndex(index);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('user');
              console.log('User removed from AsyncStorage');
              navigation.replace('Location');
            } catch (error) {
              console.error('Error removing user from AsyncStorage:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.', [
                {text: 'OK'},
              ]);
            }
          },
        },
      ],
      {cancelable: true},
    );
  };

  const handleActivityPress = async activity => {
    switch (activity.id) {
      case 1:
        if (statisticsData?.link) {
          try {
            const supported = await Linking.canOpenURL(statisticsData.link);
            if (supported) {
              await Linking.openURL(statisticsData.link);
            } else {
              Alert.alert('Error', 'Cannot open this URL.', [{text: 'OK'}]);
            }
          } catch (error) {
            console.error('Error opening statistics link:', error);
            Alert.alert('Error', 'Failed to open the statistics link.', [
              {text: 'OK'},
            ]);
          }
        }
        break;
      case 2:
        navigation.navigate('Reports');
        break;
      case 3:
        navigation.navigate('FeedbackScreen', {user});
        break;
      case 4:
        navigation.navigate('Help');
        break;
      case 5:
        handleLogout();
        break;
      default:
        console.log(`${activity.title} pressed`);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchData} />
        }>
        {/* User Greeting with Profile Icon */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>Welcome, {user.name}!</Text>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('EditProfileScreen', {user})}>
            <Ionicons name="person-circle-outline" size={30} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* Hero Image Carousel */}
        <View style={styles.heroContainer}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={styles.imageCarousel}>
            {sliders.map(slider => (
              <View key={slider.id} style={styles.imageContainer}>
                <Image
                  source={{
                    uri: slider.image_url.startsWith('http')
                      ? slider.image_url
                      : `${BASE_URL}${slider.image_url}`,
                  }}
                  style={styles.heroImage}
                  onError={error =>
                    console.log('Image load error:', error.nativeEvent.error)
                  }
                />
              </View>
            ))}
          </ScrollView>

          <View style={styles.pageIndicators}>
            {sliders.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.indicator,
                  currentImageIndex === index && styles.activeIndicator,
                ]}
              />
            ))}
          </View>

          {/* Text Crawler */}
          <View style={styles.crawlerContainer}>
            <View style={styles.crawlerWrapper}>
              <Animated.Text
                style={[
                  styles.crawlerText,
                  {
                    transform: [{translateX: crawlAnimation}],
                  },
                ]}>
                Stay updated with the latest news and announcements
              </Animated.Text>
              <Animated.Text
                style={[
                  styles.crawlerText,
                  {
                    transform: [
                      {
                        translateX: Animated.add(crawlAnimation, width),
                      },
                    ],
                  },
                ]}>
                Stay updated with the latest news and announcements
              </Animated.Text>
            </View>
          </View>
        </View>

        {/* Activities Section */}
        <View style={styles.activitiesContainer}>
          <View style={{height: heightPercentageToDP(2)}} />
          <Text style={styles.sectionTitle}>Activities</Text>
          <View style={styles.activitiesGrid}>
            {activities.map(activity => (
              <TouchableOpacity
                key={activity.id}
                style={[styles.activityCard, {backgroundColor: activity.color}]}
                onPress={() => handleActivityPress(activity)}
                activeOpacity={0.8}>
                <View style={styles.cardContent}>
                  <Ionicons
                    name={activity.icon}
                    size={24}
                    color="#FFFFFF"
                    style={styles.cardIcon}
                  />
                  <Text style={styles.cardTitle}>{activity.title}</Text>
                  <Text style={styles.cardSubtitle}>{activity.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: '7%',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#1F2937',
  },
  greetingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  profileButton: {
    padding: 8,
  },
  heroContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  imageCarousel: {
    height: 200,
    width: width,
  },
  imageContainer: {
    width: width,
    height: 200,
    paddingHorizontal: '1.5%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  crawlerContainer: {
    backgroundColor: '#2563EB',
    paddingVertical: 8,
    overflow: 'hidden',
    width: '91%',
    marginHorizontal: '4%',
  },
  crawlerWrapper: {
    flexDirection: 'row',
  },
  crawlerText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    paddingHorizontal: 10, // Ensure text doesn't touch edges
  },
  activitiesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
  },
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  activityCard: {
    width: (width - 60) / 2,
    height: 120,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardIcon: {
    alignSelf: 'flex-start',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 16,
  },
});

export default HomeScreen;
