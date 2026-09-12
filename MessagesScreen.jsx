import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { createClient } from '@supabase/supabase-js';

const API_BASE_URL = 'http://localhost:3000/api';
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

// Initialize Supabase client for realtime
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MessagesScreen = ({ navigation, route }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'system'
  const [totalUnread, setTotalUnread] = useState(0);

  const authToken = route.params?.authToken;

  useEffect(() => {
    fetchConversations();
    fetchUnreadCount();
    subscribeToRealtimeUpdates();

    return () => {
      // Cleanup subscription
      supabase.channel('conversations').unsubscribe();
    };
  }, [filter]);

  // Fetch conversations list
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/messages/conversations?filter=${filter}&limit=50`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const result = await response.json();
      if (response.ok) {
        setConversations(result.data);
      }
    } catch (error) {
      console.error('Fetch conversations error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch total unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/unread-count`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const result = await response.json();
      if (response.ok) {
        setTotalUnread(result.data.unreadCount);
      }
    } catch (error) {
      console.error('Fetch unread count error:', error);
    }
  };

  // Subscribe to realtime updates
  const subscribeToRealtimeUpdates = () => {
    const channel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          console.log('Conversation updated:', payload);
          // Refresh conversations list
          fetchConversations();
          fetchUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('New message:', payload);
          // Refresh conversations to update last message
          fetchConversations();
          fetchUnreadCount();
        }
      )
      .subscribe();

    return channel;
  };

  // Navigate to chat screen
  const openConversation = (conversation) => {
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      otherUser: conversation.otherUser,
      listing: conversation.listing,
      authToken,
    });
  };

  // Format time display
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString();
  };

  // Render conversation item
  const renderConversation = ({ item }) => {
    const isSystemMessage = !item.listing;
    
    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => openConversation(item)}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {isSystemMessage ? (
            <View style={[styles.avatar, styles.systemAvatar]}>
              <Text style={styles.systemIcon}>✓</Text>
            </View>
          ) : item.listing?.image_url ? (
            <Image
              source={{ uri: item.listing.image_url }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.placeholderAvatar]}>
              <Text style={styles.avatarText}>
                {item.otherUser.name?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.conversationContent}>
          {/* Header */}
          <View style={styles.conversationHeader}>
            <View style={styles.headerLeft}>
              <Text style={styles.userName}>{item.otherUser.name}</Text>
              {item.otherUser.role === 'seller' && (
                <Text style={styles.ownerBadge}>Owner</Text>
              )}
            </View>
            <Text style={styles.time}>{formatTime(item.lastMessage?.time)}</Text>
          </View>

          {/* Last Message */}
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage?.text || 'No messages yet'}
          </Text>

          {/* Listing Info */}
          {item.listing && (
            <View style={styles.listingTag}>
              <Text style={styles.listingTagText} numberOfLines={1}>
                {item.listing.title}
              </Text>
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                </View>
              )}
            </View>
          )}

          {isSystemMessage && (
            <View style={styles.systemTag}>
              <Text style={styles.systemTagText}>System Alert</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>💬</Text>
      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Text style={styles.emptySubtitle}>
        Start a conversation by contacting a property owner
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}
          >
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
          onPress={() => setFilter('unread')}
        >
          <Text
            style={[styles.filterTabText, filter === 'unread' && styles.filterTabTextActive]}
          >
            Unread
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filter === 'system' && styles.filterTabActive]}
          onPress={() => setFilter('system')}
        >
          <Text
            style={[styles.filterTabText, filter === 'system' && styles.filterTabTextActive]}
          >
            System
          </Text>
        </TouchableOpacity>
      </View>

      {/* Conversations List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E85A4F" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          refreshing={loading}
          onRefresh={fetchConversations}
        />
      )}

      {/* Need Help Footer */}
      <TouchableOpacity style={styles.helpButton}>
        <View style={styles.helpIcon}>
          <Text>📞</Text>
        </View>
        <View style={styles.helpContent}>
          <Text style={styles.helpTitle}>Need help?</Text>
          <Text style={styles.helpSubtitle}>Contact support team 24/7</Text>
        </View>
        <Text style={styles.helpArrow}>›</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  filterTabActive: {
    backgroundColor: '#333',
  },
  filterTabText: {
    fontSize: 14,
    color: '#666',
  },
  filterTabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  placeholderAvatar: {
    backgroundColor: '#E85A4F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  systemAvatar: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  systemIcon: {
    color: '#fff',
    fontSize: 24,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  ownerBadge: {
    fontSize: 12,
    color: '#E85A4F',
    backgroundColor: '#FFE5E5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  listingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  listingTagText: {
    fontSize: 12,
    color: '#333',
    maxWidth: 200,
  },
  unreadBadge: {
    backgroundColor: '#E85A4F',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  systemTag: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  systemTagText: {
    fontSize: 12,
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  helpIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  helpSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  helpArrow: {
    fontSize: 24,
    color: '#999',
  },
});

export default MessagesScreen;
