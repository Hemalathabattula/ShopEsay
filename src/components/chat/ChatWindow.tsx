import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, User, MessageCircle, Phone, Video, MoreVertical } from 'lucide-react';
import { useChatStore, Chat, ChatMessage } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';

interface ChatWindowProps {
  chat: Chat;
  onClose: () => void;
  isMinimized?: boolean;
  onMinimize?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  chat, 
  onClose, 
  isMinimized = false, 
  onMinimize 
}) => {
  const { user } = useAuthStore();
  const { sendMessage, getChatMessages, markAsRead } = useChatStore();
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const messages = getChatMessages(chat.id);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!isMinimized) {
      markAsRead(chat.id);
    }
  }, [chat.id, isMinimized, markAsRead]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage(chat.id, newMessage.trim());
      setNewMessage('');
      
      // Simulate typing indicator for bot responses
      if (chat.type === 'BOT') {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getChatTypeColor = () => {
    switch (chat.type) {
      case 'B2B': return 'bg-blue-500';
      case 'B2C': return 'bg-green-500';
      case 'SUPPORT': return 'bg-purple-500';
      case 'BOT': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getChatTypeIcon = () => {
    switch (chat.type) {
      case 'BOT': return <Bot className="h-4 w-4" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={onMinimize}
          className={`${getChatTypeColor()} text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center space-x-2`}
        >
          {getChatTypeIcon()}
          <span className="hidden sm:inline text-sm font-medium">{chat.title}</span>
          {chat.unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {chat.unreadCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
      {/* Chat Header */}
      <div className={`${getChatTypeColor()} text-white p-4 rounded-t-lg flex items-center justify-between`}>
        <div className="flex items-center space-x-3">
          {getChatTypeIcon()}
          <div>
            <h3 className="font-semibold text-sm">{chat.title}</h3>
            <p className="text-xs opacity-90">
              {chat.type === 'BOT' ? 'AI Assistant' : `${chat.participants.length} participants`}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {chat.type !== 'BOT' && (
            <>
              <button className="p-1 hover:bg-white hover:bg-opacity-20 rounded">
                <Phone className="h-4 w-4" />
              </button>
              <button className="p-1 hover:bg-white hover:bg-opacity-20 rounded">
                <Video className="h-4 w-4" />
              </button>
            </>
          )}
          {onMinimize && (
            <button onClick={onMinimize} className="p-1 hover:bg-white hover:bg-opacity-20 rounded">
              <MoreVertical className="h-4 w-4" />
            </button>
          )}
          <button onClick={onClose} className="p-1 hover:bg-white hover:bg-opacity-20 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Start a conversation</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                  message.senderId === user?.id
                    ? 'bg-blue-500 text-white'
                    : message.senderRole === 'BOT'
                    ? 'bg-orange-100 text-orange-900 border border-orange-200'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.senderId !== user?.id && (
                  <p className="text-xs font-medium mb-1 opacity-75">
                    {message.senderName}
                  </p>
                )}
                <p className="text-sm">{message.message}</p>
                <p className={`text-xs mt-1 ${
                  message.senderId === user?.id ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
          ))
        )}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-3 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
