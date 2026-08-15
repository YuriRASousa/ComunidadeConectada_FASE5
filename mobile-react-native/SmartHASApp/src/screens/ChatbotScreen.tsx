import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '../theme/theme';
import { useChat } from '../context/ChatContext';
import type { Message } from '../types';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function ChatbotScreen({ visible, onClose }: Props) {
  const chat = useChat();
  const [text, setText] = useState('');
  const listRef = useRef<FlatList<Message>>(null);

  const handleSend = () => {
    const content = text.trim();
    if (!content) return;
    chat.sendMessageToBot(content);
    setText('');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          style={styles.sheet}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Text style={{ color: colors.white, fontSize: 20 }}>✨</Text>
            </View>
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={styles.title}>ConectaIA</Text>
              <Text style={styles.subtitle}>Inteligência Artificial Comunitária</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 20, color: colors.grey500 }}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />
          <FlatList
            ref={listRef}
            data={chat.botMessages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => (
              <View style={[styles.bubbleRow, { justifyContent: item.isFromMe ? 'flex-end' : 'flex-start' }]}>
                <View style={[styles.bubble, item.isFromMe ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={{ color: item.isFromMe ? colors.white : colors.textDark }}>{item.content}</Text>
                </View>
              </View>
            )}
          />
          <View style={styles.inputArea}>
            <TextInput
              style={styles.input}
              placeholder="Como posso te ajudar?"
              placeholderTextColor={colors.grey400}
              value={text}
              onChangeText={setText}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
              <Text style={{ color: colors.white }}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  sheet: {
    height: '85%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', marginTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryBlue, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.primaryDark },
  subtitle: { fontSize: 12, color: colors.grey600 },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
  bubbleRow: { flexDirection: 'row', marginVertical: 8 },
  bubble: { maxWidth: '75%', padding: 16, borderRadius: 20 },
  bubbleMine: { backgroundColor: colors.primaryBlue, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.scaffoldBg, borderBottomLeftRadius: 4 },
  inputArea: { flexDirection: 'row', alignItems: 'center', padding: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  input: { flex: 1, backgroundColor: colors.scaffoldBg, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12, color: colors.textDark },
  sendButton: { marginLeft: 12, width: 44, height: 44, borderRadius: 16, backgroundColor: colors.primaryBlue, alignItems: 'center', justifyContent: 'center' },
});
