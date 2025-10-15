# 📱 Reviews Screen - Quick Reference Guide

## 🎨 NEW FEATURES AT A GLANCE

### 🔍 Search Bar
**Location:** Below the hero stats card  
**Function:** Search through reviews by customer name, comment content, or service type  
**Tip:** Clear button appears automatically when you start typing

---

### 🚨 Urgent Action Card
**When it appears:** When you have unreplied reviews  
**What it does:** Shows count of pending reviews + quick jump to "Needs Reply" tab  
**Smart behavior:** Auto-hides when you're already viewing "Needs Reply"

---

### 💫 Hero Stats Card

```
┌─────────────────────────────────────┐
│  ⭐ 4.8   │  158 total reviews       │
│  ★★★★★    │  +12 this week           │
├───────────┴──────────────────────────┤
│  [Response Rate] [Positive] [Pending]│
│      92% 🟢      87% 🟢      3 🔴    │
└──────────────────────────────────────┘
```

**Color Indicators:**
- 🟢 **Green** = Great performance (90%+)
- 🟡 **Yellow** = Good (70-89%)
- 🔴 **Red** = Needs attention (<70%)

---

### 📋 Review Card States

#### ✅ **Normal Review (Replied)**
```
┌────────────────────────────────────┐
│ 👤 John D.        ⭐ 4.5 (green)  │
│ 2 hours ago • Haircut              │
├────────────────────────────────────┤
│ "Great service, very professional" │
├────────────────────────────────────┤
│ ✓ You replied 1 hour ago           │
│ "Thank you for your kind words!" │
└────────────────────────────────────┘
```

#### ⚠️ **Normal Review (Unreplied)**
```
┌────────────────────────────────────┐
│ 👤 Mike T.        ⭐ 5.0 (green)  │
│ 5 hours ago • Premium Cut          │
├────────────────────────────────────┤
│ "Best barber in town!"             │
├────────────────────────────────────┤
│ [ Reply ] 🔖                        │
└────────────────────────────────────┘
```

#### 🚨 **Urgent Review (Low rating + Unreplied)**
```
┌────────────────────────────────────┐ ⬅️ Red border
│ ⚠️ Needs immediate attention       │
│ 👤 Sarah K.       ⭐ 2.0 (red)    │
│ 3 hours ago • Haircut              │
├────────────────────────────────────┤
│ "Service was disappointing..."     │
├────────────────────────────────────┤
│ [ Reply Now (RED) ] 🔖             │
└────────────────────────────────────┘
```

---

## 🎯 Color System

### Avatar Colors
- **Green background** = 4-5 star review (positive)
- **Default background** = 3 star review (neutral)
- **Red background** = 1-2 star review (negative)

### Rating Badges
- **Green badge** = 4-5 stars
- **Yellow badge** = 3 stars
- **Red badge** = 1-2 stars

### Response Indicators
- **Green checkmark** = You've replied
- **Green left border** = Your response section

### Action Buttons
- **Green button** = Normal reply action
- **Red button** = Urgent reply (low-rated unreplied)

---

## 📊 Sort & Filter Options

### Sort Tabs
1. **Recent** ⏱️ - Newest reviews first
2. **Highest Rated** ⭐ - 5-star reviews first
3. **Needs Reply** 💬 - Unreplied reviews first (with badge count)

### Star Filters
```
[All] [5★] [4★] [3★] [2★] [1★]
```

**Works together!** Sort by "Needs Reply" + Filter by "2★" = Show only 2-star unreplied reviews

---

## 💡 Pro Tips

### 1. **Response Rate Matters**
Your response rate is prominently displayed because:
- Customers trust businesses that engage
- Algorithm may favor responsive partners
- Shows you care about feedback

**Aim for:** 90%+ response rate (shown in green)

### 2. **Handle Urgent Reviews First**
Low-rated unreplied reviews can hurt your reputation quickly:
- They get special red styling
- "Reply Now" button emphasizes urgency
- Appear first when sorted by "Needs Reply"

### 3. **Use Search for Power Users**
Quick ways to use search:
- Find a specific customer: `"John"`
- Find service-related reviews: `"haircut"`
- Find keyword mentions: `"late"` or `"excellent"`

### 4. **Bookmark for Later**
Can't reply now? Hit the bookmark button 🔖 to mark for later  
*(Note: This is a placeholder - could be implemented to save to a list)*

### 5. **Track Weekly Progress**
The "+X this week" indicator helps you:
- See growth trends
- Measure marketing impact
- Celebrate milestones

---

## 🔔 What to Do When...

### ❓ You see a red urgent badge in header
**Action:** Click it or switch to "Needs Reply" tab to see what needs attention

### ❓ Response rate shows red
**Action:** Reply to more reviews to get above 70% (yellow) or 90% (green)

### ❓ You get a low-rated review
**Action:** 
1. Don't panic - happens to everyone
2. Reply professionally and quickly
3. Thank them for feedback
4. Address their concern
5. Offer to make it right

### ❓ You want to bulk manage reviews
**Action:**
1. Use "Needs Reply" sort
2. Work through them top to bottom
3. Use search to find specific topics if needed

---

## ⌨️ Quick Actions

| Action | How |
|--------|-----|
| Search reviews | Tap search bar, start typing |
| Clear search | Tap ❌ in search bar |
| Jump to urgent | Tap urgent action card button |
| Reply to review | Tap "Reply" or "Reply Now" |
| Save for later | Tap bookmark icon 🔖 |
| Dismiss modal | Tap outside or ✕ button |
| Refresh | Pull down on list |

---

## 📱 Best Practices

### ✅ DO
- Reply within 24 hours when possible
- Be professional and friendly
- Thank customers (even negative reviews)
- Address specific concerns
- Keep responses concise (2-3 sentences)

### ❌ DON'T
- Get defensive or argumentative
- Use all caps or excessive punctuation!!!
- Make excuses
- Ignore negative reviews
- Copy-paste generic responses

---

## 🆘 Troubleshooting

**Q: Search returns no results**  
A: Check spelling or try broader terms

**Q: Reviews not loading**  
A: Pull down to refresh or check internet

**Q: Modal keyboard covers input**  
A: Already fixed! KeyboardAvoidingView handles this

**Q: Can't see full review text**  
A: Full text shows in cards; truncated in modal preview only

---

## 🎓 Remember

> "Reviews aren't just feedback - they're conversations.  
> Every reply is a chance to show you care and build trust."

**Your reputation is your business.** This redesigned screen helps you manage it proactively! 🚀
