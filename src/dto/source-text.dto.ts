export interface CreateSourceTextDto {
  textContent: string;
}

export interface SourceTextResponseDto {
  id: string;
  textContent: string;
  createdAt: string;
}

// Type guards for runtime validation
export const isCreateSourceTextDto = (
  dto: unknown
): dto is CreateSourceTextDto => {
  if (typeof dto !== "object" || dto === null) return false;
  const { textContent } = dto as CreateSourceTextDto;
  return typeof textContent === "string" && textContent.length <= 10000;
};
