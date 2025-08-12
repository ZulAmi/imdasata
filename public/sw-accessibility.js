/**
 * Service Worker for SATA Accessibility Offline Support
 * Enables offline functionality for accessibility features
 */

const CACHE_NAME = 'sata-accessibility-v1';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Essential files to cache for offline accessibility
const CRITICAL_RESOURCES = [
  '/',
  '/manifest.json',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/accessibility.css',
  // Accessibility-specific resources
  '/mood',
  '/voice',
  '/help',
  '/crisis',
  '/breathing'
];

// Cache mental health content for offline access
const OFFLINE_CONTENT = [
  {
    url: '/offline-mood-tracker',
    title: 'Mood Tracking (Offline)',
    content: `
      <div class="offline-mood-tracker">
        <h1>How are you feeling today?</h1>
        <div class="mood-options">
          <button class="mood-option" data-mood="very-happy">😄 Very Happy</button>
          <button class="mood-option" data-mood="happy">😊 Happy</button>
          <button class="mood-option" data-mood="neutral">😐 Neutral</button>
          <button class="mood-option" data-mood="sad">😢 Sad</button>
          <button class="mood-option" data-mood="very-sad">😭 Very Sad</button>
        </div>
        <textarea placeholder="Write about your feelings (optional)..." id="mood-notes"></textarea>
        <button id="save-mood">Save Mood Entry</button>
      </div>
    `
  },
  {
    url: '/offline-breathing',
    title: 'Breathing Exercise (Offline)',
    content: `
      <div class="offline-breathing">
        <h1>Breathing Exercise</h1>
        <div class="breathing-circle" id="breathing-circle">
          <span>Breathe</span>
        </div>
        <div class="breathing-instructions">
          <p id="breathing-text">Click start to begin</p>
          <button id="start-breathing">Start Exercise</button>
          <button id="stop-breathing" style="display:none;">Stop</button>
        </div>
      </div>
    `
  },
  {
    url: '/offline-crisis',
    title: 'Crisis Support (Offline)',
    content: `
      <div class="offline-crisis">
        <h1>🚨 Crisis Support</h1>
        <div class="emergency-contacts">
          <h2>Emergency Contacts</h2>
          <ul>
            <li><strong>Suicide Prevention Lifeline:</strong> 988</li>
            <li><strong>Crisis Text Line:</strong> Text HOME to 741741</li>
            <li><strong>Emergency Services:</strong> 911</li>
          </ul>
        </div>
        <div class="coping-strategies">
          <h2>Immediate Coping Strategies</h2>
          <ul>
            <li>Take slow, deep breaths</li>
            <li>Count to 10 slowly</li>
            <li>Call a trusted friend or family member</li>
            <li>Remove yourself from immediate danger</li>
            <li>Use grounding techniques (5-4-3-2-1 method)</li>
          </ul>
        </div>
        <button onclick="window.open('tel:988')">📞 Call Crisis Line</button>
      </div>
    `
  }
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('SATA Accessibility: Caching critical resources');
        return cache.addAll(CRITICAL_RESOURCES);
      })
      .catch((error) => {
        console.error('SATA Accessibility: Cache installation failed', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('SATA Accessibility: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle offline content requests
  if (url.pathname.startsWith('/offline-')) {
    event.respondWith(handleOfflineContent(url.pathname));
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static resources and navigation
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Try network request
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the new response
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Network failed, try to serve offline content
            if (request.mode === 'navigate') {
              return handleOfflineNavigation(url.pathname);
            }
            return new Response('Offline - content not available', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Handle offline content generation
function handleOfflineContent(pathname) {
  const content = OFFLINE_CONTENT.find(item => item.url === pathname);
  
  if (!content) {
    return new Response('Offline content not found', { status: 404 });
  }

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${content.title} - SATA</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          line-height: 1.6;
        }
        .offline-banner {
          background: #ffd700;
          padding: 10px;
          text-align: center;
          margin-bottom: 20px;
          border-radius: 4px;
        }
        .mood-options, .breathing-circle {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: center;
          margin: 20px 0;
        }
        .mood-option, button {
          padding: 15px 20px;
          font-size: 16px;
          border: 2px solid #ddd;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          min-width: 120px;
          min-height: 44px;
        }
        .mood-option:hover, button:hover {
          background: #f0f8ff;
          border-color: #0066cc;
        }
        .breathing-circle {
          width: 200px;
          height: 200px;
          border: 4px solid #0066cc;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 20px auto;
          font-size: 24px;
          animation: breathe 4s infinite;
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        textarea {
          width: 100%;
          min-height: 100px;
          padding: 10px;
          margin: 10px 0;
          border: 2px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }
        .emergency-contacts ul, .coping-strategies ul {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin: 10px 0;
        }
        .emergency-contacts li, .coping-strategies li {
          margin: 10px 0;
          font-size: 16px;
        }
      </style>
    </head>
    <body>
      <div class="offline-banner">
        📱 Offline Mode - Limited functionality available
      </div>
      ${content.content}
      <script>
        // Offline functionality scripts
        ${getOfflineScripts(pathname)}
      </script>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Generate JavaScript for offline functionality
function getOfflineScripts(pathname) {
  if (pathname === '/offline-mood-tracker') {
    return `
      document.addEventListener('DOMContentLoaded', function() {
        const moodOptions = document.querySelectorAll('.mood-option');
        const saveButton = document.getElementById('save-mood');
        const notesTextarea = document.getElementById('mood-notes');
        let selectedMood = null;

        moodOptions.forEach(option => {
          option.addEventListener('click', function() {
            moodOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            selectedMood = this.dataset.mood;
          });
        });

        saveButton.addEventListener('click', function() {
          if (selectedMood) {
            const entry = {
              mood: selectedMood,
              notes: notesTextarea.value,
              timestamp: new Date().toISOString()
            };
            
            // Store in localStorage for sync when online
            const entries = JSON.parse(localStorage.getItem('offline-mood-entries') || '[]');
            entries.push(entry);
            localStorage.setItem('offline-mood-entries', JSON.stringify(entries));
            
            alert('Mood entry saved! Will sync when you go back online.');
            
            // Reset form
            moodOptions.forEach(opt => opt.classList.remove('selected'));
            notesTextarea.value = '';
            selectedMood = null;
          } else {
            alert('Please select a mood first.');
          }
        });
      });
    `;
  }

  if (pathname === '/offline-breathing') {
    return `
      document.addEventListener('DOMContentLoaded', function() {
        const startButton = document.getElementById('start-breathing');
        const stopButton = document.getElementById('stop-breathing');
        const breathingText = document.getElementById('breathing-text');
        const breathingCircle = document.getElementById('breathing-circle');
        let breathingInterval;
        let isBreathing = false;

        const breathingSteps = [
          { text: 'Breathe in...', duration: 4000 },
          { text: 'Hold...', duration: 2000 },
          { text: 'Breathe out...', duration: 4000 },
          { text: 'Rest...', duration: 2000 }
        ];
        
        let currentStep = 0;

        function nextBreathingStep() {
          const step = breathingSteps[currentStep];
          breathingText.textContent = step.text;
          
          setTimeout(() => {
            if (isBreathing) {
              currentStep = (currentStep + 1) % breathingSteps.length;
              nextBreathingStep();
            }
          }, step.duration);
        }

        startButton.addEventListener('click', function() {
          isBreathing = true;
          startButton.style.display = 'none';
          stopButton.style.display = 'inline-block';
          nextBreathingStep();
        });

        stopButton.addEventListener('click', function() {
          isBreathing = false;
          startButton.style.display = 'inline-block';
          stopButton.style.display = 'none';
          breathingText.textContent = 'Click start to begin';
        });
      });
    `;
  }

  return '';
}

// Handle offline navigation
function handleOfflineNavigation(pathname) {
  // Map paths to offline equivalents
  const offlineMap = {
    '/mood': '/offline-mood-tracker',
    '/breathing': '/offline-breathing',
    '/crisis': '/offline-crisis'
  };

  if (offlineMap[pathname]) {
    return handleOfflineContent(offlineMap[pathname]);
  }

  // Default offline page
  const offlineHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - SATA</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          padding: 50px;
          background: #f8f9fa;
        }
        .offline-container {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          max-width: 500px;
          margin: 0 auto;
        }
        .offline-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        .offline-links {
          margin-top: 30px;
        }
        .offline-link {
          display: inline-block;
          margin: 10px;
          padding: 15px 25px;
          background: #0066cc;
          color: white;
          text-decoration: none;
          border-radius: 8px;
          font-size: 16px;
        }
        .offline-link:hover {
          background: #0052a3;
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">📱</div>
        <h1>You're Offline</h1>
        <p>Some features are still available while you're offline:</p>
        <div class="offline-links">
          <a href="/offline-mood-tracker" class="offline-link">😊 Track Mood</a>
          <a href="/offline-breathing" class="offline-link">🫁 Breathing Exercise</a>
          <a href="/offline-crisis" class="offline-link">🚨 Crisis Support</a>
        </div>
        <p><small>Connect to the internet to access all features</small></p>
      </div>
    </body>
    </html>
  `;

  return new Response(offlineHtml, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// Handle API requests when offline
function handleApiRequest(request) {
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'This feature requires an internet connection',
      offline: true
    }),
    {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'SYNC_OFFLINE_DATA':
      syncOfflineData();
      break;
    case 'CACHE_CONTENT':
      cacheContent(data);
      break;
    case 'CLEAR_CACHE':
      clearAccessibilityCache();
      break;
  }
});

// Sync offline data when connection is restored
async function syncOfflineData() {
  try {
    // Sync mood entries
    const moodEntries = localStorage.getItem('offline-mood-entries');
    if (moodEntries) {
      const entries = JSON.parse(moodEntries);
      for (const entry of entries) {
        try {
          await fetch('/api/mood-entries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
          });
        } catch (error) {
          console.error('Failed to sync mood entry:', error);
        }
      }
      localStorage.removeItem('offline-mood-entries');
    }

    // Notify main thread of successful sync
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'SYNC_COMPLETE' });
      });
    });
  } catch (error) {
    console.error('Offline data sync failed:', error);
  }
}

// Cache additional content
async function cacheContent(urls) {
  const cache = await caches.open(CACHE_NAME);
  return cache.addAll(urls);
}

// Clear accessibility cache
async function clearAccessibilityCache() {
  return caches.delete(CACHE_NAME);
}
