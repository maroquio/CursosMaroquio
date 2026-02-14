import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

export interface ExerciseCorrectionRequest {
  problem: string;
  studentCode: string;
  correctionPrompt: string;
  modelTechnicalName: string;
  manufacturerSlug: string;
}

export interface ExerciseCorrectionResult {
  isCorrect: boolean;
  feedback: string;
  score?: number;
}

export class ExerciseCorrectionAgentService {
  async evaluate(request: ExerciseCorrectionRequest): Promise<ExerciseCorrectionResult> {
    const llm = this.createLlm(request.manufacturerSlug, request.modelTechnicalName);

    const agent = createReactAgent({
      llm,
      tools: [],
    });

    const systemPrompt = `${request.correctionPrompt}

IMPORTANTE: Você DEVE responder APENAS com um JSON válido no formato:
{ "isCorrect": boolean, "feedback": "string com sua análise detalhada", "score": number de 0 a 100 }

Não inclua nenhum texto antes ou depois do JSON.`;

    const humanMessage = `## Enunciado do exercício:
${request.problem}

## Código do aluno:
\`\`\`
${request.studentCode}
\`\`\`

Avalie o código acima.`;

    const result = await agent.invoke({
      messages: [
        new SystemMessage(systemPrompt),
        new HumanMessage(humanMessage),
      ],
    });

    // Extract the last message content
    const lastMessage = result.messages[result.messages.length - 1];
    if (!lastMessage) {
      return { isCorrect: false, feedback: 'No response from AI agent', score: 0 };
    }
    const content = typeof lastMessage.content === 'string'
      ? lastMessage.content
      : JSON.stringify(lastMessage.content);

    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { isCorrect: false, feedback: content, score: 0 };
      }
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        isCorrect: Boolean(parsed.isCorrect),
        feedback: String(parsed.feedback || ''),
        score: typeof parsed.score === 'number' ? parsed.score : undefined,
      };
    } catch {
      return { isCorrect: false, feedback: content, score: 0 };
    }
  }

  private createLlm(manufacturerSlug: string, technicalName: string) {
    switch (manufacturerSlug.toLowerCase()) {
      case 'anthropic':
        return new ChatAnthropic({ modelName: technicalName });
      case 'google':
        return new ChatGoogleGenerativeAI({
          model: technicalName,
          apiKey: process.env.GOOGLE_API_KEY,
        });
      case 'deepseek':
        return new ChatOpenAI({
          modelName: technicalName,
          configuration: {
            baseURL: 'https://api.deepseek.com',
            apiKey: process.env.DEEPSEEK_API_KEY,
          },
        });
      case 'openai':
        return new ChatOpenAI({ modelName: technicalName });
      default:
        // Default to OpenAI-compatible API
        return new ChatOpenAI({ modelName: technicalName });
    }
  }
}
