import { IAIProvider, IRestaurantContext } from '../types';

export class GeminiProvider implements IAIProvider {
  name = 'Gemini Pro';
  async generateResponse(prompt: string, context: IRestaurantContext) {
    return {
      text: `[Gemini Auto Response] Context evaluated. Revenue: ${context.revenueToday}, CSAT: ${context.avgCsatRating}. Ready to execute: ${prompt}`,
      modelUsed: 'gemini-1.5-pro-preview',
      latencyMs: 120
    };
  }
}

export class OpenAIProvider implements IAIProvider {
  name = 'GPT-4o';
  async generateResponse(prompt: string, context: IRestaurantContext) {
    return {
      text: `[OpenAI Auto Response] Evaluated ${context.ordersTodayCount} orders. Prompt: ${prompt}`,
      modelUsed: 'gpt-4o-2024-05-13',
      latencyMs: 180
    };
  }
}

export class ClaudeProvider implements IAIProvider {
  name = 'Claude 3.5 Sonnet';
  async generateResponse(prompt: string, context: IRestaurantContext) {
    return {
      text: `[Anthropic Claude Auto Response] Analyzed low stock items: ${context.lowStockItemsCount}. Prompt: ${prompt}`,
      modelUsed: 'claude-3-5-sonnet-20240620',
      latencyMs: 250
    };
  }
}

export class OllamaProvider implements IAIProvider {
  name = 'Ollama Local';
  async generateResponse(prompt: string, context: IRestaurantContext) {
    return {
      text: `[Ollama Local Response] Local processing complete. CSAT: ${context.avgCsatRating}. Prompt: ${prompt}`,
      modelUsed: 'llama3:8b-instruct-q8_0',
      latencyMs: 320
    };
  }
}

export class DeepSeekProvider implements IAIProvider {
  name = 'DeepSeek Coder';
  async generateResponse(prompt: string, context: IRestaurantContext) {
    return {
      text: `[DeepSeek Auto Response] Database parameters synthesized. Prompt: ${prompt}`,
      modelUsed: 'deepseek-coder-v2',
      latencyMs: 290
    };
  }
}
