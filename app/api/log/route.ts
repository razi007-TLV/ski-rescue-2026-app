import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const password = request.nextUrl.searchParams.get('password');
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
