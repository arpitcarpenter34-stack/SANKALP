import React, { useState, useEffect } from 'react';
import { SignIn, SignUp } from '@clerk/react';
import styles from './AuthScreen.module.css';

interface AuthScreenProps {
  onContinueAsGuest?: () => void;
}

const TYPEWRITER_PHRASES = [
  'Track Global Shocks.',
  "Understand India's Markets.",
  'Protect Household Affordability.',
  'Preserve SIP Compounding.',
];

/**
 * Typewriter tagline effect respecting user preferences and motion settings
 */
const TypewriterText: React.FC = () => {
  const [currentText, setCurrentText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setCurrentText(TYPEWRITER_PHRASES[0]);
      return;
    }

    const currentPhrase = TYPEWRITER_PHRASES[phraseIndex];
    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      if (currentText.length < currentPhrase.length) {
        timer = setTimeout(() => {
          setCurrentText(currentPhrase.slice(0, currentText.length + 1));
        }, 70);
      } else {
        // Pause at full word before deleting
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 2200);
      }
    } else {
      if (currentText.length > 0) {
        timer = setTimeout(() => {
          setCurrentText(currentPhrase.slice(0, currentText.length - 1));
        }, 35);
      } else {
        // Move to next phrase
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % TYPEWRITER_PHRASES.length);
        timer = setTimeout(() => {}, 400);
      }
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, phraseIndex, prefersReducedMotion]);

  return (
    <span className={styles.typewriterTextContainer}>
      {currentText}
      {!prefersReducedMotion && <span className={styles.typewriterCursor}>|</span>}
    </span>
  );
};

