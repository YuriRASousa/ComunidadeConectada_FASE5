import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Share2, User, Mail, Lock, MapPin, EyeOff } from 'lucide-react-native';
import { colors, gradients } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const auth = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Smart HAS', 'E-mail e senha são obrigatórios.');
      return;
    }
    try {
      if (isRegistering) {
        if (!name) {
          Alert.alert('Smart HAS', 'Por favor, preencha seu nome.');
          return;
        }
        await auth.register(name, email, address, password);
      } else {
        await auth.login(email, password);
      }
      navigation.replace('Main');
    } catch (e: any) {
      Alert.alert('Smart HAS', e.message ?? String(e));
    }
  };

  const handleGuest = () => {
    auth.loginAsGhost();
    navigation.replace('Main');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <LinearGradient colors={gradients.brand} style={styles.iconBadge}>
          <Share2 color={colors.white} size={38} strokeWidth={1.75} />
        </LinearGradient>
        <Text style={styles.title}>{isRegistering ? 'Criar Conta' : 'Bem-vindo de volta'}</Text>

        {isRegistering && (
          <View style={styles.inputWrap}>
            <User color={colors.primaryBlue} size={19} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nome Completo"
              placeholderTextColor={colors.grey400}
              value={name}
              onChangeText={setName}
            />
          </View>
        )}
        <View style={styles.inputWrap}>
          <Mail color={colors.primaryBlue} size={19} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor={colors.grey400}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        <View style={styles.inputWrap}>
          <Lock color={colors.primaryBlue} size={19} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor={colors.grey400}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>
        {isRegistering && (
          <View style={styles.inputWrap}>
            <MapPin color={colors.primaryBlue} size={19} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Endereço (Cidade/Estado)"
              placeholderTextColor={colors.grey400}
              value={address}
              onChangeText={setAddress}
            />
          </View>
        )}

        <TouchableOpacity style={styles.button} activeOpacity={0.9} onPress={handleSubmit} disabled={auth.isLoading}>
          <LinearGradient colors={gradients.brand} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {auth.isLoading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.buttonText}>{isRegistering ? 'CADASTRAR' : 'ENTRAR'}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={{ marginTop: 16 }}>
          <Text style={styles.link}>
            {isRegistering ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Cadastre-se agora'}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.guestButton} onPress={handleGuest}>
          <EyeOff color={colors.primaryBlue} size={17} />
          <Text style={styles.guestButtonText}>ENTRAR COMO VISITANTE</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scroll: { paddingHorizontal: 30, paddingTop: 60, paddingBottom: 40, alignItems: 'stretch' },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: colors.primaryBlue,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primaryDark,
    textAlign: 'center',
    marginBottom: 32,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textDark,
  },
  button: { height: 55, borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  buttonGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  link: { color: colors.primaryBlue, textAlign: 'center' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 32 },
  guestButton: {
    flexDirection: 'row',
    gap: 8,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestButtonText: { color: colors.primaryBlue, fontWeight: 'bold' },
});
