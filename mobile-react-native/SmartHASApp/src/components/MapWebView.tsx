import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

interface Props {
  html: string;
  style?: ViewStyle;
}

// Variante nativa (iOS/Android) — usa react-native-webview de verdade.
// A variante para a versão web do app está em MapWebView.web.tsx (o
// Metro escolhe automaticamente o arquivo certo por plataforma).
export default function MapWebView({ html, style }: Props) {
  return (
    <WebView
      originWhitelist={['*']}
      source={{ html }}
      style={[styles.webview, style]}
      javaScriptEnabled
      domStorageEnabled
    />
  );
}

const styles = StyleSheet.create({
  webview: { flex: 1 },
});
