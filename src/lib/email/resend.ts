/**
 * Resend client + daily-notification batch sender.
 *
 * Nothing sends unless RESEND_API_KEY is set — isResendConfigured()
 * gates the cron so an un-provisioned deploy is a safe no-op.
 */

import { Resend } from "resend";
import { buildDailyNotificationEmail } from "./dailyNotification";

const DEFAULT_FROM = "Pricetag <daily@guesstheprice.ai>";
const SITE_URL = "https://guesstheprice.ai";

// Resend's batch endpoint accepts up to 100 messages per call.
const BATCH_SIZE = 100;

export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

function getClient(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

function fromAddress(): string {
  return process.env.NOTIFY_FROM_EMAIL || DEFAULT_FROM;
}

function unsubscribeUrl(token: string): string {
  return `${SITE_URL}/api/notify/unsubscribe?token=${encodeURIComponent(token)}`;
}

interface Recipient {
  email: string;
  unsubToken: string;
}

export interface SendResult {
  attempted: number;
  sent: number;
  failed: number;
  /** Emails that sent successfully — the caller records these as delivered. */
  sentEmails: string[];
  errors: string[];
}

/**
 * Send the daily notification to a list of recipients, chunked into
 * batches of 100. A chunk that errors is counted as failed (not
 * recorded as delivered) so the next cron run retries it.
 */
export async function sendDailyNotifications(
  recipients: Recipient[],
  dailyNumber: number,
): Promise<SendResult> {
  const client = getClient();
  const from = fromAddress();
  const result: SendResult = { attempted: recipients.length, sent: 0, failed: 0, sentEmails: [], errors: [] };

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const chunk = recipients.slice(i, i + BATCH_SIZE);
    const messages = chunk.map((r) => {
      const unsub = unsubscribeUrl(r.unsubToken);
      const { subject, html, text } = buildDailyNotificationEmail({ dailyNumber, unsubscribeUrl: unsub });
      return {
        from,
        to: [r.email],
        subject,
        html,
        text,
        headers: {
          // RFC 8058 one-click unsubscribe — Gmail/Apple render a native
          // "Unsubscribe" button from these two headers.
          "List-Unsubscribe": `<${unsub}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      };
    });

    try {
      const { error } = await client.batch.send(messages);
      if (error) {
        result.failed += chunk.length;
        result.errors.push(`batch ${i / BATCH_SIZE}: ${error.message ?? String(error)}`);
      } else {
        result.sent += chunk.length;
        result.sentEmails.push(...chunk.map((r) => r.email));
      }
    } catch (err) {
      result.failed += chunk.length;
      result.errors.push(`batch ${i / BATCH_SIZE}: ${(err as Error).message}`);
    }
  }

  return result;
}

/**
 * Send a single test email to an arbitrary address, bypassing the
 * waitlist + delivery ledger. Used by the cron's ?testEmail= mode for a
 * visual check before enabling the real send.
 */
export async function sendTestNotification(toEmail: string, dailyNumber: number): Promise<void> {
  const client = getClient();
  const unsub = unsubscribeUrl("test-token-not-real");
  const { subject, html, text } = buildDailyNotificationEmail({ dailyNumber, unsubscribeUrl: unsub });
  const { error } = await client.emails.send({
    from: fromAddress(),
    to: [toEmail],
    subject: `[TEST] ${subject}`,
    html,
    text,
  });
  if (error) throw new Error(error.message ?? String(error));
}
