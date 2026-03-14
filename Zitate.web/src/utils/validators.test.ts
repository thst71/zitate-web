import { describe, it, expect } from 'vitest';
import {
  validateEntryText,
  validateAuthorName,
  validateLabelName,
  validateURL,
} from './validators';

describe('validators', () => {
  describe('validateEntryText', () => {
    it('should return valid for text within range', () => {
      const result = validateEntryText('Valid entry text');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty text', () => {
      const result = validateEntryText('');
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error).toBe('Text cannot be empty');
      }
    });

    it('should reject whitespace-only text', () => {
      const result = validateEntryText('   ');
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error).toBe('Text cannot be empty');
      }
    });

    it('should reject text over 10,000 characters', () => {
      const longText = 'a'.repeat(10001);
      const result = validateEntryText(longText);
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error).toBe('Text cannot exceed 10000 characters');
      }
    });

    it('should accept text at exactly 10,000 characters', () => {
      const maxText = 'a'.repeat(10000);
      const result = validateEntryText(maxText);
      expect(result.isValid).toBe(true);
    });

    it('should accept text with special characters', () => {
      const result = validateEntryText('Text with émojis 🎉 and symbols @#$%');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateAuthorName', () => {
    it('should return valid for name within range', () => {
      const result = validateAuthorName('John Doe');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty name', () => {
      const result = validateAuthorName('');
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error).toBe('Author name cannot be empty');
      }
    });

    it('should reject whitespace-only name', () => {
      const result = validateAuthorName('   ');
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error).toBe('Author name cannot be empty');
      }
    });

    it('should reject name over 200 characters', () => {
      const longName = 'a'.repeat(201);
      const result = validateAuthorName(longName);
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error).toBe('Author name cannot exceed 200 characters');
      }
    });

    it('should accept name at exactly 200 characters', () => {
      const maxName = 'a'.repeat(200);
      const result = validateAuthorName(maxName);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateLabelName', () => {
    it('should return valid for label within range', () => {
      const result = validateLabelName('Important');
      expect(result.isValid).toBe(true);
    });

    it('should reject empty label', () => {
      const result = validateLabelName('');
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error).toBe('Label name cannot be empty');
      }
    });

    it('should reject whitespace-only label', () => {
      const result = validateLabelName('   ');
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error).toBe('Label name cannot be empty');
      }
    });

    it('should reject label over 50 characters', () => {
      const longLabel = 'a'.repeat(51);
      const result = validateLabelName(longLabel);
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error).toBe('Label name cannot exceed 50 characters');
      }
    });

    it('should accept label at exactly 50 characters', () => {
      const maxLabel = 'a'.repeat(50);
      const result = validateLabelName(maxLabel);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateURL', () => {
    it('should return valid for http URL', () => {
      const result = validateURL('http://example.com/image.jpg');
      expect(result.isValid).toBe(true);
    });

    it('should return valid for https URL', () => {
      const result = validateURL('https://example.com/image.png');
      expect(result.isValid).toBe(true);
    });

    it('should return valid for data URL', () => {
      const result = validateURL('data:image/png;base64,iVBORw0KG');
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid URL', () => {
      const result = validateURL('not-a-url');
      expect(result.isValid).toBe(false);
      if (!result.isValid) {
        expect(result.error).toBe('Invalid URL format');
      }
    });

    it('should allow empty URL (optional)', () => {
      const result = validateURL('');
      expect(result.isValid).toBe(true);
    });

    it('should accept ftp URL', () => {
      const result = validateURL('ftp://example.com/image.jpg');
      expect(result.isValid).toBe(true);
    });
  });
});
