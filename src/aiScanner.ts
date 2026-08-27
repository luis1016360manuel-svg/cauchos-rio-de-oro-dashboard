import { GoogleGenAI } from '@google/genai';

export interface ScannedInvoiceData {
  clientName: string;
  invoiceCode: string;
  totalAmount: number;
}

// Comprimir imagen antes de enviarla para que sea muchísimo más rápido
const compressImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export const scanInvoiceWithAI = async (file: File): Promise<ScannedInvoiceData> => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("La API Key de Gemini no está configurada en Vercel. Por favor verifica las Variables de Entorno.");
    }
    const ai = new GoogleGenAI({ apiKey });

    // 1. Comprimir la imagen para acelerar el envío (de 5MB a ~200KB)
    const base64Data = await compressImage(file);

    // 2. Simplificar el prompt para la IA
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: [
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: 'image/jpeg'
          }
        }
      ]
    });

    if (!response.text) {
      throw new Error("Respuesta vacía de la IA.");
    }

    // 3. Extracción robusta del JSON (por si la IA añade texto extra)
    let text = response.text.trim();
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    
    if (start !== -1 && end !== -1) {
      text = text.substring(start, end + 1);
    }

    const data = JSON.parse(text);

    return {
      clientName: data.clientName || '',
      invoiceCode: data.invoiceCode || '',
      totalAmount: Number(data.totalAmount) || 0
    };
  } catch (error: any) {
    console.error("AI Scan Error:", error);
    throw new Error(error.message || "No se pudieron extraer los datos. Por favor, ingresa los datos a mano.");
  }
};
