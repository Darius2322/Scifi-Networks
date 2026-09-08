import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createServiceRoleClient } from '@/lib/supabase/server';
import { getTrackSession } from '@/lib/auth/track-session';
import { verifyAttachmentToken } from '@/lib/auth/attachment-token';
import { isRateLimited } from '@/lib/auth/rate-limit';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

async function isAuthorized(req: NextRequest, ticketId: string): Promise<{ ok: boolean; uploaderId?: string; uploaderCustomerId?: string }> {
  // 1. Logged-in staff/admin — always allowed (RLS still applies to any
  // further reads of this ticket elsewhere).
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) return { ok: true, uploaderId: user.id };

  // 2. Track-portal session scoped to this exact ticket's installation.
  const trackSession = await getTrackSession();
  if (trackSession) {
    const service = createServiceRoleClient();
    const { data: ticket } = await service.from('tickets').select('installation_id, customer_id').eq('id', ticketId).single();
    if (ticket?.installation_id === trackSession.installation_id) {
      return { ok: true, uploaderCustomerId: trackSession.customer_id };
    }
  }

  // 3. Short-lived token issued immediately after anonymous/public report creation.
  const token = req.headers.get('x-attachment-token');
  if (token && (await verifyAttachmentToken(token, ticketId))) {
    return { ok: true };
  }

  return { ok: false };
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (isRateLimited(`attachment-upload:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many uploads. Please try again later.' }, { status: 429 });
  }

  const auth = await isAuthorized(req, params.id);
  if (!auth.ok) {
    return NextResponse.json({ error: 'You are not authorized to attach files to this ticket.' }, { status: 403 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, or WebP images are allowed.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File is too large (5MB max).' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `tickets/${params.id}/${crypto.randomUUID()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from('ticket-attachments')
    .upload(path, Buffer.from(arrayBuffer), { contentType: file.type });

  if (uploadError) {
    return NextResponse.json({ error: 'Could not upload the file. Please try again.' }, { status: 500 });
  }

  const { error: dbError } = await supabase.from('ticket_attachments').insert({
    ticket_id: params.id,
    storage_path: path,
    file_name: file.name,
    mime_type: file.type,
    file_size_bytes: file.size,
    uploaded_by: auth.uploaderId || null,
    uploaded_by_customer_id: auth.uploaderCustomerId || null,
  });

  if (dbError) {
    await supabase.storage.from('ticket-attachments').remove([path]);
    return NextResponse.json({ error: 'Could not save the attachment record.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
