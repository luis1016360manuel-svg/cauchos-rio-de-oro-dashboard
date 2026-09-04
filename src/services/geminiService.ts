import { GoogleGenAI } from '@google/genai';

const API_KEY_STORAGE_KEY = 'GEMINI_API_KEY';

export const getStoredApiKey = (): string => {
  return (
    (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ||
    localStorage.getItem(API_KEY_STORAGE_KEY) ||
    ''
  ).trim();
};

export const setStoredApiKey = (key: string): void => {
  if (key) {
    localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  }
};

export const testApiKeyConnection = async (apiKey: string): Promise<boolean> => {
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: 'Ping',
    });
    return !!response.text;
  } catch (err) {
    console.error('API Key test failed:', err);
    return false;
  }
};

// Client-side image compression for ultra-fast uploads
export const compressImageForAI = async (
  file: File,
  maxDimension = 800,
  quality = 0.6
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl.split(',')[1]);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

// Robust multi-model fallback executor
export const generateWithAIFallback = async (
  prompt: string,
  base64Image?: string
): Promise<string> => {
  const apiKey = getStoredApiKey();
  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.7-flash'];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      const contents: any[] = [prompt];
      if (base64Image) {
        contents.push({
          inlineData: {
            data: base64Image,
            mimeType: 'image/jpeg',
          },
        });
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents,
      });

      if (response.text) {
        return response.text;
      }
    } catch (err: any) {
      console.warn(`[AI Engine] ${modelName} falló:`, err.message);
      lastError = err;
      if (
        err.status === 503 ||
        err.status === 429 ||
        err.message?.includes('503') ||
        err.message?.includes('429') ||
        err.message?.includes('demanda') ||
        err.message?.includes('traffic')
      ) {
        continue; // Try next model in sequence
      }
      throw err; // Non-capacity errors fail immediately
    }
  }

  throw new Error(
    lastError?.message ||
      'Todos los servidores gratuitos de IA están saturados en este momento. Por favor, reintenta en un minuto.'
  );
};

// Safe JSON parser from AI output
export const parseAIJsonResponse = <T>(rawText: string): T => {
  let text = rawText.trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  
  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    const lastBracket = text.lastIndexOf(']');
    if (lastBracket !== -1) {
      text = text.substring(firstBracket, lastBracket + 1);
    }
  } else if (firstBrace !== -1) {
    const lastBrace = text.lastIndexOf('}');
    if (lastBrace !== -1) {
      text = text.substring(firstBrace, lastBrace + 1);
    }
  }
  
  return JSON.parse(text) as T;
};
