// Terms Guard — Dark Pattern Detection Engine
// Multi-layer scanner for deceptive UI patterns

const DARK_PATTERN_TYPES = {
    preChecked: { icon: '☑️', label: 'Pre-checked Box', severity: 'high', color: '#ef4444' },
    hiddenOptOut: { icon: '👻', label: 'Hidden Opt-out', severity: 'high', color: '#f97316' },
    forcedScroll: { icon: '📜', label: 'Forced Scroll', severity: 'medium', color: '#f59e0b' },
    confirmShaming: { icon: '😢', label: 'Confirm Shaming', severity: 'medium', color: '#f59e0b' },
    misdirection: { icon: '🎯', label: 'Misdirection', severity: 'high', color: '#ef4444' },
    urgency: { icon: '⏰', label: 'False Urgency', severity: 'medium', color: '#f59e0b' },
    hiddenCosts: { icon: '💸', label: 'Hidden Costs', severity: 'high', color: '#ef4444' }
};

/**
 * Main scanner — runs all detection layers
 * @returns {Array} — detected dark patterns
 */
function scanForDarkPatterns() {
    const detections = [];

    // Layer 1: Find consent/cookie modals
    scanConsentModals(detections);

    // Layer 2: Pre-checked checkboxes
    scanPreCheckedBoxes(detections);

    // Layer 3: Hidden opt-outs
    scanHiddenOptOuts(detections);

    // Layer 4: Forced scroll acceptance
    scanForcedScroll(detections);

    // Layer 5: Confirm shaming
    scanConfirmShaming(detections);

    // Layer 6: False urgency
    scanFalseUrgency(detections);

    return detections;
}

/**
 * Layer 1: Consent/Cookie modals with manipulative design
 */
function scanConsentModals(detections) {
    const modalSelectors = [
        '[class*="cookie"]', '[class*="consent"]', '[class*="gdpr"]',
        '[id*="cookie"]', '[id*="consent"]', '[id*="gdpr"]',
        '[class*="privacy-banner"]', '[class*="cookie-banner"]',
        '[class*="notice-bar"]', '[aria-label*="cookie"]'
    ];

    for (const selector of modalSelectors) {
        try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (!el.offsetParent && el.style.display === 'none') return;

                const buttons = el.querySelectorAll('button, a[role="button"], [class*="btn"]');
                let acceptBtn = null;
                let rejectBtn = null;

                buttons.forEach(btn => {
                    const text = btn.textContent.toLowerCase().trim();
                    if (/accept|agree|allow|got it|i understand|ok|yes/i.test(text)) acceptBtn = btn;
                    if (/reject|decline|deny|no|refuse|manage|settings|preferences/i.test(text)) rejectBtn = btn;
                });

                // Misdirection: accept button is much more prominent than reject
                if (acceptBtn && rejectBtn) {
                    const acceptStyle = window.getComputedStyle(acceptBtn);
                    const rejectStyle = window.getComputedStyle(rejectBtn);

                    const acceptSize = parseFloat(acceptStyle.fontSize);
                    const rejectSize = parseFloat(rejectStyle.fontSize);

                    const acceptBg = acceptStyle.backgroundColor;
                    const rejectBg = rejectStyle.backgroundColor;
                    const isRejectPlain = rejectBg === 'rgba(0, 0, 0, 0)' || rejectBg === 'transparent';

                    if ((acceptSize > rejectSize * 1.3) || isRejectPlain) {
                        detections.push({
                            type: 'misdirection',
                            ...DARK_PATTERN_TYPES.misdirection,
                            element: el,
                            description: 'Accept button is visually emphasized while reject/decline is minimized.',
                            context: `Accept: "${acceptBtn.textContent.trim()}" vs Reject: "${rejectBtn.textContent.trim()}"`
                        });
                    }
                }

                // No reject option at all
                if (acceptBtn && !rejectBtn && buttons.length <= 2) {
                    detections.push({
                        type: 'hiddenOptOut',
                        ...DARK_PATTERN_TYPES.hiddenOptOut,
                        element: el,
                        description: 'Cookie/consent modal has no visible reject or decline option.',
                        context: `Only button found: "${acceptBtn.textContent.trim()}"`
                    });
                }
            });
        } catch (e) { /* skip */ }
    }
}

/**
 * Layer 2: Pre-checked checkboxes
 */
function scanPreCheckedBoxes(detections) {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');

    checkboxes.forEach(cb => {
        if (!cb.checked) return;
        if (!cb.offsetParent) return; // hidden

        // Check if it's a marketing/consent checkbox
        const label = cb.closest('label') || document.querySelector(`label[for="${cb.id}"]`);
        const labelText = (label?.textContent || '').toLowerCase();
        const parentText = (cb.parentElement?.textContent || '').toLowerCase();
        const combinedText = labelText + ' ' + parentText;

        const consentPatterns = [
            'marketing', 'newsletter', 'promotional', 'partner', 'third party',
            'share', 'data', 'agree', 'consent', 'subscribe', 'updates',
            'communications', 'offers', 'notifications', 'emails'
        ];

        if (consentPatterns.some(p => combinedText.includes(p))) {
            detections.push({
                type: 'preChecked',
                ...DARK_PATTERN_TYPES.preChecked,
                element: cb.closest('label') || cb.parentElement || cb,
                description: 'A marketing or data-sharing checkbox is pre-checked, opting you in without explicit consent.',
                context: `"${(label?.textContent || parentText).trim().substring(0, 100)}"`
            });
        }
    });
}

/**
 * Layer 3: Hidden opt-outs
 */
