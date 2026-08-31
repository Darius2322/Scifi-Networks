import { createServerSupabase } from '@/lib/supabase/server';

export async function getActiveSites() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('sites')
    .select('id, name, slug, network_status')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('getActiveSites failed', error.message);
    return [];
  }
  return data ?? [];
}

export async function getActivePackages() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('packages')
    .select('id, name, speed_mbps, price_kes, duration_days, description, features')
    .eq('is_active', true)
    .eq('is_archived', false)
    .order('price_kes');

  if (error) {
    console.error('getActivePackages failed', error.message);
    return [];
  }
  return data ?? [];
}

export async function getPublishedFaqs() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('faqs')
    .select('id, category, question, answer')
    .eq('is_published', true)
    .order('sort_order');

  if (error) {
    console.error('getPublishedFaqs failed', error.message);
    return [];
  }
  return data ?? [];
}

export async function getActiveOutagesBySite() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('network_outages')
    .select('id, site_id, title, status, affected_area, started_at, expected_resolution_at')
    .is('resolved_at', null)
    .order('started_at', { ascending: false });

  if (error) {
    console.error('getActiveOutagesBySite failed', error.message);
    return [];
  }
  return data ?? [];
}
