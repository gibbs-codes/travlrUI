// components/ChatSidebar.tsx
import React, { useState } from 'react';
import {
  Box,
  Button,
  Divider,
  TextField,
  Typography,
} from '@mui/material';

const ChatSidebar: React.FC = () => {
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { sender: 'user', text: input }];
    setMessages(newMessages);
    setInput('');

    // Simulate LLM response (replace with real call)
    setTimeout(() => {
      setMessages((prev) => [...prev, { sender: 'ai', text: `Acknowledged: ${input}` }]);
    }, 500);
  };

  return (
    <Box
      sx={{
        width: 320,
        height: '100vh',
        borderLeft: '1px solid #ddd',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
        position: 'fixed',
        right: 0,
        top: 0,
        zIndex: 1000,
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid #ddd', backgroundColor: '#f3f3f3' }}>
        <Typography variant="h6" fontWeight={600}>
          Travel Assistant
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {messages.map((msg, idx) => (
          <Box
            key={idx}
            sx={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor: msg.sender === 'user' ? '#1976d2' : '#eee',
              color: msg.sender === 'user' ? '#fff' : '#000',
              px: 2,
              py: 1,
              borderRadius: 2,
              maxWidth: '80%',
            }}
          >
            {msg.text}
          </Box>
        ))}
      </Box>
      <Divider />
      <Box sx={{ p: 2, borderTop: '1px solid #ddd', display: 'flex', gap: 1 }}>
        <TextField
          value={input}
          onChange={(e) => setInput(e.target.value)}
          fullWidth
          placeholder="Ask your assistant..."
          size="small"
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <Button variant="contained" onClick={handleSend}>
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default ChatSidebar;