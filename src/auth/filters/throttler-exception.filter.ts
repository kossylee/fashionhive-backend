import {
  type ExceptionFilter,
  Catch,
  type ArgumentsHost,
  HttpStatus,
} from "@nestjs/common";
import { ThrottlerException } from "@nestjs/throttler";
import type { Response } from "express";

@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status = HttpStatus.TOO_MANY_REQUESTS;

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message:
        "Rate limit exceeded. Please wait before making another request.",
      error: "Too Many Requests",
      details: {
        limit: "5 requests per minute",
        retryAfter: "60 seconds",
        endpoint: request.url,
      },
    });
  }
}
