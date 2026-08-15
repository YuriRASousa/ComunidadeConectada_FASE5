import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { colors } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { Message } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export default function ChatScreen({ route, navigation }: Props) {
  const { resourceId, resourceTitle, offerantId } = route.params;
  const auth = useAuth();
  const chat = useChat();
  const [text, setText] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    navigation.setOptions({ title: resourceTitle });
  }, [navigation, resourceTitle]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!auth.currentUser) return;
      await chat.startRequestFlow({
        currentUserId: auth.currentUser.id,
        isGhost: auth.isGhost,
        resourceId,
        resourceTitle,
        offerantId,
      });
      if (mounted) setIsLoadingHistory(false);
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const messages = chat.getMessagesForResource(resourceId);

  const handleSend = async () => {
    const content = text.trim();
    if (!content || isSending) return;
    if (auth.isGhost) {
      Alert.alert('Smart HAS', 'Crie uma conta para enviar mensagens.');
      return;
    }
    setIsSending(true);
    try {
      await chat.sendMessageToResource(auth.currentUser!.id, resourceId, content);
      setText('');
    } catch (e: any) {
      Alert.alert('Smart HAS', `Não foi possível enviar: ${e.message ?? e}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.scaffoldBg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {isLoadingHistory ? (
        <ActivityIndicator style={{ flex: 1 }} color={colors.primaryBlue} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const isMe = item.isFromMe;
            const isSystem = item.senderId === 'system';
            if (isSystem) {
              return (
                <View style={styles.systemBubble}>
                  <Text style={styles.systemText}>{item.content}</Text>
                </View>
              );
            }
            return (
              <View style={[styles.bubbleRow, { justifyContent: isMe ? 'flex-end' : 'flex-start' }]}>
                <View style={[styles.bubble, isMe ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={{ color: isMe ? colors.white : colors.textDark }}>{item.content}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Pergunte sobre o item..."
          placeholderTextColor={colors.grey400}
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={isSending}>
          {isSending ? <ActivityIndicator size="small" color={colors.white} /> : <Text style={styles.sendIcon}>➤</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  systemBubble: {
    marginVertical: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(14,165,233,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.2)',
  },
  systemText: { color: colors.primaryBlue, fontWeight: 'bold', textAlign: 'center' },
  bubbleRow: { flexDirection: 'row', marginVertical: 4 },
  bubble: { maxWidth: '80%', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 },
  bubbleMine: { backgroundColor: colors.primaryBlue, borderBottomRightRadius: 0 },
  bubbleTheirs: { backgroundColor: colors.white, borderBottomLeftRadius: 0 },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    backgroundColor: colors.scaffoldBg,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    color: colors.textDark,
  },
  sendButton: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: { color: colors.white, fontSize: 16 },
});
