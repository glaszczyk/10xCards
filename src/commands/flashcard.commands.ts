import type { AuthContext } from "../common/types";
import type {
  CreateFlashcardDto,
  FlashcardQueryDto,
  UpdateFlashcardDto,
} from "../dto/flashcard.dto";

export class CreateFlashcardCommand {
  constructor(
    public readonly dto: CreateFlashcardDto,
    public readonly auth: AuthContext
  ) {}
}

export class UpdateFlashcardCommand {
  constructor(
    public readonly id: string,
    public readonly dto: UpdateFlashcardDto,
    public readonly auth: AuthContext
  ) {}
}

export class DeleteFlashcardCommand {
  constructor(
    public readonly id: string,
    public readonly auth: AuthContext
  ) {}
}

export class GetFlashcardCommand {
  constructor(
    public readonly id: string,
    public readonly auth: AuthContext
  ) {}
}

export class ListFlashcardsCommand {
  constructor(
    public readonly query: FlashcardQueryDto,
    public readonly auth: AuthContext
  ) {}
}
