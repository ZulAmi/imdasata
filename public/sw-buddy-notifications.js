/**
 * Buddy System Service Worker
 * Handles push notifications and offline functionality for the buddy system
 */

// Service Worker for Buddy System Push Notifications
const CACHE_NAME = 'buddy-system-v1';
const urlsToCache = [
  '/buddy-system',
  '/buddy-admin',
  '/static/icons/buddy-icon.png',
  '/static/icons/buddy-badge.png'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Push event
self.addEventListener('push', (event) => {
  console.log('Push received:', event);
  
  let notificationData = {
    title: 'Buddy System',
    body: 'You have a new buddy notification',
    icon: '/icons/buddy-icon.png',
    badge: '/icons/buddy-badge.png',
    tag: 'buddy-notification',
    requireInteraction: false,
    data: {}
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
    } catch (e) {
      console.log('Error parsing push data:', e);
      notificationData.body = event.data.text();
    }
  }

  // Customize notification based on type
  if (notificationData.data && notificationData.data.type) {
    const type = notificationData.data.type;
    
    switch (type) {
      case 'new-buddy':
        notificationData.icon = '/icons/buddy-new.png';
        notificationData.requireInteraction = true;
        notificationData.actions = [
          {
            action: 'view-buddy',
            title: 'Meet Your Buddy',
            icon: '/icons/action-view.png'
          },
          {
            action: 'dismiss',
            title: 'Later',
            icon: '/icons/action-dismiss.png'
          }
        ];
        break;
        
      case 'check-in-reminder':
        notificationData.icon = '/icons/buddy-reminder.png';
        notificationData.actions = [
          {
            action: 'check-in',
            title: 'Check In Now',
            icon: '/icons/action-checkin.png'
          },
          {
            action: 'snooze',
            title: 'Remind Later',
            icon: '/icons/action-snooze.png'
          }
        ];
        break;
        
      case 'buddy-message':
        notificationData.icon = '/icons/buddy-message.png';
        notificationData.actions = [
          {
            action: 'reply',
            title: 'Reply',
            icon: '/icons/action-reply.png'
          },
          {
            action: 'view-chat',
            title: 'View Chat',
            icon: '/icons/action-view.png'
          }
        ];
        break;
        
      case 'achievement':
        notificationData.icon = '/icons/buddy-achievement.png';
        notificationData.actions = [
          {
            action: 'view-achievements',
            title: 'View All',
            icon: '/icons/action-view.png'
          }
        ];
        break;
        
      case 'safety-alert':
        notificationData.icon = '/icons/buddy-safety.png';
        notificationData.requireInteraction = true;
        notificationData.tag = 'safety-alert';
        break;
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  
  let urlToOpen = '/buddy-system';
  
  switch (action) {
    case 'view-buddy':
      urlToOpen = '/buddy-system';
      break;
      
    case 'check-in':
      urlToOpen = '/buddy-system?action=check-in';
      break;
      
    case 'reply':
    case 'view-chat':
      urlToOpen = '/buddy-system?action=chat';
      break;
      
    case 'view-achievements':
      urlToOpen = '/buddy-system?tab=stats';
      break;
      
    case 'snooze':
      // Snooze for 1 hour
      setTimeout(() => {
        self.registration.showNotification(
          'Buddy Check-in Reminder',
          {
            body: 'Time for your buddy check-in!',
            icon: '/icons/buddy-reminder.png',
            tag: 'check-in-snooze',
            data: data
          }
        );
      }, 60 * 60 * 1000); // 1 hour
      return;
      
    case 'dismiss':
      return;
      
    default:
      // Default click action
      if (data.type === 'new-buddy') {
        urlToOpen = '/buddy-system';
      } else if (data.type === 'check-in-reminder') {
        urlToOpen = '/buddy-system?action=check-in';
      } else if (data.type === 'buddy-message') {
        urlToOpen = '/buddy-system?action=chat';
      } else if (data.type === 'achievement') {
        urlToOpen = '/buddy-system?tab=stats';
      }
  }
  
  // Focus or open window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if window is already open
        for (const client of clientList) {
          if (client.url.includes('/buddy-system') && 'focus' in client) {
            // Update URL if needed
            if (urlToOpen !== '/buddy-system') {
              client.navigate(urlToOpen);
            }
            return client.focus();
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline buddy interactions
self.addEventListener('sync', (event) => {
  if (event.tag === 'buddy-sync') {
    event.waitUntil(syncBuddyData());
  }
});

async function syncBuddyData() {
  try {
    // Get pending buddy interactions from IndexedDB
    const pendingInteractions = await getPendingInteractions();
    
    for (const interaction of pendingInteractions) {
      try {
        // Try to sync with server
        await fetch('/api/buddy/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(interaction)
        });
        
        // Remove from pending if successful
        await removePendingInteraction(interaction.id);
      } catch (error) {
        console.log('Failed to sync interaction:', interaction.id, error);
      }
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

// IndexedDB helpers for offline functionality
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BuddySystemDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pendingInteractions')) {
        const store = db.createObjectStore('pendingInteractions', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp');
      }
      
      if (!db.objectStoreNames.contains('offlineMessages')) {
        const store = db.createObjectStore('offlineMessages', { keyPath: 'id' });
        store.createIndex('pairId', 'pairId');
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
}

async function getPendingInteractions() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingInteractions'], 'readonly');
    const store = transaction.objectStore('pendingInteractions');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function removePendingInteraction(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingInteractions'], 'readwrite');
    const store = transaction.objectStore('pendingInteractions');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Periodic tasks
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'BUDDY_HEARTBEAT') {
    // Send heartbeat to keep connection alive
    event.ports[0].postMessage({
      type: 'BUDDY_HEARTBEAT_ACK',
      timestamp: Date.now()
    });
  }
  
  if (event.data && event.data.type === 'BUDDY_NOTIFICATION_PERMISSION') {
    // Handle notification permission changes
    const permission = Notification.permission;
    event.ports[0].postMessage({
      type: 'BUDDY_NOTIFICATION_PERMISSION_STATUS',
      permission: permission
    });
  }
});

// Cleanup old cached data
self.addEventListener('activate', (event) => {
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

// Push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('Push subscription changed');
  
  event.waitUntil(
    // Re-subscribe and send new subscription to server
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        'your-vapid-public-key-here' // Replace with actual VAPID key
      )
    }).then((subscription) => {
      return fetch('/api/buddy/push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription,
          oldEndpoint: event.oldSubscription ? event.oldSubscription.endpoint : null
        })
      });
    })
  );
});

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
