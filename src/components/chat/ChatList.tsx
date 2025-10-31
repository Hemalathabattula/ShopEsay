import React from 'react';
import { MessageCircle, Bot, Users, Headphones, Plus } from 'lucide-react';
import { useChatStore, Chat } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';

interface ChatListProps {
  onChatSelect: (chat: Chat) => void;
  onNewChat: (type: Chat['type']) => void;
}

export const ChatList: React.FC<ChatListProps> = ({ onChatSelect, onNewChat }) => {
  const { chats } = useChatStore();
  const { user } = useAuthStore();

  const getChatTypeIcon = (type: Chat['type']) => {
    switch (type) {
      case 'B2B': return <Users className="h-4 w-4 text-blue-500" />;
      case 'B2C': return <MessageCircle className="h-4 w-4 text-green-500" />;
      case 'SUPPORT': return <Headphones className="h-4 w-4 text-purple-500" />;
      case 'BOT': return <Bot className="h-4 w-4 text-orange-500" />;
      default: return <MessageCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getChatTypeLabel = (type: Chat['type']) => {
    switch (type) {
      case 'B2B': return 'Business Chat';
      case 'B2C': return 'Customer Chat';
      case 'SUPPORT': return 'Support';
      case 'BOT': return 'AI Assistant';
      default: return 'Chat';
    }
  };

  const formatLastMessageTime = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  const availableChatTypes = user?.role === 'SELLER' 
    ? [
        { type: 'B2B' as const, label: 'Business Chat', description: 'Chat with other businesses' },
        { type: 'B2C' as const, label: 'Customer Support', description: 'Help your customers' },
        { type: 'BOT' as const, label: 'AI Assistant', description: 'Get AI help' }
      ]
    : [
        { type: 'B2C' as const, label: 'Contact Seller', description: 'Chat with sellers' },
        { type: 'SUPPORT' as const, label: 'Customer Support', description: 'Get help' },
        { type: 'BOT' as const, label: 'AI Assistant', description: 'Get AI help' }
      ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
          <div className="relative">
            <select
              onChange={(e) => onNewChat(e.target.value as Chat['type'])}
              className="bg-blue-500 text-white text-sm px-3 py-1 rounded-lg border-none focus:outline-none cursor-pointer"
              defaultValue=""
            >
              <option value="" disabled>New Chat</option>
              {availableChatTypes.map((chatType) => (
                <option key={chatType.type} value={chatType.type}>
                  {chatType.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm mb-4">No conversations yet</p>
            <div className="space-y-2">
              {availableChatTypes.map((chatType) => (
                <button
                  key={chatType.type}
                  onClick={() => onNewChat(chatType.type)}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {getChatTypeIcon(chatType.type)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{chatType.label}</p>
                      <p className="text-xs text-gray-500">{chatType.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {chats
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => onChatSelect(chat)}
                  className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getChatTypeIcon(chat.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {chat.title}
                        </p>
                        {chat.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-1">
                        {getChatTypeLabel(chat.type)}
                      </p>
                      {chat.lastMessage && (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600 truncate">
                            {chat.lastMessage.message}
                          </p>
                          <p className="text-xs text-gray-400 ml-2">
                            {formatLastMessageTime(chat.lastMessage.timestamp)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
