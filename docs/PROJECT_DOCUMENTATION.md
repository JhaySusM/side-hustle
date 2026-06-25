# Batjee / TradiGo Project Documentation

## Overview

Batjee, branded in the UI as TradiGo, is a local marketplace platform built with Next.js, React, and Prisma on top of PostgreSQL. Users can register, post listings, browse active products, message buyers and sellers in-app, negotiate transactions, track platform fees, save favorites, report abusive content, rate sellers, and receive in-app notifications.

The project also includes an admin backoffice for listing moderation, support messaging, report resolution, notification campaigns, seller promotion features, and transaction fee verification.

## Core Goals

- Let users post and browse marketplace listings.
- Keep buyer and seller communication inside the app.
- Add a structured transaction flow on top of chat.
- Give admins visibility and control over moderation and platform operations.
- Support seller growth features such as ratings, referrals, and promotions.

## Tech Stack

- Frontend: Next.js 16 App Router, React 19, Reactstrap, Bootstrap
- Backend: Next.js route handlers
- Database: PostgreSQL via Prisma
- Auth: JWT stored in an `HttpOnly` cookie named `batjee_token`
- Media uploads: Cloudinary
- Realtime updates: Server-Sent Events for inbox refresh

## Project Structure

### App routes

- `src/app/page.js`: Homepage
- `src/app/listings/page.js`: Listings discovery entry
- `src/app/product/[id]/page.js`: Product detail page
- `src/app/seller/[id]/page.js`: Seller profile page
- `src/app/messages/page.js`: Inbox and conversation UI
- `src/app/post/page.js`: Create listing page
- `src/app/dashboard/page.js`: Logged-in user dashboard
- `src/app/admin/page.js`: Admin login shell that loads the backoffice

### API routes

- `src/app/api/auth/*`: Login, logout, current-user lookup
- `src/app/api/users*`: User creation and user-related operations
- `src/app/api/products*`: Product creation, lookup, listing, status changes, posting eligibility
- `src/app/api/messages*`: Inbox, sending messages, read state, support chat, SSE stream
- `src/app/api/transactions/route.js`: Conversation transaction workflow
- `src/app/api/favorites/route.js`: Save and remove favorites
- `src/app/api/reports/route.js`: User reports
- `src/app/api/notifications/route.js`: User notifications
- `src/app/api/admin/*`: Admin notifications, reports, messages, seller features, transactions

### Shared libraries

- `src/lib/auth.js`: JWT parsing and user lookup
- `src/lib/admin-auth.js`: Admin header-based auth helper
- `src/lib/prisma.js`: Prisma client access
- `src/lib/messages.js`: Inbox shaping and message serialization
- `src/lib/message-events.js`: In-process event bus for inbox refresh
- `src/lib/message-client.js`: Client-side message and upload helpers
- `src/lib/referrals.js`: Referral code normalization and generation
- `src/lib/seller-features.js`: Seller promotion placement logic
- `src/lib/seller-fee-status.js`: Outstanding fee checks before posting
- `src/lib/transaction-utils.js`: Transaction amount and serialization helpers
- `src/lib/category-catalog.js`: Shared category normalization and visual catalog helpers

## Main User Flows

## 1. Homepage and browsing

The homepage is assembled from reusable sections such as the hero banner, categories, featured listings, call to action, navbar, and footer. Users can browse listings from the homepage or go directly to the marketplace page.

The listings experience supports:

- Search by keyword
- Filter by category
- Filter by location text
- Pagination with `page` and `pageSize`
- Favorite state when the viewer is logged in
- Seller feature ranking so promoted sellers can surface higher in relevant contexts

Only listings with `product_status = Active` appear in public listing discovery.

## 2. Registration and login

Users register through the shared auth modal.

Registration requires:

- Name
- Email
- Password and password confirmation
- Structured address fields
- Optional referral code

On successful registration:

- The user is created in Prisma
- A unique referral code is generated for the new account
- If a valid referral code was entered, the new user is linked to the referrer
- A JWT is created and returned in the `batjee_token` cookie

Login checks the submitted email and password against the stored user record, ensures the account exists, generates a JWT, and stores it in the same cookie.

The current session is read through `GET /api/auth/me`.

## 3. Posting a listing

Logged-in users can create listings from the post page.

