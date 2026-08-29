import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, MessageCircle, Plus, Map, User, Sparkles } from 'lucide-react-native';
import { colors, gradients } from '../theme/theme';
import { useResources } from '../context/ResourceContext';
import HomeScreen from '../screens/HomeScreen';
import ChatListScreen from '../screens/ChatListScreen';
import OfferResourceScreen from '../screens/OfferResourceScreen';
import MapScreen from '../screens/MapScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, typeof Home> = {
  Home,
  Chats: MessageCircle,
  Ofertar: Plus,
  Mapa: Map,
  Perfil: User,
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
          tabBarStyle: {
            backgroundColor: colors.primaryDark,
            borderTopWidth: 0,
            height: 76,
            paddingBottom: 14,
            paddingTop: 8,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
          tabBarItemStyle: { paddingTop: 2 },
          tabBarIcon: ({ color, focused }) => {
            const Icon = TAB_ICONS[route.name];
            if (route.name === 'Ofertar') {
              return (
                <View style={[styles.offerBadge, focused && styles.offerBadgeFocused]}>
                  <Icon color={colors.white} size={18} strokeWidth={2.5} />
                </View>
              );
            }
            return <Icon color={color} size={21} strokeWidth={focused ? 2.3 : 1.9} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
        <Tab.Screen name="Chats" component={ChatListScreen} options={{ title: 'Chats' }} />
        <Tab.Screen name="Ofertar" component={OfferResourceScreen} options={{ title: 'Ofertar' }} />
        <Tab.Screen name="Mapa" component={MapScreen} options={{ title: 'Mapa' }} />
        <Tab.Screen name="Perfil" component={ProfileScreen} options={{ title: 'Perfil' }} />
      </Tab.Navigator>

      <TouchableOpacity style={styles.fabWrap} onPress={() => setBotVisible(true)} activeOpacity={0.85}>
        <LinearGradient colors={gradients.brand} style={styles.fab} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Sparkles color={colors.white} size={24} />
        </LinearGradient>
      </TouchableOpacity>

      <ChatbotScreen visible={botVisible} onClose={() => setBotVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  fabWrap: {
    position: 'absolute',
    right: 20,
    bottom: 96,
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 6,
    shadowColor: colors.primaryBlue,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  fab: {
    flex: 1,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.secondaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerBadgeFocused: {
    backgroundColor: '#0DA271',
  },
});
