import { HttpException, HttpStatus } from '@nestjs/common';

export class PaymentRequiredException extends HttpException {
  constructor(message = 'insufficient credits') {
    super({ error: message }, HttpStatus.PAYMENT_REQUIRED);
  }
}

export class BadGatewayException extends HttpException {
  constructor(message: string) {
    super({ error: message }, HttpStatus.BAD_GATEWAY);
  }
}
