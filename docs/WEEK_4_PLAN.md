# 📋 Week 4 Plan - Advanced Job Features

**Goal:** Enhance job management with navigation, progress tracking, and completion flow  
**Duration:** 10-12 hours  
**Status:** Ready to Start

---

## 🎯 **Week 4 Objectives**

Build advanced features that make the provider's job workflow smooth and efficient:

1. **Job Navigation** - Help providers get to customers
2. **Progress Tracking** - Track job status through the workflow
3. **Enhanced Completion** - Better job completion experience
4. **Job Actions** - Contact customer, add notes, take photos

---

## 📦 **Features to Build**

### 1. **Job Navigation & Location** (3-4 hours)

#### Features:
- **Open in Maps** button in job details
- Show distance from current location
- "Get Directions" action
- Map preview (static image or link)
- Show travel time estimate

#### Implementation:
- Use `Linking.openURL()` for maps
- Apple Maps for iOS
- Google Maps for Android
- Calculate distance if location available
- Add "Navigate" button to job details

---

### 2. **Job Progress Tracking** (3-4 hours)

#### Features:
- **Status Timeline** in job details showing:
  - Pending → Accepted → On the way → Arrived → In Progress → Completed
- **Quick Status Updates**:
  - "I'm on the way" button (accepted → on-the-way)
  - "I've arrived" button (on-the-way → arrived)
  - "Start service" button (arrived → in-progress)
  - "Complete job" button (in-progress → completed)
- **Visual Progress Indicator**
  - Progress bar or stepper
  - Color-coded stages
  - Current stage highlighted

#### Implementation:
- Add status timeline component
- Add quick action buttons per status
- Visual progress bar (0-100%)
- Status change animations
- Timestamp tracking for each stage

---

### 3. **Enhanced Completion Flow** (2-3 hours)

#### Features:
- **Service Checklist** before completion:
  - List of services to perform
  - Check off completed services
  - Add notes per service
- **Optional Photo Capture**:
  - Before/after photos
  - Work progress photos
  - Camera or gallery selection
- **Completion Summary**:
  - Total time spent
  - Services completed
  - Final price
  - Customer signature area (optional)

#### Implementation:
- Multi-step completion modal
- Camera integration (expo-image-picker)
- Service checklist UI
- Summary screen before final completion
- Optional signature capture

---

### 4. **Customer Contact Actions** (1-2 hours)

#### Features:
- **Call Customer** button
  - One-tap call functionality
  - Uses device phone app
- **Message Customer** button
  - One-tap SMS
  - Pre-filled message template
- **Contact History**
  - Show call/message history
  - Timestamp of contacts

#### Implementation:
- `Linking.openURL('tel:...')` for calls
- `Linking.openURL('sms:...')` for messages
- Simple contact tracking
- Icon buttons in job details

---

### 5. **Job Notes & Updates** (1-2 hours)

#### Features:
- **Add Notes** to job
  - Provider can add internal notes
  - Update notes as job progresses
  - View note history
- **Update Customer**
  - Send status updates
  - ETA notifications
  - Completion notifications

#### Implementation:
- Notes section in job details
- Add/edit note modal
- Note timestamps
- Simple notification system (alerts for now)

---

## 🗓️ **Week 4 Schedule**

### **Day 1: Navigation & Contact (4 hours)**
- Morning: Job navigation features
  - Open in maps
  - Distance calculation
  - "Get Directions" button
- Afternoon: Customer contact
  - Call button
  - Message button
  - Contact tracking

### **Day 2: Progress Tracking (4 hours)**
- Morning: Status timeline UI
  - Visual progress indicator
  - Timeline component
  - Status badges
- Afternoon: Quick status updates
  - Status change buttons
  - Confirmation flows
  - Status animations

### **Day 3: Enhanced Completion (4 hours)**
- Morning: Service checklist
  - Checklist UI
  - Check/uncheck services
  - Notes per service
- Afternoon: Photo capture & completion
  - Camera integration
  - Photo gallery
  - Final completion flow

---

## 🎨 **Design Considerations**

