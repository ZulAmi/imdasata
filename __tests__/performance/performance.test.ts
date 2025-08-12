/**
 * Performance Tests for Mental Health Platform
 * Testing for entry-level devices and network conditions
 */

import { chromium, Browser, Page } from 'playwright';
import axios from 'axios';
import { performance } from 'perf_hooks';

describe('Performance Tests', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    // Simulate low-end device conditions
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Linux; Android 8.0; SM-G532M) AppleWebKit/537.36'
    });
    await page.setViewportSize({ width: 360, height: 640 });
  });

  afterEach(async () => {
    await page.close();
  });

  describe('Page Load Performance', () => {
    test('should load main page within 3 seconds on slow 3G', async () => {
      // Simulate slow 3G connection
      await page.context().route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
        await route.continue();
      });

      const startTime = performance.now();
      await page.goto('http://localhost:3000');
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      const endTime = performance.now();
      
      const loadTime = endTime - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
    });

    test('should render critical content within 1.5 seconds', async () => {
      const startTime = performance.now();
      await page.goto('http://localhost:3000');
      
      // Wait for critical content to appear
      await page.waitForSelector('[data-testid="main-content"]', { timeout: 1500 });
      const endTime = performance.now();
      
      const renderTime = endTime - startTime;
      expect(renderTime).toBeLessThan(1500);
    });

    test('should have good Lighthouse performance score', async () => {
      // This would require lighthouse integration
      // For now, we'll test basic metrics
      await page.goto('http://localhost:3000');
      
      const metrics = await page.evaluate(() => {
        return {
          fcp: (performance as any).getEntriesByType('paint')?.find((entry: any) => entry.name === 'first-contentful-paint')?.startTime || 0,
          lcp: (performance as any).getEntriesByType('largest-contentful-paint')?.[0]?.startTime || 0,
          cls: 0 // Would need actual CLS measurement
        };
      });

      expect(metrics.fcp).toBeLessThan(2000); // First Contentful Paint < 2s
      expect(metrics.lcp).toBeLessThan(2500); // Largest Contentful Paint < 2.5s
    });
  });

  describe('API Performance', () => {
    test('should respond to PHQ-4 submission within 500ms', async () => {
      const startTime = performance.now();
      
      const response = await axios.post('http://localhost:3000/api/phq4', {
        answers: [1, 2, 1, 2],
        language: 'en'
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(500);
    });

    test('should handle multiple concurrent requests efficiently', async () => {
      const requests = Array(10).fill(null).map(async (_, index) => {
        const startTime = performance.now();
        const response = await axios.get(`http://localhost:3000/api/resources?category=counseling&page=${index % 3}`);
        const endTime = performance.now();
        
        return {
          status: response.status,
          responseTime: endTime - startTime
        };
      });

      const results = await Promise.all(requests);
      
      results.forEach(result => {
        expect(result.status).toBe(200);
        expect(result.responseTime).toBeLessThan(1000);
      });

      const avgResponseTime = results.reduce((sum, result) => sum + result.responseTime, 0) / results.length;
      expect(avgResponseTime).toBeLessThan(600);
    });

    test('should handle large resource lists efficiently', async () => {
      const startTime = performance.now();
      
      const response = await axios.get('http://localhost:3000/api/resources?limit=100');
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(1000);
      expect(response.data.resources).toBeDefined();
      expect(Array.isArray(response.data.resources)).toBe(true);
    });
  });

  describe('WhatsApp Bot Performance', () => {
    test('should process messages within 2 seconds', async () => {
      const mockMessage = {
        From: 'whatsapp:+1234567890',
        Body: 'I need help',
        MessageSid: 'test-sid-123'
      };

      const startTime = performance.now();
      
      const response = await axios.post('http://localhost:3000/api/whatsapp/webhook', mockMessage, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(processingTime).toBeLessThan(2000);
    });

    test('should handle conversation state efficiently', async () => {
      const userId = 'test-user-123';
      const messages = [
        'Hello',
        'I feel anxious',
        'Yes, I want to take an assessment',
        '2', // PHQ-4 answer
        '1', // PHQ-4 answer
        '2', // PHQ-4 answer
        '1'  // PHQ-4 answer
      ];

      const processingTimes: number[] = [];

      for (const message of messages) {
        const startTime = performance.now();
        
        await axios.post('http://localhost:3000/api/whatsapp/webhook', {
          From: `whatsapp:${userId}`,
          Body: message,
          MessageSid: `test-sid-${Date.now()}`
        });
        
        const endTime = performance.now();
        processingTimes.push(endTime - startTime);
      }

      // Each message should be processed quickly
      processingTimes.forEach(time => {
        expect(time).toBeLessThan(1500);
      });

      // Average processing time should be efficient
      const avgTime = processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length;
      expect(avgTime).toBeLessThan(1000);
    });
  });

  describe('Memory Usage', () => {
    test('should not have memory leaks during extended use', async () => {
      const initialMemory = process.memoryUsage();
      
      // Simulate heavy usage
      for (let i = 0; i < 50; i++) {
        await axios.get('http://localhost:3000/api/resources');
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    test('should efficiently handle large translation datasets', async () => {
      const { getTranslation } = require('../../src/lib/i18n');
      
      const startMemory = process.memoryUsage().heapUsed;
      
      // Load translations for all languages
      const languages = ['en', 'zh', 'bn', 'ta', 'my', 'id'];
      const keys = [
        'phq4.question1',
        'phq4.question2',
        'phq4.question3',
        'phq4.question4',
        'mood.happy',
        'mood.sad',
        'mood.anxious',
        'resources.counseling',
        'resources.crisis_hotline'
      ];

      for (const lang of languages) {
        for (const key of keys) {
          getTranslation(key, lang);
        }
      }

      const endMemory = process.memoryUsage().heapUsed;
      const memoryUsed = endMemory - startMemory;
      
      // Translation loading should be memory efficient (less than 10MB)
      expect(memoryUsed).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Database Performance', () => {
    test('should query user data efficiently', async () => {
      const startTime = performance.now();
      
      const response = await axios.get('http://localhost:3000/api/user/test-user-123/stats');
      
      const endTime = performance.now();
      const queryTime = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(queryTime).toBeLessThan(300); // Database queries should be fast
    });

    test('should handle batch operations efficiently', async () => {
      const batchData = Array(20).fill(null).map((_, index) => ({
        answers: [1, 2, 1, 2],
        language: 'en',
        userId: `batch-user-${index}`
      }));

      const startTime = performance.now();
      
      const promises = batchData.map(data => 
        axios.post('http://localhost:3000/api/phq4', data)
      );
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const batchTime = endTime - startTime;
      
      // Batch operations should complete within reasonable time
      expect(batchTime).toBeLessThan(5000);
    });
  });

  describe('Network Resilience', () => {
    test('should handle slow network conditions gracefully', async () => {
      // Simulate very slow network
      await page.context().route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 500));
        await route.continue();
      });

      await page.goto('http://localhost:3000');
      
      // Should show loading states appropriately
      const loadingElement = await page.waitForSelector('[data-testid="loading"]', { timeout: 1000 });
      expect(loadingElement).toBeTruthy();
      
      // Should eventually load content
      await page.waitForSelector('[data-testid="main-content"]', { timeout: 10000 });
    });

    test('should handle intermittent connectivity', async () => {
      let requestCount = 0;
      
      await page.context().route('**/*', async (route) => {
        requestCount++;
        // Fail every third request
        if (requestCount % 3 === 0) {
          await route.abort('internetdisconnected');
        } else {
          await route.continue();
        }
      });

      await page.goto('http://localhost:3000');
      
      // Should handle network errors gracefully
      const errorMessage = await page.waitForSelector('[data-testid="offline-message"]', { timeout: 5000 });
      expect(errorMessage).toBeTruthy();
    });
  });
});
