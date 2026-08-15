import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get('authorization');
    const secretParam = searchParams.get('secret');
    const expectedSecret = process.env.CRON_SECRET;

    // Validate secret if configured
    if (expectedSecret) {
      const isAuthorized =
        authHeader === `Bearer ${expectedSecret}` || secretParam === expectedSecret;
      if (!isAuthorized) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized cron request' },
          { status: 401 }
        );
      }
    }

    // Call the internal scan engine
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const scanUrl = `${protocol}://${host}/api/scan-providers`;

    const scanRes = await fetch(scanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ZeroLLM-Automated-Cron/1.0',
      },
      body: JSON.stringify({ trigger: 'cron' }),
      cache: 'no-store',
    });

    const result = await scanRes.json();

    return NextResponse.json({
      success: true,
      message: 'Automated periodic scan completed successfully',
      cron_triggered_at: new Date().toISOString(),
      scan_result: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to execute cron scan',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  return GET(req);
}
