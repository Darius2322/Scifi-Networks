import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { createServiceRoleClient } from '@/lib/supabase/server';

export type TrackSession = {
  installation_id: string;
  customer_id: string;
};

export type TrackTicket = {
  id: string;
  ticket_number: string;
  type: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
};

export type TrackNotification = {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
};

/**
 * Verifies the httpOnly track-portal cookie. Returns null if missing/expired/
 * invalid — callers must redirect to /track (never render portal data).
 */
export async function getTrackSession(): Promise<TrackSession | null> {
  const cookie = cookies().get('scifi_track_session')?.value;
  if (!cookie) return null;

  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);
    const { payload } = await jwtVerify(cookie, secret);
    if (payload.scope !== 'track_portal') return null;
    return {
      installation_id: payload.installation_id as string,
      customer_id: payload.customer_id as string,
    };
  } catch {
    return null;
  }
}

/**
 * Fetches everything the track dashboard needs, scoped strictly to the
 * session's installation_id. Internal staff notes (ticket_updates.is_internal
 * = true) are explicitly excluded — customers never see internal comments.
 */
export async function getTrackPortalData(session: TrackSession) {
  const supabase = createServiceRoleClient();

  const { data: installation } = await supabase
    .from('installations')
    .select(`
      id, ticket_number, status, preferred_datetime, scheduled_at, completed_at, created_at,
      customers ( full_name, phone, email ),
      sites ( name ),
      packages ( name, speed_mbps, price_kes )
    `)
    .eq('id', session.installation_id)
    .single();

  const { data: tickets } = await supabase
    .from('tickets')
    .select('id, ticket_number, type, subject, status, priority, created_at')
    .eq('installation_id', session.installation_id)
    .order('created_at', { ascending: false });

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, title, body, is_read, created_at')
    .eq('customer_id', session.customer_id)
    .order('created_at', { ascending: false })
    .limit(20);

  return {
    installation,
    tickets: (tickets ?? []) as TrackTicket[],
    notifications: (notifications ?? []) as TrackNotification[],
  };
}
