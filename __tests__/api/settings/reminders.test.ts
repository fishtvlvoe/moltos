import { POST } from '@/app/api/settings/reminders/route';
import { createClient } from '@supabase/supabase-js';

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

import { getServerSession } from 'next-auth';

describe('POST /api/settings/reminders', () => {
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

    const request = new Request('http://localhost/api/settings/reminders', {
      method: 'POST',
      body: JSON.stringify({
        enabled: true,
        time: '09:00',
        frequency: 'daily',
        types: ['calm_index'],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('returns 400 for invalid time format', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'test@example.com' },
    });

    const request = new Request('http://localhost/api/settings/reminders', {
      method: 'POST',
      body: JSON.stringify({
        enabled: true,
        time: '25:00',
        frequency: 'daily',
        types: ['calm_index'],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Invalid time format');
  });

  it('returns 400 for invalid frequency', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'test@example.com' },
    });

    const request = new Request('http://localhost/api/settings/reminders', {
      method: 'POST',
      body: JSON.stringify({
        enabled: true,
        time: '09:00',
        frequency: 'invalid',
        types: ['calm_index'],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('Invalid frequency');
  });

  it('returns 400 for empty types', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'test@example.com' },
    });

    const request = new Request('http://localhost/api/settings/reminders', {
      method: 'POST',
      body: JSON.stringify({
        enabled: true,
        time: '09:00',
        frequency: 'daily',
        types: [],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBe('At least one type must be selected');
  });

  it('updates reminder schedule successfully', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { email: 'test@example.com' },
    });

    const mockUpdate = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    mockSupabase.from = jest.fn().mockReturnValue({
      update: mockUpdate,
    });

    const request = new Request('http://localhost/api/settings/reminders', {
      method: 'POST',
      body: JSON.stringify({
        enabled: true,
        time: '09:00',
        frequency: 'daily',
        types: ['calm_index', 'chat_summary'],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.schedule.types).toContain('calm_index');
    expect(data.schedule.types).toContain('chat_summary');
  });
});
