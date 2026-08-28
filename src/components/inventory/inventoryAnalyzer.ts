import { supabase } from '../../supabaseClient';
import type { InventoryItem, DischargedItem } from './InventoryTypes';
import { generateWithAIFallback, parseAIJsonResponse } from '../../services/geminiService';

// ---------------------------------------------------------------
// Types
// ---------------------------------------------------------------

export type AlertSeverity = 'CRITICO' | 'MODERADO' | 'SIN_ROTACION' | 'SALUDABLE';

export interface ProductAlert {
  producto: string;
  marca: string;
  talla: string;
  stock_actual: number;
  dias_estimados_agotamiento: number | null;
  unidades_vendidas_30d: number;
  razon: string;
  recomendacion: string;
  severidad: AlertSeverity;
}

export interface AIInventoryAnalysis {
  alertas_criticas: ProductAlert[];
  alertas_moderadas: ProductAlert[];
  productos_sin_rotacion: ProductAlert[];
  productos_saludables: ProductAlert[];
  resumen_general: string;
  valor_total_inventario: number;
  fecha_analisis: string;
}

// ---------------------------------------------------------------
// Data fetching helpers
// ---------------------------------------------------------------

interface SalesData {
  [key: string]: { cantidad: number; marca: string; talla: string };
}

const fetchSalesLast30Days = async (): Promise<SalesData> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from('inventory_discharges')
    .select('brand, size, quantityDischarged, dischargedAt')
    .gte('dischargedAt', thirtyDaysAgo.toISOString());

  if (error) {
    console.error('Error fetching sales data:', error);
    return {};
  }

  const salesMap: SalesData = {};
  (data as DischargedItem[]).forEach((d) => {
    const key = `${d.brand}|${d.size}`;
    if (!salesMap[key]) {
      salesMap[key] = { cantidad: 0, marca: d.brand, talla: d.size };
    }
    salesMap[key].cantidad += d.quantityDischarged;
  });

  return salesMap;
};

// ---------------------------------------------------------------
// Main export
// ---------------------------------------------------------------

export const analyzeInventoryWithAI = async (
  currentItems: InventoryItem[]
): Promise<AIInventoryAnalysis> => {
  // 1. Fetch sales data from the last 30 days
  const salesData = await fetchSalesLast30Days();

  // 2. Build context object
  const valorTotal = currentItems.reduce(
    (acc, item) => acc + item.unitCost * item.quantity,
    0
  );

  const inventarioContexto = currentItems.map((item) => {
    const key = `${item.brand}|${item.size}`;
    const ventasObj = salesData[key];
    return {
      marca: item.brand,
      modelo: item.model || '',
      talla: item.size,
      rin: item.rim,
      stock_actual: item.quantity,
      precio_venta: item.sellingPrice,
      costo_unitario: item.unitCost,
      unidades_vendidas_30d: ventasObj?.cantidad ?? 0,
    };
  });

  // 3. Build prompt
  const prompt = `
Eres un experto en gestión de inventario para una empresa de cauchos (neumáticos) llamada "Cauchos Río de Oro".
Analiza el siguiente inventario y sus ventas de los últimos 30 días.

INVENTARIO ACTUAL + VENTAS (últimos 30 días):
${JSON.stringify(inventarioContexto, null, 2)}

VALOR TOTAL DEL INVENTARIO: $${valorTotal.toFixed(2)}

INSTRUCCIONES DE ANÁLISIS:
1. Para cada producto, calcula la tasa de venta diaria: unidades_vendidas_30d / 30
2. Estima días hasta agotamiento: stock_actual / tasa_diaria (si tasa > 0)
3. Clasifica cada producto en una sola categoría:
   - CRITICO: stock <= 4 unidades Y tiene ventas recientes (se agota pronto). Si el stock es 0, también es CRITICO.
   - MODERADO: stock entre 5-9 unidades Y tasa de venta > 0
   - SIN_ROTACION: 0 ventas en 30 días Y stock > 0. Puede haber sobrestocking o problema de precio.
   - SALUDABLE: stock >= 10 unidades o situación controlada sin riesgo inmediato
4. Para los CRITICOS y MODERADOS incluye una recomendación concreta de cuántas unidades pedir.
5. El resumen_general debe ser claro, directo y útil para el dueño del negocio (en español).
6. NO incluyas productos con stock 0 Y sin ventas en ninguna categoría, ya que no representan riesgo.

Devuelve SOLO un JSON válido con esta estructura exacta. Sin markdown, sin explicaciones, SOLO el JSON:
{
  "alertas_criticas": [
    {
      "producto": "marca + talla (ej: Michelin 205/65R16)",
      "marca": "string",
      "talla": "string",
      "stock_actual": 0,
      "dias_estimados_agotamiento": null,
      "unidades_vendidas_30d": 0,
      "razon": "explicación breve en español",
      "recomendacion": "qué hacer concretamente",
      "severidad": "CRITICO"
    }
  ],
  "alertas_moderadas": [],
  "productos_sin_rotacion": [],
  "productos_saludables": [],
  "resumen_general": "Resumen de 2-3 oraciones del estado general del inventario."
}
`;

  // 4. Execute with unified fallback engine
  try {
    const rawText = await generateWithAIFallback(prompt);
    const parsed = parseAIJsonResponse<Omit<AIInventoryAnalysis, 'valor_total_inventario' | 'fecha_analisis'>>(rawText);

    return {
      ...parsed,
      valor_total_inventario: valorTotal,
      fecha_analisis: new Date().toISOString(),
    };
  } catch (err: any) {
    if (err.message === 'NO_API_KEY') {
      throw new Error('Configura la API Key de Gemini en el botón de Configuración IA arriba.');
    }
    throw err;
  }
};
