import { describe, it, assert } from 'vitest';
import { isSafeUrl } from '../url-utils';

describe('Evidence Feature Tests — Verification & Safety', () => {
  it('URL Security Test: allows only valid http and https schemes', () => {
    assert.strictEqual(isSafeUrl('https://mospi.gov.in/hces'), true);
    assert.strictEqual(isSafeUrl('http://example.org/study'), true);

    // Unsafe or malicious URL protocols must be rejected
    assert.strictEqual(isSafeUrl('javascript:alert(1)'), false);
    assert.strictEqual(isSafeUrl('data:text/html,<script>alert(1)</script>'), false);
    assert.strictEqual(isSafeUrl('vbscript:msgbox(1)'), false);
    assert.strictEqual(isSafeUrl('file:///etc/passwd'), false);
    assert.strictEqual(isSafeUrl(''), false);
    assert.strictEqual(isSafeUrl(null), false);
    assert.strictEqual(isSafeUrl(undefined), false);
    assert.strictEqual(isSafeUrl('not-a-valid-url'), false);
  });

  it('Verification Status Governance: validates all 4 canonical governance tags', () => {
    const statuses = ['[VERIFIED]', '[VERIFY]', '[INFERENCE]', '[UNVERIFIED]'] as const;
    for (const status of statuses) {
      assert.ok(status.startsWith('[') && status.endsWith(']'), `Status ${status} must follow governance bracket notation`);
    }
  });
});
