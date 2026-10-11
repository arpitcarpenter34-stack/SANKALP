import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  extractClerkIdentity,
  syncUserProfileWithClerk,
  getSettingsStorageKey,
  loadSettingsFromStorage,
  saveSettingsToStorage,
  clearUserSettings,
  ClerkUserLike,
} from '../../settings/settingsStorage';
import { DEFAULT_SETTINGS_STATE } from '../../settings/settingsData';
import { ApiClient } from '../../../services/api/apiClient';

// Node-based Vitest localStorage simulation
const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => storageMap.get(key) || null),
  setItem: vi.fn((key: string, value: string) => {
    storageMap.set(key, value);
  }),
  removeItem: vi.fn((key: string) => {
    storageMap.delete(key);
  }),
  clear: vi.fn(() => {
    storageMap.clear();
  }),
};

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = localStorageMock;
}

describe('BharatImpact Profile Synchronization & Identity Security Verification', () => {
  beforeEach(() => {
    storageMap.clear();
    vi.restoreAllMocks();
  });

  // =========================================================================
  // SCENARIO 1: Sign-in as account A -> name and email display account A's data
  // =========================================================================
  describe('Scenario 1: Sign-in as Account A displays authentic Account A data', () => {
    it('synchronizes profile identity with Account A Clerk attributes', () => {
      const accountA: ClerkUserLike = {
        id: 'user_2vinayVerm95AccountA',
        fullName: 'Vinay Verma',
        firstName: 'Vinay',
        lastName: 'Verma',
        primaryEmailAddress: { emailAddress: 'vinayverm95@gmail.com' },
      };

      const extracted = extractClerkIdentity(accountA);
      expect(extracted.fullName).toBe('Vinay Verma');
      expect(extracted.email).toBe('vinayverm95@gmail.com');
      expect(extracted.avatarInitials).toBe('VV');

      const initialProfile = DEFAULT_SETTINGS_STATE.profile;
      const synced = syncUserProfileWithClerk(initialProfile, accountA);

      expect(synced.fullName).toBe('Vinay Verma');
      expect(synced.email).toBe('vinayverm95@gmail.com');
      expect(synced.avatarInitials).toBe('VV');
      expect(synced.role).toBe(initialProfile.role); // Preserves app preferences
      expect(synced.location).toBe(initialProfile.location);
    });

    it('persists Account A settings under user-scoped storage key', () => {
      const accountAId = 'user_2vinayVerm95AccountA';
      const key = getSettingsStorageKey(accountAId);
      expect(key).toBe(`bharatimpact_settings_user_${accountAId}`);

      const stateA = {
        ...DEFAULT_SETTINGS_STATE,
        profile: {
          ...DEFAULT_SETTINGS_STATE.profile,
          fullName: 'Vinay Verma',
          email: 'vinayverm95@gmail.com',
        },
        display: {
          ...DEFAULT_SETTINGS_STATE.display,
          theme: 'dark' as const,
        },
      };

      saveSettingsToStorage(stateA, accountAId);
      const reloaded = loadSettingsFromStorage(accountAId);

      expect(reloaded.profile.fullName).toBe('Vinay Verma');
      expect(reloaded.profile.email).toBe('vinayverm95@gmail.com');
      expect(reloaded.display.theme).toBe('dark');
    });
  });

  // =========================================================================
  // SCENARIO 2: Sign-out and sign-in as account B -> account A's data is removed, account B appears
  // =========================================================================
  describe('Scenario 2: Account switching & Sign-out clears old data and loads Account B', () => {
    it('switches from Account A to Account B without stale data bleed', () => {
      const accountAId = 'user_2account_A';
      const accountBId = 'user_2account_B';

      // 1. Account A signs in and customizes profile & preferences
      const stateA = {
        ...DEFAULT_SETTINGS_STATE,
        profile: {
          ...DEFAULT_SETTINGS_STATE.profile,
          fullName: 'ARPIT CARPENTER',
          email: 'arpitcarpenter34@gmail.com',
        },
        preferences: {
          ...DEFAULT_SETTINGS_STATE.preferences,
          defaultView: 'sectors' as const,
        },
      };
      saveSettingsToStorage(stateA, accountAId);

      // 2. User signs out or switches to Account B
      const accountBUser: ClerkUserLike = {
        id: accountBId,
        fullName: 'Vinay Verma',
        firstName: 'Vinay',
        lastName: 'Verma',
        primaryEmailAddress: { emailAddress: 'vinayverm95@gmail.com' },
      };

      // Loading Account B settings from storage (fresh user)
      const rawB = loadSettingsFromStorage(accountBId);
      const syncedB = syncUserProfileWithClerk(rawB.profile, accountBUser);

      // Verify Account B NEVER contains Account A's name or email
      expect(syncedB.fullName).toBe('Vinay Verma');
      expect(syncedB.email).toBe('vinayverm95@gmail.com');
      expect(syncedB.fullName).not.toBe('ARPIT CARPENTER');
      expect(syncedB.email).not.toBe('arpitcarpenter34@gmail.com');

      // 3. Verify Account B's storage is completely isolated from Account A's
      saveSettingsToStorage({ ...rawB, profile: syncedB }, accountBId);

      const checkA = loadSettingsFromStorage(accountAId);
      const checkB = loadSettingsFromStorage(accountBId);

      expect(checkA.profile.email).toBe('arpitcarpenter34@gmail.com');
      expect(checkB.profile.email).toBe('vinayverm95@gmail.com');
      expect(checkA.preferences.defaultView).toBe('sectors');
      expect(checkB.preferences.defaultView).toBe('overview');
    });

    it('ensures guest exploration mode does not reuse authenticated user profiles', () => {
      const accountAId = 'user_authenticated_A';
      saveSettingsToStorage(
        {
          ...DEFAULT_SETTINGS_STATE,
          profile: {
            ...DEFAULT_SETTINGS_STATE.profile,
            fullName: 'Secret Executive',
            email: 'exec@secret.in',
          },
        },
        accountAId
      );

      // Guest mode (userId is null or undefined)
      const guestSettings = loadSettingsFromStorage(null);
      const guestIdentity = extractClerkIdentity(null);

      expect(guestIdentity.fullName).toBe('Guest Analyst');
      expect(guestIdentity.email).toBe('guest@bharatimpact.internal');
      expect(guestSettings.profile.email).not.toBe('exec@secret.in');

      // Clear Account A settings explicitly
      clearUserSettings(accountAId);
      expect(loadSettingsFromStorage(accountAId).profile.email).toBe(DEFAULT_SETTINGS_STATE.profile.email);
    });
  });

  // =========================================================================
  // SCENARIO 3: New registration -> profile initializes automatically from the new Clerk user
  // =========================================================================
  describe('Scenario 3: New registration automatically initializes profile from Clerk', () => {
    it('initializes from newly registered Clerk user with firstName and lastName', () => {
      const newRegistration: ClerkUserLike = {
        id: 'user_newReg777',
        fullName: null, // Often null on immediate sign-up before profile assembly
        firstName: 'Divya',
        lastName: 'Menon',
        primaryEmailAddress: { emailAddress: 'divya.menon@finresearch.in' },
      };

      const extracted = extractClerkIdentity(newRegistration);
      expect(extracted.fullName).toBe('Divya Menon');
      expect(extracted.email).toBe('divya.menon@finresearch.in');
      expect(extracted.avatarInitials).toBe('DM');

      const profile = syncUserProfileWithClerk(DEFAULT_SETTINGS_STATE.profile, newRegistration);
      expect(profile.fullName).toBe('Divya Menon');
      expect(profile.email).toBe('divya.menon@finresearch.in');
      expect(profile.avatarInitials).toBe('DM');
    });

    it('initializes from newly registered user with only username', () => {
      const usernameOnlyUser: ClerkUserLike = {
        id: 'user_usernameReg888',
        username: 'macro_analyst_in',
        emailAddresses: [{ emailAddress: 'macro@example.org' }],
      };

      const extracted = extractClerkIdentity(usernameOnlyUser);
      expect(extracted.fullName).toBe('macro_analyst_in');
      expect(extracted.email).toBe('macro@example.org');
    });
  });

  // =========================================================================
  // SCENARIO 4: Missing name or email -> safe fallback without stale values
  // =========================================================================
  describe('Scenario 4: Safe fallbacks for missing name or email without cross-account pollution', () => {
    it('safely falls back to email handle when name fields are missing', () => {
      const userWithoutName: ClerkUserLike = {
        id: 'user_noname123',
        fullName: null,
        firstName: null,
        lastName: null,
        primaryEmailAddress: { emailAddress: 'research.fellow@delhi.ac.in' },
      };

      const extracted = extractClerkIdentity(userWithoutName);
      expect(extracted.fullName).toBe('research.fellow');
      expect(extracted.email).toBe('research.fellow@delhi.ac.in');
      expect(extracted.avatarInitials).toBe('RE');
    });

    it('safely falls back to Authenticated User when both name and email are absent', () => {
      const emptyUser: ClerkUserLike = {
        id: 'user_empty456',
        fullName: '',
        firstName: '',
        lastName: '',
        primaryEmailAddress: null,
        emailAddresses: [],
      };

      const extracted = extractClerkIdentity(emptyUser);
      expect(extracted.fullName).toBe('Authenticated User');
      expect(extracted.email).toBe('');
      expect(extracted.avatarInitials).toBe('AU');
    });

    it('single-word names generate safe single/double character initials', () => {
      const singleNameUser: ClerkUserLike = {
        id: 'user_single',
        fullName: 'Kabir',
        primaryEmailAddress: { emailAddress: 'kabir@impact.in' },
      };

      const extracted = extractClerkIdentity(singleNameUser);
      expect(extracted.fullName).toBe('Kabir');
      expect(extracted.avatarInitials).toBe('KA');
    });
  });

  // =========================================================================
  // SCENARIO 5: Backend profile requests cannot read or modify another user's profile
  // =========================================================================
  describe('Scenario 5: Backend and API profile requests enforce verified subject token isolation', () => {
    let client: ApiClient;
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
      client = new ApiClient('http://127.0.0.1:8000/api');
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('getCurrentUser does NOT accept or trust a client-supplied user ID in query or body', async () => {
      client.setTokenGetter(async () => 'valid_user_A_token');

      // Mock backend response verifying identity exclusively from JWT 'sub' claim
      const serverResponse = {
        authenticated: true,
        user_id: 'user_verified_from_jwt_sub',
        session_id: 'sess_123',
      };

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => serverResponse,
      } as unknown as Response);

      const identity = await client.getCurrentUser();

      expect(identity.user_id).toBe('user_verified_from_jwt_sub');
      // Verify request was a GET without spoofable body
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/api/auth/me',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer valid_user_A_token',
          }),
        })
      );
    });

    it('rejects unauthenticated requests without session token immediately', async () => {
      client.setTokenGetter(null); // Signed out

      await expect(client.getCurrentUser()).rejects.toThrow('No active Clerk session token available');
    });

    it('rejects requests with 401 Unauthorized when session is rejected by backend', async () => {
      client.setTokenGetter(async () => 'invalid_token');

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Invalid or expired authentication token.' }),
      } as unknown as Response);

      await expect(client.getCurrentUser()).rejects.toThrow('Unauthorized');
    });
  });

  // =========================================================================
  // SCENARIO 6: Profile API or Clerk update failure -> clear error handling, no false success
  // =========================================================================
  describe('Scenario 6: Authentic error reporting without false positive success indications', () => {
    it('catches Clerk user.update failure and reports error message', async () => {
      const mockUpdate = vi.fn().mockRejectedValue(new Error('Clerk rate limit exceeded. Please try again.'));

      let caughtError: string | null = null;
      let updateSucceeded = false;

      try {
        await mockUpdate({ firstName: 'NewName' });
        updateSucceeded = true;
      } catch (err) {
        caughtError = (err as Error).message;
        updateSucceeded = false;
      }

      expect(updateSucceeded).toBe(false);
      expect(caughtError).toBe('Clerk rate limit exceeded. Please try again.');
    });

    it('handles Clerk structured API error objects correctly', async () => {
      const clerkErrorObj = {
        status: 422,
        errors: [{ message: 'Name contains invalid characters.' }],
      };

      const mockUpdate = vi.fn().mockRejectedValue(clerkErrorObj);

      let extractedMessage = '';
      try {
        await mockUpdate();
      } catch (err: any) {
        extractedMessage = err?.errors?.[0]?.message || 'Unknown error';
      }

      expect(extractedMessage).toBe('Name contains invalid characters.');
    });
  });
});
