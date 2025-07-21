import type { AuthContext } from "../common/types";
import type { EventLogQueryDto } from "../dto/event-log.dto";

export class ListEventLogsCommand {
  constructor(
    public readonly query: EventLogQueryDto,
    public readonly auth: AuthContext
  ) {}
}

export class CreateEventLogCommand {
  constructor(
    public readonly eventType: string,
    public readonly payload: Record<string, unknown> | null,
    public readonly auth: AuthContext
  ) {}
}
