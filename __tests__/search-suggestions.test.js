/** @jest-environment node */

import { test, expect, beforeAll, afterAll } from '@jest/globals';
import { spawn } from 'child_process';

const BASE_URL = 'http://localhost:3000';
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

async function waitForServer(url, timeoutMs = 45000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const res = await fetch(`${url}/api/search/suggestions?query=toy`);
      if (res.ok) return;
    } catch {
      // Server not ready yet.
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Server did not become ready within ${timeoutMs}ms`);
}

describe('Search Suggestions API', () => {
  let serverProcess = null;

  beforeAll(async () => {
    serverProcess = spawn(npmCommand, ['run', 'dev'], {
      cwd: process.cwd(),
      stdio: 'ignore',
    });

    await waitForServer(BASE_URL);
  }, 60000);

  afterAll(() => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill('SIGTERM');
    }
  });

  test('should return suggestions for "toy"', async () => {
    const response = await fetch(`${BASE_URL}/api/search/suggestions?query=toy`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.query).toBe('toy');
    expect(Array.isArray(data.suggestions)).toBe(true);
    expect(data.suggestions.length).toBeGreaterThan(0);
    
    // Should contain Toyota make
    const toyotaSuggestion = data.suggestions.find(s => s.value === 'Toyota');
    expect(toyotaSuggestion).toBeDefined();
    expect(toyotaSuggestion.type).toBe('make');
  });

  test('should return suggestions for "land"', async () => {
    const response = await fetch(`${BASE_URL}/api/search/suggestions?query=land`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.query).toBe('land');
    expect(Array.isArray(data.suggestions)).toBe(true);
    expect(data.suggestions.length).toBeGreaterThan(0);
    
    // Should contain Land Cruiser model
    const landCruiserSuggestion = data.suggestions.find(s => s.value === 'Land Cruiser');
    expect(landCruiserSuggestion).toBeDefined();
    expect(landCruiserSuggestion.type).toBe('model');
  });

  test('should return suggestions payload for one-character query', async () => {
    const response = await fetch(`${BASE_URL}/api/search/suggestions?query=a`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.query).toBe('a');
    expect(Array.isArray(data.suggestions)).toBe(true);
    expect(data.suggestions.length).toBeLessThanOrEqual(8);
  });

  test('should return empty suggestions for no matches', async () => {
    const response = await fetch(`${BASE_URL}/api/search/suggestions?query=xyzabc123`);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.query).toBe('xyzabc123');
    expect(Array.isArray(data.suggestions)).toBe(true);
    expect(data.suggestions.length).toBe(0);
  });
});