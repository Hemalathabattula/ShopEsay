import React, { useState, useEffect } from 'react';
import {
  FileText, Image, Plus, Search, Filter, Eye, Edit, Trash2,
  Calendar, User, Tag, Globe, Save, X, Upload, Link,
  MoreHorizontal, ArrowUpDown, TrendingUp, Heart, MessageSquare
} from 'lucide-react';
import { api } from '../../../utils/api';
import { toast } from 'react-hot-toast';

interface ContentItem {
  id: string;
  title: string;
  type: 'blog' | 'lookbook' | 'banner';
  status: 'draft' | 'published' | 'archived';
  author: {
    name: string;
    avatar?: string;
  };
  content?: string;
  excerpt?: string;
  featuredImage?: string;
  tags: string[];
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  likes: number;
  comments: number;
}

const ContentManagement: React.FC = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentItem[]>([]);
  const [selectedContent, setSelectedContent] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingContent, setEditingContent] = useState<ContentItem | null>(null);

  // Mock data for demonstration
  const mockContent: ContentItem[] = [
    {
      id: '1',
      title: 'Summer Fashion Trends 2024',
      type: 'blog',
      status: 'published',
      author: { name: 'Sarah Johnson', avatar: '/avatars/sarah.jpg' },
      content: 'Discover the hottest summer fashion trends...',
      excerpt: 'Explore vibrant colors, lightweight fabrics, and bold patterns that define summer 2024.',
      featuredImage: '/images/summer-trends.jpg',
      tags: ['fashion', 'summer', 'trends', '2024'],
      publishedAt: '2024-01-15T10:00:00Z',
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
      views: 1250,
      likes: 89,
      comments: 23
    },
    {
      id: '2',
      title: 'Elegant Evening Collection',
      type: 'lookbook',
      status: 'published',
      author: { name: 'Michael Chen', avatar: '/avatars/michael.jpg' },
      excerpt: 'Sophisticated pieces for special occasions.',
      featuredImage: '/images/evening-collection.jpg',
      tags: ['evening', 'elegant', 'collection'],
      publishedAt: '2024-01-12T14:00:00Z',
      createdAt: '2024-01-08T11:00:00Z',
      updatedAt: '2024-01-12T14:00:00Z',
      views: 890,
      likes: 67,
      comments: 15
    },
    {
      id: '3',
      title: 'New Year Sale Banner',
      type: 'banner',
      status: 'published',
      author: { name: 'Design Team', avatar: '/avatars/team.jpg' },
      excerpt: 'Promotional banner for New Year sale campaign.',
      featuredImage: '/images/new-year-banner.jpg',
      tags: ['sale', 'promotion', 'new-year'],
      publishedAt: '2024-01-01T00:00:00Z',
      createdAt: '2023-12-28T16:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      views: 2340,
      likes: 156,
      comments: 8
    },
    {
      id: '4',
      title: 'Sustainable Fashion Guide',
      type: 'blog',
      status: 'draft',
      author: { name: 'Emma Wilson', avatar: '/avatars/emma.jpg' },
      content: 'A comprehensive guide to sustainable fashion...',
      excerpt: 'Learn how to build an eco-friendly wardrobe without compromising on style.',
      tags: ['sustainable', 'eco-friendly', 'guide'],
      createdAt: '2024-01-18T13:00:00Z',
      updatedAt: '2024-01-20T15:30:00Z',
      views: 0,
      likes: 0,
      comments: 0
    }
  ];

  useEffect(() => {
    loadContent();
  }, []);

  useEffect(() => {
    filterContent();
  }, [content, searchTerm, statusFilter, typeFilter]);

  const loadContent = async () => {
    try {
      setIsLoading(true);
      // In a real app, this would be an API call
      // const response = await api.get('/admin/content');
      // setContent(response.data);
      
      // Using mock data for now
      setTimeout(() => {
        setContent(mockContent);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error loading content:', error);
      toast.error('Failed to load content');
      setIsLoading(false);
    }
  };

  const filterContent = () => {
    let filtered = content;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    setFilteredContent(filtered);
  };

  const handleStatusChange = async (contentId: string, newStatus: string) => {
    try {
      // In a real app, this would be an API call
      // await api.patch(`/admin/content/${contentId}`, { status: newStatus });
      
      setContent(prev => prev.map(item =>
        item.id === contentId ? { ...item, status: newStatus as any } : item
      ));
      toast.success('Content status updated successfully');
    } catch (error) {
      console.error('Error updating content status:', error);
      toast.error('Failed to update content status');
    }
  };

  const handleDelete = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      // In a real app, this would be an API call
      // await api.delete(`/admin/content/${contentId}`);
      
      setContent(prev => prev.filter(item => item.id !== contentId));
      toast.success('Content deleted successfully');
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Failed to delete content');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'blog': return FileText;
      case 'lookbook': return Image;
      case 'banner': return Globe;
      default: return FileText;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Content Management</h2>
          <p className="text-white/70">Manage blog posts, lookbooks, and promotional banners</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Content
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Total Content</p>
              <p className="text-2xl font-bold text-white">{content.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Published</p>
              <p className="text-2xl font-bold text-white">
                {content.filter(item => item.status === 'published').length}
              </p>
            </div>
            <Globe className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Drafts</p>
              <p className="text-2xl font-bold text-white">
                {content.filter(item => item.status === 'draft').length}
              </p>
            </div>
            <Edit className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm">Total Views</p>
              <p className="text-2xl font-bold text-white">
                {content.reduce((sum, item) => sum + item.views, 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5" />
            <input
              type="text"
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Types</option>
            <option value="blog">Blog Posts</option>
            <option value="lookbook">Lookbooks</option>
            <option value="banner">Banners</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Content List */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                  Content
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                  Engagement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredContent.map((item) => {
                const TypeIcon = getTypeIcon(item.type);
                return (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        {item.featuredImage && (
                          <img
                            src={item.featuredImage}
                            alt={item.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-white">{item.title}</div>
                          {item.excerpt && (
                            <div className="text-sm text-white/60 mt-1 max-w-xs truncate">{item.excerpt}</div>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100/20 text-purple-300"
                              >
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </span>
                            ))}
                            {item.tags.length > 3 && (
                              <span className="text-xs text-white/50">+{item.tags.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <TypeIcon className="w-4 h-4 text-white/50 mr-2" />
                        <span className="text-sm text-white/80 capitalize">{item.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-white/50 mr-2" />
                        <span className="text-sm text-white/80">{item.author.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-4 text-sm text-white/60">
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {item.views}
                        </div>
                        <div className="flex items-center">
                          <Heart className="w-4 h-4 mr-1" />
                          {item.likes}
                        </div>
                        <div className="flex items-center">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          {item.comments}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-white/60">
                        <Calendar className="w-4 h-4 mr-2" />
                        {item.publishedAt ? formatDate(item.publishedAt) : formatDate(item.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-400 hover:text-blue-300 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingContent(item)}
                          className="text-yellow-400 hover:text-yellow-300 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredContent.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No content found</h3>
            <p className="text-white/60">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first piece of content'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentManagement;
