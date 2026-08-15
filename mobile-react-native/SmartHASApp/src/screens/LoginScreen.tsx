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
import { colors } from '../theme/theme';
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
        <Text style={styles.icon}>🌐</Text>
        <Text style={styles.title}>{isRegistering ? 'Criar Conta' : 'Bem-vindo de volta'}</Text>

        {isRegistering && (
          <TextInput
            style={styles.input}
            placeholder="Nome Completo"
            placeholderTextColor={colors.grey400}
            value={name}
            onChangeText={setName}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor={colors.grey400}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor={colors.grey400}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {isRegistering && (
          <TextInput
            style={styles.input}
            placeholder="Endereço (Cidade/Estado)"
            placeholderTextColor={colors.grey400}
            value={address}
            onChangeText={setAddress}
          />
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={auth.isLoading}
        >
          {auth.isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>{isRegistering ? 'CADASTRAR' : 'ENTRAR'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsRegistering(!isRegistering)} style={{ marginTop: 16 }}>
          <Text style={styles.link}>
            {isRegistering ? 'Já tem uma conta? Entre aqui' : 'Não tem conta? Cadastre-se agora'}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.guestButton} onPress={handleGuest}>
          <Text style={styles.guestButtonText}>ENTRAR COMO VISITANTE</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scroll: { paddingHorizontal: 30, paddingTop: 60, paddingBottom: 40, alignItems: 'stretch' },
  icon: { fontSize: 56, textAlign: 'center', marginBottom: 16 },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primaryDark,
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    fontSize: 15,
    color: colors.textDark,
  },
  button: {
    height: 55,
    backgroundColor: colors.primaryBlue,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  link: { color: colors.primaryBlue, textAlign: 'center' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 32 },
  guestButton: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestButtonText: { color: colors.primaryBlue, fontWeight: 'bold' },
});
