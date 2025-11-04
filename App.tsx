import React, {useEffect} from 'react';
import {StatusBar, Platform} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import {DateProvider} from './src/context/DateContext';
import {APP_COLORS} from './src/constants/expenseCategories';

const App = () => {
  useEffect(() => {
    // Set status bar style on mount
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(APP_COLORS.cardBackground);
      StatusBar.setBarStyle('dark-content');
    }
  }, []);

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