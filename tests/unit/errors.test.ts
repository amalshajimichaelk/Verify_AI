import { describe, it, expect, vi } from 'vitest';
import { VerifyAIError, Errors, toApiError, isVerifyAIError } from '../../lib/errors';

describe('VerifyAIError', () => {
  it('creates an error with expected properties', () => {
    const error = new VerifyAIError('UNAUTHORIZED', 'Auth required', 401);
    expect(error.code).toBe('UNAUTHORIZED');
    expect(error.message).toBe('Auth required');
    expect(error.statusCode).toBe(401);
    expect(error.name).toBe('VerifyAIError');
  });

  it('toUserResponse hides internal details', () => {
    const error = new VerifyAIError('API_ERROR', 'Internal', 500, { secret: 123 });
    const response = error.toUserResponse();
    expect(response).toEqual({ code: 'API_ERROR', message: 'Internal' });
    expect((response as any).details).toBeUndefined();
  });
});

describe('Errors Factory', () => {
  it('creates common errors correctly', () => {
    expect(Errors.unauthorized().statusCode).toBe(401);
    expect(Errors.forbidden().statusCode).toBe(403);
    expect(Errors.notFound('File').statusCode).toBe(404);
    expect(Errors.fileTooLarge(5).message).toContain('5MB');
  });
});

describe('toApiError', () => {
  it('maps VerifyAIError correctly', () => {
    const err = Errors.rateLimited();
    const mapped = toApiError(err);
    expect(mapped.code).toBe('RATE_LIMITED');
    expect(mapped.statusCode).toBe(429);
  });

  it('maps unknown errors to generic 500 API_ERROR', () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const unknownErr = new Error('Database crash!');
    const mapped = toApiError(unknownErr);
    expect(mapped.code).toBe('API_ERROR');
    expect(mapped.statusCode).toBe(500);
    expect(mapped.message).not.toContain('Database crash');
    
    spy.mockRestore();
  });
});

describe('isVerifyAIError', () => {
  it('identifies VerifyAIError', () => {
    expect(isVerifyAIError(Errors.internal())).toBe(true);
    expect(isVerifyAIError(new Error())).toBe(false);
  });
});
