/**
 * Fires the session webhook to Make.com and, in parallel, to n8n.
 * Returns the Make.com Response so existing response.ok checks continue to work.
 * The n8n call is fire-and-forget — it never blocks or breaks the Make flow.
 */
export async function fireSessionWebhooks(body: object): Promise<Response> {
  const makeUrl = process.env.NEXT_PUBLIC_MAKE_WEBHOOK_SESSION_URL!;
  const n8nUrl = process.env.NEXT_PUBLIC_N8N_SESSION_WEBHOOK_URL;

  if (n8nUrl) {
    fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch((err) => console.error('[N8N] Session webhook error:', err));
  }

  return fetch(makeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
