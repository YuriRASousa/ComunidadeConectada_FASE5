import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { colors } from '../theme/theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export default function OnboardingScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={{ flex: 1 }} />
        <Text style={styles.icon}>🌐</Text>
        <Text style={styles.title}>SMART HAS</Text>
        <Text style={styles.subtitle}>Comunidade Conectada</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.description}>
          Colabore, compartilhe e ajude sua comunidade a crescer de forma sustentável e inteligente.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.replace('Login')}
        >
          <Text style={styles.buttonText}>COMEÇAR AGORA</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { flex: 1, padding: 24, alignItems: 'center' },
  icon: { fontSize: 96, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: 'bold', color: colors.primaryBlue },
  subtitle: { fontSize: 18, color: colors.grey500, marginTop: 4 },
  description: { fontSize: 16, color: '#000000CC', textAlign: 'center', marginBottom: 48 },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: colors.primaryBlue,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  buttonText: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
});
