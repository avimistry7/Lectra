
import { GoogleGenAI, Type } from "@google/genai";
import { 
  TopicExtractionResponse, 
  QuizResponse, 
  KnowledgeGraphResponse, 
  Topic,
  SummaryResponse
} from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Helper to handle exponential backoff for 429 errors
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const isQuotaError = err.message?.includes("429") || err.message?.includes("RESOURCE_EXHAUSTED");
      if (isQuotaError && i < maxRetries - 1) {
        const wait = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, wait));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export const extractTopics = async (lectureText: string): Promise<TopicExtractionResponse> => {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following university-level lecture content.
Your task:
1. Extract main topics.
2. Extract subtopics for each topic.
3. Assign a difficulty level from 1 (basic) to 5 (advanced).
4. Estimate importance score from 1-10.
5. Return structured JSON.

Lecture Content:
"""
${lectureText}
"""`,
      config: {
        systemInstruction: "You are an academic content analysis engine. Your job is to extract structured topics from educational material. Return valid JSON only. Do not add explanations. Do not wrap output in markdown. Follow the schema strictly.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic_id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  difficulty_level: { type: Type.NUMBER },
                  importance_score: { type: Type.NUMBER },
                  subtopics: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        key_concepts: { type: Type.ARRAY, items: { type: Type.STRING } }
                      },
                      required: ["title", "key_concepts"]
                    }
                  }
                },
                required: ["topic_id", "title", "summary", "difficulty_level", "importance_score", "subtopics"]
              }
            }
          },
          required: ["topics"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const generateGeneralSummary = async (text: string): Promise<SummaryResponse> => {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a high-level academic summary of this lecture. 
Your response must be structured JSON.

Text:
"""
${text}
"""`,
      config: {
        systemInstruction: "You are an expert academic summarizer. Provide an overview, a list of key takeaways, and a detailed summary of the content. Return JSON only.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING },
            key_takeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
            detailed_summary: { type: Type.STRING }
          },
          required: ["overview", "key_takeaways", "detailed_summary"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const generateQuiz = async (topic: Topic, adaptiveContext?: { score: number, total: number }): Promise<QuizResponse> => {
  return withRetry(async () => {
    let adaptivePrompt = "";
    if (adaptiveContext) {
      if (adaptiveContext.score < adaptiveContext.total / 2) {
        adaptivePrompt = `The student answered ${adaptiveContext.score}/${adaptiveContext.total} questions incorrectly. Regenerate 5 easier questions focusing on fundamentals.`;
      } else if (adaptiveContext.score === adaptiveContext.total) {
        adaptivePrompt = `The student answered ${adaptiveContext.score}/${adaptiveContext.total} correctly. Generate 5 advanced-level application-based questions (scenario-based).`;
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `${adaptivePrompt}
Generate 5 multiple-choice questions for the following topic.
Rules:
- Questions must test understanding, not memorization.
- Include one clearly correct answer.
- Distractors must be plausible.
- Difficulty level must match the given difficulty.
- Avoid ambiguous phrasing.

Topic:
Title: ${topic.title}
Difficulty: ${topic.difficulty_level}
Summary: ${topic.summary}

Subtopics:
${topic.subtopics.map(s => `- ${s.title}: ${s.key_concepts.join(', ')}`).join('\n')}`,
      config: {
        systemInstruction: "You are a university-level assessment generation engine. Return valid JSON only. No explanations. No markdown. Strictly follow schema. Ensure correct_answer matches exactly one option. Shuffle correct answer position.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question_id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  difficulty: { type: Type.NUMBER },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correct_answer: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["question_id", "question", "difficulty", "options", "correct_answer", "explanation"]
              }
            }
          },
          required: ["quiz"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  });
};

export const extractKnowledgeGraph = async (text: string): Promise<KnowledgeGraphResponse> => {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Extract entities and relationships from the following academic text. Return structured JSON.

Text:
"""
${text}
"""`,
      config: {
        systemInstruction: "You are a knowledge extraction engine. Return valid JSON only. No markdown. No commentary.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            entities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['concept', 'person', 'theory', 'method'] },
                  name: { type: Type.STRING }
                },
                required: ["id", "type", "name"]
              }
            },
            relationships: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  source: { type: Type.STRING },
                  target: { type: Type.STRING },
                  relation: { type: Type.STRING }
                },
                required: ["source", "target", "relation"]
              }
            }
          },
          required: ["entities", "relationships"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  });
};
