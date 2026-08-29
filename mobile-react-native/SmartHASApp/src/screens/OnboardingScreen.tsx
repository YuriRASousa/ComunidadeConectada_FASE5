import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Share2 } from 'lucide-react-native';
import { colors, gradients } from '../theme/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export default function OnboardingScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={{ flex: 1 }} />
        <LinearGradient colors={gradients.brand} style={styles.iconBadge}>
          <Share2 color={colors.white} size={56} strokeWidth={1.75} />
        </LinearGradient>
        <Text style={styles.title}>SMART HAS</Text>
        <Text style={styles.subtitle}>Comunidade Conectada</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.description}>
          Colabore, compartilhe e ajude sua comunidade a crescer de forma sustentável e inteligente.
        </Text>
        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.9}
          onPress={() => navigation.replace('Login')}
        >
          <LinearGradient colors={gradients.brand} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.buttonText}>COMEÇAR AGORA</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { flex: 1, padding: 24, alignItems: 'center' },
  iconBadge: {
    width: 128,
    height: 128,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: colors.primaryBlue,
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  title: { fontSize: 32, fontWeight: 'bold', color: colors.primaryDark, letterSpacing: 1 },
  subtitle: { fontSize: 18, color: colors.grey500, marginTop: 4 },
  description: { fontSize: 16, color: '#000000CC', textAlign: 'center', marginBottom: 32 },
  button: { width: '100%', height: 56, borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  buttonGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: colors.white, fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
});
