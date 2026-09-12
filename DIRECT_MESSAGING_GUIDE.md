# Direct Messaging Guide

## যেকোনো User যেকোনো User কে Message করার System

আপনার request অনুযায়ী এখন **যেকোনো user যেকোনো user কে সরাসরি message** করতে পারবে।

---

## 🎯 দুই ধরনের Conversation

### 1. Property-Based Conversation (পূর্বে ছিল)
- Property listing এর মাধ্যমে
- Buyer → Seller
- Listing card দেখাবে

### 2. Direct Message (নতুন যোগ করা হয়েছে) ✨
- যেকোনো user → যেকোনো user
- Property listing ছাড়াই
- Personal conversation

---

## 📝 Database Schema Updates

### Updated `conversations` Table
```sql
-- Now supports both types:
listing_id bigint NULL  -- NULL for direct messages
buyer_id uuid NOT NULL
seller_id uuid NOT NULL

-- New constraints:
CONSTRAINT check_participants CHECK (buyer_id != seller_id)
CONSTRAINT unique_direct_conversation -- For direct messages
```

### Updated Function
```sql
-- get_or_create_conversation() now accepts:
-- Option 1: (listing_id, buyer_id, seller_id) - Property-based
-- Option 2: (user1_id, user2_id) - Direct message
```

---

## 🔗 API Usage

### Method 1: Property-Based Conversation (Existing)

```javascript
// User clicks "Contact Owner" on property listing
const response = await fetch('/api/messages/conversations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    listingId: 123,
    sellerId: 'seller-uuid'
  })
});
```

### Method 2: Direct Message (New) ✨

```javascript
// User wants to message another user directly
const response = await fetch('/api/messages/conversations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    otherUserId: 'target-user-uuid'
  })
});
```

---

## 🔍 Search Users

নতুন endpoint যা দিয়ে user search করতে পারবেন:

```javascript
// Search users by name or email
const response = await fetch(
  '/api/messages/users/search?q=rahman&limit=10',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const { data } = await response.json();
// data = [{ id, name, email, createdAt }, ...]
```

---

## 📱 UI Implementation

### Add "New Message" Button

```jsx
// In Messages Screen
<TouchableOpacity 
  style={styles.newMessageButton}
  onPress={() => navigation.navigate('SearchUsers')}
>
  <Text style={styles.newMessageIcon}>✏️</Text>
  <Text>New Message</Text>
</TouchableOpacity>
```

### Create Search Users Screen

```jsx
const SearchUsersScreen = ({ navigation, route }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);

  const searchUsers = async (query) => {
    if (query.length < 2) return;
    
    const response = await fetch(
      `/api/messages/users/search?q=${query}`,
      {
        headers: { 'Authorization': `Bearer ${authToken}` }
      }
    );
    const result = await response.json();
    setUsers(result.data);
  };

  const startConversation = async (userId) => {
    // Create direct conversation
    const response = await fetch('/api/messages/conversations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ otherUserId: userId })
    });
    
    const { data: conversation } = await response.json();
    
    // Navigate to chat
    navigation.navigate('Chat', {
      conversationId: conversation.id,
      otherUser: users.find(u => u.id === userId),
      authToken
    });
  };

  return (
    <View>
      <TextInput
        placeholder="Search users..."
        value={searchQuery}
        onChangeText={(text) => {
          setSearchQuery(text);
          searchUsers(text);
        }}
      />
      
      <FlatList
        data={users}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => startConversation(item.id)}>
            <Text>{item.name}</Text>
            <Text>{item.email}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};
```

---

## 🔄 Complete Workflow Examples

### Workflow 1: Direct Message to Any User

```
1. User opens Messages screen
   ↓
2. Clicks "New Message" button
   ↓
3. Opens Search Users screen
   ↓
4. Types "Rahman" in search
   ↓
5. API: GET /api/messages/users/search?q=Rahman
   ↓
6. Shows list of matching users
   ↓
7. User clicks on "Rahman Ahmed"
   ↓
8. API: POST /api/messages/conversations
   Body: { otherUserId: "rahman-uuid" }
   ↓
9. Navigate to Chat screen
   ↓
10. Start chatting! 💬
```

### Workflow 2: Property-Based Message

```
1. User views property listing
   ↓
2. Clicks "Contact Owner"
   ↓
3. API: POST /api/messages/conversations
   Body: { listingId: 123, sellerId: "owner-uuid" }
   ↓
4. Navigate to Chat screen
   (with listing card displayed)
   ↓
5. Start chatting about property! 🏠
```

---

## 🎨 UI Differences