function scanHiddenOptOuts(detections) {
    const links = document.querySelectorAll('a');
    const optOutPhrases = [
        'opt out', 'opt-out', 'unsubscribe', 'manage preferences',
        'do not sell', 'privacy settings', 'cookie settings'
    ];

    links.forEach(link => {
        const text = link.textContent.toLowerCase().trim();
        if (!optOutPhrases.some(p => text.includes(p))) return;

        const style = window.getComputedStyle(link);
        const fontSize = parseFloat(style.fontSize);
        const opacity = parseFloat(style.opacity);
        const color = style.color;

        // Check if link is suspiciously small, transparent, or color-matches background
        const isHidden = fontSize < 10 || opacity < 0.5;

        // Check if same color as background (low contrast)
        const parentBg = window.getComputedStyle(link.parentElement || document.body).backgroundColor;
        const isLowContrast = color === parentBg;

        if (isHidden || isLowContrast) {
            detections.push({
                type: 'hiddenOptOut',
                ...DARK_PATTERN_TYPES.hiddenOptOut,
                element: link,
                description: 'Opt-out link is intentionally small, transparent, or low-contrast to discourage users from finding it.',
                context: `"${link.textContent.trim()}" (font: ${fontSize}px, opacity: ${opacity})`
            });
        }
    });
}

/**
 * Layer 4: Forced scroll acceptance
 */
function scanForcedScroll(detections) {
    // Find modals/containers with scrollable terms + disabled button
    const containers = document.querySelectorAll(
        '[class*="modal"], [class*="dialog"], [class*="terms"], [role="dialog"]'
    );

    containers.forEach(container => {
        const scrollable = container.querySelector('[style*="overflow"], [class*="scroll"]');
        const disabledBtn = container.querySelector('button[disabled], input[type="submit"][disabled]');

        if (scrollable && disabledBtn) {
            const btnText = disabledBtn.textContent.toLowerCase();
            if (/accept|agree|continue|submit|sign up/i.test(btnText)) {
                detections.push({
                    type: 'forcedScroll',
                    ...DARK_PATTERN_TYPES.forcedScroll,
                    element: container,
                    description: 'You must scroll through the entire terms before the accept button becomes clickable — rarely do users read during forced scroll.',
                    context: `Button "${disabledBtn.textContent.trim()}" is disabled until scroll completes`
                });
            }
        }
    });
}

/**
 * Layer 5: Confirm shaming — decline buttons with guilt-trip language
 */
function scanConfirmShaming(detections) {
    const shamingPhrases = [
        'no thanks, i don\'t want', 'no, i prefer to pay full',
        'i don\'t care about', 'no, i hate saving', 'i\'ll miss out',
        'no thanks, i\'m not interested in being', 'i don\'t like free',
        'no, i want to stay uninformed', 'i don\'t need',
        'maybe later', 'remind me later'
    ];

    const allButtons = document.querySelectorAll('button, a[role="button"], [class*="btn"], a[class*="close"]');

    allButtons.forEach(btn => {
        const text = btn.textContent.toLowerCase().trim();
        if (shamingPhrases.some(p => text.includes(p))) {
            detections.push({
                type: 'confirmShaming',
                ...DARK_PATTERN_TYPES.confirmShaming,
                element: btn,
                description: 'The decline button uses guilt-tripping language to shame you into accepting.',
                context: `"${btn.textContent.trim()}"`
            });
        }
    });
}

/**
 * Layer 6: False urgency — countdown timers, "limited time" text
 */
function scanFalseUrgency(detections) {
    const urgencyPhrases = [
        'limited time', 'offer expires', 'act now', 'hurry',
        'only \\d+ left', 'expires in', 'don\'t miss', 'last chance',
        'ending soon', 'today only', 'countdown'
    ];

    const modals = document.querySelectorAll(
        '[class*="modal"], [class*="popup"], [class*="overlay"], [class*="banner"]'
    );

    modals.forEach(modal => {
        const text = modal.textContent.toLowerCase();
        for (const phrase of urgencyPhrases) {
            if (new RegExp(phrase, 'i').test(text)) {
                // Check for timer elements
                const timerEl = modal.querySelector('[class*="timer"], [class*="countdown"], [class*="clock"]');

                detections.push({
                    type: 'urgency',
                    ...DARK_PATTERN_TYPES.urgency,
                    element: modal,
                    description: 'Creates artificial urgency to pressure you into quick decisions without reading terms.',
                    context: `Detected: "${phrase}"${timerEl ? ' + countdown timer' : ''}`
                });
                break; // one per modal
            }
        }
    });
}

/**
 * Highlight detected dark patterns on the page with warnings
 */
function highlightDarkPatterns(detections) {
    detections.forEach((detection, index) => {
        const el = detection.element;
        if (!el || !el.offsetParent) return;

        // Add visual highlight
        el.style.outline = `3px solid ${detection.color}`;
        el.style.outlineOffset = '2px';
        el.style.position = el.style.position || 'relative';

        // Create warning tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'tg-dark-pattern-tooltip';
        tooltip.innerHTML = `
            <div class="tg-dp-header">
                <span class="tg-dp-icon">${detection.icon}</span>
                <span class="tg-dp-type">${detection.label}</span>
                <span class="tg-dp-severity tg-dp-severity-${detection.severity}">${detection.severity.toUpperCase()}</span>
            </div>
            <div class="tg-dp-desc">${detection.description}</div>
            <div class="tg-dp-context">${detection.context}</div>
        `;

        // Position tooltip
        tooltip.style.animationDelay = `${index * 0.1}s`;

        el.appendChild(tooltip);
        el.addEventListener('mouseenter', () => { tooltip.style.display = 'block'; });
        el.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
        tooltip.style.display = 'none';
    });
}
