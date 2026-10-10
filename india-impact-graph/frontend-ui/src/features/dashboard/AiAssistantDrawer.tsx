import React, { useState } from 'react';
import styles from './AiAssistantDrawer.module.css';

export interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDomainFilter: (domain: string) => void;
  activeScenarioTitle?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionSummary?: string;
  domainApplied?: string;
}

const QUICK_PROMPTS = [
  { id: 'crude', text: 'Focus on crude oil and fuel inflation', domain: 'petrol' },
  { id: 'semi', text: 'Show semiconductor supply-chain impacts', domain: 'semiconductors' },
  { id: 'agri', text: 'Highlight agriculture and food prices', domain: 'food' },
  { id: 'household', text: 'Prioritize household expenses', domain: 'all' },
  { id: 'forecast', text: 'Compare historical data with available forecasts', domain: 'all' },
  { id: 'sip', text: 'Focus on SIP affordability', domain: 'all' },
];

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  onApplyDomainFilter,
  activeScenarioTitle = 'Crude Oil Shock: +12%',
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: `Hello! I am your BharatImpact Economic Intelligence Assistant. I analyze how global macroeconomic shocks transmit to the Indian domestic economy, specific sectors, and household budgets anchored to MoSPI HCES 2023-24 data. How can I assist you today?`,
      timestamp: 'Just now',
    },
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSend = (textToSend?: string, domainToFilter?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsProcessing(true);

    // Determine domain filter to apply
    let targetDomain = domainToFilter || 'all';
    const lower = text.toLowerCase();
    if (lower.includes('oil') || lower.includes('crude') || lower.includes('fuel') || lower.includes('petrol') || lower.includes('diesel')) {
      targetDomain = 'petrol';
    } else if (lower.includes('semiconductor') || lower.includes('chip') || lower.includes('electronics')) {
      targetDomain = 'semiconductors';
    } else if (lower.includes('agri') || lower.includes('food') || lower.includes('wheat') || lower.includes('edible')) {
      targetDomain = 'food';
    } else if (lower.includes('lpg') || lower.includes('cng') || lower.includes('gas')) {
      targetDomain = 'lpg';
    } else if (lower.includes('currency') || lower.includes('market') || lower.includes('rupee')) {
      targetDomain = 'currency';
    }

    setTimeout(() => {
      onApplyDomainFilter(targetDomain);

      let responseText = '';
      let actionSummary = '';

      if (targetDomain === 'petrol') {
        actionSummary = 'Applied domain filter: Petrol & Diesel';
        responseText = `Filtering the Economic Impact Graph to Energy & Fuel transmission. International crude oil increases flow through refinery gate pricing into commercial diesel and transport logistics. Under MoSPI Statement 4, conveyance expenditures account for 7.59% (rural) to 8.46% (urban) of monthly expenditure, transmitting an estimated +₹2,450 monthly pressure.`;
      } else if (targetDomain === 'semiconductors') {
        actionSummary = 'Applied domain filter: Semiconductors';
        responseText = `Focusing on semiconductor supply-chain transmission. High global chip lead-times increase component costs for Indian electronics manufacturing and automotive ECUs by an estimated +8% to +18%, affecting durable goods inflation with a 2-3 month lag.`;
      } else if (targetDomain === 'food') {
        actionSummary = 'Applied domain filter: Food & Agriculture';
        responseText = `Filtering on Food & Agriculture pathways. Rural food shares (44.52% in MP according to Table 3.6 of the MoSPI HCES report) create sensitivity to wholesale procurement and mandi freight, mitigated by PMGKAY targeted allocations.`;
      } else if (lower.includes('sip') || lower.includes('invest')) {
        actionSummary = 'Highlighted SIP Affordability module';
        responseText = `At an estimated incremental expense burden of +₹2,450/month, a median household with ₹60,000 income faces approximately 10% compression in discretionary surplus, reducing monthly SIP investment capacity from ₹5,000 to ₹4,500.`;
      } else if (lower.includes('forecast')) {
        actionSummary = 'Highlighted 6-Month Expense Forecast';
        responseText = `The 6-month forecast indicates headline household expenditure rising from ₹58,000 in October 2024 to ₹68,000 by March 2025 (+9.1%), with a 1-sigma uncertainty interval spanning ₹64,800 to ₹71,200.`;
      } else {
        actionSummary = 'Synchronized dashboard context';
        responseText = `Analyzing transmission for "${text}". The active scenario is "${activeScenarioTitle}". The deterministic engine connects global benchmarks to Indian sectors and household MPCE baskets without fabricating causality.`;
      }

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: responseText,
        timestamp: 'Just now',
        actionSummary,
        domainApplied: targetDomain,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsProcessing(false);
    }, 600);
  };

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true" aria-label="AI Economic Assistant">
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.headerTitleRow}>
            <div className={styles.assistantIconBox}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <div className={styles.headerTextCol}>
              <h2 className={styles.drawerTitle}>BharatImpact AI Assistant</h2>
              <span className={styles.drawerSubtitle}>Economic Transmission Copilot</span>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close Assistant"
          >
            ✕
          </button>
        </div>

        {/* Quick Prompt Chips */}
        <div className={styles.chipsSection}>
          <span className={styles.chipsLabel}>Suggested Prompts:</span>
          <div className={styles.chipsGrid}>
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp.id}
                type="button"
                className={styles.promptChip}
                onClick={() => handleSend(qp.text, qp.domain)}
              >
                {qp.text}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation Message List */}
        <div className={styles.chatBody}>
          {messages.map((m) => (
            <div
              key={m.id}
              className={`${styles.msgRow} ${m.sender === 'user' ? styles.msgUser : styles.msgAssistant}`}
            >
              {m.sender === 'assistant' && (
                <div className={styles.avatarMini}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#047857" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2.5" />
                  </svg>
                </div>
              )}
              <div className={styles.msgBubble}>
                {m.actionSummary && (
                  <div className={styles.actionBadge}>
                    <span>✓</span>
                    <span>{m.actionSummary}</span>
                  </div>
                )}
                <p className={styles.msgText}>{m.text}</p>
                <span className={styles.msgTime}>{m.timestamp}</span>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className={`${styles.msgRow} ${styles.msgAssistant}`}>
              <div className={styles.avatarMini}>
                <span className={styles.pulseDot} />
              </div>
              <div className={styles.msgBubble}>
                <span className={styles.processingText}>Evaluating transmission chain...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          className={styles.inputForm}
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            type="text"
            className={styles.textInput}
            placeholder="Ask about fuel inflation, chips, or household impact..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button
            type="submit"
            className={styles.sendBtn}
            disabled={!inputValue.trim()}
            aria-label="Send message"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};
