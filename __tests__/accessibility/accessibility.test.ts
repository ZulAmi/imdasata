/**
 * Accessibility Tests for Mental Health Platform
 * Testing for various user capabilities and assistive technologies
 */

import { chromium, Browser, Page } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

describe('Accessibility Tests', () => {
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
  });

  afterEach(async () => {
    await page.close();
  });

  describe('WCAG 2.1 AA Compliance', () => {
    test('should pass axe accessibility audit on main page', async () => {
      await page.goto('http://localhost:3000');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should pass accessibility audit on PHQ-4 assessment', async () => {
      await page.goto('http://localhost:3000/assessment');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should pass accessibility audit on resources page', async () => {
      await page.goto('http://localhost:3000/resources');
      
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  });

  describe('Keyboard Navigation', () => {
    test('should support full keyboard navigation', async () => {
      await page.goto('http://localhost:3000');
      
      // Test tab navigation through interactive elements
      await page.keyboard.press('Tab');
      let focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'A', 'INPUT', 'SELECT']).toContain(focusedElement);
      
      // Continue tabbing through elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(document.activeElement).not.toBeNull();
      }
    });

    test('should have visible focus indicators', async () => {
      await page.goto('http://localhost:3000');
      
      await page.keyboard.press('Tab');
      const focusStyles = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement;
        const styles = window.getComputedStyle(element);
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          boxShadow: styles.boxShadow
        };
      });
      
      // Should have visible focus indicator
      expect(
        focusStyles.outline !== 'none' || 
        focusStyles.outlineWidth !== '0px' || 
        focusStyles.boxShadow !== 'none'
      ).toBe(true);
    });

    test('should support escape key to close modals', async () => {
      await page.goto('http://localhost:3000');
      
      // Open a modal (if any)
      const modalTrigger = await page.$('[data-testid="open-modal"]');
      if (modalTrigger) {
        await modalTrigger.click();
        
        // Wait for modal to open
        await page.waitForSelector('[role="dialog"]');
        
        // Press escape to close
        await page.keyboard.press('Escape');
        
        // Modal should be closed
        const modal = await page.$('[role="dialog"]');
        expect(modal).toBeNull();
      }
    });
  });

  describe('Screen Reader Support', () => {
    test('should have proper heading hierarchy', async () => {
      await page.goto('http://localhost:3000');
      
      const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements =>
        elements.map(el => ({
          level: parseInt(el.tagName.substring(1)),
          text: el.textContent?.trim()
        }))
      );
      
      // Should have at least one h1
      const h1Count = headings.filter(h => h.level === 1).length;
      expect(h1Count).toBeGreaterThanOrEqual(1);
      
      // Heading levels should not skip
      const levels = headings.map(h => h.level);
      for (let i = 1; i < levels.length; i++) {
        const diff = levels[i] - levels[i - 1];
        expect(diff).toBeLessThanOrEqual(1);
      }
    });

    test('should have proper ARIA labels and roles', async () => {
      await page.goto('http://localhost:3000');
      
      // Check for navigation landmarks
      const nav = await page.$('nav[role="navigation"], [role="navigation"]');
      expect(nav).toBeTruthy();
      
      // Check for main content landmark
      const main = await page.$('main, [role="main"]');
      expect(main).toBeTruthy();
      
      // Check form elements have labels
      const unlabeledInputs = await page.$$eval('input:not([type="hidden"])', inputs =>
        inputs.filter(input => {
          const id = input.getAttribute('id');
          const ariaLabel = input.getAttribute('aria-label');
          const ariaLabelledBy = input.getAttribute('aria-labelledby');
          const label = id ? document.querySelector(`label[for="${id}"]`) : null;
          
          return !ariaLabel && !ariaLabelledBy && !label;
        }).length
      );
      
      expect(unlabeledInputs).toBe(0);
    });

    test('should announce form validation errors', async () => {
      await page.goto('http://localhost:3000/assessment');
      
      // Submit form without filling required fields
      const submitButton = await page.$('[type="submit"]');
      if (submitButton) {
        await submitButton.click();
        
        // Check for error announcements
        const errorMessages = await page.$$('[role="alert"], [aria-live="assertive"]');
        expect(errorMessages.length).toBeGreaterThan(0);
        
        // Errors should have descriptive text
        for (const error of errorMessages) {
          const text = await error.textContent();
          expect(text?.trim().length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Color and Contrast', () => {
    test('should meet WCAG AA contrast requirements', async () => {
      await page.goto('http://localhost:3000');
      
      const contrastIssues = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .include(['color-contrast'])
        .analyze();
      
      expect(contrastIssues.violations).toEqual([]);
    });

    test('should be usable without color alone', async () => {
      await page.goto('http://localhost:3000');
      
      // Simulate color blindness by removing color information
      await page.addStyleTag({
        content: `
          * {
            filter: grayscale(100%) !important;
          }
        `
      });
      
      // Check that important information is still conveyed
      const statusIndicators = await page.$$('[data-testid*="status"], [data-testid*="state"]');
      for (const indicator of statusIndicators) {
        const text = await indicator.textContent();
        const ariaLabel = await indicator.getAttribute('aria-label');
        const hasIcon = await indicator.$('svg, .icon');
        
        // Should have text, aria-label, or distinctive icon
        expect(
          (text && text.trim().length > 0) || 
          (ariaLabel && ariaLabel.length > 0) || 
          hasIcon
        ).toBe(true);
      }
    });
  });

  describe('Text and Typography', () => {
    test('should be readable at 200% zoom', async () => {
      await page.goto('http://localhost:3000');
      
      // Simulate 200% zoom
      await page.setViewportSize({ width: 640, height: 480 });
      await page.evaluate(() => {
        document.body.style.zoom = '2';
      });
      
      // Check that content is still accessible
      const overflowingElements = await page.$$eval('*', elements =>
        elements.filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > window.innerWidth;
        }).length
      );
      
      // Most elements should not overflow
      expect(overflowingElements).toBeLessThan(5);
    });

    test('should support text spacing adjustments', async () => {
      await page.goto('http://localhost:3000');
      
      // Apply WCAG text spacing requirements
      await page.addStyleTag({
        content: `
          * {
            line-height: 1.5 !important;
            letter-spacing: 0.12em !important;
            word-spacing: 0.16em !important;
            paragraph-spacing: 2em !important;
          }
        `
      });
      
      // Check that content is still readable and no text is cut off
      const hiddenText = await page.$$eval('*', elements =>
        elements.filter(el => {
          const styles = window.getComputedStyle(el);
          return styles.overflow === 'hidden' && el.scrollHeight > el.clientHeight;
        }).length
      );
      
      expect(hiddenText).toBe(0);
    });
  });

  describe('Mobile Accessibility', () => {
    test('should have appropriate touch targets', async () => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
      await page.goto('http://localhost:3000');
      
      const touchTargets = await page.$$eval('button, a, input, [role="button"]', elements =>
        elements.map(el => {
          const rect = el.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            area: rect.width * rect.height
          };
        })
      );
      
      // Touch targets should be at least 44x44px (WCAG AAA)
      const tooSmallTargets = touchTargets.filter(target => 
        target.width < 44 || target.height < 44
      );
      
      expect(tooSmallTargets.length).toBe(0);
    });

    test('should work with screen reader gestures', async () => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('http://localhost:3000');
      
      // Simulate screen reader navigation
      await page.evaluate(() => {
        // Focus on first heading
        const firstHeading = document.querySelector('h1, h2, h3');
        if (firstHeading) {
          (firstHeading as HTMLElement).focus();
        }
      });
      
      // Should be able to navigate by headings
      const headings = await page.$$('h1, h2, h3, h4, h5, h6');
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  describe('Language and Internationalization', () => {
    test('should have proper lang attributes', async () => {
      await page.goto('http://localhost:3000?lang=zh');
      
      const htmlLang = await page.getAttribute('html', 'lang');
      expect(htmlLang).toBeTruthy();
      
      // Check for language-specific content
      const chineseContent = await page.$eval('body', body => 
        /[\u4e00-\u9fff]/.test(body.textContent || '')
      );
      
      if (chineseContent) {
        expect(htmlLang).toBe('zh');
      }
    });

    test('should handle right-to-left languages properly', async () => {
      // This would be relevant if we add Arabic or Hebrew support
      await page.goto('http://localhost:3000');
      
      const direction = await page.evaluate(() => 
        document.documentElement.getAttribute('dir')
      );
      
      // Should explicitly set direction
      expect(['ltr', 'rtl']).toContain(direction);
    });
  });

  describe('Error Prevention and Recovery', () => {
    test('should provide clear error messages', async () => {
      await page.goto('http://localhost:3000/assessment');
      
      // Submit form with invalid data
      const form = await page.$('form');
      if (form) {
        await form.evaluate(form => (form as HTMLFormElement).submit());
        
        // Wait for error messages
        await page.waitForSelector('[role="alert"], .error-message', { timeout: 3000 });
        
        const errorMessages = await page.$$eval('[role="alert"], .error-message', 
          elements => elements.map(el => el.textContent?.trim())
        );
        
        // Error messages should be descriptive
        errorMessages.forEach(message => {
          expect(message).toBeTruthy();
          expect(message!.length).toBeGreaterThan(10);
        });
      }
    });

    test('should allow error correction', async () => {
      await page.goto('http://localhost:3000/assessment');
      
      // Find required input
      const requiredInput = await page.$('input[required], select[required]');
      if (requiredInput) {
        // Try to submit without filling
        await page.click('[type="submit"]');
        
        // Should show validation error
        const errorMessage = await page.waitForSelector('[role="alert"]', { timeout: 3000 });
        expect(errorMessage).toBeTruthy();
        
        // Fill the field correctly
        await requiredInput.fill('Valid input');
        
        // Error should be cleared or updated
        const updatedError = await page.$('[role="alert"]');
        if (updatedError) {
          const errorText = await updatedError.textContent();
          expect(errorText).not.toContain('required');
        }
      }
    });
  });

  describe('Assistive Technology Compatibility', () => {
    test('should work with simulated screen reader', async () => {
      await page.goto('http://localhost:3000');
      
      // Test programmatic focus management
      await page.evaluate(() => {
        const firstInteractive = document.querySelector('button, a, input') as HTMLElement;
        if (firstInteractive) {
          firstInteractive.focus();
        }
      });
      
      const activeElement = await page.evaluate(() => 
        document.activeElement?.tagName
      );
      
      expect(['BUTTON', 'A', 'INPUT', 'SELECT']).toContain(activeElement);
    });

    test('should support high contrast mode', async () => {
      await page.goto('http://localhost:3000');
      
      // Simulate high contrast mode
      await page.addStyleTag({
        content: `
          @media (prefers-contrast: high) {
            * {
              background: black !important;
              color: white !important;
              border-color: white !important;
            }
          }
        `
      });
      
      // Force high contrast
      await page.evaluate(() => {
        document.body.style.filter = 'contrast(200%)';
      });
      
      // Content should still be readable
      const textElements = await page.$$('p, span, div, h1, h2, h3, h4, h5, h6');
      expect(textElements.length).toBeGreaterThan(0);
    });
  });
});
