import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPinned } from 'lucide-react-native';
import { colors } from '../theme/theme';
import { useResources } from '../context/ResourceContext';
import MapWebView from '../components/MapWebView';

// Centro de referência usado no app Flutter original (São Paulo).
const CENTER = { latitude: -23.5631, longitude: -46.6544 };

const CATEGORY_COLOR: Record<string, string> = {
  Ferramentas: '#0EA5E9',
  Saúde: '#EF4444',
  Educação: '#8B5CF6',
  Alimentos: '#F59E0B',
  Eletrônicos: '#06B6D4',
  Outros: '#10B981',
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Monta um mapa Leaflet (OpenStreetMap) real e interativo — pan, zoom,
// pins clicáveis com popup — sem precisar de chave de API do Google Maps.
// O mesmo HTML roda tanto num WebView nativo (iOS/Android) quanto num
// <iframe> na versão web do app (ver MapWebView / MapWebView.web).
function buildMapHtml(resources: { id: string; title: string; category: string; offerantName: string; type: string; latitude: number; longitude: number }[]): string {
  const markers = resources
    .map((r) => {
      const color = CATEGORY_COLOR[r.category] ?? colors.primaryBlue;
      const popup = `
        <div style="font-family:-apple-system,Roboto,sans-serif;min-width:160px">
          <div style="font-weight:700;font-size:14px;color:#0F172A;margin-bottom:2px">${escapeHtml(r.title)}</div>
          <div style="display:inline-block;background:${color}22;color:${color};font-size:10px;font-weight:700;padding:2px 8px;border-radius:8px;margin-bottom:6px">${escapeHtml(r.category.toUpperCase())}</div>
          <div style="font-size:12px;color:#475569">${escapeHtml(r.type)} · ${escapeHtml(r.offerantName)}</div>
        </div>
      `.replace(/\n/g, '').replace(/'/g, "\\'");
      return `L.circleMarker([${r.latitude}, ${r.longitude}], {radius:10, color:'#fff', weight:2, fillColor:'${color}', fillOpacity:0.95}).addTo(map).bindPopup('${popup}');`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
    .leaflet-popup-content-wrapper { border-radius: 12px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map', { zoomControl: true }).setView([${CENTER.latitude}, ${CENTER.longitude}], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    L.circleMarker([${CENTER.latitude}, ${CENTER.longitude}], {radius:6, color:'#0F172A', weight:2, fillColor:'#0F172A', fillOpacity:0.5}).addTo(map);
    ${markers}
  </script>
</body>
</html>`;
}

export default function MapScreen() {
  const { resources } = useResources();

  const withLocation = useMemo(
    () => resources.filter((r) => r.latitude != null && r.longitude != null) as (typeof resources[number] & { latitude: number; longitude: number })[],
    [resources]
  );

  const mapHtml = useMemo(() => buildMapHtml(withLocation), [withLocation]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <MapPinned color={colors.primaryDark} size={20} />
        <Text style={styles.headerTitle}>Mapa da Comunidade</Text>
        <Text style={styles.headerCount}>{withLocation.length}</Text>
      </View>
      {withLocation.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Nenhum recurso com localização disponível.</Text>
        </View>
      ) : (
        <MapWebView html={mapHtml} style={{ flex: 1 }} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.scaffoldBg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, backgroundColor: colors.white },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.primaryDark, flex: 1 },
  headerCount: {
    backgroundColor: colors.scaffoldBg,
    color: colors.grey600,
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.grey600 },
});
