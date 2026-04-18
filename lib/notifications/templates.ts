/**
 * 通知固定模板（MVP）
 * 對應 openspec/changes/notification-delivery-mvp/design.md Non-Goals：不做 react-email / MJML 模板系統。
 * 未來擴充：接入對話摘要、客製化關懷訊息、AI 生成內容。
 */

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? 'https://moltos.care';

export interface ReminderTemplate {
  subject: string;
  title: string;
  body: string; // 純文字（用於 notifications.body 與 Email text）
  html: string; // HTML 版（用於 Email html）
}

export function buildCalmReminderTemplate(): ReminderTemplate {
  const subject = '「記得關心一下自己」— 小默提醒你';
  const title = '記得關心一下自己';
  const body = `嗨，又到了你設定的關心時間。
花一分鐘檢視今日的平靜指數，看看自己過得如何。
偶爾停下來關心自己，不是浪費時間，是對自己的溫柔。

打開 MOLTOS：${APP_URL}`;

  const html = `<!DOCTYPE html>
<html lang="zh-Hant">
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:24px auto;padding:0 16px;">
    <h2 style="color:#0f766e;margin-bottom:12px;">${title}</h2>
    <p>嗨，又到了你設定的關心時間。</p>
    <p>花一分鐘檢視今日的平靜指數，看看自己過得如何。</p>
    <p>偶爾停下來關心自己，不是浪費時間，是對自己的溫柔。</p>
    <p style="margin-top:24px;">
      <a href="${APP_URL}" style="display:inline-block;padding:10px 20px;background:#0f766e;color:#fff;text-decoration:none;border-radius:6px;">打開 MOLTOS</a>
    </p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin-top:32px;" />
    <p style="font-size:12px;color:#6b7280;">本郵件由 MOLTOS 依您的提醒設定自動發送。如需調整，請至設定頁 → 提醒排程。</p>
  </body>
</html>`;

  return { subject, title, body, html };
}
