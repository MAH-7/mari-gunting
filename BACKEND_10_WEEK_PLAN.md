# Mari-Gunting: 10-Week Backend Development Plan

**Project**: Mari-Gunting Barbershop Marketplace  
**Timeline**: 10 Weeks  
**Status**: Frontend Weeks 1-6 Complete, Backend Week 5-6 In Progress  
**Last Updated**: January 2025

---

## 📋 Executive Summary

This 10-week plan covers **complete backend implementation** for the Mari-Gunting marketplace platform. The frontend UI is already 75% complete (Partner App Weeks 1-6), now we integrate real backend APIs, payments, notifications, and prepare for production launch.

---

## ✅ Week 1-2: Core Infrastructure **DONE!**

### Backend Setup ✅
- [x] Supabase project initialized
- [x] PostgreSQL database configured
- [x] PostGIS extension enabled (geospatial queries)
- [x] Row Level Security (RLS) configured
- [x] Environment variables setup (.env.example)

### Database Design ✅
- [x] Core tables created:
  - `profiles` - User accounts
  - `barbers` - Freelance provider profiles
  - `barbershops` - Physical shop locations  
  - `bookings` - Job bookings
  - `services` - Service catalog
  - `reviews` - Rating system
  - `notifications` - Push notification queue
- [x] Enums defined (booking_status, payment_status, etc.)
- [x] Indexes optimized for performance
- [x] Foreign keys and constraints

### Authentication ✅
- [x] Supabase Auth configured
- [x] Phone OTP authentication
- [x] Email/password authentication
- [x] OAuth (Google, Apple) ready
- [x] JWT token management
- [x] Role-based access (customer, barber, barbershop_owner, admin)

### Storage ✅
- [x] Supabase Storage buckets:
  - `avatars` - Profile photos
  - `portfolios` - Before/after photos
  - `barbershop-images` - Shop photos
  - `documents` - Verification docs
- [x] Cloudinary integration (alternative)
- [x] Upload policies and RLS

### Third-party Integrations ✅
- [x] **Cloudinary** - Image CDN & optimization
- [x] **Sentry** - Error tracking
- [x] **Mapbox** - Maps & geocoding (optional)
- [x] Environment variables configured

---

## 🚧 Week 3-4: Core Features Development

### User Authentication Screens ✅
- [x] Login screen (phone + email)
- [x] Registration flow
- [x] OTP verification
- [x] Password reset
- [x] Role selection (customer/barber)

### Profile Management
- [ ] **Backend APIs**:
  - [ ] `GET /profiles/:id` - Fetch user profile
  - [ ] `PATCH /profiles/:id` - Update profile
  - [ ] `POST /profiles/:id/avatar` - Upload avatar
  - [ ] `DELETE /profiles/:id` - Soft delete account

- [ ] **Partner Profile APIs**:
  - [ ] `GET /barbers/:id` - Fetch barber profile
  - [ ] `PATCH /barbers/:id` - Update barber info
  - [ ] `POST /barbers/:id/portfolio` - Add portfolio image
  - [ ] `DELETE /barbers/:id/portfolio/:imageId` - Remove image
  - [ ] `POST /barbers/:id/verify` - Submit verification

### Barbershop Listing & Search
- [ ] **Search APIs**:
  - [ ] `GET /barbershops` - List with pagination
  - [ ] `GET /barbershops/search` - Full-text search
  - [ ] `POST /barbershops/nearby` - Geospatial search (PostGIS)
  - [ ] `GET /barbershops/:id` - Detail view

- [ ] **Filter APIs**:
  - [ ] Query params: `rating`, `distance`, `price_range`, `services`, `is_open`
  - [ ] Sort by: `distance`, `rating`, `price`, `popularity`

- [ ] **RPC Functions**:
  - [ ] `search_nearby_barbershops(lat, lng, radius_km, filters)`
  - [ ] `get_barbershop_availability(shop_id, date)`

