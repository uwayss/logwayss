import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Core } from './src/core';
import { completeExpoPlatform } from './src/platform/complete-expo-platform';
import * as FileSystem from 'expo-file-system';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const [core] = useState(() => new Core(completeExpoPlatform));
  const [initialRoute, setInitialRoute] = useState<'Welcome' | 'Lock'>('Welcome');
  const [isInitialized, setIsInitialized] = useState(false);

  const dataDir = `${FileSystem.documentDirectory}logwayss`;

  useEffect(() => {
    // Check if profile exists
    checkProfileExists();
  }, []);

  const checkProfileExists = async () => {
    try {
      // Try to read the profile file to see if it exists
      const profilePath = `${dataDir}/profile.db`;
      const fileInfo = await FileSystem.getInfoAsync(profilePath);
      
      if (fileInfo.exists) {
        setInitialRoute('Lock');
      } else {
        setInitialRoute('Welcome');
      }
      setIsInitialized(true);
    } catch (error) {
      // If we can't check, default to welcome screen
      setInitialRoute('Welcome');
      setIsInitialized(true);
    }
  };

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <StatusBar style="auto" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppNavigator core={core} initialRoute={initialRoute} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});