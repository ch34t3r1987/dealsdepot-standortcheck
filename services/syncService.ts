
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PLZEntry } from '../types';

const DEFAULT_SUPABASE_URL = ''; 
const DEFAULT_SUPABASE_KEY = ''; 

let supabase: SupabaseClient | null = null;

export const initSupabase = (url: string, key: string) => {
  if (!url || !key) return null;
  try {
    // Falls die URL ungültig ist, wirft createClient evtl. einen Fehler
    if (!url.startsWith('http')) return null;
    supabase = createClient(url, key);
    return supabase;
  } catch (err) {
    console.warn("Supabase Init Error:", err);
    return null;
  }
};

export const getStoredConfig = () => {
  const localUrl = localStorage.getItem('supabase_url');
  const localKey = localStorage.getItem('supabase_key');

  return {
    url: localUrl || DEFAULT_SUPABASE_URL,
    key: localKey || DEFAULT_SUPABASE_KEY
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
    
    if (error) {
      console.warn("Fetch Error (Database missing?):", error.message);
      return [];
    }
    return data || [];
  } catch (error) {
    return [];
  }
};

export const pushEntry = async (entry: PLZEntry): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('plz_entries').insert([entry]);
    if (error) {
      console.error("Push Error details:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Critical Cloud Error:", error);
    return false;
  }
};

export const deleteEntry = async (id: string): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('plz_entries').delete().eq('id', id);
    if (error) return false;
    return true;
  } catch (error) {
    return false;
  }
};

export const subscribeToChanges = (
  onNewEntry: (entry: PLZEntry) => void,
  onDeletedEntry: (id: string) => void
) => {
  if (!supabase) return null;
  
  try {
    return supabase
      .channel('public:plz_entries')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'plz_entries' }, (payload) => {
        if (payload.new) onNewEntry(payload.new as PLZEntry);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'plz_entries' }, (payload) => {
        if (payload.old) onDeletedEntry(payload.old.id);
      })
      .subscribe();
  } catch (e) {
    return null;
  }
};
