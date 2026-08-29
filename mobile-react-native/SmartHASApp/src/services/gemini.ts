// Cliente direto para a API do Google Gemini (Generative Language API),
// independente do backend Spring Boot — mesmo padrão do app Flutter
// original (chamada direta do cliente móvel a um provedor de IA).
//
// Defina sua chave em uma variável de ambiente do Expo
// (EXPO_PUBLIC_GEMINI_API_KEY, em um arquivo .env local, nunca
// commitado). Gere uma chave gratuita em https://aistudio.google.com/apikey.
// Sem chave configurada, a função retorna uma mensagem amigável de erro
// em vez de travar a tela.
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const MODEL = 'gemini-3.6-flash';
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const TECHNICAL_INSTRUCTION =
  'Você é um assistente técnico. Sua tarefa é realizar a tarefa solicitada e retornar APENAS o resultado final. Proibido usar saudações, introduções ou qualquer texto explicativo.';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

export async function generateResponse(prompt: string, isTechnical = false): Promise<string> {
  if (!API_KEY) {
    return 'IA não configurada: defina EXPO_PUBLIC_GEMINI_API_KEY (veja README).';
  }
  try {
    const body: Record<string, unknown> = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    };
    if (isTechnical) {
      body.systemInstruction = { role: 'system', parts: [{ text: TECHNICAL_INSTRUCTION }] };
    }

    const response = await withTimeout(
      fetch(`${BASE_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
      45000
    );

    if (response.status === 200) {
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return text ? String(text).trim() : 'IA sem resposta no momento.';
    } else if (response.status === 429) {
      return 'Muitas requisições! O modelo gratuito está congestionado. Tente novamente em alguns segundos.';
    } else if (response.status >= 500) {
      return `O serviço de IA está instável ou em manutenção (Erro ${response.status}). Tente novamente.`;
    } else {
      const errBody = await response.text();
      console.log(`Erro Gemini (${response.status}): ${errBody}`);
      return `Desculpe, a IA encontrou um problema técnico (${response.status}).`;
    }
  } catch (e) {
    if (e instanceof Error && e.message === 'timeout') {
      return 'A resposta demorou muito para chegar. Tente novamente.';
    }
    console.log('Erro de Conexão Gemini:', e);
    return 'Sem conexão com o serviço de IA. Verifique sua internet.';
  }
}

export async function improveDescription(description: string): Promise<string> {
  const prompt = `Melhore a seguinte descrição de doação para torná-la clara e atrativa: ${description}`;
  return generateResponse(prompt, true);
}
