import type { FlashcardSource } from "../../common/types";
import { supabaseClient } from "../../db/supabase.client";
import type {
  EventLogQuery,
  EventLogsResponse,
  EventSeverity,
  EventType,
} from "../../pages/api/v1/event-logs/types";
import type { FlashcardResponse } from "../../pages/api/v1/flashcards/types";
import type { SourceTextWithFlashcardsResponse } from "../../pages/api/v1/source-texts/[id]/types";
import type { SourceTextResponse } from "../../pages/api/v1/source-texts/types";
import type {
  DataProvider,
  FlashcardCreateAIData,
  FlashcardCreateData,
  FlashcardCreateResponse,
  FlashcardListResponse,
  FlashcardQuery,
  FlashcardUpdateData,
  SourceTextCreateData,
  SourceTextListResponse,
  SourceTextQuery,
} from "./interface";

const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001"; // TODO: Zastąp prawdziwym userem po wdrożeniu auth

export class SupabaseProvider implements DataProvider {
  // Helper method to log events
  private async logEvent(eventType: string, payload?: any): Promise<void> {
    try {
      await supabaseClient
        .from("event_logs")
        .insert({
          user_id: DEFAULT_USER_ID,
          event_type: eventType,
          payload: payload || null,
        });
    } catch (error) {
      console.error("Error logging event:", error);
      // Don't throw error for logging failures to avoid breaking main functionality
    }
  }

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

      // Log the event
      await this.logEvent("manual_card_created", {
        flashcard_id: insertedData.id,
        source_text_id: data.sourceTextId,
      });

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
      // First, create a source text entry
      const { data: sourceTextData, error: sourceTextError } =
        await supabaseClient
          .from("source_texts")
          .insert({
            user_id: DEFAULT_USER_ID,
            text_content: data.textContent,
          })
          .select()
          .single();

      if (sourceTextError) {
        console.error("Supabase error creating source text:", sourceTextError);
        throw new Error(`Database error: ${sourceTextError.message}`);
      }

      // Log source text creation event
      await this.logEvent("source_text_created", {
        source_text_id: sourceTextData.id,
        text_length: data.textContent.length,
      });

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

      const sourceTextId = sourceTextData.id; // Use the actual UUID from the database
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

      // Log AI flashcards creation event
      await this.logEvent("ai_card_created", {
        source_text_id: sourceTextId,
        generated_count: flashcards.length,
        flashcard_ids: flashcards.map(f => f.id),
      });

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

