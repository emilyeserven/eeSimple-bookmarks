/** The uniform API error envelope every failed request returns (see middleware `utils/errors.ts`). */
export interface ApiErrorBody {
  message: string;
  code: string;
  statusCode: number;
  params?: Record<string, string | number>;
}
