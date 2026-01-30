
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PLZEntry } from '../types';

let supabase: SupabaseClient | null = null;

export const initSupabase = (url: string, key: string) => {
  if (!url || !key || !url.startsWith('http')) return null;
  try {
    supabase = createClient(url, key);
    return supabase;
  } catch (err) {
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
    
    if (error) return [];
    return data || [];
  } catch (error) {
    return [];
  }
};

export const pushEntry = async (entry: PLZEntry): Promise<boolean> => {
  if (!supabase) return false;
  try {
    // Wir versuchen den Insert. 
    // Falls die Spalte 'state' in deiner DB fehlt, wird dieser Call fehlschlagen.
    const { error } = await supabase.from('plz_entries').insert([entry]);
    
    if (error) {
      console.error("Supabase Push Error:", error.message);
      // Wenn der Fehler sagt, dass 'state' fehlt, versuchen wir es ohne 'state'
      if (error.message.includes("column 'state'") || error.code === 'PGRST204') {
        const { state, ...entryWithoutState } = entry;
        const retry = await supabase.from('plz_entries').insert([entryWithoutState]);
        return !retry.error;
      }
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
};

export const deleteEntry = async (id: string): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('plz_entries').delete().eq('id', id);
    return !error;
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
