import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ZEROINVOICE_BASE = process.env.ZEROINVOICE_BASE_URL || 'https://zeroinvoice-silk.vercel.app';
const DEFAULT_ZI_KEY = 'zi_17762c7f1f650f2833f268e692573e5fa5e250b29b7a82de';

function getActiveApiKey(providedKey?: string | null): string {
  if (providedKey && typeof providedKey === 'string' && providedKey.startsWith('zi_')) {
    return providedKey.trim();
  }
  const envKey = process.env.ZEROINVOICE_API_KEY || process.env.ZEROINVOICE_APP_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.startsWith('zi_')) {
    return envKey.trim();
  }
  return DEFAULT_ZI_KEY;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { type = 'event', event_type, path = '/', ref, referrer, api_key } = body;
    const apiKey = getActiveApiKey(api_key);

    // CASE 1: type = 'visit' → gọi /api/track/visit (ANONYMOUS, KHÔNG cần Bearer, gửi api_key trong body)
    if (type === 'visit') {
      const visitBody: Record<string, unknown> = {
        type: 'page', // Để visit endpoint biết đây là page view thông thường
        api_key: apiKey,
        path: path || ref || '/',
      };
      if (referrer) visitBody.referrer = referrer;

      const visitRes = await fetch(`${ZEROINVOICE_BASE}/api/track/visit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitBody),
        cache: 'no-store',
      });

      const visitJson = await visitRes.json().catch(() => ({}));
      return NextResponse.json(visitJson, { status: visitRes.status });
    }

    // CASE 2: type = 'event' (mặc định) → gọi /api/track/event (BEARER AUTH)
    const allowedEvents = ['page_view', 'signup', 'cta_click', 'pricing_view'];
    const evt = allowedEvents.includes(event_type as string) ? event_type : 'page_view';

    const eventRes = await fetch(`${ZEROINVOICE_BASE}/api/track/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        event_type: evt,
        ref: (ref || path || '/').slice(0, 256), // Giới hạn 256 chars như backend yêu cầu
      }),
      cache: 'no-store',
    });

    const eventJson = await eventRes.json().catch(() => ({}));
    return NextResponse.json(eventJson, { status: eventRes.status });
  } catch (e: any) {
    return NextResponse.json(
      { data: { counted: false }, error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', endpoint: '/api/analytics', methods: ['POST'] });
}


