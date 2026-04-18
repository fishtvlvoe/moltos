import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { sendEmail } from '@/lib/email/tosend';

describe('lib/email/tosend.ts — sendEmail()', () => {
  const originalEnv = process.env;
  let fetchSpy: MockInstance;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = {
      ...originalEnv,
      TOSEND_API_KEY: 'tsend_test_key',
      TOSEND_FROM_EMAIL: 'noreply@moltos.care',
      TOSEND_FROM_NAME: 'MOLTOS 小默',
    };
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    process.env = originalEnv;
    fetchSpy.mockRestore();
  });

  it('returns success with messageId on 2xx response', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ message_id: 'msg_abc123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await sendEmail({
      to: 'user@example.com',
      subject: 'Test subject',
      html: '<p>hi</p>',
      text: 'hi',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('msg_abc123');
    expect(result.error).toBeUndefined();

    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.tosend.com/v2/emails');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'Bearer tsend_test_key'
    );
    const body = JSON.parse(init.body as string);
    expect(body.from).toEqual({ email: 'noreply@moltos.care', name: 'MOLTOS 小默' });
    expect(body.to).toEqual([{ email: 'user@example.com' }]);
    expect(body.subject).toBe('Test subject');
    expect(body.html).toBe('<p>hi</p>');
  });

  it('returns failure (does not throw) on non-2xx response', async () => {
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'invalid_recipient' }), { status: 400 })
    );

    const result = await sendEmail({
      to: 'bad@example.com',
      subject: 'x',
      html: 'x',
    });

    expect(result.success).toBe(false);
    expect(result.messageId).toBeUndefined();
    expect(result.error).toBeDefined();
    expect(result.error).toContain('400');
  });

  it('returns failure (does not throw) on fetch network error', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('ECONNRESET'));

    const result = await sendEmail({
      to: 'user@example.com',
      subject: 'x',
      html: 'x',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('ECONNRESET');
  });

  it('returns failure with missing_api_key when TOSEND_API_KEY absent', async () => {
    delete process.env.TOSEND_API_KEY;

    const result = await sendEmail({
      to: 'user@example.com',
      subject: 'x',
      html: 'x',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('missing_api_key');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
