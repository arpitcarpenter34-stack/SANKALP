import React, { useState, useEffect } from 'react';
import { UserProfile, UserRoleType } from './types';
import { ROLE_OPTIONS, LOCATION_OPTIONS } from './settingsData';
import styles from './ProfileAccountCard.module.css';

export interface ProfileAccountCardProps {
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => Promise<boolean | void> | boolean | void;
  isClerkAuthenticated?: boolean;
  isLoading?: boolean;
  isSaving?: boolean;
  errorMessage?: string | null;
}

export const ProfileAccountCard: React.FC<ProfileAccountCardProps> = ({
  profile,
  onSaveProfile,
  isClerkAuthenticated = false,
  isLoading = false,
  isSaving = false,
  errorMessage = null,
}) => {
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [role, setRole] = useState<UserRoleType>(profile.role);
  const [location, setLocation] = useState(profile.location);
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSaving, setLocalSaving] = useState(false);

  // Synchronize internal form state whenever the profile prop changes (e.g. account switch or Clerk hydration)
  useEffect(() => {
    setFullName(profile.fullName);
    setEmail(profile.email);
    setRole(profile.role);
    setLocation(profile.location);
    setEmailError(null);
    setLocalError(null);
  }, [profile.fullName, profile.email, profile.role, profile.location]);

  const isDirty =
    fullName !== profile.fullName ||
    (!isClerkAuthenticated && email !== profile.email) ||
    role !== profile.role ||
    location !== profile.location;

  const validateEmail = (val: string): boolean => {
    if (isClerkAuthenticated) return true; // Managed by Clerk
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    setEmailError(isValid ? null : 'Please enter a valid email address');
    return isValid;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!isClerkAuthenticated && !validateEmail(email)) return;
    if (!fullName.trim()) return;

    const words = fullName.trim().split(/\s+/).filter(Boolean);
    let initials = 'U';
    if (words.length >= 2) {
      initials = `${words[0][0]}${words[1][0]}`.toUpperCase();
    } else if (words.length === 1 && words[0].length >= 2) {
      initials = words[0].slice(0, 2).toUpperCase();
    } else if (words.length === 1 && words[0].length === 1) {
      initials = words[0].toUpperCase();
    }

    setLocalSaving(true);
    try {
      const result = await onSaveProfile({
        fullName: fullName.trim(),
        email: isClerkAuthenticated ? profile.email : email.trim(),
        role,
        location,
        avatarInitials: initials,
        updatedAt: new Date().toISOString(),
      });

      if (result === false) {
        // Parent indicated failure
        return;
      }

      setIsSavedFeedback(true);
      setTimeout(() => setIsSavedFeedback(false), 2600);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile settings';
      setLocalError(message);
    } finally {
      setLocalSaving(false);
    }
  };

  const activeError = errorMessage || localError;
  const isPending = isSaving || localSaving;

  const initialsPreview = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || (profile.avatarInitials || 'U');

  return (
    <div className={styles.card} id="settings-profile-card" data-testid="profile-account-card">
      <div className={styles.header}>
        <h2 className={styles.title}>Profile & Account</h2>
        <p className={styles.subtitle}>
          {isClerkAuthenticated
            ? 'Synchronized with your authenticated Clerk account.'
            : 'Manage your local session profile and account preferences.'}
        </p>
      </div>

      {isLoading ? (
        <div style={{ padding: '36px 0', textAlign: 'center', color: '#047857' }}>
          <div style={{
            width: '28px',
            height: '28px',
            border: '3px solid #d1fae5',
            borderTopColor: '#047857',
            borderRadius: '50%',
            margin: '0 auto 12px auto',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span style={{ fontSize: '13px', fontWeight: 600 }}>
            Synchronizing identity with Clerk...
          </span>
        </div>
      ) : (
        <form onSubmit={handleSave} className={styles.bodyRow}>
          <div className={styles.avatarContainer}>
            <div className={styles.avatarCircle}>
              {initialsPreview}
            </div>
            <button
              type="button"
              className={styles.cameraBtn}
              title={isClerkAuthenticated ? 'Profile initial' : 'Profile avatar'}
              aria-label="Profile avatar initial"
            >
              📷
            </button>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="profile-fullname">
                Full Name
              </label>
              <input
                id="profile-fullname"
                type="text"
                className={styles.input}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="e.g. Aarav Sharma"
                disabled={isPending}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="profile-email">
                Email Address
                {isClerkAuthenticated && (
                  <span className={styles.clerkBadge} title="Email managed via Clerk authentication">
                    🔒 Managed by Clerk
                  </span>
                )}
              </label>
              <input
                id="profile-email"
                type="email"
                className={`${styles.input} ${emailError ? styles.inputError : ''} ${isClerkAuthenticated ? styles.readOnlyInput : ''}`}
                value={email}
                onChange={(e) => {
                  if (!isClerkAuthenticated) {
                    setEmail(e.target.value);
                    if (emailError) validateEmail(e.target.value);
                  }
                }}
                readOnly={isClerkAuthenticated}
                disabled={isPending}
                required
                placeholder="user@example.com"
                aria-describedby={isClerkAuthenticated ? 'clerk-email-desc' : undefined}
              />
              {isClerkAuthenticated && (
                <span id="clerk-email-desc" className={styles.clerkEmailHelp}>
                  Email is verified and managed by Clerk. Use your Clerk user menu to manage email addresses.
                </span>
              )}
              {emailError && <span className={styles.errorText}>{emailError}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="profile-role">
                Role / User Type
              </label>
              <select
                id="profile-role"
                className={styles.select}
                value={role}
                onChange={(e) => setRole(e.target.value as UserRoleType)}
                disabled={isPending}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="profile-location">
                Location
              </label>
              <select
                id="profile-location"
                className={styles.select}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isPending}
              >
                {LOCATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>
      )}

      <div className={styles.footerRow}>
        {activeError && (
          <div className={styles.errorBanner} role="alert">
            <span>⚠️</span>
            <span>{activeError}</span>
          </div>
        )}
        {isSavedFeedback && !activeError && (
          <span className={styles.feedbackBadge}>
            ✓ {isClerkAuthenticated ? 'Changes saved to Clerk & local workspace' : 'Changes saved to local profile'}
          </span>
        )}
        <button
          type="button"
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={!isDirty || !!emailError || !fullName.trim() || isPending || isLoading}
        >
          {isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};
