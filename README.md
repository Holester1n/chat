![Fluxly Logo](chat-app/client/public/IMG_8677.png)
# Fluxly

A real-time messaging app built as an alternative to blocked messengers
[telegram channel with updates](https://t.me/fluxlyme)

## Live demo
[fluxly.me](https://fluxly.me/) 

## Stack
- React + CSS Modules
- Node.js + Express
- Socket.io
- PostgreSQL
- JWT + bcrypt
- AES-256-CBC encryption
- WebRTC (P2P file transfer)
- Resend (email delivery)
- Cloudinary (avatar storage)
- Deployed on Railway + Vercel

## Features
- Real-time messaging via WebSocket
- General chat and direct messages
- P2P file transfer (images, video, audio, any file) via WebRTC
- User registration with email verification
- Password reset via email
- Message encryption at rest (AES-256-CBC)
- User profiles with avatars and bio
- User search by username
- Mobile-friendly UI

## Running locally

### Server
```bash
cd chat-app/server
npm install
npm start
```

### Client
```bash
cd chat-app/client
npm install
npm start
```

Create a `.env` file in the server folder:
```
DATABASE_URL=your_postgres_url
JWT_SECRET=your_secret
ENCRYPTION_KEY=your_32_byte_hex_key
GMAIL_USER=your_gmail
GMAIL_PASS=your_app_password
RESEND_API_KEY=your_resend_key
```

## Credits

**Logo design** — [Мари](https://t.me/qinai_de3)

---