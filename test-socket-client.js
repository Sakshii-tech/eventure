// test-socket-client.js

const { io } = require('socket.io-client');

const JWT_TOKEN = ''; // 🔑 Replace this with actual token of friend user

const socket = io('http://localhost:3000/events', {
  auth: {
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjgsImVtYWlsIjoidGVzdDFAZXhhbXBsZS5jb20iLCJpYXQiOjE3NTAzMzExMzUsImV4cCI6MTc1MDkzNTkzNX0.CV3IQKgxyHBnj0rW-4CQjtr8F_sZxsAgCtlmA6MHfYY",
  },
});

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket Server');
  console.log('🔌 Socket ID:', socket.id);
});

socket.on('connection_success', (data) => {
  console.log('🎉 Connection Success:', data);
});

socket.on('event_created', (payload) => {
  console.log('📢 New Event Created by Friend:', payload);
});

socket.on('leaderboard_updated', (data) => {
  console.log('🏆 Leaderboard Updated:', data);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from WebSocket Server');
});

socket.on('connect_error', (err) => {
  console.error('🚫 Connection Error:', err.message);
});
