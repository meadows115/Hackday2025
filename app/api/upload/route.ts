export const runtime = 'nodejs';
// Deprecated: Upload functionality removed. Keeping stub so older links return a clear message.
export async function POST() {
  return Response.json({ error: 'Upload endpoint disabled' }, { status: 410 });
}
