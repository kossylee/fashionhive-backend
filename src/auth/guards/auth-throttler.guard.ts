import { Injectable, type ExecutionContext } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerException } from "@nestjs/throttler";
import { Request } from "express";

@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Skip throttling for admin endpoints
    if (request.url.includes("/admin")) {
      return true;
    }

    // Only apply throttling to auth endpoints
    return !request.url.startsWith("/auth");
  }

  protected async getTracker(req: Request): Promise<string> {
    // Use IP address as the tracking key
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    return `auth_throttle:${ip}`;
  }

  protected generateKey(context: ExecutionContext, tracker: string): string {
    const request = context.switchToHttp().getRequest<Request>();
    return `${tracker}:${request.url}`;
  }

  protected throwThrottlingException(context: ExecutionContext): void {
    const request = context.switchToHttp().getRequest<Request>();
    const endpoint = request.url;

    throw new ThrottlerException(
      `Too many requests to ${endpoint}. Please wait before trying again. Maximum 5 requests per minute allowed.`
    );
  }
}
