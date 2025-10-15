# 📱 Portfolio Screen - Feature Guide

## Quick Reference for Testing

### 🎯 **How to Test Each Feature**

---

## 1. **Bottom Sheet for Add Photo**

**How to trigger:**
1. Tap the **green FAB** button (bottom-right)
2. Bottom sheet slides up from bottom

**What to look for:**
- ✅ Smooth slide-up animation
- ✅ Two options: "Take Photo" and "Choose from Library"
- ✅ Icons with colored backgrounds
- ✅ Swipe down or tap backdrop to close
- ✅ Haptic feedback when FAB is tapped

---

## 2. **Toast Notifications**

**When they appear:**
- After uploading photo: "Photo uploaded successfully!"
- After deleting photo: "Photo deleted"
- After setting cover: "Cover photo updated"
- After pull-to-refresh: "Portfolio refreshed - X photos loaded"
- On errors: Various error messages

**What to look for:**
- ✅ Appears at **top of screen**
- ✅ Auto-dismisses after 2 seconds
- ✅ Green for success, red for errors
- ✅ Two lines: title + subtitle
- ✅ Non-blocking (can still interact with app)

---

## 3. **Pull-to-Refresh**

**How to trigger:**
1. Scroll to top of portfolio
2. Pull down with finger
3. Release when you see refresh indicator

**What to look for:**
- ✅ Haptic feedback when triggered
- ✅ Spinning indicator in brand color
- ✅ Portfolio reloads from server
- ✅ Toast notification shows photo count
- ✅ Works even with many photos

---

## 4. **Selection Mode**

**How to enter:**
- **Method 1**: Long-press any photo
- **Method 2**: Tap checkmark icon in header (when photos exist)

**What to look for:**
- ✅ Header changes to show count: "3 selected"
- ✅ Close icon (X) on left
- ✅ Trash icon on right
- ✅ Checkboxes appear on all photos
- ✅ Tap photos to select/deselect
- ✅ Haptic feedback on each selection
- ✅ FAB button hides
- ✅ Tap X or back to exit

**Batch Delete:**
1. Select multiple photos
2. Tap trash icon in header
3. Confirm deletion
4. All selected photos deleted with toasts

---

## 5. **Skeleton Loading**

**When it appears:**
- First time loading portfolio
- After app restart

**What to look for:**
- ✅ Grey placeholder boxes where photos will be
- ✅ Grey placeholder for stats cards
- ✅ Grey title bar
- ✅ Shows structure immediately
- ✅ Smooth transition to real content

---

## 6. **Upload Progress**

**How to trigger:**
1. Tap FAB → Choose photo method
2. Select a photo
3. Observe upload overlay

**What to look for:**
- ✅ Full-screen dark overlay
- ✅ White card with progress
- ✅ Percentage: 0% → 100%
- ✅ Progress bar animates smoothly
- ✅ "Uploading..." text
- ✅ Can't interact until done
- ✅ Toast appears when complete
- ✅ Photo appears at top of grid

---

## 7. **Enhanced Stats Dashboard**

**Location:** Top of screen, two cards

**Card 1 - Total Photos:**
- ✅ Image icon with colored background
- ✅ Large number (photo count)
- ✅ "Total Photos" label

**Card 2 - Completion:**
- ✅ Checkmark icon (yellow if < 6, green if ≥ 6)
- ✅ Percentage: 0% to 100%
- ✅ "Complete" label
- ✅ Progress bar at bottom (fills as you add photos)

---

## 8. **Info Banner**

**When it appears:** Only when you have < 6 photos

**What to look for:**
- ✅ Yellow background
- ✅ Lightbulb icon
- ✅ Text: "Add X more photos to complete your portfolio"
- ✅ Disappears when you have 6+ photos

---

## 9. **Cover Photo Section**

**When it appears:** Only when you have at least 1 photo

**What to look for:**
- ✅ Section titled "Cover Photo" with star badge
- ✅ Large featured photo (200px height)
- ✅ "Featured" badge in yellow
- ✅ First uploaded photo is cover by default

**How to change cover:**
1. Find a photo in grid
2. Look for star icon at bottom-right of photo
3. Tap the star icon
4. Haptic feedback
5. Toast: "Cover photo updated"
6. Star badge moves to new photo
7. Cover Photo section updates

---

## 10. **Quick Actions on Photos**

**Location:** Bottom-right of each photo (when NOT in selection mode)

**Actions:**
- ⭐ **Star Icon**: Set as cover (hidden on current cover)
- 🗑️ **Trash Icon**: Delete photo

**What to look for:**
- ✅ Semi-transparent dark circles
- ✅ White icons
- ✅ Trash icon has red background
- ✅ Tap for action
- ✅ Confirmation dialog for delete
- ✅ Toast notification after action

---

## 11. **Enhanced Empty State**

**When it appears:** When you have 0 photos

**What to look for:**
- ✅ Large circular icon container
- ✅ "Build Your Portfolio" title
- ✅ Subtitle explaining purpose
- ✅ Two quick action buttons:
  - 📷 "Take Photo"
  - 🖼️ "Choose Photos"
- ✅ Tips section with 3 tips:
  - Use good lighting
  - Show different styles
  - Include before & after

---

## 12. **Haptic Feedback**

