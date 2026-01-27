'use client';

import { useEffect, useState, useRef } from 'react';
import { Message } from '@/types';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface ChatWindowProps {
  jobId: string;
}

export function ChatWindow({ jobId }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socket = getSocket();

  useEffect(() => {
    // Load existing messages
    loadMessages();

    // Join socket room
    if (user && jobId) {
      socket.emit('join_room', { job_id: jobId, user_id: user.id });

      // Listen for new messages
      socket.on('new_message', (message: Message) => {
        setMessages((prev) => [...prev, message]);
      });

      return () => {
        socket.emit('leave_room', { job_id: jobId });
        socket.off('new_message');
      };
    }
  }, [jobId, user]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await api.getMessages(jobId);
      if (response.success && response.data) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    setSending(true);
    try {
      const response = await api.sendMessage(jobId, newMessage);
      if (response.success && response.data) {
        // Message will be added via socket event
        setNewMessage('');
      } else {
        throw new Error(response.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Job Chat</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === user?.id;
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    isOwn
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwn ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {format(new Date(message.created_at), 'HH:mm')}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />
          <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