The posting flow works like this:

1. The page checks authentication.
2. It fetches categories from `GET /api/categories`.
3. It checks whether the seller is allowed to post with `GET /api/products/eligibility`.
4. The user fills in title, category, price, description, and images.
5. Images are uploaded directly to Cloudinary from the client.
6. The listing is submitted to `POST /api/products`.

Business rules:

- At least one image is required.
- Up to five images are supported.
- The first uploaded image becomes the cover image.
- A seller with outstanding unpaid platform fees cannot post a new listing.
- New listings are created with `product_status = Pending`.
- Pending listings must be approved by an admin before they appear in public results.

## 4. Product detail and seller contact

The product detail page loads a single listing from `GET /api/products/[id]`.

The page shows:

- Product title, price, status, category, and description
- Multi-image gallery
- Seller information
- Seller rating summary
- Safety reminders
- Chat composer to message the seller
- Report form for abusive or fraudulent listings

The chat entry point creates or reuses a conversation for the current buyer, seller, and listing combination.

Visibility rules for `GET /api/products/[id]`:

- Public viewers can access `Active` listings
- `Sold` listings are also viewable
- Listing owners can view their own non-public listings
- Admin requests can view non-public listings

## 5. Seller profile

The seller page loads seller details, seller listings, ratings, and rating summary.

User actions available there include:

- Browse the seller's listings
- Open a listing detail modal
- Send a direct message about one of the seller's listings
- Submit a seller rating from 1 to 5
- Leave an optional rating comment
- Report the seller account

Seller rating data is persisted in the `SellerRating` model and denormalized back into `User.sellerRatingAvg` and `User.sellerRatingCount`.

## 6. Messaging

Messaging is based on two Prisma models:

- `Conversation`
- `ConversationMessage`

Each conversation belongs to exactly one listing and one buyer/seller pair. The uniqueness constraint is:

- `listingId + buyerId + sellerId`

Messaging capabilities:

- Open or reuse a conversation from product and seller screens
- Send plain text messages
- Send image attachments
- View message history ordered oldest to newest
- Track unread messages through `readAt`
- Mark conversations as read
- Show unread count in the mobile footer

Realtime behavior:

- The client subscribes to `GET /api/messages/stream`
- The server emits refresh events through an in-process listener map in `src/lib/message-events.js`
- The client reloads inbox data when a refresh event arrives

Important limitation:

- This realtime setup is suitable for local development or single-node hosting
- It is not a durable multi-instance pub/sub architecture

## 7. Support chat

Users can open an admin support thread through `POST /api/messages/support`.

How it works:

- The route ensures that an admin user exists
- It ensures a hidden support listing exists
- It creates or reopens a conversation between the current user and the admin user
- It seeds an initial support greeting message when needed

Support threads reuse the same conversation and message tables as the normal marketplace chat flow.

Admins handle these threads through `src/app/api/admin/messages/route.js`.

## 8. Transaction workflow

Transactions are attached one-to-one to conversations through the `Transaction` model.

The transaction flow is designed to happen inside the conversation experience.

The usual lifecycle is:

1. One party proposes or saves an agreed amount.
2. The buyer and seller both confirm the amount.
3. The transaction moves to `ready_for_completion` when both sides have confirmed.
4. The buyer and seller both mark the deal completed.
5. The transaction moves to `completed` when both sides have completed.
6. The listing status is changed to `Sold` when the transaction completes.
7. The seller submits platform fee payment details and proof.
8. An admin verifies the platform fee payment.

Stored transaction data includes:

- Agreed amount
- Commission rate
- Platform fee amount
- Seller net amount
- Dual confirmation timestamps
- Dual completion timestamps
- Fee payment method and reference
- Fee proof image URL
- Fee verification timestamps

Supported transaction actions in `PATCH /api/transactions`:

- `confirm_amount`
- `mark_completed`
- `void`
- `submit_fee_payment`

## 9. Dashboard

The dashboard is the logged-in user control panel.

It loads from `GET /api/dashboard` and shows:

- Listing counts
- Active, pending, and sold counts
- Member since date
- User referral code
- Copyable referral link
- Listing management table
- Saved favorites

Listing management includes:

- Viewing current status
- Withdrawing a pending listing
- Reactivating an inactive listing
- Marking a listing as sold

