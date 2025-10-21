import React, {useEffect, useState} from 'react';
import {View, FlatList, Image, StyleSheet} from 'react-native';
import {fetchSliders} from '../../api/sliders';

const AutoSlider = () => {
  const [sliders, setSliders] = useState<{id: number; imageUrl: string}[]>([]);

  useEffect(() => {
    const loadSliders = async () => {
      const sliderData = await fetchSliders();
      setSliders(sliderData);
    };

    loadSliders();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={sliders}
        renderItem={({item}) => (
          <Image source={{uri: item.imageUrl}} style={styles.image} />
        )}
        keyExtractor={item => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        onMomentumScrollEnd={event => {
          const index = Math.floor(
            event.nativeEvent.contentOffset.x /
              event.nativeEvent.layoutMeasurement.width,
          );
          // Handle auto-scroll logic here if needed
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 200, // Adjust height as needed
  },
  image: {
    width: 300, // Adjust width as needed
    height: '100%',
    resizeMode: 'cover',
  },
});

export default AutoSlider;
