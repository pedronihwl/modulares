import { DomainException } from "./domain.exceptions";

export class NotFoundDomainException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}