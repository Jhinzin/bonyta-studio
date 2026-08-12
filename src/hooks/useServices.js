import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export function useServices() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar serviços:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createService = async (serviceData) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert([serviceData])
        .select();

      if (error) throw error;
      setServices(prev => [...prev, data[0]].sort((a, b) => a.name.localeCompare(b.name)));
      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Erro ao criar serviço:', err);
      return { success: false, error: err.message };
    }
  };

  const updateService = async (id, serviceData) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .update(serviceData)
        .eq('id', id)
        .select();

      if (error) throw error;
      setServices(prev => prev.map(s => s.id === id ? data[0] : s));
      return { success: true, data: data[0] };
    } catch (err) {
      console.error('Erro ao atualizar serviço:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteService = async (id) => {
    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      setServices(prev => prev.filter(s => s.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Erro ao excluir serviço:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    services,
    isLoading,
    error,
    createService,
    updateService,
    deleteService,
    refreshServices: fetchServices
  };
}