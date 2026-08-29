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
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, X, Send } from 'lucide-react-native';
import { colors, gradients } from '../theme/theme';
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
      <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            style={styles.sheet}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.handle} />
            <View style={styles.header}>
              <LinearGradient colors={gradients.brand} style={styles.iconWrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Sparkles color={colors.white} size={20} />
              </LinearGradient>
              <View style={{ marginLeft: 16, flex: 1 }}>
                <Text style={styles.title}>ConectaIA</Text>
                <Text style={styles.subtitle}>Inteligência Artificial Comunitária</Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={10}>
                <X color={colors.grey500} size={22} />
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
              <TouchableOpacity onPress={handleSend} activeOpacity={0.85}>
                <LinearGradient colors={gradients.brand} style={styles.sendButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  <Send color={colors.white} size={18} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    height: '85%',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -6 },
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', marginTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryBlue,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.primaryDark },
  subtitle: { fontSize: 12, color: colors.grey600 },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
  bubbleRow: { flexDirection: 'row', marginVertical: 8 },
  bubble: { maxWidth: '75%', padding: 16, borderRadius: 20 },
  bubbleMine: { backgroundColor: colors.primaryBlue, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.scaffoldBg, borderBottomLeftRadius: 4 },
  inputArea: { flexDirection: 'row', alignItems: 'center', padding: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  input: { flex: 1, backgroundColor: colors.scaffoldBg, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 12, color: colors.textDark },
  sendButton: {
    marginLeft: 12,
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryBlue,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
