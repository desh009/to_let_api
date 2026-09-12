## Realtime Chat/Messaging API Documentation

## Overview
Comprehensive realtime chat and messaging system using Supabase Realtime. Supports one-on-one conversations between property buyers and sellers, system notifications, and full message history.

---

## 🗄️ Database Schema

### Tables

#### 1. **conversations**
Stores conversation metadata between users.

```sql
id                      uuid PRIMARY KEY
listing_id              bigint (references to_let_api)
buyer_id                uuid (references auth.users)
seller_id               uuid (references auth.users)
last_message_text       text
last_message_time       timestamptz
last_message_sender_id  uuid
buyer_unread_count      integer
seller_unread_count     integer
is_archived             boolean
is_blocked              boolean
blocked_by_user_id      uuid
created_at              timestamptz
updated_at              timestamptz
```

#### 2. **messages**
Stores individual messages.

```sql
id                uuid PRIMARY KEY
conversation_id   uuid (references conversations)
sender_id         uuid (references auth.users)
receiver_id       uuid (references auth.users)
message_text      text
message_type      text ('text', 'image', 'listing', 'system')
metadata          jsonb
is_read           boolean
read_at           timestamptz
is_deleted        boolean
deleted_by_user_id uuid
created_at        timestamptz
updated_at        timestamptz
```

---

## 🔗 API Endpoints

### Base URL
```
/api/messages
```

All endpoints require authentication (🔒).

---

### 1. Get Conversations List

```http
GET /api/messages/conversations
```

Get all conversations for the authenticated user.

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `filter` | string | Filter: 'all', 'unread', 'system' | 'all' |
| `limit` | number | Results per page (1-100) | 50 |
| `offset` | number | Pagination offset | 0 |

#### Example Request
```bash
GET /api/messages/conversations?filter=unread&limit=20
Authorization: Bearer {token}
```

#### Response (200 OK)
```json
{
  "data": [
    {
      "id": "conv-uuid-123",
      "listingId": 456,
      "listing": {
        "id": 456,
        "title": "Beautiful 2BHK Apartment",
        "image_url": "https://...",
        "price": 18000,
        "location": "Khulna Sadar",
        "category": "Family"
      },
      "otherUser": {
        "id": "user-uuid-789",
        "name": "Rahman",
        "email": "rahman@example.com",
        "role": "seller"
      },
      "lastMessage": {
        "text": "The property is available...",
        "time": "2024-01-15T10:30:00Z",
        "senderId": "user-uuid-789",
        "isMine": false
      },
      "unreadCount": 2,
      "isBlocked": false,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 15,
    "offset": 0,
    "limit": 50,
    "hasMore": false
  }
}
```

---

### 2. Create or Get Conversation

```http
POST /api/messages/conversations
```

Create a new conversation or get existing one for a listing.

#### Request Body
```json
{
  "listingId": 456,
  "sellerId": "user-uuid-789"
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "conv-uuid-123",
    "listing_id": 456,
    "buyer_id": "current-user-uuid",
    "seller_id": "user-uuid-789",
    "buyer_unread_count": 0,
    "seller_unread_count": 0,
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

#### Error Responses
```json
// 404 - Listing not found
{
  "error": "Listing not found."
}

