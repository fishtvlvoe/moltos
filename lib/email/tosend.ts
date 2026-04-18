/**
 * toSend Email 發送抽象層（AWS SES 底層）
 * 設計原則：永不 throw，失敗以 { success: false, error } 回傳
 * 對應 openspec/changes/notification-delivery-mvp/design.md Decision 1
 */

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const TOSEND_API_URL = 'https://api.tosend.com/v2/emails';

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.TOSEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'missing_api_key' };
  }

  const fromEmail = process.env.TOSEND_FROM_EMAIL ?? 'noreply@moltos.care';
  const fromName = process.env.TOSEND_FROM_NAME ?? 'MOLTOS';

  try {
    const response = await fetch(TOSEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: { email: fromEmail, name: fromName },
        to: [{ email: params.to }],
        subject: params.subject,
        html: params.html,
        ...(params.text ? { text: params.text } : {}),
      }),
    });

    if (!response.ok) {
      let detail = '';
      try {
        const body = await response.text();
        detail = body ? ` ${body}` : '';
      } catch {
        // ignore body read failure
      }
      return { success: false, error: `tosend_http_${response.status}${detail}` };
    }

    const data = (await response.json().catch(() => ({}))) as { message_id?: string };
    return { success: true, messageId: data.message_id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
