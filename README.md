# Flicker

A real-time messaging app built as an alternative to blocked messengers.

## Live demo
[flicker.vercel.app](https://chat-ashen-gamma-22.vercel.app/)

## Stack
- React
- Node.js + Express
- Socket.io
- PostgreSQL
- JWT + bcrypt
- Deployed on Railway + Vercel

## Features
- Real-time messaging via WebSocket
- User registration and authentication
- Message history
- "Is typing" indicator
- Date dividers between messages

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
```