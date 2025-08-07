import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  View,
  Alert,
  PermissionsAndroid,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {WebView} from 'react-native-webview';
import Geolocation from '@react-native-community/geolocation';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import {Button, Text} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LocationScreen = ({navigation}) => {
  const [userLocation, setUserLocation] = useState(null);
  const [isInsidePolygon, setIsInsidePolygon] = useState(null);
  const [polygonCoordinates, setPolygonCoordinates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const webViewRef = useRef(null);

  // Fetch polygon coordinates from API
  const fetchPolygonCoordinates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://10.0.2.2:8000/api/coordinates');
      const data = await response.json();
      if (!response.ok) {
        throw new Error('Failed to fetch coordinates');
      }
      const coordinates = data.map(coord => [
        parseFloat(coord.latitude),
        parseFloat(coord.longitude),
      ]);
      console.log('Fetched Polygon Coordinates:', coordinates);
      setPolygonCoordinates(coordinates);
    } catch (err) {
      console.error('API Error:', err.message);
      setError('Failed to load polygon coordinates. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch coordinates on component mount
  useEffect(() => {
    fetchPolygonCoordinates();
  }, []);

  const isPointInPolygon = (point, polygon) => {
    if (polygon.length === 0) return false;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (
        polygon[i][1] > point[1] !== polygon[j][1] > point[1] &&
        point[0] <
          ((polygon[j][0] - polygon[i][0]) * (point[1] - polygon[i][1])) /
            (polygon[j][1] - polygon[i][1]) +
            polygon[i][0]
      ) {
        inside = !inside;
      }
    }
    console.log('Point:', point, 'Polygon:', polygon, 'Inside:', inside);
    return inside;
  };

  // Request location permission
  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location to function.',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        },
      );
      console.log('Permission granted:', granted);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn('Permission request error:', err);
      Alert.alert(
        'Error',
        'Failed to request location permission: ' + err.message,
        [{text: 'OK'}],
      );
      return false;
    }
  };

  // Function to fetch user from AsyncStorage
  const getStoredUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error retrieving user from AsyncStorage:', error);
      return null;
    }
  };

  // Function to handle navigation based on user presence
  const handleNavigation = async () => {
    const user = await getStoredUser();
    if (user) {
      console.log('User found in AsyncStorage, navigating to Home:', user);
      navigation.replace('Home', {user});
    } else {
      console.log('No user found in AsyncStorage, navigating to Login');
      navigation.replace('Login');
    }
  };

  // Function to fetch location and trigger alert
  const fetchLocationAndAlert = (useHighAccuracy = true) => {
    if (loading) {
      console.log('Skipping location check: Polygon coordinates still loading');
      return;
    }

    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude, accuracy} = position.coords;
        console.log('Location Update:', {
          latitude,
          longitude,
          accuracy,
          timestamp: position.timestamp,
          highAccuracy: useHighAccuracy,
        });
        setUserLocation([latitude, longitude]);
        const inside = isPointInPolygon(
          [latitude, longitude],
          polygonCoordinates,
        );
        setIsInsidePolygon(inside);
        if (webViewRef.current) {
          console.log('Sending location update to WebView:', {
            lat: latitude,
            lng: longitude,
          });
          webViewRef.current.postMessage(
            JSON.stringify({lat: latitude, lng: longitude, type: 'location'}),
          );
        }
      },
      error => {
        console.log('GetCurrentPosition Error:', error);
        let errorMessage = error.message;
        if (error.code === 2) {
          errorMessage +=
            '. Please ensure location services are enabled and GPS is available. Try going outside for a better signal.';
          if (useHighAccuracy) {
            console.log(
              'Retrying with network-based location (highAccuracy: false)...',
            );
            fetchLocationAndAlert(false);
            return;
          }
        } else if (error.code === 3) {
          errorMessage +=
            '. The device took too long to retrieve the location. Ensure you have a clear view of the sky for GPS, or try using network-based location.';
        }
        Alert.alert('Error', 'Failed to get location: ' + errorMessage, [
          {text: 'OK'},
        ]);
      },
      {
        enableHighAccuracy: useHighAccuracy,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  // Set up location updates and timer
  useEffect(() => {
    const initializeLocation = async () => {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Permission Denied',
          'Please enable location permissions in your device settings and ensure location services are turned on.',
          [{text: 'OK'}],
        );
        return;
      }

      fetchLocationAndAlert();

      const intervalId = setInterval(() => {
        fetchLocationAndAlert();
      }, 60000);

      return () => clearInterval(intervalId);
    };

    initializeLocation();
  }, [loading]);

  // HTML content for WebView with Leaflet, Leaflet.Draw, and OSM
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Draw Custom Shapes - Leaflet.js</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">

      <!-- Leaflet CSS -->
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        #map {
          height: 100%;
        }
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
        }
      </style>

      <!-- Leaflet.js -->
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <!-- Leaflet.Draw -->
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css" />
      <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"></script>
    </head>
    <body>
      <div id="map"></div>

      <script>
        console.log = function(message) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'log',
            message: typeof message === 'object' ? JSON.stringify(message) : message
          }));
        };

        const map = L.map('map');

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        var polygonCoords = ${JSON.stringify(polygonCoordinates)};
        var hardcodedPolygon = L.polygon(polygonCoords, { color: '#000', weight: 2 }).addTo(map);

        if (polygonCoords.length > 0) {
          map.fitBounds(polygonCoords, { padding: [50, 50] });
        } else {
          map.setView([0, 0], 2);
        }

        var userIcon = L.icon({
          iconUrl: 'data:image/svg+xml;base64,' + btoa(\`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill="#28a745" />
            </svg>
          \`),
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -40]
        });

        var userMarker;

        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        const drawControl = new L.Control.Draw({
          edit: {
            featureGroup: drawnItems,
            remove: true,
          },
          draw: {
            polygon: true,
            circle: true,
            rectangle: false,
            polyline: false,
            marker: false,
          },
        });
        map.addControl(drawControl);

        map.on(L.Draw.Event.CREATED, function (event) {
          const layer = event.layer;

          if (event.layerType === 'polygon') {
            const coordinates = layer.getLatLngs()[0].map((latLng) => ({
              latitude: latLng.lat,
              longitude: latLng.lng,
            }));
            console.log('Polygon Coordinates:', coordinates);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'drawnShape',
              shapeType: 'polygon',
              coordinates: coordinates,
            }));
          }

          if (event.layerType === 'circle') {
            const center = layer.getLatLng();
            const radius = layer.getRadius();
            console.log('Circle Center:', { latitude: center.lat, longitude: center.lng });
            console.log('Circle Radius (meters):', radius);
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'drawnShape',
              shapeType: 'circle',
              center: { latitude: center.lat, longitude: center.lng },
              radius: radius,
            }));
          }

          drawnItems.addLayer(layer);
        });

        window.addEventListener('message', function (event) {
          try {
            var data = JSON.parse(event.data);
            console.log('WebView received message:', data);

            if (data.type === 'location') {
              var lat = data.lat;
              var lng = data.lng;
              console.log('Parsed location:', { lat, lng });

              if (userMarker) {
                console.log('Removing previous marker');
                map.removeLayer(userMarker);
              }

              userMarker = L.marker([lat, lng], { icon: userIcon })
                .addTo(map)
                .bindPopup('Your Location')
                .openPopup();
              console.log('Marker added at:', { lat, lng });

              const polygonBounds = L.latLngBounds(polygonCoords);
              const userLatLng = L.latLng(lat, lng);
              const combinedBounds = polygonBounds.extend(userLatLng);
              map.fitBounds(combinedBounds, { padding: [50, 50] });
              console.log('Map adjusted to fit bounds:', combinedBounds.toBBoxString());
            }
          } catch (e) {
            console.log('Error in message event listener:', e.message);
          }
        });

        window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'mapLoaded' }));
      </script>
    </body>
    </html>
  `;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading coordinates...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchPolygonCoordinates}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{html: htmlContent}}
          style={styles.webview}
          onMessage={event => {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'log') {
              console.log('[WebView Log]', data.message);
            } else if (data.status === 'mapLoaded') {
              console.log('Map loaded in WebView');
              if (userLocation && webViewRef.current) {
                console.log('Sending initial location after map load:', {
                  lat: userLocation[0],
                  lng: userLocation[1],
                });
                webViewRef.current.postMessage(
                  JSON.stringify({
                    lat: userLocation[0],
                    lng: userLocation[1],
                    type: 'location',
                  }),
                );
              }
            } else if (data.type === 'drawnShape') {
              if (data.shapeType === 'polygon') {
                console.log('Drawn Polygon Coordinates:', data.coordinates);
                Alert.alert(
                  'Polygon Drawn',
                  `Coordinates: ${JSON.stringify(data.coordinates, null, 2)}`,
                  [{text: 'OK'}],
                );
              } else if (data.shapeType === 'circle') {
                console.log('Drawn Circle Center:', data.center);
                console.log('Drawn Circle Radius (meters):', data.radius);
                Alert.alert(
                  'Circle Drawn',
                  `Center: ${JSON.stringify(data.center)}, Radius: ${
                    data.radius
                  } meters`,
                  [{text: 'OK'}],
                );
              }
            }
          }}
          onError={syntheticEvent => {
            const {nativeEvent} = syntheticEvent;
            console.log('WebView Error:', nativeEvent);
            Alert.alert('Error', 'Failed to load map.', [{text: 'OK'}]);
          }}
        />
      </View>
      {isInsidePolygon !== null && (
        <View style={styles.buttonContainer}>
          {isInsidePolygon ? (
            <>
              <View
                style={{
                  width: wp(100),
                  height: hp(20),
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <View style={{flexDirection: 'row', gap: 10}}>
                  <AntDesign name="checkcircle" color="#22C55E" size={30} />
                  <Text
                    style={{
                      fontFamily: 'Inter',
                      fontSize: wp(5.5),
                      fontWeight: 'bold',
                      color: '#000',
                    }}>
                    You are inside the region
                  </Text>
                </View>

                <TouchableOpacity
                  style={{
                    width: wp(80),
                    backgroundColor: '#2563EB',
                    height: hp(6),
                    borderRadius: 8,
                    elevation: 5,
                    marginVertical: '5%',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={handleNavigation}>
                  <Text
                    style={{
                      fontFamily: 'Inter',
                      fontSize: wp(4.5),
                      fontWeight: 'bold',
                      color: '#fff',
                    }}>
                    Continue to App
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View
                style={{
                  width: wp(100),
                  height: hp(20),
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <View style={{flexDirection: 'row', gap: 10}}>
                  <Entypo name="circle-with-cross" color="#C53522" size={30} />
                  <Text
                    style={{
                      fontFamily: 'Inter',
                      fontSize: wp(5.5),
                      fontWeight: 'bold',
                      color: '#000',
                    }}>
                    You are outside the region
                  </Text>
                </View>

                <TouchableOpacity
                  style={{
                    width: wp(80),
                    backgroundColor: '#6B717D',
                    height: hp(6),
                    borderRadius: 8,
                    elevation: 5,
                    marginVertical: '5%',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Text
                    style={{
                      fontFamily: 'Inter',
                      fontSize: wp(4.5),
                      fontWeight: 'bold',
                      color: '#fff',
                    }}>
                    Get Inside to Continue to App
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fefefe',
  },
  mapContainer: {
    width: wp(100),
    height: hp(70),
  },
  webview: {
    flex: 1,
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: hp(30),
    backgroundColor: '#fefefe',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fefefe',
  },
  loadingText: {
    marginTop: 10,
    fontSize: wp(4),
    color: '#1F2937',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fefefe',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: wp(4),
    color: '#C53522',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    fontSize: wp(4),
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default LocationScreen;