### Booking System
- [ ] **Booking APIs**:
  - [ ] `POST /bookings` - Create booking
  - [ ] `GET /bookings/:id` - Booking details
  - [ ] `GET /bookings` - List (customer & partner views)
  - [ ] `PATCH /bookings/:id/status` - Update status
  - [ ] `DELETE /bookings/:id` - Cancel booking

- [ ] **Availability APIs**:
  - [ ] `GET /barbers/:id/availability` - Check available slots
  - [ ] `POST /barbers/:id/working-hours` - Set schedule
  - [ ] `POST /barbers/:id/block-dates` - Block specific dates

- [ ] **Status Flow**:
  ```
  pending → accepted → confirmed → in_progress → completed
                ↓           ↓
            rejected    cancelled
  ```

### Basic UI Components ✅
- [x] Component library built
- [x] Design system defined
- [x] Reusable cards, buttons, inputs

---

## 🎯 Week 5-6: Advanced Features **IN PROGRESS**

### Payment Integration (Stripe/FPX)
- [ ] **Stripe Setup**:
  - [ ] Stripe account created
  - [ ] Connect account for payouts
  - [ ] Payment intents API
  - [ ] Webhook handlers

- [ ] **FPX/Malaysian Payments**:
  - [ ] FPX merchant account
  - [ ] Payment gateway integration
  - [ ] Local bank support
  - [ ] E-wallet support (TnG, GrabPay, Boost, ShopeePay)

- [ ] **Payment APIs**:
  - [ ] `POST /payments/intent` - Create payment intent
  - [ ] `POST /payments/confirm` - Confirm payment
  - [ ] `GET /payments/:id` - Payment status
  - [ ] `POST /payments/refund` - Process refund
  - [ ] `POST /webhooks/stripe` - Stripe webhook
  - [ ] `POST /webhooks/fpx` - FPX webhook

- [ ] **Payout System**:
  - [ ] `GET /partners/:id/earnings` - Earnings summary
  - [ ] `POST /partners/:id/payout` - Request payout
  - [ ] `GET /partners/:id/payouts` - Payout history
  - [ ] Automatic weekly/monthly payouts

### Real-time Notifications
- [ ] **Push Notifications**:
  - [ ] Firebase Cloud Messaging (FCM) setup
  - [ ] OneSignal (alternative)
  - [ ] Device token registration
  - [ ] Notification templates

- [ ] **Notification APIs**:
  - [ ] `POST /notifications/send` - Send notification
  - [ ] `GET /notifications` - Fetch notifications
  - [ ] `PATCH /notifications/:id/read` - Mark as read
  - [ ] `DELETE /notifications/:id` - Delete notification

- [ ] **Notification Types**:
  - [ ] Booking status updates
  - [ ] Payment confirmations
  - [ ] New messages
  - [ ] Reviews received
  - [ ] Promotions/offers

- [ ] **Real-time Updates**:
  - [ ] Supabase Realtime subscriptions
  - [ ] WebSocket connections
  - [ ] Live booking status
  - [ ] Live chat messages

### Review System
- [ ] **Review APIs**:
  - [ ] `POST /reviews` - Submit review
  - [ ] `GET /reviews/:barberId` - Fetch reviews
  - [ ] `PATCH /reviews/:id` - Edit review
  - [ ] `DELETE /reviews/:id` - Delete review
  - [ ] `POST /reviews/:id/report` - Report abuse

- [ ] **Rating Calculation**:
  - [ ] Aggregate rating update (trigger function)
  - [ ] Review count tracking
  - [ ] Response handling from barbers

### Chat Functionality
- [ ] **Chat System**:
  - [ ] `messages` table with RLS
  - [ ] Real-time message subscriptions
  - [ ] Read receipts
  - [ ] Typing indicators
  - [ ] Image sharing in chat

