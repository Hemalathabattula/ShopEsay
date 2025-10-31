import React, { useState } from 'react';
import { MessageCircle, Bot, Users, Headphones, Plus, Search, Filter } from 'lucide-react';
import { useChatStore, Chat } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { ChatWindow } from './ChatWindow';

export const ChatDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { chats, createChat, getUnreadCount } = useChatStore();
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<Chat['type'] | 'ALL'>('ALL');

  const handleNewChat = (type: Chat['type']) => {
    let title = '';
    let participants: Chat['participants'] = [];

    switch (type) {
      case 'BOT':
        title = 'AI Assistant';
        participants = [
          { id: 'bot', name: 'AI Assistant', role: 'ADMIN' }
        ];
        break;
      case 'B2B':
        title = 'Business Chat';
        participants = [
          { id: user?.id || '', name: user?.name || '', role: user?.role as any }
        ];
        break;
      case 'B2C':
        title = user?.role === 'SELLER' ? 'Customer Support' : 'Contact Seller';
        participants = [
          { id: user?.id || '', name: user?.name || '', role: user?.role as any }
        ];
        break;
      case 'SUPPORT':
        title = 'Customer Support';
        participants = [
          { id: user?.id || '', name: user?.name || '', role: user?.role as any },
          { id: 'support', name: 'Support Team', role: 'ADMIN' }
        ];
        break;
    }

    const chatId = createChat(type, participants, title);
    const newChat = chats.find(c => c.id === chatId);
    if (newChat) {
      setActiveChat(newChat);
    }
  };

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

  const filteredChats = chats.filter(chat => {
    const matchesSearch = chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chat.lastMessage?.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'ALL' || chat.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const chatTypes = user?.role === 'SELLER' 
    ? [
        { type: 'B2B' as const, label: 'Business Chat', description: 'Chat with suppliers and partners', color: 'blue' },
        { type: 'B2C' as const, label: 'Customer Support', description: 'Help your customers', color: 'green' },
        { type: 'BOT' as const, label: 'AI Assistant', description: 'Get business insights', color: 'orange' }
      ]
    : [
        { type: 'B2C' as const, label: 'Contact Seller', description: 'Chat with product sellers', color: 'green' },
        { type: 'SUPPORT' as const, label: 'Customer Support', description: 'Get platform help', color: 'purple' },
        { type: 'BOT' as const, label: 'AI Assistant', description: 'Get shopping help', color: 'orange' }
      ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-semibold text-gray-900">Messages & Support</h2>
        
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as Chat['type'] | 'ALL')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">All Chats</option>
            <option value="B2B">Business</option>
            <option value="B2C">Customer</option>
            <option value="SUPPORT">Support</option>
            <option value="BOT">AI Assistant</option>
          </select>
        </div>
      </div>

      {/* Quick Start Chat Types */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {chatTypes.map((chatType) => (
          <button
            key={chatType.type}
            onClick={() => handleNewChat(chatType.type)}
            className={`p-6 bg-white rounded-xl shadow-sm border-2 border-transparent hover:border-${chatType.color}-200 hover:shadow-md transition-all text-left group`}
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 bg-${chatType.color}-100 rounded-lg group-hover:bg-${chatType.color}-200 transition-colors`}>
                {getChatTypeIcon(chatType.type)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{chatType.label}</h3>
                <p className="text-sm text-gray-600">{chatType.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Active Conversations */}
      {filteredChats.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Active Conversations</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredChats
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setActiveChat(chat)}
                  className="w-full text-left p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getChatTypeIcon(chat.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-gray-900">{chat.title}</h4>
                        <div className="flex items-center space-x-2">
                          {chat.unreadCount > 0 && (
                            <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {chat.unreadCount}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(chat.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">{getChatTypeLabel(chat.type)}</p>
                      {chat.lastMessage && (
                        <p className="text-sm text-gray-600 truncate">
                          <span className="font-medium">{chat.lastMessage.senderName}:</span> {chat.lastMessage.message}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Chat Window Modal */}
      {activeChat && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl h-full max-h-[600px]">
            <ChatWindow
              chat={activeChat}
              onClose={() => setActiveChat(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
