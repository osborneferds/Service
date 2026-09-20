import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Search, Paperclip, Smile, MoreVertical, Phone, Video, ArrowLeft } from 'lucide-react';
import { useMessages, Conversation } from '../../context/MessageContext';
import { useAuth } from '../../context/AuthContext';
import { useClientAccounts } from '../../context/ClientAccountsContext';

const AdminMessages: React.FC = () => {
  const { conversations, activeConversation, setActiveConversation, sendMessage, markAsRead } = useMessages();
  const { user } = useAuth();
  const { clientAccounts } = useClientAccounts();
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConversation || !user) return;

    sendMessage(
      activeConversation.participantId,
      activeConversation.participantName,
      activeConversation.participantEmail,
      messageText,
      user.id,
      user.name,
      'admin'
    );
    setMessageText('');
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);
    markAsRead(conversation.id);
  };

  const filteredConversations = conversations.filter(c =>
    c.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.participantEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex">
      {/* Conversations List */}
      <div className={`w-full md:w-96 border-r border-gray-200 flex flex-col ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 text-sm">No conversations yet</p>
              <p className="text-gray-400 text-xs mt-2">Start a conversation with a client</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredConversations.map((conversation) => (
                <motion.button
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation)}
                  className={`w-full p-4 hover:bg-gray-50 transition-colors text-left ${
                    activeConversation?.id === conversation.id ? 'bg-indigo-50' : ''
                  }`}
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {conversation.participantName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">
                          {conversation.participantName}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.lastMessageTime)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full mt-1">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveConversation(null)}
                    className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {activeConversation.participantName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{activeConversation.participantName}</h3>
                    <p className="text-xs text-gray-500">{activeConversation.participantEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Phone className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Video className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {activeConversation.messages.map((message) => {
                const isAdmin = message.senderRole === 'admin';
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isAdmin ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`px-4 py-3 rounded-2xl ${
                          isAdmin
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <p className={`text-xs text-gray-500 mt-1 ${isAdmin ? 'text-right' : 'text-left'}`}>
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <button type="button" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Paperclip className="w-5 h-5 text-gray-600" />
                </button>
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button type="button" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Smile className="w-5 h-5 text-gray-600" />
                </button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!messageText.trim()}
                  className="p-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-10 h-10 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Start a Conversation</h3>
              <p className="text-gray-600">Select a conversation from the list or start a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMessages;
