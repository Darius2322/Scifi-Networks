import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Your session has expired.' }, { status: 401 });

  // Confirm the caller can actually see this ticket at all — relies on the
  // session-bound client's RLS (site-scoped staff, or owner/admin).
  const { data: ticket } = await supabase.from('tickets').select('id').eq('id', params.id).maybeSingle();
  if (!ticket) return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });

  const service = createServiceRoleClient();
  const { data: attachments } = await service
    .from('ticket_attachments')
    .select('id, storage_path, file_name, mime_type, created_at')
    .eq('ticket_id', params.id)
    .order('created_at', { ascending: false });

  const withUrls = await Promise.all(
    (attachments ?? []).map(async (a) => {
      const { data: signed } = await service.storage.from('ticket-attachments').createSignedUrl(a.storage_path, 300); // 5 min
      return { id: a.id, file_name: a.file_name, mime_type: a.mime_type, created_at: a.created_at, url: signed?.signedUrl ?? null };
    })
  );

  return NextResponse.json({ attachments: withUrls });
}
