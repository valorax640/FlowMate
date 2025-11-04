import React, {useEffect} from 'react';
import {View, Text, Image, StyleSheet, Animated} from 'react-native';
import {APP_COLORS} from '../constants/expenseCategories';

const SplashScreen = ({onFinish}) => {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after 2.5 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}],
          },
        ]}>
        <Image
          source={require('../../assets/image/expenses.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>FlowMate</Text>
        <Text style={styles.tagline}>Track Smart. Spend Wise.</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: APP_COLORS.primary,
    marginBottom: 8,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: APP_COLORS.text,
    opacity: 0.9,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});

export default SplashScreen;
