import React, {useEffect, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {AutoSlider} from '../components/Slider/AutoSlider';
import {fetchSliders} from '../api/sliders';
import {Card} from '../components/common/Card';

export const HomeScreen = () => {
  const [sliders, setSliders] = useState([]);

  useEffect(() => {
    const loadSliders = async () => {
      const sliderData = await fetchSliders();
      setSliders(sliderData);
    };

    loadSliders();
  }, []);

  return (
    <View style={styles.container}>
      <AutoSlider scrollInterval={5000} sliders={sliders} />
      <View style={styles.activitySection}>
        {/* Placeholder for activity cards */}
        <Card title="Statistics" />
        <Card title="Reports" />
        <Card title="Feedback" />
        <Card title="Help" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  activitySection: {
    marginTop: 20,
  },
});