- [ ] **Chat APIs**:
  - [ ] `POST /conversations` - Start conversation
  - [ ] `GET /conversations` - List conversations
  - [ ] `POST /conversations/:id/messages` - Send message
  - [ ] `GET /conversations/:id/messages` - Fetch messages
  - [ ] `PATCH /messages/:id/read` - Mark as read

### Dashboard & Analytics
- [ ] **Partner Dashboard APIs**:
  - [ ] `GET /partners/:id/stats` - Overview stats
  - [ ] `GET /partners/:id/earnings/summary` - Earnings breakdown
  - [ ] `GET /partners/:id/bookings/calendar` - Calendar view
  - [ ] `GET /partners/:id/performance` - Performance metrics

- [ ] **Admin Analytics**:
  - [ ] Total bookings
  - [ ] Revenue tracking
  - [ ] User growth
  - [ ] Top performers
  - [ ] Booking trends

- [ ] **Database Views**:
  - [ ] `v_partner_earnings_daily`
  - [ ] `v_partner_calendar_days`
  - [ ] `v_booking_analytics`
  - [ ] `v_top_barbers`

- [ ] **RPC Functions**:
  - [ ] `rpc_partner_earnings_summary(partner_id, start_date, end_date)`
  - [ ] `rpc_booking_analytics(start_date, end_date)`

---

## 🎨 Week 7-8: Polish & Testing

### UI/UX Refinement
- [ ] Final design review
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Dark mode support
- [ ] Loading states consistency
- [ ] Error message improvements
- [ ] Empty states polish
- [ ] Animation smoothness
- [ ] Responsive design check

### Bug Fixes
- [ ] Critical bugs from testing
- [ ] Edge case handling
- [ ] Form validation improvements
- [ ] Network error handling
- [ ] Offline mode support
- [ ] Memory leak fixes
- [ ] Race condition fixes

### Testing
- [ ] **Unit Tests**:
  - [ ] API service functions
  - [ ] Utility functions
  - [ ] Component logic
  - [ ] State management

- [ ] **Integration Tests**:
  - [ ] Authentication flow
  - [ ] Booking creation flow
  - [ ] Payment flow
  - [ ] Profile update flow
  - [ ] Review submission

- [ ] **E2E Tests** (Detox):
  - [ ] Complete booking journey
  - [ ] Registration & login
  - [ ] Search & filter
  - [ ] Payment processing

- [ ] **API Tests**:
  - [ ] Postman/Hoppscotch collection
  - [ ] All endpoints tested
  - [ ] Error scenarios covered

### Performance Optimization
- [ ] **Frontend**:
  - [ ] Image lazy loading
  - [ ] List virtualization
  - [ ] Bundle size reduction
  - [ ] React Query caching
  - [ ] Memory profiling

- [ ] **Backend**:
  - [ ] Database query optimization
  - [ ] Index tuning
  - [ ] N+1 query elimination
  - [ ] Caching strategy (Redis optional)
  - [ ] CDN for static assets

### Security Audit
- [ ] RLS policy review
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Rate limiting
- [ ] Input validation
- [ ] Secret management
- [ ] HTTPS enforcement
- [ ] Authentication security
- [ ] Authorization checks

---

## 🚀 Week 9-10: Deployment & Launch

### App Store Submission
- [ ] **iOS (Apple App Store)**:
  - [ ] App Store Connect account
  - [ ] App metadata prepared
  - [ ] Screenshots (all sizes)
  - [ ] App icon (1024x1024)
  - [ ] Privacy policy URL
  - [ ] Terms of service URL
  - [ ] App review notes
  - [ ] TestFlight build
  - [ ] Submit for review
  - [ ] Handle review feedback

- [ ] **Android (Google Play)**:
  - [ ] Play Console account
  - [ ] App metadata prepared
  - [ ] Screenshots (phone, tablet)
  - [ ] Feature graphic
  - [ ] App icon
  - [ ] Privacy policy URL
  - [ ] Content rating questionnaire
  - [ ] Internal testing track
  - [ ] Open testing track
  - [ ] Production release