const clerkAppearance = {
  variables: {
    colorPrimary: '#00866A',
    colorText: '#172B3A',
    colorTextSecondary: '#52677F',
    colorBackground: '#FFFFFF',
    colorInputBackground: '#FFFFFF',
    colorInputText: '#172B3A',
    colorDanger: '#EF4444',
    borderRadius: '12px',
    fontSize: '15px',
    fontFamily: 'var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
    spacingUnit: '16px',
  },
  layout: {
    socialButtonsVariant: 'blockButton' as const,
    logoPlacement: 'none' as const,
  },
  elements: {
    rootBox: {
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box' as const,
    },
    card: {
      boxShadow: 'none',
      border: 'none',
      padding: '0',
      width: '100%',
      maxWidth: '100%',
      backgroundColor: 'transparent',
      boxSizing: 'border-box' as const,
    },
    header: {
      marginBottom: '18px',
      textAlign: 'center' as const,
    },
    headerTitle: {
      fontSize: '22px',
      fontWeight: '800',
      color: '#10233F',
      letterSpacing: '-0.02em',
      lineHeight: '1.25',
    },
    headerSubtitle: {
      fontSize: '14.5px',
      lineHeight: '1.45',
      color: '#52677F',
      marginTop: '4px',
    },
    socialButtonsRoot: {
      width: '100%',
      marginBottom: '16px',
    },
    socialButtons: {
      width: '100%',
    },
    socialButtonsBlockButton: {
      minHeight: '46px',
      height: '46px',
      width: '100%',
      border: '1.5px solid #D8EADF',
      borderRadius: '12px',
      backgroundColor: '#FFFFFF',
      fontSize: '15px',
      fontWeight: '600',
      color: '#172B3A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 16px',
      position: 'relative' as const,
      boxSizing: 'border-box' as const,
      transition: 'all 0.15s ease',
      boxShadow: '0 1px 3px rgba(16, 24, 40, 0.02)',
      '&:hover': {
        backgroundColor: '#F0FAF4',
        borderColor: '#00866A',
      },
      '&:focus': {
        borderColor: '#00866A',
        boxShadow: '0 0 0 3px rgba(0, 134, 106, 0.15)',
      },
    },
    socialButtonsBlockButtonText: {
      fontSize: '15px',
      fontWeight: '600',
      color: '#172B3A',
    },
    socialButtonsProviderIcon: {
      width: '20px',
      height: '20px',
      marginRight: '10px',
    },
    lastAuthenticationStrategyBadge: {
      position: 'absolute' as const,
      right: '12px',
      fontSize: '11px',
      fontWeight: '700',
      padding: '3px 8px',
      borderRadius: '9999px',
      backgroundColor: '#E8F5EC',
      color: '#00866A',
      border: '1px solid #C3E2D0',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.04em',
      lineHeight: '1',
      display: 'inline-flex',
      alignItems: 'center',
    },
    dividerRow: {
      margin: '18px 0',
      width: '100%',
    },
    dividerText: {
      fontSize: '13px',
      fontWeight: '500',
      color: '#64748B',
      textTransform: 'lowercase' as const,
      letterSpacing: '0.02em',
    },
    dividerLine: {
      backgroundColor: '#E2E8F0',
    },
    form: {
      width: '100%',
      boxSizing: 'border-box' as const,
    },
    formFieldRow: {
      marginBottom: '16px',
      width: '100%',
    },
    formField: {
      width: '100%',
    },
    formFieldLabelRow: {
      marginBottom: '6px',
    },
    formFieldLabel: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#172B3A',
      marginBottom: '6px',
      display: 'block',
    },
    formFieldInput: {
      minHeight: '46px',
      height: '46px',
      width: '100%',
      fontSize: '15px',
      color: '#172B3A',
      backgroundColor: '#FFFFFF',
      border: '1.5px solid #D8EADF',
      borderRadius: '12px',
      padding: '0 14px',
      boxSizing: 'border-box' as const,
      transition: 'all 0.15s ease',
      '&:focus': {
        borderColor: '#00866A',
        boxShadow: '0 0 0 3px rgba(0, 134, 106, 0.15)',
        backgroundColor: '#FFFFFF',
      },
      '&::placeholder': {
        color: '#94A3B8',
        fontSize: '14.5px',
      },
    },
    formButtonPrimary: {
      minHeight: '46px',
      height: '46px',
      width: '100%',
      background: 'linear-gradient(135deg, #00866A 0%, #00745A 100%)',
      borderRadius: '12px',
      fontSize: '15.5px',
      fontWeight: '700',
      color: '#FFFFFF',
      marginTop: '12px',
      boxSizing: 'border-box' as const,
      boxShadow: '0 4px 12px rgba(0, 134, 106, 0.25)',
      transition: 'all 0.15s ease',
      '&:hover': {
        background: 'linear-gradient(135deg, #00745A 0%, #00604A 100%)',
        boxShadow: '0 6px 16px rgba(0, 134, 106, 0.35)',
      },
      '&:active': {
        transform: 'translateY(1px)',
      },
    },
    footer: {
      marginTop: '18px',
      padding: '0',
      textAlign: 'center' as const,
      width: '100%',
    },
    footerAction: {
      fontSize: '13.5px',
      color: '#52677F',
    },
    footerActionText: {
      fontSize: '13.5px',
      color: '#52677F',
    },
    footerActionLink: {
      fontSize: '13.5px',
      fontWeight: '600',
      color: '#00866A',
      textDecoration: 'none',
      '&:hover': {
        textDecoration: 'underline',
        color: '#006E57',
      },
    },
    identityPreview: {
      padding: '12px 14px',
      borderRadius: '12px',
      border: '1px solid #D8EADF',
      backgroundColor: '#F0FAF4',
    },
    identityPreviewText: {
      fontSize: '14.5px',
      fontWeight: '600',
      color: '#172B3A',
    },
    identityPreviewEditButton: {
      fontSize: '13.5px',
      fontWeight: '600',
      color: '#00866A',
    },
    formFieldErrorText: {
      fontSize: '12.5px',
      color: '#EF4444',
      marginTop: '4px',
    },
    formFieldSuccessText: {
      fontSize: '12.5px',
      color: '#00866A',
      marginTop: '4px',
    },
  },
};

