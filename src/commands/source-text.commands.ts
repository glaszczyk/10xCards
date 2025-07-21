import type { AuthContext } from "../common/types";
import type { CreateSourceTextDto } from "../dto/source-text.dto";

export class CreateSourceTextCommand {
  constructor(
    public readonly dto: CreateSourceTextDto,
    public readonly auth: AuthContext
  ) {}
}

export class GetSourceTextCommand {
  constructor(
    public readonly id: string,
    public readonly auth: AuthContext
  ) {}
}
