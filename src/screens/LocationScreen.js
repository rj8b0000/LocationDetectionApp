import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  ActivityIndicator,
  Alert,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {Button, Text} from 'react-native-paper';
import {TouchableOpacity} from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

MapLibreGL.setAccessToken(null);

const EMPTY_BASE_STYLE = {
  version: 8,
  name: 'Empty',
  sources: {},
  layers: [
    {id: 'bg', type: 'background', paint: {'background-color': '#f8f4f0'}},
  ],
};

const requestFineLocation = async () => {
  if (Platform.OS !== 'android') return true;
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

const computeBounds = (polygon, user) => {
  let minLat = Infinity,
    minLon = Infinity,
    maxLat = -Infinity,
    maxLon = -Infinity;
  const all = [...polygon, user];
  for (const [lat, lon] of all) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
  }
  return {ne: [maxLon, maxLat], sw: [minLon, minLat]}; // [lon, lat]
};

export default function LocationGate({navigation}) {
  const [loading, setLoading] = useState(true);
  const [polygon, setPolygon] = useState([]); // [[lat, lon], ...]
  const [user, setUser] = useState(null); // [lat, lon]
  const [inside, setInside] = useState(null);
  const cameraRef = useRef(null);
  // const navigation = useNavigation();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const resp = await fetch('http://147.93.110.242:8080/api/coordinates');
        const data = await resp.json();
        if (!resp.ok) throw new Error('Failed to fetch polygon');
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

  useEffect(() => {
    (async () => {
      const ok = await requestFineLocation();
      if (!ok)
        Alert.alert(
          'Permission denied',
          'Enable location permission to continue.',
        );
    })();
  }, []);
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
  const onUserLocationUpdate = useCallback(
    loc => {
      if (!loc?.coords) return;
      const {latitude, longitude} = loc.coords;
      const next = [latitude, longitude];
      setUser(next);

      if (polygon?.length) {
        setInside(pointInPolygon(next, polygon));
        try {
          const {ne, sw} = computeBounds(polygon, next);
          cameraRef.current?.fitBounds(ne, sw, 80, 80, 80, 80, 600);
        } catch {}
      }
    },
    [polygon],
  );

  const polygonGeoJSON = useMemo(() => {
    if (!polygon?.length) return null;
    const ring = polygon.map(([lat, lon]) => [lon, lat]); // to [lon, lat]
    const closed =
      ring[0][0] === ring[ring.length - 1][0] &&
      ring[0][1] === ring[ring.length - 1][1]
        ? ring
        : [...ring, ring[0]];
    return {
      type: 'Feature',
      geometry: {type: 'Polygon', coordinates: [closed]},
      properties: {},
    };
  }, [polygon]);

  if (loading) {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <ActivityIndicator />
        <Text>Loading coordinates…</Text>
      </View>
    );
  }

  return (
    <View style={{flex: 1}}>
      <MapLibreGL.MapView
        style={{flex: 1}}
        styleJSON={EMPTY_BASE_STYLE}
        compassEnabled
        logoEnabled={false}>
        <MapLibreGL.Camera ref={cameraRef} zoomLevel={12} />

        {/* Leaflet-like base (OSM raster) */}
        <MapLibreGL.RasterSource
          id="osm"
          tileSize={256}
          tileUrlTemplates={[
            'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
            'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
          ]}>
          <MapLibreGL.RasterLayer id="osm-layer" sourceID="osm" />
        </MapLibreGL.RasterSource>

        {/* Your polygon */}
        {polygonGeoJSON && (
          <MapLibreGL.ShapeSource id="poly" shape={polygonGeoJSON}>
            <MapLibreGL.FillLayer
              id="polyFill"
              style={{
                fillColor: '#ffb7006f',
                fillOutlineColor: '#000',
              }}
            />
          </MapLibreGL.ShapeSource>
        )}

        {/* User location stream */}
        <MapLibreGL.UserLocation
          visible
          onUpdate={onUserLocationUpdate}
          showsUserHeadingIndicator
        />
      </MapLibreGL.MapView>

      {inside !== null && (
        <View style={{backgroundColor: '#fff'}}>
          {inside ? (
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
}