// 400 - Cannot message yourself
{
  "error": "Cannot create conversation with yourself."
}
```

---

### 3. Get Single Conversation

```http
GET /api/messages/conversations/:id
```

Get details of a specific conversation.

#### Response (200 OK)
```json
{
  "data": {
    "id": "conv-uuid-123",
    "listingId": 456,
    "listing": {
      "id": 456,
      "title": "Beautiful 2BHK Apartment",
      "image_url": "https://...",
      "price": 18000,
      "bedrooms": 2,
      "bathrooms": 2
    },
    "otherUser": {
      "id": "user-uuid-789",
      "name": "Rahman",
      "email": "rahman@example.com",
      "role": "seller"
    },
    "unreadCount": 2,
    "isBlocked": false,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### 4. Get Messages in Conversation

```http
GET /api/messages/conversations/:conversationId/messages
```

Get all messages in a conversation with pagination.

#### Query Parameters
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `limit` | number | Results per page (1-100) | 50 |
| `offset` | number | Pagination offset | 0 |
| `before` | string | Get messages before this timestamp | - |

#### Example Request
```bash
GET /api/messages/conversations/conv-uuid-123/messages?limit=50
Authorization: Bearer {token}
```

#### Response (200 OK)
```json
{
  "data": [
    {
      "id": "msg-uuid-1",
      "conversation_id": "conv-uuid-123",
      "sender_id": "user-uuid-789",
      "receiver_id": "current-user-uuid",
      "message_text": "The property is available for visit tomorrow?",
      "message_type": "text",
      "metadata": {},
      "is_read": true,
      "read_at": "2024-01-15T10:31:00Z",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "msg-uuid-2",
      "conversation_id": "conv-uuid-123",
      "sender_id": "current-user-uuid",
      "receiver_id": "user-uuid-789",
      "message_text": "Yes, available for visit tomorrow? Let me know time that works for you",
      "message_type": "text",
      "metadata": {},
      "is_read": false,
      "read_at": null,
      "created_at": "2024-01-15T10:32:00Z"
    }
  ],
  "pagination": {
    "total": 12,
    "offset": 0,
    "limit": 50,
    "hasMore": false
  }
}
```

**Note:** Messages are automatically marked as read when fetched.

---

### 5. Send Message

```http
POST /api/messages/send
```

Send a new message in a conversation.

#### Request Body
```json
{
  "conversationId": "conv-uuid-123",
  "receiverId": "user-uuid-789",
  "messageText": "Hello, is it available for tomorrow? I'd love to check it out.",
  "messageType": "text",
  "metadata": {}
}
```

#### Field Specifications
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `conversationId` | uuid | ✅ | Conversation UUID |
| `receiverId` | uuid | ✅ | Receiver user UUID |
| `messageText` | string | ✅ | Message content (1-5000 chars) |
| `messageType` | enum | ❌ | 'text', 'image', 'listing', 'system' (default: 'text') |
| `metadata` | object | ❌ | Additional data for special message types |

#### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "msg-uuid-new",
    "conversation_id": "conv-uuid-123",
    "sender_id": "current-user-uuid",
    "receiver_id": "user-uuid-789",
    "message_text": "Hello, is it available for tomorrow?",
    "message_type": "text",
    "metadata": {},
    "is_read": false,
    "created_at": "2024-01-15T10:45:00Z"
  }
}
```

#### Error Responses
```json
// 404 - Conversation not found
{
  "error": "Conversation not found or access denied."
}

// 403 - Conversation blocked
{
  "error": "This conversation is blocked."
}

// 400 - Invalid receiver
{
  "error": "Invalid receiver."
}

