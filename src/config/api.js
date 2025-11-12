import axios from 'axios';

// Replace with your actual base URL
export const BASE_URL = 'http://localhost:8080/api'; // Update this with your actual API base URL

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API endpoints
export const API_ENDPOINTS = {
  SPLASH_IMAGE: '/splash-image/local',
};

// API functions
export const getSplashImage = async () => {
  try {
    const response = await apiClient.get(API_ENDPOINTS.SPLASH_IMAGE);
    return response.data;
  } catch (error) {
    console.error('Error fetching splash image:', error);
    throw error;
  }
};
