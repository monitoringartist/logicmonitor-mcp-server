/**
 * Tests for LogicMonitor MCP Server - Prompts
 */

import { describe, it, expect } from '@jest/globals';
import { listLMPrompts, getLMPrompt } from './prompts.js';

describe('LogicMonitor Prompts', () => {
  describe('listLMPrompts', () => {
    it('should return a list of available prompts', () => {
      const prompts = listLMPrompts();

      expect(prompts).toBeDefined();
      expect(Array.isArray(prompts)).toBe(true);
      expect(prompts.length).toBeGreaterThan(0);
    });

    it('should include the resource_check prompt', () => {
      const prompts = listLMPrompts();
      const healthPrompt = prompts.find(p => p.name === 'resource_check');

      expect(healthPrompt).toBeDefined();
      expect(healthPrompt?.name).toBe('resource_check');
      expect(healthPrompt?.description).toBeTruthy();
      expect(healthPrompt?.arguments).toBeDefined();
      expect(Array.isArray(healthPrompt?.arguments)).toBe(true);
    });

    it('should have valid prompt structure', () => {
      const prompts = listLMPrompts();

      prompts.forEach(prompt => {
        expect(prompt.name).toBeTruthy();
        expect(prompt.description).toBeTruthy();
        expect(typeof prompt.name).toBe('string');
        expect(typeof prompt.description).toBe('string');
      });
    });

    it('should have valid arguments structure for resource_check', () => {
      const prompts = listLMPrompts();
      const healthPrompt = prompts.find(p => p.name === 'resource_check');

      expect(healthPrompt?.arguments).toBeDefined();
      expect(healthPrompt?.arguments?.length).toBeGreaterThan(0);

      healthPrompt?.arguments?.forEach(arg => {
        expect(arg.name).toBeTruthy();
        expect(arg.description).toBeTruthy();
        expect(typeof arg.name).toBe('string');
        expect(typeof arg.description).toBe('string');
      });
    });
  });

  describe('getLMPrompt', () => {
    it('should return prompt by name', () => {
      const prompt = getLMPrompt('resource_check');

      expect(prompt).toBeDefined();
      expect(prompt?.name).toBe('resource_check');
    });

    it('should return undefined for non-existent prompt', () => {
      const prompt = getLMPrompt('non_existent_prompt');

      expect(prompt).toBeUndefined();
    });

    it('should return prompt with all properties', () => {
      const prompt = getLMPrompt('resource_check');

      expect(prompt).toBeDefined();
      expect(prompt?.name).toBeTruthy();
      expect(prompt?.description).toBeTruthy();
      expect(prompt?.arguments).toBeDefined();
    });
  });
});