// 422 - Validation error
{
  "error": "Invalid message data.",
  "details": [
    {
      "field": "messageText",
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```

---

### 6. Mark Messages as Read

```http
POST /api/messages/mark-as-read
```

Mark messages as read. Can mark entire conversation or specific messages.

#### Request Body (Option 1 - Entire Conversation)
```json
{
  "conversationId": "conv-uuid-123"
}
```

#### Request Body (Option 2 - Specific Messages)
```json
{
  "messageIds": ["msg-uuid-1", "msg-uuid-2", "msg-uuid-3"]
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "All messages marked as read."
}
```

---

### 7. Get Total Unread Count

```http
GET /api/messages/unread-count
```

Get total unread message count across all conversations.

#### Response (200 OK)
```json
{
  "data": {
    "unreadCount": 5
  }
}
```

---

### 8. Delete Message

```http
DELETE /api/messages/:id
```

Delete a message (soft delete - only sender can delete).

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Message deleted successfully."
}
```

#### Error Response (404)
```json
{
  "error": "Message not found or you cannot delete this message."
}
```

---

### 9. Block/Unblock Conversation

```http
POST /api/messages/conversations/:id/block
```

Block or unblock a conversation.

#### Request Body
```json
{
  "block": true
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Conversation blocked.",
  "data": {
    "id": "conv-uuid-123",
    "is_blocked": true,
    "blocked_by_user_id": "current-user-uuid"
  }
}
```

---

## ⚡ Realtime Integration

### Supabase Realtime Setup

#### 1. Enable Realtime in Supabase Dashboard
```sql
-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
```

#### 2. Subscribe to Messages (React Native / JavaScript)

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Subscribe to new messages in a conversation
const subscribeToMessages = (conversationId) => {
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
        console.log('New message:', payload.new);
        // Update UI with new message
        addMessageToUI(payload.new);
      }
    )
    .subscribe();

  return channel;
};

// Subscribe to conversation updates (for messages list screen)
const subscribeToConversations = (userId) => {
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
        refreshConversations();
      }
    )
    .subscribe();

  return channel;
};

// Cleanup
const cleanup = () => {
  supabase.channel('chat-123').unsubscribe();
  supabase.channel('conversations').unsubscribe();
};
```

---

## 📱 Screen Implementation

### Messages List Screen
**API Calls:**
1. `GET /api/messages/conversations` - Load conversations
2. `GET /api/messages/unread-count` - Badge count
3. Realtime: Subscribe to `conversations` table updates

**Features:**
- Filter tabs (All, Unread, System)
- Real-time conversation updates
- Unread count badges
- Last message preview
- Time formatting

### Chat Screen
**API Calls:**
1. `GET /api/messages/conversations/:id` - Load conversation details
2. `GET /api/messages/conversations/:id/messages` - Load messages
3. `POST /api/messages/send` - Send new message
4. `POST /api/messages/mark-as-read` - Mark as read
5. Realtime: Subscribe to `messages` table inserts

**Features:**
- Real-time message delivery
- Optimistic UI updates
- Read receipts (✓✓)
- Online status indicator
- Listing card display
- Auto-scroll to bottom

---

## 🔐 Security

### Row Level Security (RLS)
All tables have RLS enabled with policies:

**Conversations:**
- Users can only view/create/update their own conversations
- Participants are verified on all operations

**Messages:**
- Users can only view messages in conversations they're part of
- Can only send messages in their conversations
- Can only delete their own messages

### Authorization Checks
- Verified on every request
- User ID extracted from JWT token
- Conversation ownership validated
- Receiver ID validated before sending

---

## 🎯 Screen-to-API Mapping

### Messages Screen
| UI Element | API Call | Method |
|------------|----------|--------|
| Load conversations | `/messages/conversations` | GET |
| Pull to refresh | `/messages/conversations` | GET |
| Filter tabs | `/messages/conversations?filter=...` | GET |
| Unread badge | `/messages/unread-count` | GET |
| Real-time updates | Supabase Realtime subscription | - |

### Chat Screen
| UI Element | API Call | Method |
|------------|----------|--------|
| Load conversation | `/messages/conversations/:id` | GET |
| Load messages | `/messages/conversations/:id/messages` | GET |
| Send message | `/messages/send` | POST |
| Mark as read | `/messages/mark-as-read` | POST |
| Delete message | `/messages/:id` | DELETE |
| Block conversation | `/messages/conversations/:id/block` | POST |
| Real-time messages | Supabase Realtime subscription | - |

---

## 📊 Database Functions

### 1. `get_or_create_conversation()`
```sql
SELECT get_or_create_conversation(456, 'buyer-uuid', 'seller-uuid');
-- Returns: conversation UUID
```

### 2. `mark_conversation_as_read()`
```sql
SELECT mark_conversation_as_read('conv-uuid', 'user-uuid');
-- Marks all unread messages as read
```

### 3. `get_total_unread_count()`
```sql
SELECT get_total_unread_count('user-uuid');
-- Returns: total unread count
```

---

## 🔄 Workflow Examples

### Complete Workflow: Start Conversation

```javascript
// 1. User clicks "Contact Owner" on listing
const listing = { id: 456, owner_id: 'seller-uuid' };