Owner status changes are restricted. For example, a user cannot arbitrarily force a listing into any state; some changes still require admin approval or are constrained by the current state.

## 10. Favorites

Users can save public listings through `POST /api/favorites` and remove them through `DELETE /api/favorites`.

Rules enforced by the API:

- The listing must exist
- The listing must be `Active`
- Users cannot favorite their own listings
- Each user-listing favorite pair is unique

Favorites are surfaced both in listings and in the dashboard.

## 11. Reports and moderation from the user side

Users can report either:

- A listing
- A seller account

Reporting is handled by `POST /api/reports`.

Each report stores:

- Reporter
- Optional listing target
- Optional seller target
- Report type
- Details
- Optional screenshot URL
- Priority
- Status
- Admin note and action when resolved

Priority is derived from the report type. For example, scam and fraud reports are treated as high priority.

Users cannot:

- Report their own listing
- Report their own seller account
- Open multiple unresolved reports against the same target

## 12. Notifications

The app supports in-app notifications through:

- `NotificationCampaign`
- `UserNotification`

End-user capabilities:

- Read the latest notifications
- Check unread count
- Mark one notification as read
- Mark all notifications as read

Notification delivery is generated by admin-created campaigns.

## 13. Referral system

Every user can have a unique referral code.

Referral behavior:

- Codes are generated from the user's name or email prefix plus a random suffix
- Registration accepts an optional referral code
- Invite links can pass `?ref=CODE`
- The auth modal detects the `ref` query parameter and prefills the registration field
- Referred users are linked through `User.referredById`

The dashboard exposes the user's referral code and a prebuilt referral link.

## 14. Seller features and promotions

The project includes paid or admin-managed seller promotion placements.

Supported placements are managed through shared seller feature utilities and admin APIs. The code currently uses placements such as:

- Homepage banner
- Category top
- Search boost

These placements are used in the listing ranking flow. Active seller features can push relevant listings higher depending on whether the user is browsing the homepage, a category page, or a search result.

## Admin Backoffice

The admin page at `src/app/admin/page.js` is a React shell that loads the actual admin UI from `public/admin-backoffice.html` inside an `iframe`.

This means the backoffice is not implemented as a Next.js React route tree. It is a static HTML dashboard backed by admin APIs.

### Admin capabilities

#### Listing moderation

- Review marketplace listings
- Approve or reject pending content
- Update product statuses through admin-authenticated APIs

#### Support inbox

- Read support conversations
- Reply as the admin support account
- Mark support threads as solved

#### Reports management

- View all reports
- Filter and inspect report details
- Resolve reports
- Leave admin notes
- Suspend or ban users
- Inactivate listings when action requires removal

#### Transactions and fee verification

- Review all transactions
- Inspect GMV, expected revenue, verified revenue, and outstanding revenue summaries
- Verify seller-submitted platform fee payments

#### Notification campaigns

- Create in-app campaigns
- Target all users, buyers, sellers, inactive users, or a specific city
- See sent count, read count, and open rate

#### Seller feature management

- View sellers with current feature placements
- Assign a placement for 7, 14, or 30 days
- Remove a placement

## Authentication and roles

### User auth

- JWT is signed with `JWT_SECRET`
- Token is stored in the `batjee_token` cookie
- `requireRequestUser` blocks unauthenticated access to protected routes
- Inactive users are blocked from protected actions

### Admin auth

The codebase currently has two admin auth patterns:

- UI login state stored in `sessionStorage` for the admin page shell
- Header-based protection for admin API routes using `x-admin-email` and `x-admin-password`

This is functional for internal use and prototyping, but it is not a production-grade admin authentication design.

## Database Model Summary

### User

Stores account identity, password, address, structured address fields, role marker, status, referral data, seller ratings, notifications, favorites, seller features, conversations, and transactions.

### ProductList

Stores listing title, price, timestamps, status, description, images, category, owner, favorites, reports, and transactions.

### Category

Stores normalized marketplace categories.

### Conversation

Represents a buyer-seller thread for a single listing.

### ConversationMessage

Stores each chat message with sender, text body, optional image, timestamps, and read state.

### Transaction

Stores the negotiated deal and fee lifecycle for one conversation.

### Favorite

Stores user-saved listings.

