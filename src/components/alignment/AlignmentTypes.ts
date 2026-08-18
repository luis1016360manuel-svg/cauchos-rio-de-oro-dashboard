export type VehiculoTipo = 'carro' | 'camioneta';
export type ServicioTipo = 'delantera' | 'trasera' | 'delantera_trasera' | 'doble_camioneta';
export type EstadoPago = 'pendiente' | 'pagado';

export interface AlignmentService {
  id: string;
  fecha: string; // ISO timestamp
  vehiculo_tipo: VehiculoTipo;
  servicio_tipo: ServicioTipo;
  placa_vehiculo?: string;
  monto_alineador: number;
  estado_pago: EstadoPago;
  fecha_pago?: string; // ISO timestamp
  created_at: string;
  updated_at: string;
}

export interface CreateAlignmentPayload {
  vehiculo_tipo: VehiculoTipo;
  servicio_tipo: ServicioTipo;
  placa_vehiculo?: string;
  monto_alineador: number;
}
