import { describe, it, expect } from 'vitest';
import { EMOJI_TO_ICON, getIconName } from './icon-mapping';

describe('icon-mapping', () => {
  describe('EMOJI_TO_ICON', () => {
    it('should provide emoji-to-icon mappings', () => {
      expect(EMOJI_TO_ICON).toBeDefined();
      expect(typeof EMOJI_TO_ICON).toBe('object');
    });

    it('should map chevron emoji to Lucide icons', () => {
      expect(EMOJI_TO_ICON['▼']).toBe('ChevronDown');
      expect(EMOJI_TO_ICON['▲']).toBe('ChevronUp');
    });

    it('should map health metric emoji to Lucide icons', () => {
      expect(EMOJI_TO_ICON['🚶']).toBe('Footprints');
      expect(EMOJI_TO_ICON['😴']).toBe('Moon');
      expect(EMOJI_TO_ICON['💧']).toBe('Droplet');
    });

    it('should map time and mail emoji to Lucide icons', () => {
      expect(EMOJI_TO_ICON['📧']).toBe('Mail');
      expect(EMOJI_TO_ICON['⏰']).toBe('Clock');
      expect(EMOJI_TO_ICON['🌙']).toBe('Moon');
    });

    it('should map social interaction emoji to Lucide icons', () => {
      expect(EMOJI_TO_ICON['♡']).toBe('Heart');
      expect(EMOJI_TO_ICON['❤️']).toBe('Heart');
      expect(EMOJI_TO_ICON['💬']).toBe('MessageCircle');
      expect(EMOJI_TO_ICON['📤']).toBe('Share');
      expect(EMOJI_TO_ICON['🔖']).toBe('Bookmark');
      expect(EMOJI_TO_ICON['📌']).toBe('Bookmark');
    });

    it('should map custom emoji to custom component names', () => {
      expect(EMOJI_TO_ICON['▌']).toBe('BlockCursor');
      expect(EMOJI_TO_ICON['●']).toBe('RecordingDot');
    });
  });

  describe('getIconName', () => {
    it('should return the icon name for a given emoji', () => {
      expect(getIconName('▼')).toBe('ChevronDown');
      expect(getIconName('🚶')).toBe('Footprints');
      expect(getIconName('▌')).toBe('BlockCursor');
    });

    it('should return undefined for unmapped emoji', () => {
      expect(getIconName('🚀')).toBeUndefined();
      expect(getIconName('😀')).toBeUndefined();
    });

    it('should handle empty string', () => {
      expect(getIconName('')).toBeUndefined();
    });
  });
});
