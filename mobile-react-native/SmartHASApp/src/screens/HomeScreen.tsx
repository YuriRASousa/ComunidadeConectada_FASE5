import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, WifiOff } from 'lucide-react-native';
import { colors, gradients } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { useResources } from '../context/ResourceContext';
import ResourceCard from '../components/ResourceCard';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { RootStackParamList, MainTabParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function HomeScreen({ navigation }: Props) {
  const auth = useAuth();
  const { resources, isLoading, error, fetchResources } = useResources();
  const firstName = auth.currentUser?.name.split(' ')[0] ?? 'Visitante';

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={gradients.dark} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={styles.greeting}>Olá, {firstName}!</Text>
        <Text style={styles.subGreeting}>O que você precisa hoje?</Text>
        <View style={styles.searchBox}>
          <Search color={colors.primaryBlue} size={18} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar recursos ou ajuda..."
            placeholderTextColor={colors.grey400}
          />
        </View>
      </LinearGradient>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Destaques na Região</Text>
        <Text style={styles.sectionAction}>Ver todos</Text>
      </View>

      {isLoading && resources.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.primaryBlue} />
      ) : error && resources.length === 0 ? (
        <View style={styles.centerBox}>
          <WifiOff color={colors.grey400} size={40} style={{ marginBottom: 12 }} />
          <Text style={styles.errorText}>Não foi possível carregar os recursos.{'\n'}{error}</Text>
          <TouchableOpacity onPress={() => fetchResources()}>
            <Text style={styles.retry}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : resources.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyText}>Nenhum recurso disponível ainda.</Text>
        </View>
      ) : (
        <FlatList
          data={resources}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <ResourceCard
              resource={item}
              onPress={() => navigation.navigate('ResourceDetail', { resourceId: item.id })}
              onAction={() =>
                navigation.navigate('Chat', {
                  resourceId: item.id,
                  resourceTitle: item.title,
                  offerantId: item.offerantId,
                })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.scaffoldBg },
  header: { backgroundColor: colors.primaryDark, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24 },
  greeting: { color: colors.white, fontSize: 24, fontWeight: 'bold' },
  subGreeting: { color: '#CBD5E1', fontSize: 16, marginTop: 6 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    height: 50,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  searchInput: { flex: 1, color: colors.textDark },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.primaryDark },
  sectionAction: { color: colors.primaryBlue, fontWeight: '600' },
  centerBox: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 40 },
  errorText: { color: colors.grey600, textAlign: 'center', marginBottom: 12 },
  retry: { color: colors.primaryBlue, fontWeight: 'bold' },
  emptyText: { color: colors.grey600 },
});