**Where you'll feel it:**
- ✅ Tap FAB button (medium)
- ✅ Pull-to-refresh trigger (light)
- ✅ Long-press to enter selection (medium)
- ✅ Toggle photo selection (light)
- ✅ Cancel selection mode (light)
- ✅ Set cover photo (notification type)
- ✅ Delete photo (notification type)

**Note:** More noticeable on physical device than simulator

---

## 13. **Fullscreen Preview**

**How to trigger:**
1. Tap any photo (when NOT in selection mode)

**What to look for:**
- ✅ Full black background
- ✅ Photo displayed full-size
- ✅ Close button (X) in top-right
- ✅ Smooth fade animation
- ✅ Tap X or back to close

---

## 14. **Cover Photo Badge**

**Where to find:**
- Small badge on cover photo in grid
- Top-right corner of photo

**What to look for:**
- ✅ Dark semi-transparent background
- ✅ Star icon + "Cover" text
- ✅ Yellow/orange color

---

## 15. **Image Grid**

**Layout:**
- ✅ 2 columns
- ✅ Square photos (1:1 aspect)
- ✅ 12px gap between photos
- ✅ 16px rounded corners
- ✅ Shadows for depth
- ✅ Newest photos at top

---

## 🎨 **Visual Checklist**

### Colors
- [ ] Primary green throughout
- [ ] Yellow for warnings/cover badges
- [ ] Green for success states
- [ ] Red for delete actions
- [ ] Grey for disabled states

### Spacing
- [ ] Consistent 20px screen padding
- [ ] 12px gaps between cards
- [ ] 16px rounded corners on cards
- [ ] Proper alignment throughout

### Shadows
- [ ] Stat cards have subtle shadows
- [ ] Image cards have medium shadows
- [ ] FAB has prominent shadow
- [ ] Cover photo has deep shadow

---

## 🧪 **Testing Scenarios**

### Scenario 1: First-Time User
1. Open Portfolio screen (0 photos)
2. See enhanced empty state
3. Tap "Choose Photos" quick action
4. Select photo from library
5. Watch upload progress
6. See toast notification
7. Photo appears in grid
8. Stats show "1" and "17% Complete"

### Scenario 2: Add Multiple Photos
1. Tap FAB 5 more times
2. Add photos one by one
3. Watch stats update
4. When reach 6 photos:
   - Completion shows "100%"
   - Progress bar full green
   - Info banner disappears

### Scenario 3: Manage Cover Photo
1. Open portfolio with multiple photos
2. First photo is cover
3. Scroll to different photo
4. Tap star icon on that photo
5. See toast: "Cover photo updated"
6. Scroll to top
7. Cover Photo section shows new photo
8. Star badge on new photo in grid

### Scenario 4: Delete Multiple Photos
1. Long-press any photo
2. Selection mode activates
3. Tap 3 more photos
4. Header shows "4 selected"
5. Tap trash icon in header
6. Confirm deletion
7. All 4 photos deleted
8. Toast notifications appear
9. Stats update automatically

### Scenario 5: Pull-to-Refresh
1. Scroll to top of portfolio
2. Pull down with finger
3. Feel haptic feedback
4. See refresh indicator
5. Release to refresh
6. Portfolio reloads
7. Toast: "Portfolio refreshed - X photos"

---

## 📊 **Expected Behavior Matrix**

| State | FAB | Selection Mode | Cover Section | Info Banner |
|-------|-----|----------------|---------------|-------------|
| 0 photos | ✅ Visible | ❌ Disabled | ❌ Hidden | ❌ Hidden |
| 1-5 photos | ✅ Visible | ✅ Available | ✅ Visible | ✅ Visible |
| 6+ photos | ✅ Visible | ✅ Available | ✅ Visible | ❌ Hidden |
| Selection mode | ❌ Hidden | ✅ Active | ✅ Visible | Depends |
| Uploading | ❌ Hidden | ❌ Disabled | ✅ Visible | Depends |

---

## 🐛 **Common Issues & Solutions**

### Bottom Sheet not appearing?
- Restart Metro bundler
- Check GestureHandlerRootView wraps screen
- Verify @gorhom/bottom-sheet installed

### No haptic feedback?
- Physical device required (minimal in simulator)
- Check device haptic settings enabled
- iOS: Settings > Sounds & Haptics > System Haptics

### Toasts not showing?
- Check `<Toast />` component at bottom of JSX
- Verify Toast.show() called correctly
- Check console for errors

### Upload progress stuck?
- Check network connection
- Verify Supabase configuration
- Check portfolioService.addMyImage()

### Skeleton never disappears?
- Check currentUser exists
- Verify portfolioService.getMyPortfolio() returns data
- Check console for errors

---

## 🎯 **Success Criteria**

Portfolio screen is working correctly when:

✅ All 12 features function as described
✅ No console errors or warnings
✅ Smooth animations throughout
✅ Haptic feedback feels natural
✅ Toasts appear and auto-dismiss
✅ Loading states show properly
✅ Cover photo management works
✅ Batch operations complete successfully
✅ Empty state engages users
✅ Stats update in real-time

---

**Ready to test!** 🚀

Go through each feature systematically and verify it works as described. The app should feel polished, responsive, and professional - just like Grab!
