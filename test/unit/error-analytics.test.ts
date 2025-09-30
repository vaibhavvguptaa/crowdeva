import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';

describe('Error Analytics API', () => {
  it('should accept error analytics data', async () => {
    // Mock error data
    const errorData = {
      errors: [
        {
          error: 'Test error message',
          type: 'unknown',
          component: 'test-component',
          userAgent: 'test-agent',
          timestamp: new Date().toISOString(),
          url: 'http://localhost:3000/test',
          additional: { test: 'data' }
        }
      ]
    };

    // Test the endpoint
    const response = await fetch('http://localhost:3000/api/analytics/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorData),
    });

    expect(response.status).toBe(200);
    
    const result = await response.json();
    expect(result.message).toBe('Error analytics received');
  });

  it('should reject invalid data format', async () => {
    // Test with invalid data
    const response = await fetch('http://localhost:3000/api/analytics/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invalid: 'data' }),
    });

    expect(response.status).toBe(400);
    
    const result = await response.json();
    expect(result.error).toBe('Invalid data format');
  });
});