// 2. Create or get conversation
const createConvResponse = await fetch('/api/messages/conversations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    listingId: listing.id,
    sellerId: listing.owner_id
  })
});
const { data: conversation } = await createConvResponse.json();

// 3. Navigate to chat screen
navigation.navigate('Chat', {
  conversationId: conversation.id,
  otherUser: { id: listing.owner_id, name: 'Owner' },
  listing: listing,
  authToken: token
});

// 4. In chat screen, load messages and subscribe to realtime
```

### Complete Workflow: Send Message with Realtime

```javascript
// 1. User types message and clicks send
const messageText = "Hello, is it available?";

// 2. Optimistically add to UI
const tempMessage = {
  id: `temp-${Date.now()}`,
  message_text: messageText,
  sender_id: currentUserId,
  created_at: new Date().toISOString(),
  is_read: false
};
setMessages(prev => [...prev, tempMessage]);

// 3. Send to server
const response = await fetch('/api/messages/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    conversationId: 'conv-123',
    receiverId: otherUserId,
    messageText: messageText
  })
});
const { data: sentMessage } = await response.json();

// 4. Replace temp message with real one
setMessages(prev => 
  prev.map(msg => msg.id === tempMessage.id ? sentMessage : msg)
);

// 5. Other user receives via Realtime subscription
// (automatically handled by Supabase Realtime)
```

---

## 🧪 Testing

### Test with cURL

```bash
# 1. Create conversation
curl -X POST http://localhost:3000/api/messages/conversations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"listingId": 1, "sellerId": "seller-uuid"}'

# 2. Send message
curl -X POST http://localhost:3000/api/messages/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv-uuid",
    "receiverId": "receiver-uuid",
    "messageText": "Hello!"
  }'

# 3. Get conversations
curl http://localhost:3000/api/messages/conversations \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Get messages
curl http://localhost:3000/api/messages/conversations/conv-uuid/messages \
  -H "Authorization: Bearer YOUR_TOKEN"

# 5. Mark as read
curl -X POST http://localhost:3000/api/messages/mark-as-read \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"conversationId": "conv-uuid"}'

# 6. Get unread count
curl http://localhost:3000/api/messages/unread-count \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ⚠️ Common Issues & Solutions

### 1. Messages not appearing in real-time
**Solution:** Ensure Realtime is enabled in Supabase:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
```

### 2. Unread count not updating
**Solution:** Check if triggers are created:
```sql
-- Verify triggers exist
SELECT * FROM pg_trigger WHERE tgname LIKE '%message%';
```

### 3. Cannot create conversation
**Solution:** Verify listing exists and user is authenticated:
```sql
SELECT * FROM to_let_api WHERE id = YOUR_LISTING_ID;
```

### 4. RLS policies blocking access
**Solution:** Check if user is part of conversation:
```sql
SELECT * FROM conversations 
WHERE (buyer_id = 'user-id' OR seller_id = 'user-id')
AND id = 'conv-id';
```

---

## 📝 Notes

1. **Message Limits:** Messages are limited to 5000 characters
2. **Pagination:** Use `offset` and `before` parameters for pagination
3. **Soft Delete:** Messages are soft-deleted, not permanently removed
4. **Auto Read:** Messages are automatically marked as read when fetched
5. **Unread Count:** Updated via database triggers automatically
6. **Conversation Update:** Last message info is updated via trigger
7. **Blocking:** Blocked conversations prevent new messages
8. **System Messages:** Special type for notifications (no listing_id)

---

**Complete implementation with Supabase Realtime for instant messaging! 🚀**
