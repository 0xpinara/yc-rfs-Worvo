import type { ApiErrorCode } from "../../shared/contracts";

export class InvoiceError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly fields?: string[],
  ) {
    super(message);
    this.name = "InvoiceError";
  }
}