### Beta Testing
- [ ] **Internal Testing**:
  - [ ] TestFlight (iOS)
  - [ ] Internal testing track (Android)
  - [ ] Team testing (5-10 users)

- [ ] **Closed Beta**:
  - [ ] Invite 50-100 beta testers
  - [ ] Feedback collection form
  - [ ] Bug reporting system
  - [ ] Analytics tracking
  - [ ] Weekly updates

- [ ] **Open Beta** (optional):
  - [ ] Public TestFlight
  - [ ] Open testing track
  - [ ] Community feedback

### Production Deployment
- [ ] **Backend**:
  - [ ] Production Supabase project
  - [ ] Environment variables
  - [ ] Database migrations
  - [ ] Seed data (services, default data)
  - [ ] Backup strategy
  - [ ] Monitoring setup (Sentry, Datadog)
  - [ ] CDN configuration
  - [ ] Domain & SSL

- [ ] **Frontend**:
  - [ ] EAS Build (production)
  - [ ] Production environment config
  - [ ] Remove debug code
  - [ ] Obfuscate JavaScript
  - [ ] Source maps upload

- [ ] **Infrastructure**:
  - [ ] CI/CD pipeline (GitHub Actions)
  - [ ] Automated testing
  - [ ] Automated deployments
  - [ ] Rollback procedures

### Marketing Materials
- [ ] Landing page (Next.js/Vercel)
- [ ] Social media accounts
- [ ] App demo video
- [ ] Press kit
- [ ] Launch announcement
- [ ] Referral program setup
- [ ] Promo codes configured
- [ ] Email marketing setup (Mailchimp/SendGrid)
- [ ] Customer support system (Intercom/Zendesk)

---

## 📊 Current Status

| Phase | Status | Completion |
|-------|--------|------------|
| **Week 1-2: Core Infrastructure** | ✅ DONE | 100% |
| **Week 3-4: Core Features** | 🔄 In Progress | 60% |
| **Week 5-6: Advanced Features** | 🔄 In Progress | 20% |
| **Week 7-8: Polish & Testing** | ⏳ Pending | 0% |
| **Week 9-10: Deployment** | ⏳ Pending | 0% |

**Overall Backend Progress**: 36% (3.6 out of 10 weeks)

---

## 🎯 Immediate Next Steps (Week 5-6 Focus)

Based on your request to proceed with **Week 5-6 API**, here's what we'll implement:

### Priority 1: Schedule & Earnings APIs ⚡
1. Create Supabase RPC functions for partner schedule
2. Build earnings calculation logic
3. Implement calendar aggregation views
4. Wire up Partner app Schedule screen to real APIs
5. Wire up Partner app Earnings screen to real APIs

### Priority 2: Payment Integration 💳
1. Stripe Connect setup for Malaysia
2. FPX payment gateway integration
3. Payment intent creation
4. Webhook handling
5. Payout system for partners

### Priority 3: Real-time Notifications 🔔
1. FCM setup and configuration
2. Notification template system
3. Push notification APIs
4. Booking status notifications

### Priority 4: Reviews & Chat 💬
1. Review submission and display
2. Rating aggregation
3. Basic chat functionality
4. Real-time message sync

---

## 📝 Notes

- **Frontend Status**: Partner App UI Weeks 1-6 complete (75%)
- **Backend Status**: Infrastructure ready, features in progress
- **Estimated Timeline**: 6-7 more weeks to complete
- **Team Size**: 1-2 developers
- **Risk Areas**: Payment integration, app store approval, real-time chat scaling

---

## 🔗 Related Documents

- `PROJECT_STATUS_WEEKS_1-6.md` - Partner App frontend status
- `DEVELOPMENT_STATUS.md` - Overall development progress
- `supabase/migrations/` - Database schema
- `.env.example` - Environment configuration

---

**Last Updated**: January 2025  
**Next Milestone**: Week 5-6 Advanced Features  
**Target Launch**: Q2 2025
