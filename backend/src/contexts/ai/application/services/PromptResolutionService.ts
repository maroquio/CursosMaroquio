const DEFAULT_PROMPT = `Você é um professor avaliando a solução de um exercício de programação.
Analise o código do aluno considerando: corretude lógica, boas práticas, e aderência ao enunciado.
Responda em JSON: { "isCorrect": boolean, "feedback": "...", "score": 0-100 }`;

export class PromptResolutionService {
  async resolveFromHierarchy(
    lessonPrompt: string | null,
    modulePrompt: string | null,
    coursePrompt: string | null
  ): Promise<string> {
    if (lessonPrompt && lessonPrompt.trim().length > 0) return lessonPrompt;
    if (modulePrompt && modulePrompt.trim().length > 0) return modulePrompt;
    if (coursePrompt && coursePrompt.trim().length > 0) return coursePrompt;
    return DEFAULT_PROMPT;
  }

  getDefaultPrompt(): string {
    return DEFAULT_PROMPT;
  }
}
