import { test, expect, beforeAll, afterAll } from '@jest/globals';
import { execSync } from 'child_process';

describe('Search Suggestions API', () => {
  let serverProcess = null;

  beforeAll(() => {
    // Start the development server
    try {
      execSync('cd /home/welsh/E-GARAGE/Motorske/motorke && npm run dev &', { stdio: 'inherit' });
      // Wait a bit for server to start
      setTimeout(() => {}, 5000);
    } catch (error) {
      console.log('Server already running or failed to start');
    }
  });

  afterAll(() => {
    // Clean up
    try {
      execSync('pkill -f "next dev"');
    } catch (error) {
      console.log('No server process to kill');
    }
  });

  test('should return suggestions for "toy"', async () => {
    const response = await fetch('http://localhost:3000/api/search/suggestions?query=toy');
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
    const response = await fetch('http://localhost:3000/api/search/suggestions?query=land');
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

  test('should return empty suggestions for short query', async () => {
    const response = await fetch('http://localhost:3000/api/search/suggestions?query=a');
    const data = await response.json();
    
    expect(response.status).toBe(400); // Should fail validation for query too short
  });

  test('should return empty suggestions for no matches', async () => {
    const response = await fetch('http://localhost:3000/api/search/suggestions?query=xyzabc123');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.query).toBe('xyzabc123');
    expect(Array.isArray(data.suggestions)).toBe(true);
    expect(data.suggestions.length).toBe(0);
  });
});