export type EventType =
  | "aiCardCreated"
  | "aiEditedCardCreated"
  | "manualCardCreated"
  | "aiCardReviewed"
  | "cardEdited"
  | "cardDeleted";

export type EventSeverity = "info" | "warning" | "error" | "critical";

export interface EventLogResponse {
  id: string;
  userId: string;
  eventType: EventType;
  timestamp: string;
  severity: EventSeverity;
  payload: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface EventLogQuery {
  page?: number;
  perPage?: number;
  eventType?: EventType;
  severity?: EventSeverity;
  startDate?: string;
  endDate?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  perPage: number;
}

export interface EventLogsResponse {
  data: EventLogResponse[];
  meta: {
    pagination: PaginationMeta;
    summary: {
      totalEvents: number;
      eventTypes: Record<EventType, number>;
      severityDistribution: Record<EventSeverity, number>;
    };
  };
}
