import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ApiClient } from '../../../services/api/apiClient';

describe('BharatImpact Clerk Authentication & Token Client Integration', () => {
  let client: ApiClient;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    client = new ApiClient('http://127.0.0.1:8000/api');
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('1. Token Getter & Header Synchronization', () => {
    it('returns empty auth headers when no token getter is configured', async () => {
      const headers = await client.getAuthHeaders();
      expect(headers).toEqual({});
    });

    it('attaches Bearer token header when token getter returns valid session JWT', async () => {
      const mockJwt = 'mock.clerk.jwt.token.xyz123';
      client.setTokenGetter(async () => mockJwt);

      const headers = await client.getAuthHeaders();
      expect(headers).toEqual({
        Authorization: `Bearer ${mockJwt}`,
      });
    });

    it('returns empty headers when token getter returns null (guest / signed out state)', async () => {
      client.setTokenGetter(async () => null);

      const headers = await client.getAuthHeaders();
      expect(headers).toEqual({});
    });

    it('handles token getter throwing an error gracefully without crashing requests', async () => {
      client.setTokenGetter(async () => {
        throw new Error('Clerk session token expired or unreachable');
      });

      const headers = await client.getAuthHeaders();
      expect(headers).toEqual({});
    });
  });

  describe('2. Protected API Endpoints & Request Headers', () => {
    it('getCurrentUser sends GET /api/auth/me with Authorization Bearer header', async () => {
      const mockJwt = 'clerk_test_token_456';
      client.setTokenGetter(async () => mockJwt);

      const mockUserResponse = {
        authenticated: true,
        user_id: 'user_2xyzBharatImpact',
        claims: { sub: 'user_2xyzBharatImpact' },
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockUserResponse,
      } as unknown as Response);

      const result = await client.getCurrentUser();
      expect(result).toEqual(mockUserResponse);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/api/auth/me',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockJwt}`,
          }),
        })
      );
    });

    it('getCurrentUser throws when API returns 401 Unauthorized', async () => {
      client.setTokenGetter(async () => 'expired_token');

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      } as unknown as Response);

      await expect(client.getCurrentUser()).rejects.toThrow('Unauthorized');
    });

    it('postScenarioAnalysis attaches Authorization header when token getter is active', async () => {
      const mockJwt = 'scenario_auth_token_789';
      client.setTokenGetter(async () => mockJwt);

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          scenario: { id: 'crude-surge', title: 'Crude Surge', sourceReceipt: {} },
          graph: { nodes: [{ id: 'n1', label: 'Crude' }], edges: [] },
          persona: { persona: {}, itemBreakdown: [], itemCoverage: {} },
        }),
      } as unknown as Response);

      await client.postScenarioAnalysis({
        scenarioId: 'crude-surge',
        isAiOff: false,
        state: 'Maharashtra',
        sector: 'Urban',
        expenditureClass: 'Middle',
      });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/api/scenarios/analyze',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockJwt}`,
          }),
        })
      );
    });
  });

  describe('3. Clerk Environment Configuration Rules', () => {
    it('validates that VITE_CLERK_PUBLISHABLE_KEY matches Clerk format requirements', () => {
      const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
      expect(typeof key).toBe('string');
      expect(key.startsWith('pk_test_') || key.startsWith('pk_live_')).toBe(true);
      expect(key.length).toBeGreaterThan(20);
    });

    it('ensures frontend does not expose backend CLERK_SECRET_KEY', () => {
      // Secret key must NEVER be prefixed with VITE_ or exposed to client bundle
      const envKeys = Object.keys(import.meta.env);
      const leakedSecretKey = envKeys.find(
        (k) => k.toLowerCase().includes('secret') || k === 'CLERK_SECRET_KEY'
      );
      expect(leakedSecretKey).toBeUndefined();
    });
  });
});
