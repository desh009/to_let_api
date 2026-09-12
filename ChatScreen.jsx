import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { createClient } from '@supabase/supabase-js';

const API_BASE_URL = 'http://localhost:3000/api';
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const ChatScreen = ({ navigation, route }) => {
  const { conversationId, otherUser, listing, authToken } = route.params;

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const flatListRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    subscribeToMessages();
    getCurrentUser();

    return () => {
      supabase.channel(`chat-${conversationId}`).unsubscribe();
    };
  }, []);

  // Get current user ID from token
  const getCurrentUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/conversations/${conversationId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const result = await response.json();
      if (response.ok) {
        // Extract user ID from conversation data
        const userId = result.data.otherUser.id;
        setCurrentUserId(userId);
      }
    } catch (error) {
      console.error('Get user error:', error);
    }
  };

  // Fetch messages
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/messages/conversations/${conversationId}/messages?limit=100`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      const result = await response.json();
      if (response.ok) {
        setMessages(result.data);
        // Mark conversation as read
        markAsRead();
      }
    } catch (error) {
      console.error('Fetch messages error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to realtime messages
  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          const newMessage = payload.new;
          setMessages((prev) => [...prev, newMessage]);
          
          // Auto-scroll to bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);

          // Mark as read if not from current user
          if (newMessage.sender_id !== currentUserId) {
            markAsRead();
          }
        }
      )
      .subscribe();

    return channel;
  };

  // Send message
  const sendMessage = async () => {
    if (!messageText.trim()) return;

    const tempMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: currentUserId,
      receiver_id: otherUser.id,
      message_text: messageText.trim(),
      message_type: 'text',
      created_at: new Date().toISOString(),
      is_read: false,
    };

    // Optimistically add message to UI
    setMessages((prev) => [...prev, tempMessage]);
    const textToSend = messageText.trim();
    setMessageText('');

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      setSending(true);
      const response = await fetch(`${API_BASE_URL}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          conversationId,
          receiverId: otherUser.id,
          messageText: textToSend,
          messageType: 'text',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      // Replace temp message with real one
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempMessage.id ? result.data : msg))
      );
    } catch (error) {
      console.error('Send message error:', error);
      // Remove temp message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Mark messages as read
  const markAsRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/messages/mark-as-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ conversationId }),
      });
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  // Format message time
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  };

  // Render message bubble
  const renderMessage = ({ item, index }) => {
    const isMine = item.sender_id === currentUserId;
    const isFirstInGroup =
      index === 0 || messages[index - 1].sender_id !== item.sender_id;
    const isLastInGroup =
      index === messages.length - 1 || messages[index + 1].sender_id !== item.sender_id;

    return (
      <View
        style={[
          styles.messageContainer,
          isMine ? styles.myMessageContainer : styles.otherMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMine ? styles.myMessageBubble : styles.otherMessageBubble,
            isFirstInGroup && styles.firstInGroup,
            isLastInGroup && styles.lastInGroup,
          ]}
        >
          <Text style={[styles.messageText, isMine && styles.myMessageText]}>
            {item.message_text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isMine && styles.myMessageTime]}>
              {formatMessageTime(item.created_at)}
            </Text>
            {isMine && (
              <Text style={styles.checkmark}>{item.is_read ? '✓✓' : '✓'}</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Render date separator
  const renderDateSeparator = (date) => {
    const today = new Date().toDateString();
    const messageDate = new Date(date).toDateString();
    const label = today === messageDate ? 'Today' : messageDate;

    return (
      <View style={styles.dateSeparator}>
        <Text style={styles.dateSeparatorText}>{label}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.headerAvatar}>
              {listing?.image_url ? (
                <Image source={{ uri: listing.image_url }} style={styles.avatar} />
              ) : (
                <View style={styles.placeholderAvatar}>
                  <Text style={styles.avatarText}>
                    {otherUser.name?.[0]?.toUpperCase() || '?'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{otherUser.name}</Text>
              <View style={styles.headerStatus}>
                <View style={styles.onlineDot} />
                <Text style={styles.headerStatusText}>
                  {otherUser.role === 'seller' ? 'Owner' : 'Buyer'} • Online
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionButton}>
              <Text>📞</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionButton}>
              <Text>⋯</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Listing Card */}
        {listing && (
          <View style={styles.listingCard}>
            <Image source={{ uri: listing.image_url }} style={styles.listingImage} />
            <View style={styles.listingInfo}>
              <Text style={styles.listingTitle} numberOfLines={1}>
                {listing.title}
              </Text>
              <Text style={styles.listingDetails}>
                {listing.bedrooms}bd • {listing.bathrooms}ba • {listing.square_feet || 0} sqft
              </Text>
              <Text style={styles.listingPrice}>৳{listing.price.toLocaleString()}/mo</Text>
            </View>
            <TouchableOpacity style={styles.viewButton}>
              <Text style={styles.viewButtonText}>View</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Date Separator */}
        {messages.length > 0 && renderDateSeparator(messages[0].created_at)}

        {/* Messages List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E85A4F" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Text style={styles.attachIcon}>📎</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder={`Message ${otherUser.name}...`}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={5000}
          />

          <TouchableOpacity
            style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendIcon}>➤</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerAvatar: {
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  placeholderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E85A4F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  headerStatusText: {
    fontSize: 12,
    color: '#666',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerActionButton: {
    padding: 8,
    marginLeft: 4,
  },
  listingCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listingImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  listingInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  listingTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  listingDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  listingPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E85A4F',
  },
  viewButton: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateSeparatorText: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    marginVertical: 2,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  myMessageBubble: {
    backgroundColor: '#E85A4F',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  firstInGroup: {
    marginTop: 8,
  },
  lastInGroup: {
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.8)',
  },
  checkmark: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  attachButton: {
    padding: 8,
  },
  attachIcon: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E85A4F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendIcon: {
    color: '#fff',
    fontSize: 18,
  },
});

export default ChatScreen;
