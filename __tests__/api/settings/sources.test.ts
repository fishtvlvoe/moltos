import { POST } from '@/app/api/settings/sources/route';
import { createClient } from '@supabase/supabase-js';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

import { getServerSession } from 'next-auth';

describe('POST /api/settings/sources', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn(() => ({
        update: jest.fn(() => ({
          eq: jest.fn(),
        })),
      })),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('returns 401 if user is not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const request = new Request('http://localhost/api/settings/sources', {
      method: 'POST',
      body: JSON.stringify({
        gmail: {
          connected: true,
          priority: 1,
          sync_interval: 'daily',
        },
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid sync_interval', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'test@example.com' },
    });

    const request = new Request('http://localhost/api/settings/sources', {
      method: 'POST',
      body: JSON.stringify({
        gmail: {
          connected: true,
          priority: 1,
          sync_interval: 'invalid',
        },
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Invalid sync_interval');
  });

  it('updates source priorities successfully', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'test@example.com' },
    });

    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    mockSupabase.from = jest.fn().mockReturnValue({
      update: mockUpdate,
    });

    const sources = {
      gmail: {
        connected: true,
        priority: 2,
        sync_interval: 'hourly',
      },
    };

    const request = new Request('http://localhost/api/settings/sources', {
      method: 'POST',
      body: JSON.stringify(sources),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.sources.gmail.priority).toBe(2);
    expect(data.sources.gmail.sync_interval).toBe('hourly');
  });
});
