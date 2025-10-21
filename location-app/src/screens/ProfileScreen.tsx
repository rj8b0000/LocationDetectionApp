import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { updateUserProfile, fetchUserProfile } from '../api/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = () => {
    const [userData, setUserData] = useState({ name: '', mobile: '', password: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUserProfile = async () => {
            const storedUser = await AsyncStorage.getItem('user');
            if (storedUser) {
                setUserData(JSON.parse(storedUser));
            }
            setLoading(false);
        };
        loadUserProfile();
    }, []);

    const handleUpdateProfile = async () => {
        await updateUserProfile(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
    };

    if (loading) {
        return <Text>Loading...</Text>;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profile</Text>
            <TextInput
                style={styles.input}
                placeholder="Name"
                value={userData.name}
                onChangeText={(text) => setUserData({ ...userData, name: text })}
            />
            <TextInput
                style={styles.input}
                placeholder="Mobile"
                value={userData.mobile}
                onChangeText={(text) => setUserData({ ...userData, mobile: text })}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={userData.password}
                onChangeText={(text) => setUserData({ ...userData, password: text })}
            />
            <Button title="Update Profile" onPress={handleUpdateProfile} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 15,
        paddingHorizontal: 10,
    },
});

export default ProfileScreen;