import type { FlashcardSource } from "../../common/types";
import { supabaseClient } from "../../db/supabase.client";
import type { FlashcardResponse } from "../../pages/api/v1/flashcards/types";
import type {
  DataProvider,
  FlashcardCreateAIData,
  FlashcardCreateData,
  FlashcardCreateResponse,
  FlashcardListResponse,
  FlashcardQuery,
} from "./interface";

const DEFAULT_USER_ID = "default-user-id"; // TODO: Zastąp prawdziwym userem po wdrożeniu auth

export class SupabaseProvider implements DataProvider {
  async getFlashcards(query: FlashcardQuery): Promise<FlashcardListResponse> {
    try {
      let supabaseQuery = supabaseClient
        .from("flashcards")
        .select("*", { count: "exact" })
        .eq("user_id", DEFAULT_USER_ID);

      // Apply source filter if specified
      if (query.source) {
        supabaseQuery = supabaseQuery.eq("source", query.source);
      }

      // Apply sorting
      const sortColumn =
        query.sort === "createdAt" ? "created_at" : "updated_at";
      supabaseQuery = supabaseQuery.order(sortColumn, {
        ascending: query.order === "asc",
      });

      // Apply pagination
      const from = (query.page - 1) * query.perPage;
      const to = from + query.perPage - 1;
      supabaseQuery = supabaseQuery.range(from, to);

      const { data, error, count } = await supabaseQuery;

      if (error) {
        console.error("Supabase error:", error);
        throw new Error(`Database error: ${error.message}`);
      }

      // Transform database rows to API response format
      const flashcards: FlashcardResponse[] = (data || []).map((row) => ({
        id: row.id,
        front: row.front,
        back: row.back,
        source: row.source as FlashcardSource,
        sourceTextId: row.source_text_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        easeFactor: row.ease_factor,
        interval: row.interval,
        nextReviewAt: row.next_review_at,
      }));

      return {
        data: flashcards,
        meta: {
          pagination: {
            total: count || 0,
            page: query.page,
            perPage: query.perPage,
          },
        },
      };
    } catch (error) {
      console.error("Error fetching flashcards from Supabase:", error);
      throw error;
    }
  }

  async createManualFlashcard(
    data: FlashcardCreateData
  ): Promise<FlashcardResponse> {
    try {
      const { data: insertedData, error } = await supabaseClient
        .from("flashcards")
        .insert({
          user_id: DEFAULT_USER_ID,
          front: data.front,
          back: data.back,
          source: "manual",
          source_text_id: data.sourceTextId || null,
          ease_factor: null,
          interval: null,
          next_review_at: null,
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        id: insertedData.id,
        front: insertedData.front,
        back: insertedData.back,
        source: insertedData.source as FlashcardSource,
        sourceTextId: insertedData.source_text_id,
        createdAt: insertedData.created_at,
        updatedAt: insertedData.updated_at,
        easeFactor: insertedData.ease_factor,
        interval: insertedData.interval,
        nextReviewAt: insertedData.next_review_at,
      };
    } catch (error) {
      console.error("Error creating manual flashcard in Supabase:", error);
      throw error;
    }
  }

  async createAIFlashcards(
    data: FlashcardCreateAIData
  ): Promise<FlashcardCreateResponse> {
    try {
      // For now, we'll create mock AI flashcards since we don't have AI integration yet
      // In the future, this would call an AI service to generate flashcards
      const mockCards = [
        {
          front: "What is the main topic of this text?",
          back: "This text discusses various programming concepts and technologies.",
        },
        {
          front: "What are the key benefits mentioned?",
          back: "Improved productivity, better code quality, and enhanced developer experience.",
        },
      ];

      const sourceTextId = `text-${Date.now()}`;
      const flashcardsToInsert = mockCards.map((card) => ({
        user_id: DEFAULT_USER_ID,
        front: card.front,
        back: card.back,
        source: "ai",
        source_text_id: sourceTextId,
        ease_factor: 2.5,
        interval: 1,
        next_review_at: new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ).toISOString(), // 24 hours from now
      }));

      const { data: insertedData, error } = await supabaseClient
        .from("flashcards")
        .insert(flashcardsToInsert)
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw new Error(`Database error: ${error.message}`);
      }

      const flashcards: FlashcardResponse[] = (insertedData || []).map(
        (row) => ({
          id: row.id,
          front: row.front,
          back: row.back,
          source: row.source as FlashcardSource,
          sourceTextId: row.source_text_id,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          easeFactor: row.ease_factor,
          interval: row.interval,
          nextReviewAt: row.next_review_at,
        })
      );

      return {
        data: flashcards,
        meta: {
          sourceTextId,
          generatedCount: flashcards.length,
          mode: "ai",
        },
      };
    } catch (error) {
      console.error("Error creating AI flashcards in Supabase:", error);
      throw error;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const { error } = await supabaseClient
        .from("flashcards")
        .select("id")
        .eq("user_id", DEFAULT_USER_ID)
        .limit(1);
      return !error;
    } catch (error) {
      console.error("Supabase health check failed:", error);
      return false;
    }
  }
}
