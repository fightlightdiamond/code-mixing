import {
  queryOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { keyFactory } from "@/core/api/keyFactory";
import { api } from "@/core/api/api";

// Types
export interface Vocabulary {
  id: number;
  englishWord: string;
  vietnameseMeaning: string;
  level: string;
  pronunciation?: string;
  exampleSentence?: string;
  createdAt: string;
  updatedAt: string;
}

// Database type
interface VocabularyDB {
  id: number;
  lessonId: number;
  word: string;
  meaning: string;
  example: string | null;
  audioUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVocabularyData {
  englishWord: string;
  vietnameseMeaning: string;
  level: string;
  pronunciation?: string;
  exampleSentence?: string;
}

// Database type for create
interface CreateVocabularyDataDB {
  lessonId: number;
  word: string;
  meaning: string;
  example?: string | null;
  audioUrl?: string | null;
}

export interface UpdateVocabularyData {
  englishWord?: string;
  vietnameseMeaning?: string;
  level?: string;
  pronunciation?: string;
  exampleSentence?: string;
}

// Database type for update
interface UpdateVocabularyDataDB {
  lessonId?: number;
  word?: string;
  meaning?: string;
  example?: string | null;
  audioUrl?: string | null;
}

// Helper functions for transformation
const transformVocabularyDB = (db: VocabularyDB): Vocabulary => ({
  id: db.id,
  englishWord: db.word,
  vietnameseMeaning: db.meaning,
  level: "1", // Default level since it's not in DB
  exampleSentence: db.example || undefined,
  pronunciation: "", // Default empty since it's not in DB
  createdAt: db.createdAt,
  updatedAt: db.updatedAt,
});

const transformCreateVocabularyData = (
  data: CreateVocabularyData
): CreateVocabularyDataDB => ({
  lessonId: 1, // Default lesson ID
  word: data.englishWord,
  meaning: data.vietnameseMeaning,
  example: data.exampleSentence || null,
  audioUrl: null, // Not used in frontend
});

const transformUpdateVocabularyData = (
  data: UpdateVocabularyData
): UpdateVocabularyDataDB => {
  const result: UpdateVocabularyDataDB = {};
  if (data.englishWord !== undefined) result.word = data.englishWord;
  if (data.vietnameseMeaning !== undefined)
    result.meaning = data.vietnameseMeaning;
  if (data.exampleSentence !== undefined)
    result.example = data.exampleSentence || null;
  // Note: level and pronunciation are not in DB, so we ignore them
  // lessonId is also not updated through this interface
  return result;
};

// Query builders
export const buildVocabulariesListQuery = (params?: {
  search?: string;
  level?: string;
}) =>
  queryOptions({
    queryKey: keyFactory.list("vocabularies", params),
    queryFn: async ({ signal }) => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.append("search", params.search);
      if (params?.level) searchParams.append("level", params.level);

      const url = `/api/admin/vocabularies${
        searchParams.toString() ? `?${searchParams.toString()}` : ""
      }`;
      const vocabulariesDB = await api<VocabularyDB[]>(url, { signal });
      return vocabulariesDB.map(transformVocabularyDB);
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    placeholderData: (prev) => prev,
  });

// Mutations
export function useCreateVocabulary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateVocabularyData) => {
      const dbData = transformCreateVocabularyData(data);
      const result = await api<VocabularyDB>("/api/admin/vocabularies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbData),
      });
      return transformVocabularyDB(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vocabularies"] });
    },
  });
}

export function useUpdateVocabulary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateVocabularyData }) => {
      const dbData = transformUpdateVocabularyData(data);
      const result = await api<VocabularyDB>(`/api/admin/vocabularies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbData),
      });
      return transformVocabularyDB(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vocabularies"] });
    },
  });
}

export function useDeleteVocabulary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      api(`/api/admin/vocabularies/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vocabularies"] });
    },
  });
}
