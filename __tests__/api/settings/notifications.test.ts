import { POST } from '@/app/api/settings/notifications/route';
import { createClient } from '@supabase/supabase-js';

// Mock getServerSession
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

import { getServerSession } from 'next-auth';

describe('POST /api/settings/notifications', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(),
        })),
      })),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('returns 401 if user is not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const request = new Request('http://localhost/api/settings/notifications', {
      method: 'POST',
      body: JSON.stringify({ channel: 'email', enabled: false }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 400 for invalid channel', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'test@example.com' },
    });

    const request = new Request('http://localhost/api/settings/notifications', {
      method: 'POST',
      body: JSON.stringify({ channel: 'invalid', enabled: true }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid channel');
  });

  it('returns 400 for invalid enabled value', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'test@example.com' },
    });

    const request = new Request('http://localhost/api/settings/notifications', {
      method: 'POST',
      body: JSON.stringify({ channel: 'email', enabled: 'yes' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toBe('Invalid enabled value');
  });

  it('updates notification preferences successfully', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'test@example.com' },
    });

    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: {
            notification_preferences: {
              email: true,
              in_app: true,
              push: false,
            },
          },
          error: null,
        }),
      }),
    });

    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    mockSupabase.from = jest.fn()
      .mockReturnValueOnce({ select: mockSelect })
      .mockReturnValueOnce({ update: mockUpdate });

    const request = new Request('http://localhost/api/settings/notifications', {
      method: 'POST',
      body: JSON.stringify({ channel: 'push', enabled: true }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.preferences.push).toBe(true);
  });

  it('handles fetch error gracefully', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'test@example.com' },
    });

    const mockSelect = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
        }),
      }),
    });

    mockSupabase.from = jest.fn().mockReturnValue({ select: mockSelect });

    const request = new Request('http://localhost/api/settings/notifications', {
      method: 'POST',
      body: JSON.stringify({ channel: 'email', enabled: false }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.success).toBe(false);
  });
});
