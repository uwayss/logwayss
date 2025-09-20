import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../screens/WelcomeScreen';
import LockScreen from '../screens/LockScreen';
import JournalScreen from '../screens/JournalScreen';
import { Core } from '../core';

export type RootStackParamList = {
  Welcome: { core: Core };
  Lock: { core: Core };
  Journal: { core: Core };
};

const Stack = createStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  core: Core;
  initialRoute: keyof RootStackParamList;
}

export default function AppNavigator({ core, initialRoute }: AppNavigatorProps) {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} initialParams={{ core }} />
        <Stack.Screen name="Lock" component={LockScreen} initialParams={{ core }} />
        <Stack.Screen name="Journal" component={JournalScreen} initialParams={{ core }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}