### Navigation
```
[Job Details Modal]
├── Location Section
│   ├── Address (existing)
│   ├── Distance: "3.2 km away"
│   ├── [Get Directions] button (maps)
│   └── [Call Customer] button
```

### Progress Timeline
```
┌─────────────────────────────────────┐
│  Pending → Accepted → On the way   │
│     ✓         ✓          ⚫         │
│  → Arrived → In Progress → Done    │
│                                      │
│  [I'm on the way] button            │
└─────────────────────────────────────┘
```

### Completion Flow
```
Step 1: Service Checklist
  ☑ Haircut (30 min) - Done
  ☑ Beard Trim (15 min) - Done
  [Next]

Step 2: Photos (Optional)
  [Take Before Photo]
  [Take After Photo]
  [Skip]

Step 3: Summary
  Time: 45 minutes
  Services: 2 completed
  Total: RM 60
  [Complete Job]
```

---

## 📱 **New Components to Create**

### 1. **StatusTimeline Component**
```typescript
<StatusTimeline 
  currentStatus="on-the-way"
  statuses={['pending', 'accepted', 'on-the-way', ...]}
  timestamps={...}
/>
```

### 2. **ServiceChecklist Component**
```typescript
<ServiceChecklist 
  services={job.services}
  onComplete={(checklist) => {...}}
/>
```

### 3. **PhotoCapture Component**
```typescript
<PhotoCapture 
  onPhotoCaptured={(photos) => {...}}
  optional={true}
/>
```

### 4. **JobCompletionModal Component**
```typescript
<JobCompletionModal 
  job={selectedJob}
  onComplete={(data) => {...}}
  onCancel={() => {...}}
/>
```

---

## ✅ **Success Criteria**

By end of Week 4, provider can:
- [ ] Navigate to customer location via maps
- [ ] See distance to customer
- [ ] Call customer with one tap
- [ ] Message customer with one tap
- [ ] Update job status through workflow
- [ ] See visual progress timeline
- [ ] Mark job stages (on the way, arrived, etc.)
- [ ] Complete service checklist
- [ ] Take before/after photos (optional)
- [ ] Complete job with summary
- [ ] Add notes to jobs
- [ ] Track job history with timestamps

---

## 🚫 **What We're NOT Doing (Yet)**

- ❌ Real-time location tracking
- ❌ Live map with provider location
- ❌ Real backend updates (still mock)
- ❌ Push notifications
- ❌ Customer signature pad
- ❌ Payment collection
- ❌ Real-time chat

These are for later phases!

---

## 🔧 **Technical Requirements**

### New Packages Needed:
```bash
# Likely already installed:
- expo-linking (for calls, sms, maps)
- expo-image-picker (for photos)

# Check if needed:
npm list expo-linking expo-image-picker
```

### Permissions:
- Camera permission (for photos)
- Phone permission (for calls)
- No location permission needed yet (using static addresses)

---

## 📝 **Implementation Notes**

### Maps Integration:
```typescript
// iOS
Linking.openURL(`maps://app?daddr=${lat},${lng}`);

// Android
Linking.openURL(`geo:0,0?q=${lat},${lng}`);

// Universal (opens in browser if no app)
Linking.openURL(`https://maps.google.com/maps?daddr=${lat},${lng}`);
```

### Phone Call:
```typescript
Linking.openURL(`tel:${phoneNumber}`);
```

### SMS:
```typescript
Linking.openURL(`sms:${phoneNumber}?body=${message}`);
```

---

## 🎯 **Priority Order**

1. **High Priority** (Must have):
   - Navigate to customer
   - Call customer
   - Status updates (on the way, arrived)
   - Basic completion flow

2. **Medium Priority** (Should have):
   - Visual timeline
   - Service checklist
   - Job notes

3. **Low Priority** (Nice to have):
   - Photo capture
   - Message customer
   - Contact history

---

## 🚀 **Let's Start!**

Ready to build Week 4 features? We'll start with:
1. Job navigation (get directions)
2. Customer contact (call button)
3. Then move to progress tracking

Sound good? Let's proceed! 💪
