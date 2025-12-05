import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  ActivityIndicator,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import MapView, {PROVIDER_GOOGLE, Marker, Polygon} from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {Text} from 'react-native-paper';
import {TouchableOpacity} from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import AntDesign from 'react-native-vector-icons/AntDesign';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ASK FINE LOCATION (Android only – iOS handled via Info.plist)
const requestFineLocation = async () => {
  // if (Platform.OS !== 'android') return true;
  const res = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location Permission',
      message: 'We need your location to check if you’re inside the region.',
      buttonPositive: 'OK',
      buttonNegative: 'Cancel',
    },
  );
  return res === PermissionsAndroid.RESULTS.GRANTED;
};

// [lat, lon] winding-agnostic ray-cast
const pointInPolygon = (point, polygon) => {
  if (!polygon?.length) return false;
  const [pyLat, pyLon] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [iLat, iLon] = polygon[i];
    const [jLat, jLon] = polygon[j];
    const intersect =
      iLon > pyLon !== jLon > pyLon &&
      pyLat < ((jLat - iLat) * (pyLon - iLon)) / (jLon - iLon) + iLat;
    if (intersect) inside = !inside;
  }
  return inside;
};

export default function LocationGate({navigation}) {
  const [loading, setLoading] = useState(true);
  const [polygon, setPolygon] = useState([]); // [[lat, lon], ...]
  const [user, setUser] = useState(null); // [lat, lon]
  const [inside, setInside] = useState(null);
  const mapRef = useRef(null);

  // Fetch polygon from API
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const resp = await fetch('http://147.93.110.242:8080/api/coordinates');
        const data = await resp.json();
        if (!resp.ok) throw new Error('Failed to fetch polygon');

        // GeoJSON: [lon, lat] -> we store [lat, lon]
        const coords = data[0].polygon.coordinates[0].map(([lon, lat]) => [
          parseFloat(lat),
          parseFloat(lon),
        ]);
        if (mounted) setPolygon(coords);
      } catch (e) {
        Alert.alert('Error', e.message || 'Failed to load polygon');
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // AsyncStorage user fetch
  const getStoredUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error retrieving user from AsyncStorage:', error);
      return null;
    }
  };

  const handleNavigation = async () => {
    const user = await getStoredUser();
    if (user) {
      console.log('User found in AsyncStorage, navigating to Home:', user);
      navigation.replace('BottomNavigator', {user});
    } else {
      console.log('No user found in AsyncStorage, navigating to Login');
      navigation.replace('Login');
    }
  };

  // Location update handler (Geolocation)
  const onUserLocationUpdate = useCallback(
    position => {
      if (!position?.coords) return;
      const {latitude, longitude} = position.coords;
      const next = [latitude, longitude];
      setUser(next);

      if (polygon?.length) {
        // Check inside / outside
        setInside(pointInPolygon(next, polygon));

        // Fit map to include polygon + user
        try {
          const coordsForMap = [
            ...polygon.map(([lat, lon]) => ({
              latitude: lat,
              longitude: lon,
            })),
            {latitude, longitude},
          ];

          if (mapRef.current && coordsForMap.length > 0) {
            mapRef.current.fitToCoordinates(coordsForMap, {
              edgePadding: {top: 80, bottom: 80, left: 80, right: 80},
              animated: true,
            });
          }
        } catch (e) {
          // fail silently
        }
      }
    },
    [polygon],
  );

  // Request permission + start watching location
  useEffect(() => {
    let watchId = null;

    (async () => {
      const ok = await requestFineLocation();
      if (!ok) {
        Alert.alert(
          'Permission denied',
          'Enable location permission to continue.',
        );
        return;
      }

      watchId = Geolocation.watchPosition(
        onUserLocationUpdate,
        err => {
          console.log('Location error:', err);
        },
        {
          enableHighAccuracy: true,
          distanceFilter: 5,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    })();

    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, [onUserLocationUpdate]);

  // Polygon for react-native-maps
  const polygonLatLng = useMemo(() => {
    if (!polygon?.length) return [];
    return polygon.map(([lat, lon]) => ({
      latitude: lat,
      longitude: lon,
    }));
  }, [polygon]);

  if (loading) {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <ActivityIndicator />
        <Text>Loading coordinates…</Text>
      </View>
    );
  }

  // Initial region (fallback while we wait for user & fitToCoordinates)
  const initialRegion = {
    latitude: polygonLatLng[0]?.latitude || 18.5204, // Pune default
    longitude: polygonLatLng[0]?.longitude || 73.8567,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  return (
    <View style={{flex: 1}}>
      <MapView
        ref={mapRef}
        style={{flex: 1}}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation={false} // we use our own marker below
      >
        {/* Polygon */}
        {polygonLatLng.length > 0 && (
          <Polygon
            coordinates={polygonLatLng}
            strokeWidth={2}
            strokeColor="#000000"
            fillColor="#ffb7006f"
          />
        )}

        {/* User marker (always show when we have location) */}
        {user && (
          <Marker
            coordinate={{
              latitude: user[0],
              longitude: user[1],
            }}
          />
        )}
      </MapView>

      {inside !== null && (
        <View style={{backgroundColor: '#fff'}}>
          {inside ? (
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
          ) : (
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
          )}
        </View>
      )}
    </View>
  );
}
