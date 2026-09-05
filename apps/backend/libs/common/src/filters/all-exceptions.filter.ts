import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Errores del body-parser de Express (no son HttpException): traen su propio
    // status — 413 "entity.too.large" cuando el cuerpo supera el limit del
    // parser, 400 "entity.parse.failed" con JSON inválido. Sin esto salían como
    // 500 genérico y el cliente no sabía que el problema era el tamaño.
    const bodyParserStatus = this.bodyParserErrorStatus(exception);

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : (bodyParserStatus ?? HttpStatus.INTERNAL_SERVER_ERROR);

    const raw =
      exception instanceof HttpException
        ? exception.getResponse()
        : bodyParserStatus === HttpStatus.PAYLOAD_TOO_LARGE
          ? 'Payload too large: the request body exceeds the 1MB limit'
          : bodyParserStatus !== null
            ? 'Malformed request body'
            : 'Internal server error';

    // Nest a menudo devuelve { statusCode, message, error }; exponer solo message
    // para que clientes (web ApiError) lean string | string[] correctamente.
    const message =
      typeof raw === 'string'
        ? raw
        : typeof raw === 'object' &&
            raw !== null &&
            'message' in raw &&
            (typeof (raw as { message: unknown }).message === 'string' ||
              Array.isArray((raw as { message: unknown }).message))
          ? (raw as { message: string | string[] }).message
          : raw;

    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }

  /** 4xx de body-parser (`type: 'entity.*'` + `status`), o null si no es uno. */
  private bodyParserErrorStatus(exception: unknown): number | null {
    if (typeof exception !== 'object' || exception === null) return null;
    const { type, status } = exception as { type?: unknown; status?: unknown };
    if (typeof type !== 'string' || !type.startsWith('entity.')) return null;
    return typeof status === 'number' && status >= 400 && status < 500
      ? status
      : HttpStatus.BAD_REQUEST;
  }
}

