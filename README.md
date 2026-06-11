<h1>
  <img src="chat-app/client/public/IMG_8677.png" alt="Fluxly Logo" width="32" style="margin-right: 8px;"/>
  Fluxly
</h1>

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
- Resend (email delivery)
- Cloudinary (file & avatar storage)
- Deployed on Railway + Vercel

## Features
- Real-time messaging with AES-256-CBC encryption at rest
- File sharing (images, video, audio, any file)
- Message replies with quote — swipe on mobile, text selection on desktop
- User registration with email verification and password reset
- Online status, read receipts, unread counters
- PWA support, mobile-friendly with swipe gestures

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
RESEND_API_KEY=your_resend_key
```

## Credits

**Logo design** — [Мари](https://t.me/qinai_de3)

---