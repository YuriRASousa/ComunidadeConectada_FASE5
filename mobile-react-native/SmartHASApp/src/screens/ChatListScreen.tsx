import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/theme';
import { useChat } from '../context/ChatContext';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { RootStackParamList, MainTabParamList } from '../navigation/types';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Chats'>,
  NativeStackScreenProps<RootStackParamList>
>;

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function ChatListScreen({ navigation }: Props) {
  const { activeConversations } = useChat();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Conversas</Text>
      </View>
      {activeConversations.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>Nenhuma conversa ainda</Text>
          <Text style={styles.emptySubtitle}>Suas conversas com ofertantes aparecerão aqui.</Text>
        </View>
      ) : (
        <FlatList
          data={activeConversations}
          keyExtractor={(item) => item.resourceId}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() =>
                navigation.navigate('Chat', {
                  resourceId: item.resourceId,
                  resourceTitle: item.resourceTitle,
                  offerantId: item.offerantId,
                })
              }
            >
              <View style={styles.avatar}>
                <Text>📦</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.rowTitle}>{item.resourceTitle}</Text>
                <Text style={styles.rowSubtitle} numberOfLines={1}>
                  {item.lastMessage.content}
                </Text>
              </View>
              <Text style={styles.time}>{formatTime(item.lastMessage.timestamp)}</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.primaryDark },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { color: colors.grey600, fontSize: 18 },
  emptySubtitle: { color: colors.grey500, marginTop: 8, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(14,165,233,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontWeight: 'bold', fontSize: 16, color: colors.textDark },
  rowSubtitle: { color: colors.grey600, marginTop: 2 },
  time: { fontSize: 12, color: colors.grey500 },
  separator: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 80 },
});
