import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export function useClients() {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('clients').select('*').order('name', { ascending: true });
    if (!error) setClients(data || []);
    setIsLoading(false);
  };

  const createClient = async (clientData) => {
    const { data, error } = await supabase.from('clients').insert([clientData]).select();
    if (!error) {
      setClients(prev => [...prev, data[0]].sort((a, b) => a.name.localeCompare(b.name)));
    } else {
      console.error('Erro ao salvar cliente:', error);
    }
  };

  const updateClient = async (id, clientData) => {
    const { data, error } = await supabase.from('clients').update(clientData).eq('id', id).select();
    if (!error) {
      setClients(prev => prev.map(c => c.id === id ? data[0] : c));
    }
  };

  const deleteClient = async (id) => {
    const { error } = await supabase.from('clients').delete().eq('id', id);
    if (!error) setClients(prev => prev.filter(c => c.id !== id));
  };

  return { clients, isLoading, createClient, updateClient, deleteClient };
}