export const AuthScreen: React.FC<AuthScreenProps> = ({ onContinueAsGuest }) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  return (
    <div className={styles.authContainer}>
      {/* Tricolor Ribbon at bottom left */}
      <svg className={styles.tricolorSwoosh} viewBox="0 0 600 200" fill="none" aria-hidden="true">
        <path d="M0,190 Q150,150 280,165 T580,120 L580,200 L0,200 Z" fill="rgba(19, 136, 8, 0.45)" />
        <path d="M0,175 Q160,135 290,150 T560,105 L560,185 L0,185 Z" fill="rgba(255, 255, 255, 0.75)" />
        <path d="M0,160 Q170,120 300,135 T540,90 L540,170 L0,170 Z" fill="rgba(255, 153, 51, 0.55)" />
        <circle cx="280" cy="148" r="6" fill="#000080" opacity="0.35" />
      </svg>

      <div className={styles.authLayoutWrapper}>
        {/* =========================================================================
            LEFT PANEL: BHARATIMPACT INTRO & VISUALS (58-62% Desktop Width)
            ========================================================================= */}
        <div className={styles.leftPanel}>
          {/* Background Illustration Container */}
          <div className={styles.illustrationContainer} aria-hidden="true">
            <svg width="480" height="480" viewBox="0 0 480 480" fill="none">
              {/* Glowing Earth Globe */}
              <circle cx="240" cy="240" r="180" fill="url(#globeGrad)" />
              <circle cx="240" cy="240" r="180" stroke="rgba(0, 134, 106, 0.25)" strokeWidth="1.5" />
              <ellipse cx="240" cy="240" rx="180" ry="75" stroke="rgba(0, 134, 106, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
              <ellipse cx="240" cy="240" rx="80" ry="180" stroke="rgba(0, 134, 106, 0.15)" strokeWidth="1" strokeDasharray="4 4" />

              {/* India Contour Map on Globe */}
              <path
                d="M205,170 Q230,160 255,165 Q275,185 285,210 Q295,235 305,255 Q290,285 270,305 Q250,335 235,355 Q220,330 205,305 Q190,280 185,250 Q180,220 195,190 Z"
                fill="url(#indiaGrad)"
                stroke="#00866A"
                strokeWidth="1.8"
              />

              {/* Skyline Silhouette (India Gate + Towers) */}
              <path
                d="M175,340 L175,320 L185,320 L185,340 M195,340 L195,305 L210,305 L210,290 L225,290 L225,305 L240,305 L240,340 M250,340 L250,315 L265,315 L265,340 M275,340 L275,295 L285,295 L285,340"
                stroke="#D4A76A"
                strokeWidth="2"
                fill="rgba(212, 167, 106, 0.25)"
              />

              {/* Floating Event Badges */}
              {/* 1. Geopolitics Badge */}
              <g transform="translate(140, 120)">
                <rect width="105" height="30" rx="15" fill="#FFEBEB" stroke="#FFA3A3" strokeWidth="1" />
                <circle cx="15" cy="15" r="7" fill="#E53935" />
                <text x="30" y="19" fill="#C62828" fontSize="11" fontWeight="700" fontFamily="sans-serif">Geopolitics</text>
              </g>

              {/* 2. Climate & Energy Badge */}
              <g transform="translate(285, 140)">
                <rect width="130" height="30" rx="15" fill="#FFF4E5" stroke="#FFCC80" strokeWidth="1" />
                <circle cx="15" cy="15" r="7" fill="#FB8C00" />
                <text x="30" y="19" fill="#E65100" fontSize="11" fontWeight="700" fontFamily="sans-serif">Climate & Energy</text>
              </g>

              {/* 3. Commodities Badge */}
              <g transform="translate(120, 230)">
                <rect width="115" height="30" rx="15" fill="#E8F4FD" stroke="#90CAF9" strokeWidth="1" />
                <circle cx="15" cy="15" r="7" fill="#1E88E5" />
                <text x="30" y="19" fill="#0D47A1" fontSize="11" fontWeight="700" fontFamily="sans-serif">Commodities</text>
              </g>

              {/* 4. Technology Badge */}
              <g transform="translate(295, 255)">
                <rect width="108" height="30" rx="15" fill="#F3E5F5" stroke="#CE93D8" strokeWidth="1" />
                <circle cx="15" cy="15" r="7" fill="#8E24AA" />
                <text x="30" y="19" fill="#4A148C" fontSize="11" fontWeight="700" fontFamily="sans-serif">Technology</text>
              </g>

              <defs>
                <radialGradient id="globeGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
                  <stop offset="60%" stopColor="#D4F4E4" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#A8E4C7" stopOpacity="0.2" />
                </radialGradient>
                <linearGradient id="indiaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00A884" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#006E57" stopOpacity="0.95" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div>
            {/* 1. Logo Header */}
            <div className={styles.brandHeader}>
              <div className={styles.brandLogo}>
                <svg width="42" height="42" viewBox="0 0 42 42" fill="none">
                  {/* Stylized India map outline with mini bar chart */}
                  <path
                    d="M10,8 Q15,6 20,7 Q24,11 25,16 Q27,21 28,26 Q25,32 21,35 Q18,34 16,30 Q14,26 12,22 Q9,16 8,12 Z"
                    fill="#00866A"
                  />
                  {/* 3 Rising Bar Chart Pillars */}
                  <rect x="25" y="24" width="3" height="8" rx="1.5" fill="#00866A" />
                  <rect x="30" y="20" width="3" height="12" rx="1.5" fill="#00866A" />
                  <rect x="35" y="16" width="3" height="16" rx="1.5" fill="#00866A" />
                </svg>
              </div>
              <div className={styles.brandTextGroup}>
                <h1 className={styles.brandWordmark}>
                  Bharat<span className={styles.brandWordmarkHighlight}>Impact</span>
                </h1>
                <span className={styles.brandSubtitle}>
                  Global events → Indian economy → your household.
                </span>
              </div>
            </div>

            {/* 2. Main Headline */}
            <h2 className={styles.heroHeading}>
              Understand India's<br />
              Economic Shocks<br />
              Before They Reach<br />
              <span className={styles.heroHeadingEmerald}>Your Household.</span>
            </h2>

            {/* 3. Description Copy */}
            <p className={styles.heroDescription}>
              Track global disruptions, trace their impact on Indian markets and household expenses,
              and explore how they affect sector performance and SIP affordability.
            </p>

            {/* 4. Typewriter Pill Banner */}
            <div className={styles.typewriterPill}>
              <div className={styles.typewriterIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="13" width="4" height="8" rx="1.5" fill="#00866A" />
                  <rect x="10" y="8" width="4" height="13" rx="1.5" fill="#00866A" />
                  <rect x="17" y="3" width="4" height="18" rx="1.5" fill="#00866A" />
                </svg>
              </div>
              <TypewriterText />
            </div>

            {/* 5. Four Feature Highlights Row */}
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <div className={styles.featureIconCircle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <div className={styles.featureTitle}>Global Events</div>
                <div className={styles.featureSubtitle}>Real-time insights globally</div>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIconCircle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <div className={styles.featureTitle}>Economic Impact</div>
                <div className={styles.featureSubtitle}>Sector & market effects</div>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIconCircle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
                <div className={styles.featureTitle}>Household Expenses</div>
                <div className={styles.featureSubtitle}>Understand cost implications</div>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureIconCircle}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div className={styles.featureTitle}>Investments & SIP</div>
                <div className={styles.featureSubtitle}>Plan with better foresight</div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT PANEL: AUTHENTICATION CARD (38-42% Desktop Width)
            ========================================================================= */}
        <div className={styles.rightPanel}>
          <div className={styles.authCard}>
            {/* Top Segmented Tabs: Sign In | Create Account */}
            <div className={styles.tabsContainer} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={authMode === 'signin'}
                className={`${styles.tabButton} ${authMode === 'signin' ? styles.tabButtonActive : ''}`}
                onClick={() => setAuthMode('signin')}
              >
                Sign In
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={authMode === 'signup'}
                className={`${styles.tabButton} ${authMode === 'signup' ? styles.tabButtonActive : ''}`}
                onClick={() => setAuthMode('signup')}
              >
                Create Account
              </button>
            </div>

            {/* Custom Header */}
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>
                {authMode === 'signin' ? 'Welcome Back' : 'Create Account'}
              </h3>
              <p className={styles.cardSubtitle}>
                {authMode === 'signin'
                  ? 'Sign in to your BharatImpact account'
                  : 'Get started with verified economic intelligence'}
              </p>
            </div>

            {/* Clerk Authentication Component */}
            <div className={styles.clerkMountContainer}>
              {authMode === 'signin' ? (
                <SignIn routing="hash" appearance={clerkAppearance} />
              ) : (
                <SignUp routing="hash" appearance={clerkAppearance} />
              )}
            </div>

            {/* Guest Exploration Option */}
            {onContinueAsGuest && (
              <div className={styles.guestButtonContainer}>
                <button
                  type="button"
                  onClick={onContinueAsGuest}
                  className={styles.guestButton}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Explore as Guest →
                </button>
              </div>
            )}

            {/* Security Badge and Terms Footer */}
            <div className={styles.cardFooter}>
              <div className={styles.securedBadge}>
                <span>Secured by</span>
                <span className={styles.clerkLogoMark}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#10233F" strokeWidth="2" />
                    <path d="M12 7v5l3 3" stroke="#10233F" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  clerk
                </span>
              </div>
              <div className={styles.legalNotice}>
                By continuing, you agree to our <a>Terms</a> and <a>Privacy Policy</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
