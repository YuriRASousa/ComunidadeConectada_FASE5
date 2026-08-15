import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../theme/theme';
import { useResources } from '../context/ResourceContext';
import HomeScreen from '../screens/HomeScreen';
import ChatListScreen from '../screens/ChatListScreen';
import OfferResourceScreen from '../screens/OfferResourceScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, string> = {
  Home: '🏠',
  Chats: '💬',
  Ofertar: '➕',
  Mapa: '🗺️',
  Perfil: '👤',
};

export default function MainTabs() {
  const { fetchResources } = useResources();
  const [botVisible, setBotVisible] = useState(false);

  useEffect(() => {
    fetchResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primaryBlue,
          tabBarInactiveTintColor: colors.slate400,
          tabBarStyle: { backgroundColor: colors.primaryDark, borderTopWidth: 0 },
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>{ICONS[route.name]}</Text>,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
        <Tab.Screen name="Chats" component={ChatListScreen} options={{ title: 'Chats' }} />
        <Tab.Screen name="Ofertar" component={OfferResourceScreen} options={{ title: 'Ofertar' }} />
        <Tab.Screen name="Mapa" component={MapScreen} options={{ title: 'Mapa' }} />
        <Tab.Screen name="Perfil" component={ProfileScreen} options={{ title: 'Perfil' }} />
      </Tab.Navigator>

      <TouchableOpacity style={styles.fab} onPress={() => setBotVisible(true)} activeOpacity={0.85}>
        <Text style={{ color: colors.white, fontSize: 22 }}>✨</Text>
      </TouchableOpacity>

      <ChatbotScreen visible={botVisible} onClose={() => setBotVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 84,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.primaryBlue,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
});
