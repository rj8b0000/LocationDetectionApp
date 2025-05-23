import * as React from 'react';
import {useState, useEffect, useRef} from 'react';
import {StyleSheet, View, Alert, PermissionsAndroid} from 'react-native';
import {WebView} from 'react-native-webview';
import Geolocation from '@react-native-community/geolocation';

export default function App() {
  const [userLocation, setUserLocation] = useState(null);
  const [isInsidePolygon, setIsInsidePolygon] = useState(null);
  const webViewRef = useRef(null);

  const polygonCoordinates = [
    [23.101493576644984, 72.539731264144],
    [23.10141462858724, 72.54059493541719],
    [23.099919540983777, 72.5402194261551],
    [23.100181059158132, 72.5389748811722],
  ];

  const isPointInPolygon = (point, polygon) => {
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

  // Function to fetch location and trigger alert
  const fetchLocationAndAlert = () => {
    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude, accuracy} = position.coords;
        console.log('Location Update:', {
          latitude,
          longitude,
          accuracy,
          timestamp: position.timestamp,
        });
        setUserLocation([latitude, longitude]);
        const inside = isPointInPolygon(
          [latitude, longitude],
          polygonCoordinates,
        );
        setIsInsidePolygon(inside);
        // Show alert on every update
        Alert.alert(
          'Location Update',
          `You are ${
            inside ? 'inside' : 'outside'
          } the polygon\nLat: ${latitude}, Lng: ${longitude}\nAccuracy: ${accuracy}m`,
          [{text: 'OK'}],
        );
        if (webViewRef.current) {
          console.log('Sending location update to WebView:', {
            lat: latitude,
            lng: longitude,
          });
          webViewRef.current.postMessage(
            JSON.stringify({lat: latitude, lng: longitude}),
          );
        }
      },
      error => {
        console.log('GetCurrentPosition Error:', error);
        let errorMessage = error.message;
        if (error.code === 2) {
          errorMessage +=
            '. Please ensure location services are enabled and GPS is available. Try going outside for a better signal.';
        } else if (error.code === 3) {
          errorMessage +=
            '. The device took too long to retrieve the location. Ensure you have a clear view of the sky for GPS, or try using network-based location.';
        }
        Alert.alert('Error', 'Failed to get location: ' + errorMessage, [
          {text: 'OK'},
        ]);
      },
      {enableHighAccuracy: true, timeout: 10000, maximumAge: 0},
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

      // Initial location fetch
      fetchLocationAndAlert();

      // Set up a timer to fetch location every 2 seconds
      const intervalId = setInterval(() => {
        fetchLocationAndAlert();
      }, 10000); // 2000 ms = 2 seconds

      // Cleanup on unmount
      return () => clearInterval(intervalId);
    };

    initializeLocation();
  }, []); // No dependencies to prevent re-render loop

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
        /* CSS for the custom marker */
        .custom-marker {
          width: 20px;
          height: 20px;
          background-color: red;
          border: 2px solid darkred;
          border-radius: 50%;
          transform: translate(-50%, -50%); /* Center the marker on the position */
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
        // Initialize the map
        const map = L.map('map').setView([23.0250, 72.5850], 14); // Center on Ahmedabad initially

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Hardcoded polygon coordinates for Ahmedabad
        var polygonCoords = ${JSON.stringify(polygonCoordinates)};
        var hardcodedPolygon = L.polygon(polygonCoords, { color: '#000', weight: 2 }).addTo(map);

        // Variable to hold the user location marker
        var userMarker;

        // Initialize the Leaflet.Draw plugin
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

        // Event listener for shape creation
        map.on(L.Draw.Event.CREATED, function (event) {
          const layer = event.layer;

          if (event.layerType === 'polygon') {
            // Get polygon coordinates
            const coordinates = layer.getLatLngs()[0].map((latLng) => ({
              latitude: latLng.lat,
              longitude: latLng.lng,
            }));
            console.log('Polygon Coordinates:', coordinates);
            // Send coordinates to React Native
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'drawnShape',
              shapeType: 'polygon',
              coordinates: coordinates,
            }));
          }

          if (event.layerType === 'circle') {
            // Get circle center and radius
            const center = layer.getLatLng();
            const radius = layer.getRadius();
            console.log('Circle Center:', { latitude: center.lat, longitude: center.lng });
            console.log('Circle Radius (meters):', radius);
            // Send circle data to React Native
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'drawnShape',
              shapeType: 'circle',
              center: { latitude: center.lat, longitude: center.lng },
              radius: radius,
            }));
          }

          // Add the layer to the map
          drawnItems.addLayer(layer);
        });

        // Listen for location updates from React Native
        window.addEventListener('message', function (event) {
          try {
            var location = JSON.parse(event.data);
            var lat = location.lat;
            var lng = location.lng;
            console.log('WebView received location:', { lat, lng });

            // Remove previous marker if it exists
            if (userMarker) {
              console.log('Removing previous marker');
              map.removeLayer(userMarker);
            }

            // Add new marker for user location using L.divIcon with CSS
            userMarker = L.marker([lat, lng], {
              icon: L.divIcon({
                className: 'custom-marker',
                html: '<div></div>', // The div is styled by the custom-marker class
                iconSize: [20, 20], // Size of the marker
                iconAnchor: [10, 10], // Center the marker on the position
                popupAnchor: [0, -10] // Position the popup above the marker
              })
            }).addTo(map)
              .bindPopup('Your Location')
              .openPopup();

            console.log('Marker added at:', { lat, lng });

            // Center the map on the user's location
            map.setView([lat, lng], 14);
            console.log('Map centered at:', { lat, lng });
          } catch (e) {
            console.error('Error parsing location data:', e);
          }
        });

        // Notify React Native that the map is ready
        window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'mapLoaded' }));
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{html: htmlContent}}
        style={styles.webview}
        onMessage={event => {
          const data = JSON.parse(event.nativeEvent.data);
          if (data.status === 'mapLoaded') {
            console.log('Map loaded in WebView');
            // Send initial location if available
            if (userLocation && webViewRef.current) {
              console.log('Sending initial location after map load:', {
                lat: userLocation[0],
                lng: userLocation[1],
              });
              webViewRef.current.postMessage(
                JSON.stringify({lat: userLocation[0], lng: userLocation[1]}),
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
        onError={contraceptivesyntheticEvent => {
          const {nativeEvent} = contraceptivesyntheticEvent;
          console.log('WebView Error:', nativeEvent);
          Alert.alert('Error', 'Failed to load map.', [{text: 'OK'}]);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  webview: {flex: 1},
});
