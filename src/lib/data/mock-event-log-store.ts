import type {
  EventLogResponse,
  EventSeverity,
  EventType,
} from "../../pages/api/v1/event-logs/types";

// Wspólny store mocków dla event-logs
export const mockEventLogs: EventLogResponse[] = [
  {
    id: "event-1",
    userId: "user-123",
    eventType: "manualCardCreated",
    timestamp: "2024-01-15T10:30:00Z",
    severity: "info",
    payload: {
      flashcardId: "123e4567-e89b-12d3-a456-426614174000",
      front: "What is TypeScript?",
    },
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0...",
    sessionId: "session-123",
  },
  {
    id: "event-2",
    userId: "user-123",
    eventType: "aiCardCreated",
    timestamp: "2024-01-15T11:00:00Z",
    severity: "info",
    payload: {
      flashcardId: "123e4567-e89b-12d3-a456-426614174001",
      sourceTextId: "text-123",
    },
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0...",
    sessionId: "session-123",
  },
  {
    id: "event-3",
    userId: "user-123",
    eventType: "cardEdited",
    timestamp: "2024-01-15T14:30:00Z",
    severity: "info",
    payload: {
      flashcardId: "123e4567-e89b-12d3-a456-426614174002",
      changes: ["front", "back"],
    },
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0...",
    sessionId: "session-123",
  },
  {
    id: "event-4",
    userId: "user-123",
    eventType: "aiCardReviewed",
    timestamp: "2024-01-15T16:00:00Z",
    severity: "info",
    payload: {
      flashcardId: "123e4567-e89b-12d3-a456-426614174001",
      difficulty: "easy",
    },
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0...",
    sessionId: "session-123",
  },
  {
    id: "event-5",
    userId: "user-123",
    eventType: "cardDeleted",
    timestamp: "2024-01-15T18:00:00Z",
    severity: "warning",
    payload: { flashcardId: "123e4567-e89b-12d3-a456-426614174003" },
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0...",
    sessionId: "session-123",
  },
];

// CRUD helpers
export function getMockEventLogs(
  page: number = 1,
  perPage: number = 20,
  eventType?: EventType,
  severity?: EventSeverity,
  startDate?: string,
  endDate?: string
): { data: EventLogResponse[]; total: number } {
  // Filter by event type
  let filtered = eventType
    ? mockEventLogs.filter((log) => log.eventType === eventType)
    : mockEventLogs;

  // Filter by severity
  if (severity) {
    filtered = filtered.filter((log) => log.severity === severity);
  }

  // Filter by date range
  if (startDate) {
    filtered = filtered.filter((log) => log.timestamp >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter((log) => log.timestamp <= endDate);
  }

  // Sort by timestamp (newest first)
  filtered = [...filtered].sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp)
  );

  // Apply pagination
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  const paginatedData = filtered.slice(startIndex, endIndex);

  return {
    data: paginatedData,
    total: filtered.length,
  };
}

export function addMockEventLog(event: EventLogResponse) {
  mockEventLogs.unshift(event);
}

export function getEventLogSummary(): {
  totalEvents: number;
  eventTypes: Record<EventType, number>;
  severityDistribution: Record<EventSeverity, number>;
} {
  const eventTypes: Record<EventType, number> = {
    aiCardCreated: 0,
    aiEditedCardCreated: 0,
    manualCardCreated: 0,
    aiCardReviewed: 0,
    cardEdited: 0,
    cardDeleted: 0,
  };

  const severityDistribution: Record<EventSeverity, number> = {
    info: 0,
    warning: 0,
    error: 0,
    critical: 0,
  };

  mockEventLogs.forEach((log) => {
    eventTypes[log.eventType]++;
    severityDistribution[log.severity]++;
  });

  return {
    totalEvents: mockEventLogs.length,
    eventTypes,
    severityDistribution,
  };
}
