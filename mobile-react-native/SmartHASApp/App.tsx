import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ResourceProvider } from './src/context/ResourceContext';
import { ChatProvider } from './src/context/ChatContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ResourceProvider>
          <ChatProvider>
            <NavigationContainer>
              <RootNavigator />
              <StatusBar style="dark" />
            </NavigationContainer>
          </ChatProvider>
        </ResourceProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
