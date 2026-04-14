import { describe, it, expect } from 'vitest';
import React from 'react';
import { BlockCursor, RecordingDot } from './custom-icons';

describe('Custom SVG Icons', () => {
  describe('BlockCursor', () => {
    it('should render without crashing', () => {
      const component = BlockCursor({ className: 'test-class' });
      expect(component).toBeDefined();
      expect(component.type).toBe('svg');
    });

    it('should accept className prop', () => {
      const testClass = 'w-6 h-6 text-blue-500';
      const component = BlockCursor({ className: testClass });
      expect(component.props.className).toBe(testClass);
    });

    it('should export a valid React component', () => {
      expect(typeof BlockCursor).toBe('function');
    });
  });

  describe('RecordingDot', () => {
    it('should render without crashing', () => {
      const component = RecordingDot({ className: 'test-class' });
      expect(component).toBeDefined();
      expect(component.type).toBe('svg');
    });

    it('should accept className prop', () => {
      const testClass = 'w-4 h-4 text-red-500';
      const component = RecordingDot({ className: testClass });
      expect(component.props.className).toBe(testClass);
    });

    it('should export a valid React component', () => {
      expect(typeof RecordingDot).toBe('function');
    });
  });
});
