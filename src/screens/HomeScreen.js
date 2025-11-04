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
  const [settings, setSettings] = useState({
    modulesVisibility: {
      sliders: true,
      statistics: true,
      reports: true,
      feedback: true,
      help: true,
    },
    sliderAutoScrollInterval: 5000,
    statisticsLink: 'https://www.rocket.new/',
  });
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef(null);
  const {user} = route.params;
  // Animation value for crawler
  const crawlAnimation = useRef(new Animated.Value(0)).current;
  // Track screen width for responsive carousel (updates on orientation changes)
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  useEffect(() => {
    const onChange = ({window}) => {
      setScreenWidth(window.width);
    };
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => {
      // RN >=0.65 returns subscription with remove; older returns removeEventListener
      if (typeof subscription?.remove === 'function') subscription.remove();
      else Dimensions.removeEventListener?.('change', onChange);
    };
  }, []);
  // Responsive slider height based on screen width (16:9), clamped
  const sliderHeight = Math.max(180, Math.min(320, Math.round((screenWidth * 9) / 16)));

  // Base URL for slider images
  const BASE_URL = 'http://10.0.2.2:8080';

  // Default hero images (fallback if API fails)
  const defaultHeroImages = [
    {
      _id: 'default1',
      title: 'Default Slider 1',
      imageUrl:
        'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&h=400&fit=crop',
      order: 0,
      isActive: true,
    },
    {
      _id: 'default2',
      title: 'Default Slider 2',
      imageUrl:
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
      order: 1,
      isActive: true,
    },
    {
      _id: 'default3',
      title: 'Default Slider 3',
      imageUrl:
        'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=400&fit=crop',
      order: 2,
      isActive: true,
    },
  ];

  // Fetch settings from API
  const fetchSettings = async () => {
    try {
      const response = await axios.get('http://10.0.2.2:8080/api/settings');
      setSettings(response.data);
      console.log('Settings fetched:', response.data);
    } catch (error) {
      console.error('Error fetching settings:', error.message);
      Alert.alert('Error', 'Failed to load settings. Using default settings.', [
        {text: 'OK'},
      ]);
    }
  };

  // Fetch sliders from API
  const fetchSliders = async () => {
    if (!settings.modulesVisibility.sliders) {
      setSliders([]);
      return;
    }
    try {
      const response = await axios.get('http://10.0.2.2:8080/api/sliders');
      // Filter active sliders and sort by order
      const activeSliders = response.data
        .filter(slider => slider.isActive)
        .sort((a, b) => a.order - b.order);
      setSliders(activeSliders);
      console.log('Sliders fetched and sorted:', activeSliders);
    } catch (error) {
      console.error('Error fetching sliders:', error.message);
      Alert.alert('Error', 'Failed to load sliders. Using default images.', [
        {text: 'OK'},
      ]);
      setSliders(defaultHeroImages);
    }
  };
  const fetchContent = async () => {
    try {
      const response = await axios.get('http://10.0.2.2:8080/api/contents');
      setContent(response.data);
      console.log('Content fetched:', response.data);
    } catch (error) {
      console.error('Error fetching settings:', error.message);
      Alert.alert('Error', 'Failed to load settings. Using default settings.', [
        {text: 'OK'},
      ]);
    }
  };

  // Fetch data (used for initial load, polling, and refresh)
  const fetchData = async () => {
    setRefreshing(true);
    await Promise.all([fetchSettings(), fetchSliders(), fetchContent()]);
    setRefreshing(false);
    setLoading(false);
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-scroll for slider
  useEffect(() => {
    if (sliders.length === 0 || !settings.modulesVisibility.sliders) return;

    const intervalId = setInterval(() => {
      const nextIndex = (currentImageIndex + 1) % sliders.length;
      setCurrentImageIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * screenWidth,
        animated: true,
      });
    }, settings.sliderAutoScrollInterval);

    return () => clearInterval(intervalId);
  }, [currentImageIndex, sliders.length, settings.sliderAutoScrollInterval]);

  // Text crawler animation
  useEffect(() => {
    if (!settings.modulesVisibility.sliders) return;

    Animated.loop(
      Animated.timing(crawlAnimation, {
        toValue: -width * 2,
        duration: 10000,
        useNativeDriver: true,
      }),
    ).start();

    return () => crawlAnimation.setValue(0);
  }, [crawlAnimation, settings.modulesVisibility.sliders]);

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
      visible: settings.modulesVisibility.reports,
    },
    {
      id: 3,
      title: 'Feedback',
      subtitle: 'Your Opinion matters',
      color: '#059669',
      icon: 'chatbubble-ellipses',
      visible: settings.modulesVisibility.feedback,
    },
    {
      id: 4,
      title: 'Help',
      subtitle: 'Get support',
      color: '#e67e22',
      icon: 'help-circle',
      visible: settings.modulesVisibility.help,
    },
  ];

  // Conditionally add Statistics to activities if module is visible
  const statisticsActivity = {
    id: 1,
    title: 'Statistics',
    subtitle: 'View activity status',
    color: '#2563EB',
    icon: 'stats-chart',
    visible: settings.modulesVisibility.statistics,
  };

  const activities = settings.modulesVisibility.statistics
    ? [statisticsActivity, ...baseActivities]
    : baseActivities;

  const handleScroll = event => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / screenWidth);
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
              await AsyncStorage.removeItem('token');
              console.log('User and token removed from AsyncStorage');
              navigation.replace('Location');
            } catch (error) {
              console.error('Error removing data from AsyncStorage:', error);
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
        if (settings.statisticsLink) {
          try {
            // const supported = await Linking.canOpenURL(settings.statisticsLink);
            // if (supported) {
            await Linking.openURL(settings.statisticsLink);
            // } else {
            //   Alert.alert('Error', 'Cannot open this URL.', [{text: 'OK'}]);
            // }
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
          <Text style={styles.greetingText}>Welcome, {user.fullName}!</Text>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('EditProfileScreen', {user})}>
            <Ionicons name="person-circle-outline" size={30} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* Hero Image Carousel */}
        {settings.modulesVisibility.sliders && (
          <View style={styles.heroContainer}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={[
                styles.imageCarousel,
                {height: sliderHeight, width: screenWidth},
              ]}>
              {sliders.map(slider => (
                <View
                  key={slider._id}
                  style={[
                    styles.imageContainer,
                    {height: sliderHeight, width: screenWidth},
                  ]}
                >
                  <Image
                    source={{
                      uri: slider.imageUrl.startsWith('https')
                        ? slider.imageUrl
                        : `${BASE_URL}${slider.imageUrl}`,
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
                  {content.content}
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
                  {content.content}
                </Animated.Text>
              </View>
            </View>
          </View>
        )}

        {/* Activities Section */}
        <View style={styles.activitiesContainer}>
          <View style={{height: heightPercentageToDP(2)}} />
          <Text style={styles.sectionTitle}>Activities</Text>
          <View style={styles.activitiesGrid}>
            {activities
              .filter(activity => activity.visible)
              .map(activity => (
                <TouchableOpacity
                  key={activity.id}
                  style={[
                    styles.activityCard,
                    {backgroundColor: activity.color},
                  ]}
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
    width: width,
  },
  imageContainer: {
    width: width,
    paddingHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
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
    // backgroundColor: '#8a9ecaff',
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
    color: '#000',
    fontWeight: '500',
    paddingHorizontal: 10,
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
