import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isDemoMode, hasGeminiKey, hasInngest, hasDatabase, hasBlobStorage, getServiceAvailability } from '../../lib/demo/mode';

describe('Demo Mode Utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('isDemoMode is true by default without keys', () => {
    delete process.env.DEMO_MODE;
    delete process.env.NEXT_PUBLIC_DEMO_MODE;
    delete process.env.GEMINI_API_KEY;
    delete process.env.ENABLE_REAL_ANALYSIS;
    
    expect(isDemoMode()).toBe(true);
  });

  it('isDemoMode is true when explicitly set', () => {
    process.env.DEMO_MODE = 'true';
    process.env.GEMINI_API_KEY = 'test_key';
    process.env.ENABLE_REAL_ANALYSIS = 'true';
    
    expect(isDemoMode()).toBe(true);
  });

  it('isDemoMode is false when real analysis is enabled and keys are present', () => {
    process.env.DEMO_MODE = 'false';
    process.env.NEXT_PUBLIC_DEMO_MODE = 'false';
    process.env.GEMINI_API_KEY = 'test_key';
    process.env.ENABLE_REAL_ANALYSIS = 'true';
    
    expect(isDemoMode()).toBe(false);
  });

  it('checks individual service keys correctly', () => {
    process.env.GEMINI_API_KEY = 'val';
    process.env.INNGEST_EVENT_KEY = 'val';
    process.env.DATABASE_URL = 'val';
    process.env.BLOB_READ_WRITE_TOKEN = 'val';

    expect(hasGeminiKey()).toBe(true);
    expect(hasInngest()).toBe(true);
    expect(hasDatabase()).toBe(true);
    expect(hasBlobStorage()).toBe(true);
  });

  it('getServiceAvailability returns full status', () => {
    process.env.DEMO_MODE = 'true';
    process.env.DATABASE_URL = 'postgres://test';
    process.env.BLOB_READ_WRITE_TOKEN = '';
    
    const status = getServiceAvailability();
    expect(status.demoMode).toBe(true);
    expect(status.database).toBe(true);
    expect(status.blobStorage).toBe(false);
  });
});
