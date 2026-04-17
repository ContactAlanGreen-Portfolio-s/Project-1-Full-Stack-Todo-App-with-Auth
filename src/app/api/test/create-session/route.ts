import { NextResponse } from 'next/server';

export async function GET() {
  if (process.env.NODE_ENV !== 'test') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Create a real user in the test DB and return a session
  // Implementation depends on your NextAuth setup
  // For simplicity, you can mock a JWT cookie here
  const response = NextResponse.json({ ok: true });
  response.cookies.set('next-auth.session-token', 'test-session-token', {
    httpOnly: true,
    path: '/',
  });
  return response;
}
