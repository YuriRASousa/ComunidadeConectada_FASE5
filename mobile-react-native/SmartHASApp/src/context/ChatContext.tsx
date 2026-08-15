import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from 'react';
import { api } from '../config/api';
import { Message, messageFromJson } from '../types';
import { generateResponse } from '../services/gemini';

export interface ChatConversation {
  resourceId: string;
  resourceTitle: string;
  offerantId: string;
  lastMessage: Message;
}

interface ChatContextValue {
  botMessages: Message[];
  activeConversations: ChatConversation[];
  getMessagesForResource: (resourceId: string) => Message[];
  startRequestFlow: (args: {
    currentUserId: string;
    isGhost: boolean;
    resourceId: string;
    resourceTitle: string;
    offerantId: string;
  }) => Promise<void>;
  sendMessageToResource: (currentUserId: string, resourceId: string, content: string) => Promise<void>;
  sendMessageToBot: (content: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

const INITIAL_BOT_MESSAGE: Message = {
  id: '1',
  senderId: 'bot',
  content: 'Olá! Eu sou o ConectaIA. Como posso ajudar você hoje?',
  timestamp: new Date().toISOString(),
  isFromMe: false,
};

// Conversas sobre recursos (negociação com o ofertante) são persistidas
// via POST/GET /api/messages no backend Spring Boot. A lista de
// conversas em si continua indexada por recurso localmente na sessão do
// app — o backend agrupa mensagens por usuário, não por recurso;
// reconciliar os dois modelos fica como item de roadmap para a próxima
// fase (mesma simplificação documentada em lib/providers/chat_provider.dart).
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [resourceChats, setResourceChats] = useState<Record<string, Message[]>>({});
  const resourceTitles = useRef<Record<string, string>>({});
  const resourceOfferants = useRef<Record<string, string>>({});
  const [botMessages, setBotMessages] = useState<Message[]>([INITIAL_BOT_MESSAGE]);

  const activeConversations = useMemo<ChatConversation[]>(() => {
    return Object.entries(resourceChats)
      .filter(([, msgs]) => msgs.length > 0)
      .map(([resourceId, msgs]) => ({
        resourceId,
        resourceTitle: resourceTitles.current[resourceId] ?? 'Recurso',
        offerantId: resourceOfferants.current[resourceId] ?? '',
        lastMessage: msgs[msgs.length - 1],
      }))
      .sort((a, b) => new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime());
  }, [resourceChats]);

  const getMessagesForResource = useCallback(
    (resourceId: string) => resourceChats[resourceId] ?? [],
    [resourceChats]
  );

  const startRequestFlow = useCallback(
    async ({ currentUserId, isGhost, resourceId, resourceTitle, offerantId }: {
      currentUserId: string;
      isGhost: boolean;
      resourceId: string;
      resourceTitle: string;
      offerantId: string;
    }) => {
      resourceTitles.current[resourceId] = resourceTitle;
      resourceOfferants.current[resourceId] = offerantId;

      if (resourceChats[resourceId]) return;

      if (isGhost) {
        setResourceChats((prev) => ({
          ...prev,
          [resourceId]: [
            {
              id: 'ghost_init',
              senderId: 'system',
              content: `Crie uma conta para conversar sobre "${resourceTitle}".`,
              timestamp: new Date().toISOString(),
              resourceId,
              isFromMe: true,
            },
          ],
        }));
        return;
      }

      try {
        const response = await api.get(
          `/messages/conversation/${offerantId}?resourceId=${resourceId}`,
          true
        );
        const history: Message[] = (response as any[]).map((json) =>
          messageFromJson(json, currentUserId)
        );

        if (history.length === 0) {
          const initial = await api.post(
            '/messages',
            {
              receiverId: offerantId,
              resourceId,
              content: `Olá! Tenho interesse no recurso: ${resourceTitle}`,
            },
            true
          );
          history.push(messageFromJson(initial, currentUserId));
        }

        setResourceChats((prev) => ({ ...prev, [resourceId]: history }));
      } catch (e: any) {
        setResourceChats((prev) => ({
          ...prev,
          [resourceId]: [
            {
              id: 'error_init',
              senderId: 'system',
              content: `Não foi possível carregar a conversa (${e.message ?? e}).`,
              timestamp: new Date().toISOString(),
              resourceId,
              isFromMe: true,
            },
          ],
        }));
      }
    },
    [resourceChats]
  );

  const sendMessageToResource = useCallback(
    async (currentUserId: string, resourceId: string, content: string) => {
      const offerantId = resourceOfferants.current[resourceId];
      if (!offerantId) return;

      const response = await api.post(
        '/messages',
        { receiverId: offerantId, resourceId, content },
        true
      );
      const message = messageFromJson(response, currentUserId);
      setResourceChats((prev) => ({
        ...prev,
        [resourceId]: [...(prev[resourceId] ?? []), message],
      }));
    },
    []
  );

  const sendMessageToBot = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: String(Date.now()),
      senderId: 'me',
      content,
      timestamp: new Date().toISOString(),
      isFromMe: true,
    };
    setBotMessages((prev) => [...prev, userMessage]);

    const response = await generateResponse(content);

    const botMessage: Message = {
      id: String(Date.now() + 1),
      senderId: 'bot',
      content: response,
      timestamp: new Date().toISOString(),
      isFromMe: false,
    };
    setBotMessages((prev) => [...prev, botMessage]);
  }, []);

  const value = useMemo(
    () => ({
      botMessages,
      activeConversations,
      getMessagesForResource,
      startRequestFlow,
      sendMessageToResource,
      sendMessageToBot,
    }),
    [botMessages, activeConversations, getMessagesForResource, startRequestFlow, sendMessageToResource, sendMessageToBot]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat deve ser usado dentro de ChatProvider');
  return ctx;
}
