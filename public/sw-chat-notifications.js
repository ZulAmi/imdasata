// Service Worker for Chat Notifications
const CACHE_NAME = 'chat-notifications-v1';

// Install service worker
self.addEventListener('install', (event) => {
  console.log('Chat notification service worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/icons/chat-icon-192.png',
        '/icons/chat-badge-72.png'
      ]);
    })
  );
});

// Activate service worker
self.addEventListener('activate', (event) => {
  console.log('Chat notification service worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  if (!event.data) {
    return;
  }

  try {
    const data = event.data.json();
    const options = {
      body: data.message || 'New message in peer support chat',
      icon: '/icons/chat-icon-192.png',
      badge: '/icons/chat-badge-72.png',
      tag: `chat-${data.groupId || 'general'}`,
      data: data,
      requireInteraction: data.priority === 'urgent',
      vibrate: data.priority === 'urgent' ? [200, 100, 200] : [100],
      actions: [
        {
          action: 'view',
          title: 'View Chat',
          icon: '/icons/view-icon.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/dismiss-icon.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Chat Notification', options)
    );
  } catch (error) {
    console.error('Error handling push notification:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  const data = event.notification.data;
  
  if (event.action === 'view' || !event.action) {
    // Open the chat page
    const chatUrl = data.groupId 
      ? `/peer-support-chat?group=${data.groupId}`
      : '/peer-support-chat';
    
    event.waitUntil(
      clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then((clientList) => {
        // Check if chat is already open
        for (const client of clientList) {
          if (client.url.includes('/peer-support-chat')) {
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              data: data
            });
            return;
          }
        }
        
        // Open new window/tab
        return clients.openWindow(chatUrl);
      })
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification (already done above)
    console.log('Notification dismissed');
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.data);
  
  // Track notification dismissal for analytics
  // In a real app, you might send this data to your analytics service
});

// Handle background sync for offline message sending
self.addEventListener('sync', (event) => {
  if (event.tag === 'chat-message-sync') {
    event.waitUntil(syncChatMessages());
  }
});

// Background message sync function
async function syncChatMessages() {
  try {
    // Get pending messages from IndexedDB
    const pendingMessages = await getPendingMessages();
    
    for (const message of pendingMessages) {
      try {
        // Attempt to send the message
        const response = await fetch('/api/chat/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message)
        });
        
        if (response.ok) {
          // Remove from pending messages
          await removePendingMessage(message.id);
        }
      } catch (error) {
        console.error('Failed to sync message:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// IndexedDB helpers for offline functionality
async function getPendingMessages() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ChatDB', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingMessages'], 'readonly');
      const store = transaction.objectStore('pendingMessages');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('pendingMessages')) {
        db.createObjectStore('pendingMessages', { keyPath: 'id' });
      }
    };
  });
}

async function removePendingMessage(messageId) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ChatDB', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingMessages'], 'readwrite');
      const store = transaction.objectStore('pendingMessages');
      const deleteRequest = store.delete(messageId);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

// Handle message from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Send updates to clients
function sendUpdateToClients(data) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage(data);
    });
  });
}
