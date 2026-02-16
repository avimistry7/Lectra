
export interface Subtopic {
  title: string;
  key_concepts: string[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface Topic {
  topic_id: string;
  title: string;
  summary: string;
  difficulty_level: number;
  importance_score: number;
  subtopics: Subtopic[];
  flashcards?: Flashcard[];
}

export interface TopicExtractionResponse {
  topics: Topic[];
}

export interface QuizQuestion {
  question_id: string;
  question: string;
  difficulty: number;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface QuizResponse {
  quiz: QuizQuestion[];
}

export interface FlashcardsResponse {
  flashcards: Flashcard[];
}

export interface Entity {
  id: string;
  type: 'concept' | 'person' | 'theory' | 'method';
  name: string;
}

export interface Relationship {
  source: string;
  target: string;
  relation: string;
}

export interface KnowledgeGraphResponse {
  entities: Entity[];
  relationships: Relationship[];
}

export interface SummaryResponse {
  overview: string;
  key_takeaways: string[];
  detailed_summary: string;
}

export type AppState = 'IDLE' | 'ANALYZING' | 'TOPICS_VIEW' | 'QUIZ_VIEW' | 'KG_VIEW' | 'SUMMARY_VIEW' | 'FLASHCARDS_VIEW';
