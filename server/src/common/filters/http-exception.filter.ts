import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = this.getTurkishMessage(status);
    let errorResponse: any = {};

    if (exception instanceof HttpException) {
      message = exception.message || this.getTurkishMessage(status);
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        errorResponse = exceptionResponse;
      } else {
        errorResponse = { message: exceptionResponse };
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      success: false,
      message: message,
      error: errorResponse,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private getTurkishMessage(status: number): string {
    const messages: Record<number, string> = {
      400: 'Geçersiz istek',
      401: 'Yetkisiz erişim',
      403: 'Erişim reddedildi',
      404: 'Kaynak bulunamadı',
      409: 'Çakışma var',
      422: 'İşlenemez veri',
      429: 'Çok fazla istek',
      500: 'Sunucu hatası',
      502: 'Kötü ağır geçidi',
      503: 'Hizmet kullanılamıyor',
    };
    return messages[status] || 'Bir hata oluştu';
  }
}
