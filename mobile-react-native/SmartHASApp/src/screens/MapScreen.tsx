import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/theme';
import { useResources } from '../context/ResourceContext';
import type { Resource } from '../types';

// Centro de referência usado no app Flutter original (São Paulo).
const CENTER = { latitude: -23.5631, longitude: -46.6544 };

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// NOTA DE IMPLEMENTAÇÃO: a tela original em Flutter usava google_maps_flutter
// com um mapa nativo interativo. Tentamos replicar com react-native-maps,
// mas essa biblioteca exige uma chave de API do Google Maps configurada no
// AndroidManifest para renderizar os tiles no Android — chave que não está
// disponível neste ambiente. Para não travar a tela com um mapa em branco
// (ou crash nativo por falta de chave), substituímos por uma lista
// ordenada por distância até um ponto de referência, mostrando as mesmas
// coordenadas que apareceriam nos marcadores do mapa. Ver README para
// instruções de como reativar o mapa nativo caso uma chave seja fornecida.
export default function MapScreen() {
  const { resources } = useResources();

  const withDistance = useMemo(() => {
    return resources
      .filter((r) => r.latitude != null && r.longitude != null)
      .map((r) => ({
        resource: r,
        distance: distanceKm(CENTER.latitude, CENTER.longitude, r.latitude!, r.longitude!),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [resources]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mapa da Comunidade</Text>
        <Text style={styles.headerSubtitle}>
          Modo lista (mapa nativo requer chave do Google Maps — ver README)
        </Text>
      </View>
      {withDistance.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Nenhum recurso com localização disponível.</Text>
        </View>
      ) : (
        <FlatList
          data={withDistance}
          keyExtractor={(item) => item.resource.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.pin}>
                <Text>📍</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.title}>{item.resource.title}</Text>
                <Text style={styles.category}>{item.resource.category}</Text>
                <Text style={styles.coords}>
                  {item.resource.latitude!.toFixed(4)}, {item.resource.longitude!.toFixed(4)}
                </Text>
              </View>
              <Text style={styles.distance}>{item.distance.toFixed(1)} km</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.scaffoldBg },
  header: { padding: 16, backgroundColor: colors.white },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.primaryDark },
  headerSubtitle: { color: colors.grey500, fontSize: 12, marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.grey600 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  pin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(14,165,233,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontWeight: 'bold', color: colors.textDark },
  category: { color: colors.grey600, fontSize: 12, marginTop: 2 },
  coords: { color: colors.grey500, fontSize: 11, marginTop: 2 },
  distance: { color: colors.primaryBlue, fontWeight: 'bold' },
});
