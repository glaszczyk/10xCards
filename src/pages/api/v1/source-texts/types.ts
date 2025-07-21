export interface CreateSourceTextDto {
  textContent: string;
}

export interface SourceTextResponse {
  id: string;
  textContent: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
}
