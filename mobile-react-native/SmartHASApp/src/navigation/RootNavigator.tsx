import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme/theme';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import MainTabs from './MainTabs';
import ResourceDetailScreen from '../screens/ResourceDetailScreen';
import ChatScreen from '../screens/ChatScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Onboarding"
      screenOptions={{
        headerTintColor: colors.primaryDark,
        headerTitleStyle: { fontWeight: 'bold' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="ResourceDetail"
        component={ResourceDetailScreen}
        options={{ title: 'Detalhes do Recurso' }}
      />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Conversa' }} />
    </Stack.Navigator>
  );
}
