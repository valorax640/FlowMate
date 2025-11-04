import React, {useEffect, useState} from 'react';
import {StatusBar, Platform} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';
import {DateProvider} from './src/context/DateContext';
import {APP_COLORS} from './src/constants/expenseCategories';

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Set status bar style on mount
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(APP_COLORS.cardBackground);
      StatusBar.setBarStyle('dark-content');
    }
  }, []);

  if (showSplash) {
    return (
      <GestureHandlerRootView style={{flex: 1}}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={APP_COLORS.cardBackground}
          translucent={false}
        />
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <DateProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={APP_COLORS.cardBackground}
          translucent={false}
        />
        <AppNavigator />
      </DateProvider>
    </GestureHandlerRootView>
  );
};

export default App;