/**
 * Daily-notification email: subject, HTML, and plain-text parts.
 *
 * Table-based layout with inline styles — the only thing that renders
 * reliably across Gmail / Apple Mail / Outlook. Keep it minimal and
 * robust; email clients are not browsers.
 *
 * Deliberately generic ("a new home") — no per-day data load, which
 * keeps the cron fast and preserves the mystery of today's house.
 */

const SITE_URL = "https://guesstheprice.ai";

// Brand palette (mirrors globals.css). Hex only — no CSS vars in email.
const INK = "#1A1A1A";
const PAPER = "#F7F4EE";
const CREAM = "#EDE6D6";
const ACCENT = "#FF5C39";
const MUTE = "#6b6960";

export interface DailyEmailParts {
  subject: string;
  html: string;
  text: string;
}

export function buildDailyNotificationEmail(opts: {
  dailyNumber: number;
  unsubscribeUrl: string;
}): DailyEmailParts {
  const { dailyNumber, unsubscribeUrl } = opts;
  const playUrl = `${SITE_URL}/daily`;

  const subject = `Today's house is ready — Daily #${dailyNumber}`;

  const text = [
    `Today's house is ready.`,
    ``,
    `A new home just dropped on Pricetag. One guess. How close can you get?`,
    ``,
    `Play today's house: ${playUrl}`,
    ``,
    `—`,
    `You're getting this because you joined the Pricetag daily list.`,
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");

  // prettier-ignore
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};">
  <!-- preheader (hidden) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">A new home just dropped. One guess. How close can you get?</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 40px -16px rgba(0,0,0,0.25);">
          <!-- header -->
          <tr>
            <td style="padding:28px 32px 0;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:20px;font-weight:600;color:${INK};">Pricetag</div>
            </td>
          </tr>
          <!-- headline -->
          <tr>
            <td style="padding:20px 32px 0;">
              <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;text-transform:uppercase;letter-spacing:0.16em;font-size:11px;font-weight:600;color:${MUTE};">Daily #${dailyNumber}</div>
              <h1 style="margin:10px 0 0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:500;font-size:34px;line-height:1.05;color:${INK};">Today's house<br>is ready.</h1>
            </td>
          </tr>
          <!-- body -->
          <tr>
            <td style="padding:18px 32px 0;">
              <p style="margin:0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.55;color:#3a3832;">A new home just dropped. One guess. No do-overs. How close can you get?</p>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding:26px 32px 4px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:14px;background:${ACCENT};">
                    <a href="${playUrl}" style="display:inline-block;padding:15px 28px;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:14px;">Play today's house &rarr;</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- divider -->
          <tr><td style="padding:28px 32px 0;"><div style="height:1px;background:${CREAM};"></div></td></tr>
          <!-- footer -->
          <tr>
            <td style="padding:18px 32px 30px;">
              <p style="margin:0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:${MUTE};">
                You're getting this because you joined the Pricetag daily list.<br>
                <a href="${unsubscribeUrl}" style="color:${MUTE};text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}
