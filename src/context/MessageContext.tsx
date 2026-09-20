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
    
    // Sample conversations for demo client
    return [
      {
        id: '1',
        participantId: '1',
        participantName: 'John Smith',
        participantEmail: 'client@demo.com',
        lastMessage: 'Hi! I\'ve completed the initial design mockups. Please review when you have time.',
        lastMessageTime: '2024-01-28T10:30:00.000Z',
        unreadCount: 1,
        messages: [
          {
            id: '1',
            senderId: 'admin',
            senderName: 'Osborne Fernandes',
            senderRole: 'admin',
            recipientId: '1',
            recipientName: 'John Smith',
            content: 'Hi John! I\'ve started working on your e-commerce website redesign. I\'ll have the initial mockups ready by Friday.',
            read: true,
            createdAt: '2024-01-25T09:00:00.000Z',
          },
          {
            id: '2',
            senderId: '1',
            senderName: 'John Smith',
            senderRole: 'client',
            recipientId: 'admin',
            recipientName: 'Osborne Fernandes',
            content: 'That sounds great! Looking forward to seeing the designs.',
            read: true,
            createdAt: '2024-01-25T10:15:00.000Z',
          },
          {
            id: '3',
            senderId: 'admin',
            senderName: 'Osborne Fernandes',
            senderRole: 'admin',
            recipientId: '1',
            recipientName: 'John Smith',
            content: 'Hi! I\'ve completed the initial design mockups. Please review when you have time.',
            read: false,
            createdAt: '2024-01-28T10:30:00.000Z',
          },
        ],
      },
      {
        id: '2',
        participantId: '1',
        participantName: 'John Smith',
        participantEmail: 'client@demo.com',
        lastMessage: 'The mobile app development is progressing well. We\'re on track for the deadline.',
        lastMessageTime: '2024-01-27T14:20:00.000Z',
        unreadCount: 0,
        messages: [
          {
            id: '4',
            senderId: 'admin',
            senderName: 'Osborne Fernandes',
            senderRole: 'admin',
            recipientId: '1',
            recipientName: 'John Smith',
            content: 'The mobile app development is progressing well. We\'re on track for the deadline.',
            read: true,
            createdAt: '2024-01-27T14:20:00.000Z',
          },
        ],
      },
    ];
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