### Property-Based Conversation
```
┌─────────────────────────────┐
│ 👤 Rahman, Owner   📞 ⋯     │
│ • Owner • Online            │
├─────────────────────────────┤
│ ┌──────────────────────┐   │
│ │ 🏠 Sunlit 2BHK       │   │
│ │ 2bd • 2ba • 950 sqft │   │
│ │ ৳32,000/mo    [View] │   │
│ └──────────────────────┘   │
├─────────────────────────────┤
│ The property is available..│
│                             │
│     Hello, is it available │
│     for tomorrow?          │
└─────────────────────────────┘
```

### Direct Message Conversation
```
┌─────────────────────────────┐
│ 👤 Rahman Ahmed    📞 ⋯     │
│ • Online                    │
├─────────────────────────────┤
│ Hey! How are you?          │
│                             │
│     I'm good, thanks!      │
│     How about you?         │
│                             │
│ Doing well! Want to meet   │
│ for coffee?                │
└─────────────────────────────┘
```

---

## 🔐 Security & Permissions

### Who Can Message Whom?

✅ **Anyone can message anyone**
- No restrictions
- Search any user
- Start conversation with any user

### Privacy Controls

Users can:
- ✅ Block conversations
- ✅ Delete messages
- ✅ Archive conversations

---

## 📊 API Endpoints Summary

| Endpoint | Method | Purpose | Type |
|----------|--------|---------|------|
| `/api/messages/conversations` | POST | Create conversation | Both |
| `/api/messages/users/search` | GET | Search users | Direct |
| `/api/messages/send` | POST | Send message | Both |
| `/api/messages/conversations` | GET | List conversations | Both |

### Request Body Examples

**Property-Based:**
```json
{
  "listingId": 123,
  "sellerId": "seller-uuid"
}
```

**Direct Message:**
```json
{
  "otherUserId": "target-user-uuid"
}
```

---

## 🧪 Testing

### Test Direct Message

```bash
# 1. Search for users
curl "http://localhost:3000/api/messages/users/search?q=rahman" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Create direct conversation
curl -X POST http://localhost:3000/api/messages/conversations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"otherUserId": "target-user-uuid"}'

# 3. Send message
curl -X POST http://localhost:3000/api/messages/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "conv-uuid",
    "receiverId": "target-user-uuid",
    "messageText": "Hey! How are you?"
  }'
```

### Test Property-Based (Existing)

```bash
curl -X POST http://localhost:3000/api/messages/conversations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "listingId": 123,
    "sellerId": "owner-uuid"
  }'
```

---

## 📝 Database Migration

যদি আপনার database ইতিমধ্যে create করা থাকে:

```sql
-- Run this migration:

-- 1. Update constraints
ALTER TABLE public.conversations 
  DROP CONSTRAINT IF EXISTS unique_listing_conversation;

ALTER TABLE public.conversations
  ADD CONSTRAINT check_participants 
  CHECK (buyer_id != seller_id);

-- 2. Add new constraint for direct messages
ALTER TABLE public.conversations
  ADD CONSTRAINT unique_direct_conversation
  UNIQUE NULLS NOT DISTINCT (
    CASE WHEN listing_id IS NULL THEN LEAST(buyer_id, seller_id) END,
    CASE WHEN listing_id IS NULL THEN GREATEST(buyer_id, seller_id) END
  ) WHERE listing_id IS NULL;

-- 3. Update function
-- (Copy-paste the updated function from messages-schema.sql)
```

---

## ✨ Feature Highlights

### Before (শুধু Property-Based)
```
User A → [Property Listing] → Owner B
✅ Message about property
❌ Cannot message directly
❌ Cannot message other users
```

### After (Both Supported) 🎉
```
User A → [Property Listing] → Owner B
✅ Message about property

User A → [Search] → Any User
✅ Direct message anyone
✅ Personal conversations
✅ No listing required
```

---

## 🎯 Use Cases

### Property-Based Messages
- "Is this property available?"
- "Can I visit tomorrow?"
- "What's included in rent?"

### Direct Messages
- "Thanks for helping me find a place!"
- "Do you have other properties?"
- "Let's discuss the details"
- General communication

---

## 🚀 Implementation Checklist

- [x] Update database schema
- [x] Update `get_or_create_conversation()` function
- [x] Add `otherUserId` parameter support
- [x] Create user search endpoint
- [x] Update API validation
- [x] Update documentation
- [ ] Add "New Message" button in UI
- [ ] Create Search Users screen
- [ ] Test both conversation types
- [ ] Deploy to production

---

## 💡 Next Steps (Optional Enhancements)

1. **User Profiles**
   - Add profile pictures
   - Bio/description
   - Verification badges

2. **Privacy Settings**
   - Who can message me?
   - Block list management
   - Message requests

3. **Group Chats**
   - Multiple participants
   - Group admin
   - Group info

4. **Message Features**
   - Reply to specific message
   - Forward messages
   - Voice messages
   - File attachments

---

**এখন যেকোনো user যেকোনো user কে সরাসরি message করতে পারবে! 🎉**

Full flexibility + Property-based messaging উভয়ই support করে!
