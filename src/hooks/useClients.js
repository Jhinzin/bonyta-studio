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
      return data[0];
    } else {
      console.error('Erro ao salvar cliente:', error);
      throw error;
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

  const createManyClients = async (clientsArray) => {
    setIsLoading(true);
    try {
      const chunkSize = 50;
      for (let i = 0; i < clientsArray.length; i += chunkSize) {
        const chunk = clientsArray.slice(i, i + chunkSize);
        const { error } = await supabase.from('clients').insert(chunk);
        if (error) {
          console.error('Erro no lote de importação:', error);
          throw error;
        }
      }
      await fetchClients();
    } finally {
      setIsLoading(false);
    }
  };

  return { clients, isLoading, createClient, createManyClients, updateClient, deleteClient, refreshClients: fetchClients };
}
