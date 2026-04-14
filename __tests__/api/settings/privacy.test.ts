import { POST } from '@/app/api/settings/privacy/route';
import { createClient } from '@supabase/supabase-js';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

import { getServerSession } from 'next-auth';

describe('POST /api/settings/privacy', () => {
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

    const request = new Request('http://localhost/api/settings/privacy', {
      method: 'POST',
      body: JSON.stringify({
        personalization: true,
        analytics: true,
        recommendations: true,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid settings values', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'test@example.com' },
    });

    const request = new Request('http://localhost/api/settings/privacy', {
      method: 'POST',
      body: JSON.stringify({
        personalization: 'yes',
        analytics: true,
        recommendations: true,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Invalid settings values');
  });

  it('updates privacy settings successfully', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'test@example.com' },
    });

    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    mockSupabase.from = jest.fn().mockReturnValue({
      update: mockUpdate,
    });

    const request = new Request('http://localhost/api/settings/privacy', {
      method: 'POST',
      body: JSON.stringify({
        personalization: false,
        analytics: true,
        recommendations: false,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.settings.personalization).toBe(false);
    expect(data.settings.analytics).toBe(true);
    expect(data.settings.recommendations).toBe(false);
  });
});
