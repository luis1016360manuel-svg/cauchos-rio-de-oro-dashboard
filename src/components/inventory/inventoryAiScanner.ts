import { compressImageForAI, generateWithAIFallback, parseAIJsonResponse } from '../../services/geminiService';

export interface ScannedTireItem {
  id: string; // Temporary ID for client editing
  brand: string;
  model: string;
  size: string;
  rim: number;
  quantity: number;
  unitCost: number;
  sellingPrice: number;
}

export const scanInventoryFromImageWithAI = async (file: File): Promise<ScannedTireItem[]> => {
  try {
    const base64Data = await compressImageForAI(file, 1200, 0.75);

    const prompt = `
      Eres un experto en inventario de neumáticos / cauchos automotrices y extractor de datos de facturas, notas de entrega, guías de despacho, etiquetas o fotos de lotes de cauchos.
      
      Analiza minuciosamente esta imagen. Extrae TODOS los artículos / cauchos que se están cargando, despachando o comprando.

      Para cada ítem detectado, extrae los siguientes campos:
      1. "brand": Marca del caucho (ej. "Goodyear", "Pirelli", "Bridgestone", "Triangle", "Linglong", "Westlake", "Habilead", "Compasal", "Firestone", "Aplus", "Windforce", "Roadcruza", "Kenda", "Maxxis", "Hifly", "Otani", etc. Si no se puede identificar, pon "Genérico").
      2. "model": Modelo, diseño o patrón si está indicado (ej. "AT", "MT", "HT", "Comfort", "Sport", "Touring", "Radial", "D905", "TR645", "TR918", etc. Si no se especifica, pon "Radial").
      3. "size": Medida normalizada del caucho en formato estándar (ej. "175/70R13", "185/65R14", "195/65R15", "205/55R16", "265/70R16", "265/70R17", "31X10.50R15", "11R22.5", "12R22.5", "295/80R22.5", etc.).
      4. "rim": El número de rin como número (ej. 13, 14, 15, 16, 17, 18, 20, 22.5). Extráelo de la medida.
      5. "quantity": Cantidad de unidades/cauchos de ese ítem (número entero positivo, por defecto 1 si no se indica).
      6. "unitCost": Costo unitario en dólares ($) si aparece en el documento (ej. 35.00), o 0 si no se muestra.
      7. "sellingPrice": Precio de venta estimado en dólares ($). Si el documento muestra precio de venta úsalo; si solo muestra costo y es > 0, puedes sugerir costo * 1.35; si no, pon 0.

      Devuelve la respuesta ÚNICAMENTE como un JSON con esta estructura exacta:
      {
        "items": [
          {
            "brand": "Triangle",
            "model": "TR918",
            "size": "195/65R15",
            "rim": 15,
            "quantity": 8,
            "unitCost": 35.00,
            "sellingPrice": 48.00
          }
        ]
      }
      
      REGLAS:
      - Si hay varios artículos o filas en el documento, extrae CADA uno por separado en el arreglo "items".
      - Si hay un solo artículo, devuélvelo en el arreglo "items" con 1 elemento.
      - NO devuelvas texto explicativo ni formato Markdown adicional fuera del JSON.
    `;

    const rawText = await generateWithAIFallback(prompt, base64Data);
    const data = parseAIJsonResponse<{ items?: any[] } | any[]>(rawText);

    const itemsRaw = Array.isArray(data) ? data : (data?.items || []);

    if (itemsRaw.length === 0) {
      throw new Error('No se detectaron cauchos o artículos claros en la imagen. Por favor, asegúrate de que la foto esté nítida.');
    }

    return itemsRaw.map((it: any, index: number) => {
      let rim = Number(it.rim) || 0;
      const sizeStr = (it.size || '').toString().trim().toUpperCase();
      if (!rim && sizeStr) {
        const rimMatch = sizeStr.match(/R\s*(\d+(?:\.\d+)?)/i) || sizeStr.match(/[\/-](\d+(?:\.\d+)?)$/);
        if (rimMatch && rimMatch[1]) {
          rim = parseFloat(rimMatch[1]);
        }
      }

      const cost = Math.max(0, Number(it.unitCost) || 0);
      let price = Math.max(0, Number(it.sellingPrice) || 0);
      if (!price && cost > 0) {
        price = Math.round(cost * 1.35 * 100) / 100;
      }

      return {
        id: `SCANNED-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
        brand: (it.brand || 'Genérico').toString().trim(),
        model: (it.model || 'Radial').toString().trim(),
        size: sizeStr || 'N/D',
        rim: rim || 15,
        quantity: Math.max(1, Number(it.quantity) || 1),
        unitCost: cost,
        sellingPrice: price,
      };
    });
  } catch (error: any) {
    console.error('Inventory AI Scan Error:', error);
    if (error.message === 'NO_API_KEY') {
      throw new Error('Debes configurar tu API Key de Gemini en el botón superior de Configuración IA.');
    }
    throw new Error(error.message || 'No se pudieron extraer los cauchos de la imagen. Verifica la foto o realiza el ingreso manual.');
  }
};
