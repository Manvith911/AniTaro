# AniTaro - Anime Streaming Web App

AniTaro is an anime streaming web application built with React, Vite, TypeScript, Tailwind CSS, and Supabase. It uses the **Kenjitsu API** (`https://kenjitsu.vercel.app`) as the primary anime data and streaming source, and the **AniList GraphQL API** for profile avatar images.

## Features

- 🎬 **Anime Streaming** – Watch anime with sub/dub support via HLS
- 🔍 **Search** – Search anime with instant suggestions
- 📋 **Watchlist** – Track anime with status (watching, completed, plan to watch, dropped)
- 💬 **Comments** – Comment on episodes with reactions, replies, and mentions
- 🔔 **Notifications** – Get notified about replies, likes, mentions, and new episodes
- 👤 **User Profiles** – Customizable profiles with anime character avatars from AniList
- 🏠 **Rich Homepage** – Spotlight carousel, trending, top airing, most popular sections
- 📱 **PWA Support** – Installable as a Progressive Web App

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Lovable Cloud (Supabase) – Database, Auth, Edge Functions, Storage
- **Anime API**: [Kenjitsu API](https://kenjitsu.vercel.app) – Anime data, episodes, streaming sources
- **Avatar API**: [AniList GraphQL API](https://graphql.anilist.co) – Character images for profile avatars
- **Video Player**: ArtPlayer with HLS.js
- **Animations**: Framer Motion
- **Carousel**: Swiper.js

## API Endpoints Used

### Kenjitsu API (via CORS proxy edge function)

| Endpoint | Description |
|---|---|
| `/api/kaido/home` | Homepage data (spotlight, trending, top airing, etc.) |
| `/api/kaido/anime/search?q=` | Search anime |
| `/api/kaido/anime/suggestions?q=` | Search suggestions |
| `/api/kaido/anime/category/:category` | Category listing (subbed, dubbed, popular, etc.) |
| `/api/kaido/anime/genre/:genre` | Genre listing |
| `/api/kaido/anime/recent/:status` | Recent anime (completed, added, updated) |
| `/api/kaido/anime/:id` | Anime details + episodes |
| `/api/kaido/episode/:id/servers` | Episode servers |
| `/api/kaido/sources/:id` | Streaming sources |

### AniList GraphQL API

Used to fetch top anime character images (sorted by favorites) for user profile avatar selection.

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm (or bun)
- Supabase Account
### Local Development

```sh
# 1. Clone the repository
git clone https://github.com/Manvith911/AniTaro

# 2. Navigate to the project directory
cd AniTaro

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

### Environment Variables

Configure the following in Environment variables if hosted in vercel:
| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Backend url |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Backend public/anon key |
| `VITE_SUPABASE_PROJECT_ID` | Backend project ID |

> **Note**: You do NOT need to set these manually when using Lovable. They are auto-provisioned.

### Database Setup

The database schema is given in Migrations [AniTaro/supabase/migrations]. Key tables:

- **profiles** – User profiles (username, display name, avatar, bio, gender)
- **watchlist** – User watchlist entries with status tracking
- **comments** – Episode comments with threading support
- **comment_reactions** – Like/dislike reactions on comments
- **comment_mentions** – @mentions in comments
- **notifications** – User notifications (replies, likes, mentions, new episodes)
- **anime_subscriptions** – Subscribe to anime for new episode notifications

All tables have Row Level Security (RLS) policies ensuring users can only access their own data.

### Edge Functions

Two edge functions handle API proxying:

1. **cors-proxy** – Proxies requests to the Kenjitsu API to avoid CORS issues
2. **m3u8-proxy** – Proxies HLS video streams with proper headers

Deploy these in Supabase given here [AniTaro/supabase/functions]

### Authentication

- Email/password signup and login
- Email confirmation required (configurable)
- New users are redirected to the profile setup page after their first sign-in
- Profile setup includes username, display name, gender, bio, and avatar selection

## Deployment

Open [AniTaro](https://anitaro.vercel.app)

## License

This project is for educational and personal use.