### ProductReport

Stores moderation reports against listings or sellers.

### SellerRating

Stores buyer-submitted seller ratings and comments.

### NotificationCampaign and UserNotification

Store admin-created campaign messages and per-user delivery state.

### SellerFeature

Stores temporary seller placement boosts or promotional surfaces.

## API Map

### Auth

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Users

- `GET /api/users`
- `POST /api/users`
- `GET /api/users/[id]`

### Listings and categories

- `GET /api/categories`
- `POST /api/categories`
- `DELETE /api/categories`
- `GET /api/products/active`
- `GET /api/products/[id]`
- `GET /api/products`
- `POST /api/products`
- `PATCH /api/products/status`
- `GET /api/products/eligibility`

### Dashboard and seller

- `GET /api/dashboard`
- `GET /api/seller/[id]`
- `GET /api/seller/[id]/ratings`
- `POST /api/seller/[id]/ratings`

### Messaging and transactions

- `GET /api/messages`
- `POST /api/messages`
- `PATCH /api/messages`
- `GET /api/messages/stream`
- `POST /api/messages/support`
- `POST /api/transactions`
- `PATCH /api/transactions`

### User engagement and moderation

- `GET /api/favorites`
- `POST /api/favorites`
- `DELETE /api/favorites`
- `GET /api/reports`
- `POST /api/reports`
- `GET /api/notifications`
- `PATCH /api/notifications`

### Admin

- `GET /api/admin/messages`
- `POST /api/admin/messages`
- `PATCH /api/admin/messages`
- `GET /api/admin/reports`
- `PATCH /api/admin/reports`
- `GET /api/admin/transactions`
- `PATCH /api/admin/transactions`
- `GET /api/admin/notifications`
- `POST /api/admin/notifications`
- `GET /api/admin/seller-features`
- `POST /api/admin/seller-features`
- `DELETE /api/admin/seller-features`

## Required Environment and Services

### Required environment variables

- `DATABASE_URL`: PostgreSQL connection string for Prisma
- `JWT_SECRET`: Secret used to sign user JWTs
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name for client uploads
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`: Cloudinary upload preset for client uploads

### Scripts

- `npm run dev`: Start the development server
- `npm run build`: Run `prisma generate` and build the Next.js app
- `npm run start`: Start the production server
- `npm run lint`: Run ESLint

## Operational Notes

- Prisma schema is in `prisma/schema.prisma`
- Prisma migrations are already present in `prisma/migrations`
- On Windows, `prisma generate` can fail if the Prisma query engine DLL is locked by an active Node process
- Category display and category filtering share helpers from `src/lib/category-catalog.js`
- Seller promotion state is attached during listing fetches and detail fetches
- The footer and navbar are reused as primary navigation shells across the user-facing experience

## Current Constraints and Risks

These are important for anyone maintaining or extending the project:

- User passwords are stored and compared as plain text in the current implementation
- Admin credentials are hardcoded in the current implementation
- Admin API auth uses request headers rather than a robust server-side session model
- Realtime messaging is built on an in-process event map and SSE, which is not suitable for horizontally scaled deployments
- The backoffice is a large static HTML file rather than a typed React admin surface
- Some routes guard new features by checking whether the generated Prisma client exposes the required model, which means migrations and `prisma generate` must stay in sync

## Suggested Improvement Areas

- Move user passwords to hashed storage
- Replace hardcoded admin credentials with secure environment-backed auth
- Replace header-based admin auth with a server-validated admin session
- Move the static admin backoffice into the Next.js app for maintainability
- Replace in-process messaging events with a durable realtime layer
- Add automated tests around auth, posting rules, transactions, and moderation
- Add explicit role management if seller and buyer permissions need to diverge further

## Quick Mental Model

If you need to understand the platform quickly, this is the shortest accurate model:

- Users sign up, get a referral code, and log in through a JWT cookie.
- Sellers post listings, but every new listing starts as pending.
- Admin approves listings before they become publicly visible.
- Buyers browse active listings and contact sellers through conversation threads.
- A conversation can carry a structured transaction record.
- Once both sides confirm and complete the transaction, the listing becomes sold.
- The seller then submits a platform fee payment, and admin verifies it.
- Users can also save favorites, rate sellers, report abuse, and receive notification campaigns.
