import { io, Socket } from 'socket.io-client';
import { Message } from './messages';

export interface WebSocketEvents {
  'new-message': (message: Message) => void;
  'new-message-notification': (notification: {
    messageId: string | number;
    senderId: number;
    senderUsername: string;
    listingDocumentId?: string;
    body: string;
  }) => void;
  'message-read': (data: { messageId: string }) => void;
  'unread-count-updated': (data: { count: number }) => void;
  'user-typing': (data: { userId: number; username: string; conversationId: string }) => void;
  'user-stop-typing': (data: { userId: number; conversationId: string }) => void;
  'connect': () => void;
  'disconnect': () => void;
  'connect_error': (error: Error) => void;
}

type EventCallback = (...args: unknown[]) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private currentUserId: number | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventListeners = new Map<keyof WebSocketEvents, Set<EventCallback>>();
  private pendingConversationJoins: Array<{ otherUserId: number; listingDocumentId?: string }> = [];
  private storageListener: ((e: StorageEvent) => void) | null = null;

  constructor() {
    this.setupTokenRefresh();
  }

  private setupTokenRefresh() {
    // Listen for token changes and reconnect if needed
    if (typeof window !== 'undefined') {
      this.storageListener = (e) => {
        if (e.key === 'token' && this.socket) {
          const newToken = localStorage.getItem('token');
          if (newToken) {
            this.disconnect();
            this.connect(Number(this.currentUserId));
          }
        }
      };
      window.addEventListener('storage', this.storageListener);
    }
  }

  connect(userId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        reject(new Error('No authentication token available'));
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';
      
      this.socket = io(apiUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.currentUserId = userId;

      this.socket.on('connect', () => {
        console.log('WebSocket connected successfully');
        this.reconnectAttempts = 0;
        this.emitEvent('connect');
        
        // Process any pending conversation joins
        if (this.pendingConversationJoins.length > 0) {
          this.pendingConversationJoins.forEach(join => {
            this.socket!.emit('join-conversation', join);
          });
          this.pendingConversationJoins = [];
        }
        
        resolve();
      });

      this.socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        this.emitEvent('disconnect');
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.reconnectAttempts++;
        this.emitEvent('connect_error', error);
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(new Error('Failed to connect to WebSocket server'));
        }
      });

      // Set up message event listeners
      this.setupMessageListeners();
    });
  }

  private setupMessageListeners() {
    if (!this.socket) return;

    this.socket.on('new-message', (message: Message) => {
      this.emitEvent('new-message', message);
    });

    this.socket.on('new-message-notification', (notification: {
      messageId: string | number;
      senderId: number;
      senderUsername: string;
      listingDocumentId?: string;
      body: string;
    }) => {
      this.emitEvent('new-message-notification', notification);
    });

    this.socket.on('message-read', (data: { messageId: string }) => {
      this.emitEvent('message-read', data);
    });

    this.socket.on('unread-count-updated', (data: { count: number }) => {
      this.emitEvent('unread-count-updated', data);
    });

    this.socket.on('user-typing', (data: { userId: number; username: string; conversationId: string }) => {
      this.emitEvent('user-typing', data);
    });

    this.socket.on('user-stop-typing', (data: { userId: number; conversationId: string }) => {
      this.emitEvent('user-stop-typing', data);
    });
  }

  joinConversation(otherUserId: number, listingDocumentId?: string) {
    
    if (!this.socket?.connected) {
      console.warn('Cannot join conversation: WebSocket not connected, queuing for later');
      this.pendingConversationJoins.push({ otherUserId, listingDocumentId });
      return;
    }

    this.socket.emit('join-conversation', { otherUserId, listingDocumentId });
  }

  leaveConversation(otherUserId: number, listingDocumentId?: string) {
    if (!this.socket?.connected) {
      console.warn('Cannot leave conversation: WebSocket not connected');
      return;
    }

    this.socket.emit('leave-conversation', { otherUserId, listingDocumentId });
    
    // Remove from pending joins if it exists
    this.pendingConversationJoins = this.pendingConversationJoins.filter(
      join => !(join.otherUserId === otherUserId && join.listingDocumentId === listingDocumentId)
    );
  }

  sendTyping(otherUserId: number, listingDocumentId?: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('typing', { otherUserId, listingDocumentId });
  }

  stopTyping(otherUserId: number, listingDocumentId?: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('stop-typing', { otherUserId, listingDocumentId });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentUserId = null;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Event management methods
  on<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback as EventCallback);
  }

  off<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback as EventCallback);
      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  private emitEvent<K extends keyof WebSocketEvents>(event: K, ...args: Parameters<WebSocketEvents[K]>) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Cleanup method
  cleanup() {
    this.disconnect();
    this.eventListeners.clear();
    
    // Remove storage event listener to prevent memory leak
    if (this.storageListener && typeof window !== 'undefined') {
      window.removeEventListener('storage', this.storageListener);
      this.storageListener = null;
    }
  }
}

// Singleton instance
export const websocketService = new WebSocketService();

// Export types for use in components
export type { WebSocketService };