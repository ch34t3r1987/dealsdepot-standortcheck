import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PLZEntry } from '../types';

let supabase: SupabaseClient | null = null;

export const initSupabase = (url: string, key: string) => {
  if (!url || !key) return null;
  try {
    supabase = createClient(url, key);
    return supabase;
  } catch (err) {
    console.error("Supabase Init Error:", err);
    return null;
  }
};

export const getStoredConfig = () => {
  return {
    url: localStorage.getItem('supabase_url') || '',
    key: localStorage.getItem('supabase_key') || ''
  };
};

export const saveConfig = (url: string, key: string) => {
  localStorage.setItem('supabase_url', url);
  localStorage.setItem('supabase_key', key);
};

export const fetchEntries = async (): Promise<PLZEntry[]> => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('plz_entries')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching:", error);
    return [];
  }
};

export const pushEntry = async (entry: PLZEntry) => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('plz_entries').insert([entry]);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error pushing:", error);
    return false;
  }
};

export const subscribeToChanges = (onNewEntry: (entry: PLZEntry) => void) => {
  if (!supabase) return null;
  
  return supabase
    .channel('public:plz_entries')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'plz_entries' }, (payload) => {
      onNewEntry(payload.new as PLZEntry);
    })
    .subscribe();
};