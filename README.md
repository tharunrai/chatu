# ChatU 💬

ChatU is a modern, real-time web chat application built using **Next.js (App Router)** and **React 19**, powered by **Pusher** for instantaneous, low-latency communication. It features a sleek, dark-themed UI styled with **Tailwind CSS v4**, dynamic avatars powered by **DiceBear 10.x**, and clean state orchestration via custom React hooks.

---

## Features ✨

* **Real-time Messaging**: Exchange messages instantly with other users in presence channels using Pusher.
* **DiceBear 10.x Avatars**: Dynamic SVG avatar generation:
  * **Notionists** avatars seeded by usernames for profile pictures.
  * **Shape Grid** avatars seeded by room IDs for visually distinct room identity icons.
* **Custom React Hooks State Engine**:
  * `useChat(roomId, username)`: Encapsulates Pusher subscriptions, event handlers, typing indicators, and message sending via an atomic `useReducer` state machine.
  * `useRecentRooms()`: Handles `localStorage` cache synchronization for recently joined rooms.
* **Double-Tap to Reply**: Double-click (or double-tap) any message bubble to link your response. Displays the reply context inline.
* **Presence & Active Users**: Hover over the user count in the header to view a live popover listing active room members with their custom avatars.
* **Typing Indicators**: Real-time typing indicators with animated bouncing dots feedback via client events.
* **Recent Rooms Cache**: Automatically stores up to 5 recently joined rooms in `localStorage` for quick one-click reconnects.
* **Strict TypeScript Safety**: Fully typed Pusher events (`PusherMember`, `ChatMessageEvent`, `TypingEvent`) and `crypto.randomUUID()` for reliable message IDs.

---

## Directory Structure 📂

The codebase is modularized as follows:

```text
src/
├── app/
│   ├── globals.css          # Global styling definitions
│   ├── layout.tsx           # Page structure wrapper
│   ├── manifest.ts          # Web app manifest for PWA capabilities
│   └── page.tsx             # Main page composing custom hooks and UI components
├── components/
│   └── chat/
│       ├── ChatArea.tsx     # Message lists, avatars, and double-click reply behavior
│       ├── ChatHeader.tsx   # Room title, shape-grid avatar, typing indicator, and user popover
│       ├── ChatInput.tsx    # Text editor, reply preview, and typing event triggers
│       ├── RecentRooms.tsx  # Landing page cached rooms list with shape-grid & notionist avatars
│       ├── JoinRoomForm.tsx # Login panel
│       └── JoinRoomModal.tsx# Form overlay modal
├── hooks/
│   ├── useChat.ts           # Custom hook orchestrating Pusher subscriptions & chatReducer
│   └── useRecentRooms.ts    # Custom hook handling localStorage persistence for recent rooms
├── pages/
│   └── api/
│       ├── message.ts       # Broadcasts text messages via Pusher
│       └── pusher/
│           └── auth.ts      # Authorizes presence channel memberships
└── types/
    └── chat.ts              # TypeScript models for Messages & RecentRooms
```

---

## Tech Stack 🛠️

* **Framework**: Next.js 16.2 (App Router)
* **Library**: React 19
* **Real-Time Sync**: Pusher & Pusher-JS (Presence Channels & Client Events)
* **Avatars**: DiceBear 10.x API (`notionists` & `shape-grid`)
* **State Management**: React `useReducer` & Custom Hooks (`useChat`, `useRecentRooms`)
* **Styling**: Tailwind CSS v4
* **Icons**: Lucide React

---

## Getting Started 🚀

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org) (v18+ recommended) installed.

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env.local
```

Populate it with your Pusher credentials:

```env
# Server-side Pusher Credentials
PUSHER_APP_ID="your_pusher_app_id"
PUSHER_SECRET="your_pusher_secret"

# Client-side (Public) Pusher Credentials
NEXT_PUBLIC_PUSHER_KEY="your_pusher_key"
NEXT_PUBLIC_PUSHER_CLUSTER="your_pusher_cluster"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser to start chatting.

### 5. Build for Production
Verify TypeScript constraints and build optimized bundles:
```bash
npm run build
```