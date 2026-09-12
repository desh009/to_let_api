import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { requireSupabaseUser } from '../middleware/auth.js';
import { z } from 'zod';

const messagesRouter = Router();

// Validation schemas
const createConversationSchema = z.object({
  listingId: z.coerce.number().int().positive(),
  sellerId: z.string().uuid(),
});

const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  receiverId: z.string().uuid(),
  messageText: z.string().trim().min(1).max(5000),
  messageType: z.enum(['text', 'image', 'listing', 'system']).default('text'),
  metadata: z.object({}).passthrough().optional(),
});

const markAsReadSchema = z.object({
  messageIds: z.array(z.string().uuid()).optional(),
  conversationId: z.string().uuid().optional(),
});

// =====================================================
// Conversations Endpoints
// =====================================================

/**
 * GET /api/messages/conversations
 * Get all conversations for the authenticated user
 */
messagesRouter.get('/conversations', requireSupabaseUser, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const filter = req.query.filter || 'all'; // 'all', 'unread', 'system'
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);

    let query = supabase
      .from('conversations')
      .select(`
        *,
        listing:to_let_api!conversations_listing_id_fkey(
          id, title, image_url, price, location, category
        )
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .eq('is_archived', false)
      .order('last_message_time', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false });

    // Apply filters
    if (filter === 'unread') {
      query = query.or(`buyer_unread_count.gt.0,seller_unread_count.gt.0`);
    } else if (filter === 'system') {
      query = query.is('listing_id', null);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: conversations, error, count } = await query;
    if (error) throw error;

    // Enrich conversations with participant info
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.buyer_id === userId ? conv.seller_id : conv.buyer_id;
        const isOwner = conv.seller_id === userId;

        // Get other user's info
        const { data: otherUser } = await supabase.auth.admin.getUserById(otherUserId);
        
        const unreadCount = isOwner ? conv.seller_unread_count : conv.buyer_unread_count;

        return {
          id: conv.id,
          listingId: conv.listing_id,
          listing: conv.listing,
          otherUser: {
            id: otherUserId,
            name: otherUser?.user?.user_metadata?.name || 'User',
            email: otherUser?.user?.email,
            role: isOwner ? 'buyer' : 'seller',
          },
          lastMessage: {
            text: conv.last_message_text,
            time: conv.last_message_time,
            senderId: conv.last_message_sender_id,
            isMine: conv.last_message_sender_id === userId,
          },
          unreadCount,
          isBlocked: conv.is_blocked,
          createdAt: conv.created_at,
          updatedAt: conv.updated_at,
        };
      })
    );

    return res.json({
      data: enrichedConversations,
      pagination: {
        total: count,
        offset,
        limit,
        hasMore: count > offset + limit,
      },
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    return next(error);
  }
});

/**
 * POST /api/messages/conversations
 * Create or get existing conversation
 */
messagesRouter.post('/conversations', requireSupabaseUser, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const parsed = createConversationSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(422).json({
        error: 'Invalid conversation data.',
        details: parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const { listingId, sellerId } = parsed.data;

    // Verify listing exists
    const { data: listing, error: listingError } = await supabase
      .from('to_let_api')
      .select('id, owner_id')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return res.status(404).json({ error: 'Listing not found.' });
    }

    // User cannot message themselves
    if (userId === sellerId) {
      return res.status(400).json({ error: 'Cannot create conversation with yourself.' });
    }

    // Call the database function to get or create conversation
    const { data: conversationId, error } = await supabase.rpc('get_or_create_conversation', {
      p_listing_id: listingId,
      p_buyer_id: userId,
      p_seller_id: sellerId,
    });

    if (error) throw error;

    // Fetch the conversation details
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (fetchError) throw fetchError;

    return res.status(201).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    return next(error);
  }
});

/**
 * GET /api/messages/conversations/:id
 * Get single conversation details
 */
messagesRouter.get('/conversations/:id', requireSupabaseUser, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;

    const { data: conversation, error } = await supabase
      .from('conversations')
      .select(`
        *,
        listing:to_let_api!conversations_listing_id_fkey(
          id, title, image_url, price, location, category, bedrooms, bathrooms
        )
      `)
      .eq('id', conversationId)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .single();

    if (error || !conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    const otherUserId = conversation.buyer_id === userId ? conversation.seller_id : conversation.buyer_id;
    const isOwner = conversation.seller_id === userId;

    // Get other user's info
    const { data: otherUser } = await supabase.auth.admin.getUserById(otherUserId);

    return res.json({
      data: {
        id: conversation.id,
        listingId: conversation.listing_id,
        listing: conversation.listing,
        otherUser: {
          id: otherUserId,
          name: otherUser?.user?.user_metadata?.name || 'User',
          email: otherUser?.user?.email,
          role: isOwner ? 'buyer' : 'seller',
        },
        unreadCount: isOwner ? conversation.seller_unread_count : conversation.buyer_unread_count,
        isBlocked: conversation.is_blocked,
        createdAt: conversation.created_at,
      },
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    return next(error);
  }
});

// =====================================================
// Messages Endpoints
// =====================================================

/**
 * GET /api/messages/conversations/:conversationId/messages
 * Get messages in a conversation
 */
messagesRouter.get('/conversations/:conversationId/messages', requireSupabaseUser, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.conversationId;
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const before = req.query.before; // timestamp for pagination

    // Verify user is part of this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({ error: 'Conversation not found or access denied.' });
    }

    let query = supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (before) {
      query = query.lt('created_at', before);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: messages, error, count } = await query;
    if (error) throw error;

    // Mark messages as read
    const unreadMessageIds = messages
      .filter((m) => m.receiver_id === userId && !m.is_read)
      .map((m) => m.id);

    if (unreadMessageIds.length > 0) {
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', unreadMessageIds);
    }

    return res.json({
      data: messages.reverse(), // Return in chronological order
      pagination: {
        total: count,
        offset,
        limit,
        hasMore: count > offset + limit,
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return next(error);
  }
});

/**
 * POST /api/messages/send
 * Send a new message
 */
messagesRouter.post('/send', requireSupabaseUser, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const parsed = sendMessageSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(422).json({
        error: 'Invalid message data.',
        details: parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }

    const { conversationId, receiverId, messageText, messageType, metadata } = parsed.data;

    // Verify user is part of this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .single();

    if (convError || !conversation) {
      return res.status(404).json({ error: 'Conversation not found or access denied.' });
    }

    // Check if conversation is blocked
    if (conversation.is_blocked) {
      return res.status(403).json({ error: 'This conversation is blocked.' });
    }

    // Verify receiver is the other participant
    const expectedReceiver = conversation.buyer_id === userId ? conversation.seller_id : conversation.buyer_id;
    if (receiverId !== expectedReceiver) {
      return res.status(400).json({ error: 'Invalid receiver.' });
    }

    // Create message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        receiver_id: receiverId,
        message_text: messageText,
        message_type: messageType,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Send message error:', error);
    return next(error);
  }
});

/**
 * POST /api/messages/mark-as-read
 * Mark messages as read
 */
messagesRouter.post('/mark-as-read', requireSupabaseUser, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const parsed = markAsReadSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(422).json({
        error: 'Invalid request data.',
        details: parsed.error.issues,
      });
    }

    const { messageIds, conversationId } = parsed.data;

    if (conversationId) {
      // Mark all messages in conversation as read
      const { error } = await supabase.rpc('mark_conversation_as_read', {
        p_conversation_id: conversationId,
        p_user_id: userId,
      });

      if (error) throw error;

      return res.json({
        success: true,
        message: 'All messages marked as read.',
      });
    } else if (messageIds && messageIds.length > 0) {
      // Mark specific messages as read
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', messageIds)
        .eq('receiver_id', userId);

      if (error) throw error;

      return res.json({
        success: true,
        message: `${messageIds.length} message(s) marked as read.`,
      });
    } else {
      return res.status(400).json({
        error: 'Either messageIds or conversationId is required.',
      });
    }
  } catch (error) {
    console.error('Mark as read error:', error);
    return next(error);
  }
});

/**
 * GET /api/messages/unread-count
 * Get total unread message count
 */
messagesRouter.get('/unread-count', requireSupabaseUser, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const { data: count, error } = await supabase.rpc('get_total_unread_count', {
      p_user_id: userId,
    });

    if (error) throw error;

    return res.json({
      data: {
        unreadCount: count || 0,
      },
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    return next(error);
  }
});

/**
 * DELETE /api/messages/:id
 * Delete a message (soft delete)
 */
messagesRouter.delete('/:id', requireSupabaseUser, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const messageId = req.params.id;

    const { data, error } = await supabase
      .from('messages')
      .update({ is_deleted: true, deleted_by_user_id: userId })
      .eq('id', messageId)
      .eq('sender_id', userId)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Message not found or you cannot delete this message.' });
    }

    return res.json({
      success: true,
      message: 'Message deleted successfully.',
    });
  } catch (error) {
    console.error('Delete message error:', error);
    return next(error);
  }
});

/**
 * POST /api/messages/conversations/:id/block
 * Block/unblock a conversation
 */
messagesRouter.post('/conversations/:id/block', requireSupabaseUser, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    const { block } = req.body; // true or false

    const { data, error } = await supabase
      .from('conversations')
      .update({
        is_blocked: block === true,
        blocked_by_user_id: block === true ? userId : null,
      })
      .eq('id', conversationId)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    return res.json({
      success: true,
      message: block ? 'Conversation blocked.' : 'Conversation unblocked.',
      data,
    });
  } catch (error) {
    console.error('Block conversation error:', error);
    return next(error);
  }
});

export { messagesRouter };
