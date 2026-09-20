import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'client';
  recipientId: string;
  recipientName: string;
  content: string;
  read: boolean;
  createdAt: string;
  attachments?: string[];
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantEmail: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: Message[];
}

interface MessageContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  setActiveConversation: (conversation: Conversation | null) => void;
  sendMessage: (recipientId: string, recipientName: string, recipientEmail: string, content: string, senderId: string, senderName: string, senderRole: 'admin' | 'client') => void;
  markAsRead: (conversationId: string) => void;
  getUnreadCount: () => number;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const stored = localStorage.getItem('freelancer_messages');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
    return [];
  });

  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

  const saveConversations = (items: Conversation[]) => {
    setConversations(items);
    localStorage.setItem('freelancer_messages', JSON.stringify(items));
  };

  const sendMessage = (
    recipientId: string,
    recipientName: string,
    recipientEmail: string,
    content: string,
    senderId: string,
    senderName: string,
    senderRole: 'admin' | 'client'
  ) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId,
      senderName,
      senderRole,
      recipientId,
      recipientName,
      content,
      read: false,
      createdAt: new Date().toISOString(),
    };

    const existingConversation = conversations.find(
      c => c.participantId === recipientId || c.participantId === senderId
    );

    if (existingConversation) {
      const updated = conversations.map(c => {
        if (c.participantId === recipientId || c.participantId === senderId) {
          return {
            ...c,
            messages: [...c.messages, newMessage],
            lastMessage: content,
            lastMessageTime: newMessage.createdAt,
            unreadCount: c.participantId === senderId ? c.unreadCount + 1 : c.unreadCount,
          };
        }
        return c;
      });
      saveConversations(updated);
    } else {
      const newConversation: Conversation = {
        id: Date.now().toString(),
        participantId: recipientId,
        participantName: recipientName,
        participantEmail: recipientEmail,
        lastMessage: content,
        lastMessageTime: newMessage.createdAt,
        unreadCount: 1,
        messages: [newMessage],
      };
      saveConversations([newConversation, ...conversations]);
    }
  };

  const markAsRead = (conversationId: string) => {
    const updated = conversations.map(c =>
      c.id === conversationId ? { ...c, unreadCount: 0 } : c
    );
    saveConversations(updated);
  };

  const getUnreadCount = () => {
    return conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  };

  return (
    <MessageContext.Provider value={{
      conversations,
      activeConversation,
      setActiveConversation,
      sendMessage,
      markAsRead,
      getUnreadCount,
    }}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) throw new Error('useMessages must be used within MessageProvider');
  return context;
};
