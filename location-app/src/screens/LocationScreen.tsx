import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { fetchCoordinates } from '../api/coordinates';
import { isInsidePolygon } from '../components/Map/PolygonCheck';
import { getCurrentLocation } from '../utils/locationService'; // Assume this utility fetches the user's current location

const LocationScreen = () => {
    const [coordinates, setCoordinates] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [isInside, setIsInside] = useState(false);

    useEffect(() => {
        const loadCoordinates = async () => {
            const coords = await fetchCoordinates();
            setCoordinates(coords);
        };

        loadCoordinates();
        getCurrentLocation().then(location => {
            setUserLocation(location);
            if (location) {
                const inside = isInsidePolygon(location, coordinates);
                setIsInside(inside);
            }
        });
    }, [coordinates]);

    const handleContinue = () => {
        Alert.alert("You are inside the allowed region. Continuing to the app...");
        // Navigate to the next screen or perform the next action
    };

    const handleOutside = () => {
        Alert.alert("You are outside the allowed region.");
    };

    return (
        <View style={{ flex: 1 }}>
            <WebView
                source={{ uri: 'https://your-leaflet-map-url.com' }} // Replace with your Leaflet map URL
                style={{ flex: 1 }}
            />
            {userLocation && (
                <View>
                    {isInside ? (
                        <Button title="Continue to App" onPress={handleContinue} />
                    ) : (
                        <Text>You are outside the allowed region</Text>
                    )}
                </View>
            )}
        </View>
    );
};

export default LocationScreen;