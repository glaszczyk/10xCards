import type { EventType } from "../common/types";

export interface EventLogQueryDto {
  eventType?: EventType;
  startDate?: string;
  endDate?: string;
  page?: number;
  perPage?: number;
}

export interface EventLogResponseDto {
  id: string;
  userId: string;
  eventType: EventType;
  timestamp: string;
  payload: Record<string, unknown> | null;
}

// Type guards for runtime validation
export const isEventLogQueryDto = (dto: unknown): dto is EventLogQueryDto => {
  if (typeof dto !== "object" || dto === null) return false;
  const { eventType, startDate, endDate, page, perPage } =
    dto as EventLogQueryDto;

  const isValidEventType = (type: unknown): boolean => {
    if (typeof type !== "string") return false;
    return [
      "ai_card_created",
      "ai_edited_card_created",
      "manual_card_created",
      "ai_card_reviewed",
      "card_edited",
      "card_deleted",
    ].includes(type);
  };

  const isValidDate = (date: unknown): boolean => {
    if (typeof date !== "string") return false;
    const timestamp = Date.parse(date);
    return !isNaN(timestamp);
  };

  return (
    (eventType === undefined || isValidEventType(eventType)) &&
    (startDate === undefined || isValidDate(startDate)) &&
    (endDate === undefined || isValidDate(endDate)) &&
    (page === undefined || (typeof page === "number" && page > 0)) &&
    (perPage === undefined || (typeof perPage === "number" && perPage > 0))
  );
};
