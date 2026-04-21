import { io } from 'socket.io-client';
import { getApiOrigin } from './apiClient.js';

let socket = null;
const DEFAULT_DEDUPE_WINDOW_MS = 450;

function createSocket() {
  return io(getApiOrigin(), {
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });
}

export function getRealtimeSocket() {
  if (!socket) {
    socket = createSocket();
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

function parseRoomId(value) {
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return null;
  }

  return parsed;
}

function resolveDefaultEventKey(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if (payload.id) {
    return `id:${payload.id}`;
  }

  if (payload.comment_id) {
    return `comment-deleted:${payload.comment_id}`;
  }

  if (payload.comment?.id) {
    return `comment-created:${payload.comment.id}`;
  }

  if (payload.photo_id && payload.total_votes !== undefined) {
    return `vote:${payload.photo_id}:${payload.total_votes}`;
  }

  if (payload.photo_id) {
    return `photo:${payload.photo_id}`;
  }

  return null;
}

export function subscribeRealtimeRooms(currentSocket, { communityId, photoId } = {}) {
  const parsedCommunityId = parseRoomId(communityId);
  const parsedPhotoId = parseRoomId(photoId);

  if (parsedCommunityId) {
    currentSocket.emit('subscribe:community', parsedCommunityId);
  }

  if (parsedPhotoId) {
    currentSocket.emit('subscribe:photo', parsedPhotoId);
  }
}

export function registerRealtimeHandlers(currentSocket, handlers, { dedupeWindowMs = DEFAULT_DEDUPE_WINDOW_MS } = {}) {
  const recentEvents = new Map();
  const boundedHandlers = Array.isArray(handlers) ? handlers : [];

  const clearOldEntries = (now) => {
    if (recentEvents.size <= 250) {
      return;
    }

    const maxAge = dedupeWindowMs * 8;
    recentEvents.forEach((timestamp, key) => {
      if (now - timestamp > maxAge) {
        recentEvents.delete(key);
      }
    });
  };

  const wrappedHandlers = boundedHandlers
    .filter((entry) => entry && entry.event && typeof entry.handler === 'function')
    .map((entry) => {
      const wrappedHandler = (payload) => {
        const rawKey = entry.keySelector ? entry.keySelector(payload) : resolveDefaultEventKey(payload);
        if (rawKey !== null && rawKey !== undefined && rawKey !== '') {
          const key = `${entry.event}:${String(rawKey)}`;
          const now = Date.now();
          const lastSeen = recentEvents.get(key);

          if (lastSeen && now - lastSeen < dedupeWindowMs) {
            return;
          }

          recentEvents.set(key, now);
          clearOldEntries(now);
        }

        entry.handler(payload);
      };

      currentSocket.on(entry.event, wrappedHandler);
      return { event: entry.event, wrappedHandler };
    });

  return () => {
    wrappedHandlers.forEach(({ event, wrappedHandler }) => {
      currentSocket.off(event, wrappedHandler);
    });
  };
}
