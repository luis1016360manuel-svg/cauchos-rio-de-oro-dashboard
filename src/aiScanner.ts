import {
  compressImageForAI,
  generateWithAIFallback,
  parseAIJsonResponse,
} from './services/geminiService';

export interface ScannedInvoiceData {
  clientName: string;
  invoiceCode: string;
  totalAmount: number;
}

export interface ScannedPaymentData {
  monto: number;
  referencia: string;
  fecha: string;
}

export const scanInvoiceWithAI = async (file: File): Promise<ScannedInvoiceData> => {
  try {
    const base64Data = await compressImageForAI(file, 800, 0.6);

    const prompt = `
      Eres un extractor de datos. Extrae los datos de esta factura o recibo.
      
      REGLA MUY IMPORTANTE: La empresa emisora de la factura somos nosotros, "CAUCHOS RIO DE ORO" (o variaciones de ese nombre). NUNCA pongas "Cauchos Rio de Oro" ni nada similar como "clientName". Debes buscar a quién se le está cobrando o facturando (el comprador/cliente real).

      Devuelve SOLO un JSON con esta estructura exacta:
      {
        "clientName": "nombre del cliente o empresa compradora",
        "invoiceCode": "numero de factura o ticket",
        "totalAmount": 123.45
      }
      No devuelvas NADA MÁS que el JSON, sin comillas Markdown.
    `;

    const rawText = await generateWithAIFallback(prompt, base64Data);
    const data = parseAIJsonResponse<any>(rawText);

    return {
      clientName: data?.clientName || '',
      invoiceCode: data?.invoiceCode || '',
      totalAmount: Number(data?.totalAmount) || 0,
    };
  } catch (error: any) {
    console.error('AI Scan Error:', error);
    if (error.message === 'NO_API_KEY') {
      throw new Error('Configura la API Key de Gemini en el botón de Configuración IA arriba.');
    }
    throw new Error(error.message || 'No se pudieron extraer los datos. Por favor, ingresa los datos a mano.');
  }
};

export const scanPaymentWithAI = async (file: File): Promise<ScannedPaymentData> => {
  try {
    const base64Data = await compressImageForAI(file, 800, 0.6);

    const prompt = `
      Eres un extractor de datos de recibos de pago. Analiza esta captura de pantalla o recibo de transferencia (ej: Zelle, Pago Móvil, Wire, ACH, efectivo).
      Extrae los siguientes datos:
      1. monto: El dinero enviado o pagado (solo el número, ej: 150.00).
      2. referencia: El número de confirmación, referencia o ID de la transacción. Si no hay, déjalo vacío.
      3. fecha: La fecha del pago en formato YYYY-MM-DD. Si no hay fecha clara, déjalo vacío.

      Devuelve SOLO un JSON con esta estructura exacta:
      {
        "monto": 150.00,
        "referencia": "TR-123456",
        "fecha": "2024-05-20"
      }
      No devuelvas NADA MÁS que el JSON, sin comillas Markdown.
    `;

    const rawText = await generateWithAIFallback(prompt, base64Data);
    const data = parseAIJsonResponse<any>(rawText);

    return {
      monto: Number(data?.monto) || 0,
      referencia: data?.referencia || '',
      fecha: data?.fecha || '',
    };
  } catch (error: any) {
    console.error('AI Scan Error:', error);
    if (error.message === 'NO_API_KEY') {
      throw new Error('Configura la API Key de Gemini en el botón de Configuración IA arriba.');
    }
    throw new Error(error.message || 'No se pudieron extraer los datos. Por favor, ingresa los datos a mano.');
  }
};
