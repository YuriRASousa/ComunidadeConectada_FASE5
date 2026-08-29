import React from 'react';
import { ViewStyle } from 'react-native';

interface Props {
  html: string;
  style?: ViewStyle;
}

// Variante web (react-native-webview não tem implementação para web) —
// o mesmo HTML do mapa Leaflet roda direto num <iframe>.
export default function MapWebView({ html, style }: Props) {
  return (
    <iframe
      srcDoc={html}
      style={{ flex: 1, border: 'none', width: '100%', height: '100%', ...(style as any) }}
      title="Mapa da Comunidade"
    />
  );
}
