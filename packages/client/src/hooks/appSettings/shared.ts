/**
 * Variables for a mutation shared by many differently-worded call sites: each call supplies its own
 * toast text rather than the hook flattening every field into one generic "Updated <label>" message.
 */
export interface ToastedMutationVars<TInput> {
  input: TInput;
  successMessage: string;
  errorMessage?: string;
}