  async getFlashcardById(id: string): Promise<FlashcardResponse | null> {
    try {
      const { data, error } = await supabaseClient
        .from("flashcards")
        .select("*")
        .eq("id", id)
        .eq("user_id", DEFAULT_USER_ID)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return null;
        }
        console.error("Supabase error:", error);
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        id: data.id,
        front: data.front,
        back: data.back,
        source: data.source as FlashcardSource,
        sourceTextId: data.source_text_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        easeFactor: data.ease_factor,
        interval: data.interval,
        nextReviewAt: data.next_review_at,
      };
    } catch (error) {
      console.error("Error fetching flashcard by id from Supabase:", error);
      throw error;
    }
  }

  async updateFlashcard(
    id: string,
    data: FlashcardUpdateData
  ): Promise<FlashcardResponse | null> {
    try {
      const updateData: any = {};
      if (data.front !== undefined) {
        updateData.front = data.front;
      }
      if (data.back !== undefined) {
        updateData.back = data.back;
      }

      const { data: updatedData, error } = await supabaseClient
        .from("flashcards")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", DEFAULT_USER_ID)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return null;
        }
        console.error("Supabase error:", error);
        throw new Error(`Database error: ${error.message}`);
      }

      // Log the event
      await this.logEvent("card_edited", {
        flashcard_id: updatedData.id,
        changes: updateData,
      });

      return {
        id: updatedData.id,
        front: updatedData.front,
        back: updatedData.back,
        source: updatedData.source as FlashcardSource,
        sourceTextId: updatedData.source_text_id,
        createdAt: updatedData.created_at,
        updatedAt: updatedData.updated_at,
        easeFactor: updatedData.ease_factor,
        interval: updatedData.interval,
        nextReviewAt: updatedData.next_review_at,
      };
    } catch (error) {
      console.error("Error updating flashcard in Supabase:", error);
      throw error;
    }
  }

  async deleteFlashcard(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseClient
        .from("flashcards")
        .delete()
        .eq("id", id)
        .eq("user_id", DEFAULT_USER_ID);

      if (error) {
        console.error("Supabase error:", error);
        throw new Error(`Database error: ${error.message}`);
      }

      // Log the event
      await this.logEvent("card_deleted", {
        flashcard_id: id,
      });

      return true;
    } catch (error) {
      console.error("Error deleting flashcard from Supabase:", error);
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

  // Source text operations
  async getSourceTexts(
    query: SourceTextQuery
  ): Promise<SourceTextListResponse> {
    try {
      let supabaseQuery = supabaseClient
        .from("source_texts")
        .select("*", { count: "exact" })
        .eq("user_id", DEFAULT_USER_ID);

      // Apply sorting
      supabaseQuery = supabaseQuery.order("created_at", {
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
      const sourceTexts: SourceTextResponse[] = (data || []).map((row) => ({
        id: row.id,
        textContent: row.text_content,
        createdAt: row.created_at,
      }));

      return {
        data: sourceTexts,
        meta: {
          pagination: {
            total: count || 0,
            page: query.page,
            perPage: query.perPage,
          },
        },
      };
    } catch (error) {
      console.error("Error fetching source texts from Supabase:", error);
      throw error;
    }
  }

  async getSourceTextById(
    id: string
  ): Promise<SourceTextWithFlashcardsResponse | null> {
    try {
      // Get source text with flashcards
      const { data: sourceTextData, error: sourceTextError } =
        await supabaseClient
          .from("source_texts")
          .select(
            `
          *,
          flashcards(*)
        `
          )
          .eq("id", id)
          .eq("user_id", DEFAULT_USER_ID)
          .single();

      if (sourceTextError) {
        if (sourceTextError.code === "PGRST116") {
          // No rows returned
          return null;
        }
        console.error("Supabase error:", sourceTextError);
        throw new Error(`Database error: ${sourceTextError.message}`);
      }

      // Transform to API response format
      const sourceText: SourceTextWithFlashcardsResponse = {
        id: sourceTextData.id,
        textContent: sourceTextData.text_content,
        createdAt: sourceTextData.created_at,
        flashcards: (sourceTextData.flashcards || []).map((flashcard: any) => ({
          id: flashcard.id,
          front: flashcard.front,
          back: flashcard.back,
          source: flashcard.source as FlashcardSource,
          sourceTextId: flashcard.source_text_id,
          createdAt: flashcard.created_at,
          updatedAt: flashcard.updated_at,
          easeFactor: flashcard.ease_factor,
          interval: flashcard.interval,
          nextReviewAt: flashcard.next_review_at,
        })),
        flashcardCount: sourceTextData.flashcards?.length || 0,
      };

      return sourceText;
    } catch (error) {
      console.error("Error fetching source text by id from Supabase:", error);
      throw error;
    }
  }

  async createSourceText(
    data: SourceTextCreateData
  ): Promise<SourceTextResponse> {
    try {
      const { data: insertedData, error } = await supabaseClient
        .from("source_texts")
        .insert({
          user_id: DEFAULT_USER_ID,
          text_content: data.textContent,
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw new Error(`Database error: ${error.message}`);
      }

      // Log source text creation event
      await this.logEvent("source_text_created", {
        source_text_id: insertedData.id,
        text_length: data.textContent.length,
      });

      return {
        id: insertedData.id,
        textContent: insertedData.text_content,
        createdAt: insertedData.created_at,
      };
    } catch (error) {
      console.error("Error creating source text in Supabase:", error);
      throw error;
    }
  }

  async updateSourceText(
    id: string,
    data: Partial<SourceTextCreateData>
  ): Promise<SourceTextResponse | null> {
    try {
      const updateData: any = {};
      if (data.textContent !== undefined) {
        updateData.text_content = data.textContent;
      }

      const { data: updatedData, error } = await supabaseClient
        .from("source_texts")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", DEFAULT_USER_ID)
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return null;
        }
        console.error("Supabase error:", error);
        throw new Error(`Database error: ${error.message}`);
      }

      // Log the event
      await this.logEvent("source_text_updated", {
        source_text_id: updatedData.id,
        changes: updateData,
      });

      return {
        id: updatedData.id,
        textContent: updatedData.text_content,
        createdAt: updatedData.created_at,
      };
    } catch (error) {
      console.error("Error updating source text in Supabase:", error);
      throw error;
    }
  }

  async deleteSourceText(id: string): Promise<boolean> {
    try {
      const { error } = await supabaseClient
        .from("source_texts")
        .delete()
        .eq("id", id)
        .eq("user_id", DEFAULT_USER_ID);

      if (error) {
        console.error("Supabase error:", error);
        throw new Error(`Database error: ${error.message}`);
      }

      // Log the event
      await this.logEvent("source_text_deleted", {
        source_text_id: id,
      });

      return true;
    } catch (error) {
      console.error("Error deleting source text from Supabase:", error);
      throw error;
    }
  }

  async getEventLogs(query: EventLogQuery): Promise<EventLogsResponse> {
    try {
      let supabaseQuery = supabaseClient
        .from("event_logs")
        .select("*")
        .eq("user_id", DEFAULT_USER_ID);

      // Apply filters
      if (query.eventType) {
        supabaseQuery = supabaseQuery.eq("event_type", query.eventType);
      }

      // Note: severity is not in the database schema, so we'll skip it for now
      // if (query.severity) {
      //   supabaseQuery = supabaseQuery.eq("severity", query.severity);
      // }

      if (query.startDate) {
        supabaseQuery = supabaseQuery.gte("timestamp", query.startDate);
      }

      if (query.endDate) {
        supabaseQuery = supabaseQuery.lte("timestamp", query.endDate);
      }

      // Apply pagination and sorting
      const page = query.page || 1;
      const perPage = query.perPage || 20;
      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      const {
        data: eventLogs,
        error,
        count,
      } = await supabaseQuery
        .order("timestamp", { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Supabase error:", error);
        throw new Error(`Database error: ${error.message}`);
      }

      // Transform data to match API response format
      const transformedLogs =
        eventLogs?.map((log) => ({
          id: log.id,
          userId: log.user_id,
          eventType: log.event_type as EventType,
          timestamp: log.timestamp,
          severity: "info" as EventSeverity, // Default since severity is not in DB
          payload: (log.payload as Record<string, any>) || {},
          ipAddress: undefined,
          userAgent: undefined,
          sessionId: undefined,
        })) || [];

      // Calculate summary statistics
      const eventTypes: Record<EventType, number> = {
        aiCardCreated: 0,
        aiEditedCardCreated: 0,
        manualCardCreated: 0,
        aiCardReviewed: 0,
        cardEdited: 0,
        cardDeleted: 0,
      };

      const severityDistribution: Record<EventSeverity, number> = {
        info: transformedLogs.length,
        warning: 0,
        error: 0,
        critical: 0,
      };

      transformedLogs.forEach((log) => {
        eventTypes[log.eventType]++;
      });

      return {
        data: transformedLogs,
        meta: {
          pagination: {
            total: count || 0,
            page,
            perPage,
          },
          summary: {
            totalEvents: count || 0,
            eventTypes,
            severityDistribution,
          },
        },
      };
    } catch (error) {
      console.error("Error fetching event logs from Supabase:", error);
      throw error;
    }
  }
}
