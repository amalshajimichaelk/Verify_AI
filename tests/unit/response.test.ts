import { describe, it, expect, vi } from 'vitest';
import { ok, created, error, fromError, generateRequestId, noContent } from '../../lib/api/response';
import { Errors } from '../../lib/errors';
import { NextResponse } from 'next/server';

// Mock NextResponse for testing since it's part of Next.js server runtime
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body, options) => ({ body, options })),
  },
}));

describe('API Response Helpers', () => {
  it('ok() returns a 200 response', () => {
    const res = ok({ id: 123 }, 'req_1');
    expect((res as any).body).toEqual({ success: true, data: { id: 123 }, requestId: 'req_1' });
    expect((res as any).options).toEqual({ status: 200 });
  });

  it('created() returns a 201 response', () => {
    const res = created({ name: 'test' });
    expect((res as any).body).toEqual({ success: true, data: { name: 'test' }, requestId: undefined });
    expect((res as any).options).toEqual({ status: 201 });
  });

  it('error() returns formatted error envelope', () => {
    const res = error('NOT_FOUND', 'Missing item', 404, 'req_2');
    expect((res as any).body).toEqual({ 
      success: false, 
      error: { code: 'NOT_FOUND', message: 'Missing item' }, 
      requestId: 'req_2' 
    });
    expect((res as any).options).toEqual({ status: 404 });
  });

  it('fromError() handles VerifyAIErrors safely', () => {
    const verifyErr = Errors.unauthorized();
    const res = fromError(verifyErr, 'req_3');
    expect((res as any).body.error.code).toBe('UNAUTHORIZED');
    expect((res as any).options.status).toBe(401);
  });

  it('generateRequestId() creates a unique string', () => {
    const id1 = generateRequestId();
    const id2 = generateRequestId();
    expect(id1).toMatch(/^req_[a-z0-9]+_[a-z0-9]+$/);
    expect(id1).not.toBe(id2);
  });
});
