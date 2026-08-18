import { supabase } from '../../supabaseClient';
import type { AlignmentService, CreateAlignmentPayload } from './AlignmentTypes';

export const fetchAlignments = async (): Promise<AlignmentService[]> => {
  const { data, error } = await supabase
    .from('alignment_services')
    .select('*')
    .order('fecha', { ascending: false });

  if (error) {
    console.error('Error fetching alignments:', error);
    throw new Error('No se pudieron cargar los servicios de alineación');
  }

  return data as AlignmentService[];
};

export const createAlignment = async (payload: CreateAlignmentPayload): Promise<AlignmentService> => {
  const { data, error } = await supabase
    .from('alignment_services')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error creating alignment:', error);
    throw new Error('No se pudo registrar el servicio de alineación');
  }

  return data as AlignmentService;
};

export const liquidateAlignments = async (ids: string[]): Promise<void> => {
  if (!ids.length) return;

  const now = new Date().toISOString();

  const { error } = await supabase
    .from('alignment_services')
    .update({ 
      estado_pago: 'pagado', 
      fecha_pago: now,
      updated_at: now
    })
    .in('id', ids);

  if (error) {
    console.error('Error liquidating alignments:', error);
    throw new Error('No se pudieron liquidar los servicios seleccionados');
  }
};

export const deleteAlignment = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('alignment_services')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting alignment:', error);
    throw new Error('No se pudo eliminar el servicio');
  }
};
