// Terms Guard — Content Script
// Scans the current page for T&C content, highlights risks, and adds floating widgets

(function () {
    'use strict';

    // Prevent double injection
    if (window.__termsGuardLoaded) return;
    window.__termsGuardLoaded = true;

    let isScanning = false;
    let lastAnalysis = null;
    let bannerDismissed = false;

    // =====================================================
    // 1. AUTO-DETECT T&C PAGES
    // =====================================================

    function detectTCContent() {
        const pageText = document.body?.innerText?.toLowerCase() || '';
        const pageTitle = document.title?.toLowerCase() || '';
        const pageUrl = window.location.href.toLowerCase();

        // Check URL
        for (const keyword of TC_KEYWORDS) {
            const urlKeyword = keyword.replace(/\s+/g, '[-_]?');
            if (new RegExp(urlKeyword).test(pageUrl)) return true;
        }

        // Check title
        for (const keyword of TC_KEYWORDS) {
            if (pageTitle.includes(keyword)) return true;
        }

        // Check for T&C containers in the page
        const headings = document.querySelectorAll('h1, h2, h3');
        for (const heading of headings) {
            const headingText = heading.textContent.toLowerCase();
            for (const keyword of TC_KEYWORDS) {
                if (headingText.includes(keyword)) return true;
            }
        }

        return false;
    }

    // =====================================================
    // 2. TEXT EXTRACTION
    // =====================================================

    function extractTCText() {
        // Strategy 1: Look for specific T&C containers
        const selectors = [
            '[class*="terms"]', '[class*="policy"]', '[class*="privacy"]',
            '[class*="agreement"]', '[class*="legal"]', '[class*="tos"]',
            '[id*="terms"]', '[id*="policy"]', '[id*="privacy"]',
            '[id*="agreement"]', '[id*="legal"]', '[id*="tos"]',
            'article', 'main', '.content', '#content', '.main-content'
        ];

        for (const selector of selectors) {
            try {
                const elements = document.querySelectorAll(selector);
                for (const el of elements) {
                    const text = el.innerText?.trim();
                    if (text && text.length > 500) {
                        return { text, element: el };
                    }
                }
            } catch (e) { /* skip invalid selectors */ }
        }

        // Strategy 2: Look for modals/overlays with T&C content
        const modals = document.querySelectorAll(
            '[class*="modal"], [class*="dialog"], [class*="overlay"], [class*="popup"], [role="dialog"]'
        );
        for (const modal of modals) {
            const text = modal.innerText?.trim();
            if (text && text.length > 300) {
                const lowerText = text.toLowerCase();
                for (const keyword of TC_KEYWORDS) {
                    if (lowerText.includes(keyword)) {
                        return { text, element: modal };
                    }
                }
            }
        }

        // Strategy 3: Fall back to body text
        const bodyText = document.body?.innerText?.trim();
        if (bodyText && bodyText.length > 200) {
            return { text: bodyText, element: document.body };
        }

        return null;
    }

    // =====================================================
    // 3. RISK HIGHLIGHTING ON PAGE
    // =====================================================

    function highlightRisks(risks, containerElement) {
        if (!containerElement || !risks || risks.length === 0) return;

        // Remove existing highlights
        removeHighlights();

        const walker = document.createTreeWalker(
            containerElement,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        const textNodes = [];
        let node;
        while (node = walker.nextNode()) {
            if (node.textContent.trim().length > 0) {
                textNodes.push(node);
            }
        }

        for (const textNode of textNodes) {
            const text = textNode.textContent;
            const lowerText = text.toLowerCase();

            for (const risk of risks) {
                const patternLower = risk.pattern.toLowerCase();
                if (lowerText.includes(patternLower)) {
                    try {
                        highlightTextNode(textNode, risk);
                    } catch (e) { /* skip problematic nodes */ }
                    break; // Only highlight once per text node
                }
            }
        }
    }

    function highlightTextNode(textNode, risk) {
        const text = textNode.textContent;
        const lowerText = text.toLowerCase();
        const patternLower = risk.pattern.toLowerCase();
        const idx = lowerText.indexOf(patternLower);

        if (idx === -1) return;

        const before = text.substring(0, idx);
        const match = text.substring(idx, idx + risk.pattern.length);
        const after = text.substring(idx + risk.pattern.length);

        const span = document.createElement('span');
        span.className = 'tg-highlight';
        span.setAttribute('data-tg-severity', risk.severity);
        span.setAttribute('data-tg-category', risk.categoryLabel);

        // Color based on severity
        let highlightColor;
        if (risk.severity >= 8) {
            highlightColor = 'rgba(239, 68, 68, 0.25)';
            span.classList.add('tg-severity-high');
        } else if (risk.severity >= 5) {
            highlightColor = 'rgba(245, 158, 11, 0.25)';
            span.classList.add('tg-severity-medium');
        } else {
            highlightColor = 'rgba(34, 197, 94, 0.2)';
            span.classList.add('tg-severity-low');
        }

        span.style.backgroundColor = highlightColor;
        span.textContent = match;

        // Add tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'tg-tooltip';
        tooltip.innerHTML = `
      <div class="tg-tooltip-header">
        <span class="tg-tooltip-icon">${risk.categoryIcon}</span>
        <span class="tg-tooltip-category">${risk.categoryLabel}</span>
        <span class="tg-tooltip-severity tg-severity-${risk.severity >= 8 ? 'high' : risk.severity >= 5 ? 'medium' : 'low'}">
          Risk: ${risk.severity}/10
        </span>
      </div>
      <div class="tg-tooltip-body">${risk.explanation}</div>
    `;
        span.appendChild(tooltip);

        const parent = textNode.parentNode;
        const fragment = document.createDocumentFragment();
        if (before) fragment.appendChild(document.createTextNode(before));
        fragment.appendChild(span);
        if (after) fragment.appendChild(document.createTextNode(after));

        parent.replaceChild(fragment, textNode);
    }

    function removeHighlights() {
        document.querySelectorAll('.tg-highlight').forEach(el => {
            const text = el.childNodes[0]?.textContent || el.textContent;
            el.replaceWith(document.createTextNode(text));
        });
    }

    // =====================================================
    // 4. FLOATING WIDGET ON ACCEPT BUTTONS
    // =====================================================

    function addAcceptButtonWarnings(analysis) {
        if (!analysis || analysis.riskScore === 0) return;

        const buttons = document.querySelectorAll('button, input[type="submit"], a[role="button"], [class*="btn"], [class*="button"]');

        buttons.forEach(btn => {
            const text = (btn.textContent || btn.value || '').toLowerCase().trim();

            for (const keyword of ACCEPT_BUTTON_KEYWORDS) {
                if (text.includes(keyword)) {
                    addWarningBadge(btn, analysis);
                    break;
                }
            }
        });
    }

    function addWarningBadge(button, analysis) {
        // Don't add if already has badge
        if (button.querySelector('.tg-accept-badge')) return;

        const badge = document.createElement('div');
        badge.className = 'tg-accept-badge';

        const gradeEmoji = analysis.grade.emoji;
        const score = analysis.riskScore;

        badge.innerHTML = `
      <div class="tg-badge-icon">${gradeEmoji}</div>
      <div class="tg-badge-tooltip">
        <div class="tg-badge-title">Terms Guard Warning</div>
        <div class="tg-badge-score">Risk Score: ${score}/100</div>
        <div class="tg-badge-grade" style="color: ${analysis.grade.color}">${analysis.grade.label}</div>
        <div class="tg-badge-msg">${analysis.totalRisksFound} risk${analysis.totalRisksFound !== 1 ? 's' : ''} detected. Click the Terms Guard icon for details.</div>
      </div>
    `;

        // Position relative to button
        const parent = button.parentElement;
        if (parent) {
            parent.style.position = parent.style.position || 'relative';
        }
        button.style.position = button.style.position || 'relative';
        button.appendChild(badge);
    }

    // =====================================================
    // 5. FLOATING SCAN BUTTON (FAB)
    // =====================================================

    function createScanFAB() {
        // Remove existing
        const existing = document.getElementById('tg-fab');
        if (existing) existing.remove();

        const fab = document.createElement('div');
        fab.id = 'tg-fab';
        fab.innerHTML = `
      <div class="tg-fab-button" id="tg-fab-btn">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
      <div class="tg-fab-label" id="tg-fab-label">Scan T&C</div>
    `;

        document.body.appendChild(fab);

        document.getElementById('tg-fab-btn').addEventListener('click', () => {
            scanPage();
        });
    }

    // =====================================================
    // 6. SMART AUTO-SCAN NOTIFICATION BANNER
    // =====================================================

    function showAutoScanBanner() {
        if (bannerDismissed) return;

        // Remove existing banner
        const existing = document.getElementById('tg-banner');
        if (existing) existing.remove();

        const banner = document.createElement('div');
        banner.id = 'tg-banner';
        banner.innerHTML = `
      <div class="tg-banner-content">
        <div class="tg-banner-left">
          <div class="tg-banner-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div class="tg-banner-text">
            <strong>Terms Guard</strong> has detected Terms & Conditions on this page.
            <span class="tg-banner-sub">Scan to reveal hidden risks before you accept.</span>
          </div>
        </div>
        <div class="tg-banner-actions">
          <button class="tg-banner-scan" id="tg-banner-scan">🔍 Scan Now</button>
          <button class="tg-banner-dismiss" id="tg-banner-dismiss">✕</button>
        </div>
      </div>
    `;

        document.body.appendChild(banner);

        // Animate in after a brief delay
        requestAnimationFrame(() => {
            setTimeout(() => {
                banner.classList.add('tg-banner-visible');
            }, 100);
        });

        document.getElementById('tg-banner-scan').addEventListener('click', () => {
            banner.classList.remove('tg-banner-visible');
            setTimeout(() => banner.remove(), 400);
            scanPage();
        });

        document.getElementById('tg-banner-dismiss').addEventListener('click', () => {
            bannerDismissed = true;
            banner.classList.remove('tg-banner-visible');
            setTimeout(() => banner.remove(), 400);
        });
    }

    // =====================================================
    // 7. RESULTS PANEL (INLINE IN PAGE)
    // =====================================================

    function showResultsPanel(analysis) {
        // Remove existing
        const existing = document.getElementById('tg-results-panel');
        if (existing) existing.remove();

        const panel = document.createElement('div');
        panel.id = 'tg-results-panel';

        const topRisks = analysis.risks.slice(0, 8);
        const risksHTML = topRisks.map(r => `
      <div class="tg-risk-item">
        <div class="tg-risk-header">
          <span class="tg-risk-icon">${r.categoryIcon}</span>
          <span class="tg-risk-pattern">"${r.pattern}"</span>
          <span class="tg-risk-severity" style="background:${r.categoryColor}20; color:${r.categoryColor}">
            ${r.severity}/10
          </span>
        </div>
        <div class="tg-risk-explain">${r.explanation}</div>
      </div>
    `).join('');

        const summaryHTML = analysis.summary.map(line => {
            if (!line) return '<br>';
            return `<p>${line}</p>`;
        }).join('');

        // Verdict section
        const verdictHTML = analysis.verdict ? `
          <div class="tg-verdict-section">
            <span class="tg-verdict-icon">${analysis.verdict.icon}</span>
            <span class="tg-verdict-text">${analysis.verdict.text}</span>
          </div>
        ` : '';

        // Permissions section
        const permissionsHTML = (analysis.permissions && analysis.permissions.length > 0) ? `
          <div class="tg-permissions-section">
            <h4>🔐 Permissions Detected</h4>
            <div class="tg-perm-badges">
              ${analysis.permissions.map(p => `<span class="tg-perm-badge">${p.icon} ${p.label}</span>`).join('')}
            </div>
          </div>
        ` : '';

        // Readability section
        const readabilityHTML = analysis.readability ? `
          <div class="tg-readability-section">
            <h4>📖 Readability</h4>
            <div class="tg-readability-info">
              <span class="tg-readability-value" style="color: ${analysis.readability.color}">${analysis.readability.score}/100</span>
              <span class="tg-readability-label">${analysis.readability.level}</span>
            </div>
            <p class="tg-readability-desc">${analysis.readability.description}</p>
          </div>
        ` : '';

        panel.innerHTML = `
      <div class="tg-panel-header">
        <div class="tg-panel-logo">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Terms Guard
        </div>
        <button class="tg-panel-close" id="tg-panel-close">✕</button>
      </div>
      <div class="tg-panel-body">
        ${verdictHTML}

        ${analysis.trustScore ? `
          <div class="tg-trust-section">
            <h4>🛡️ Trust Score</h4>
            <div class="tg-trust-gauge">
              <div class="tg-trust-score" style="color: ${analysis.trustScore.tierColor}">${analysis.trustScore.trustScore}</div>
              <div class="tg-trust-tier" style="background: ${analysis.trustScore.tierColor}22; color: ${analysis.trustScore.tierColor}">
                ${analysis.trustScore.tier} — ${analysis.trustScore.tierLabel}
              </div>
              <div class="tg-trust-confidence">Confidence: ${analysis.trustScore.confidenceLabel} (${Math.round(analysis.trustScore.confidence * 100)}%)</div>
            </div>
            <div class="tg-trust-factors">
              ${analysis.trustScore.factors.map(f => `
                <div class="tg-trust-factor">
                  <div class="tg-factor-label">${f.icon} ${f.name}</div>
                  <div class="tg-factor-bar-wrap">
                    <div class="tg-factor-bar" style="width: ${f.normalizedScore}%; background: ${f.normalizedScore >= 60 ? '#22c55e' : f.normalizedScore >= 40 ? '#f59e0b' : '#ef4444'}"></div>
                  </div>
                  <div class="tg-factor-score">${Math.round(f.normalizedScore)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${analysis.rightsLoss && analysis.rightsLoss.rights.length > 0 ? `
          <div class="tg-rights-section">
            <h4>⚠️ Rights at Risk <span class="tg-rights-count">${analysis.rightsLoss.criticalCount} critical</span></h4>
            <div class="tg-rights-list">
              ${analysis.rightsLoss.rights.slice(0, 6).map(r => `
                <div class="tg-right-item tg-right-${r.severity}">
                  <div class="tg-right-header">
                    <span class="tg-right-icon">${r.icon}</span>
                    <span class="tg-right-name">${r.right}</span>
                    <span class="tg-right-sev">${r.severity.toUpperCase()}</span>
                  </div>
                  <div class="tg-right-emotion">${r.emotionalText}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="tg-score-section">
          <div class="tg-score-circle" style="--score-color: ${analysis.grade.color}">
            <div class="tg-score-value">${analysis.riskScore}</div>
            <div class="tg-score-label">Risk Score</div>
          </div>
          <div class="tg-grade" style="color: ${analysis.grade.color}">
            ${analysis.grade.emoji} ${analysis.grade.label}
          </div>
          <div class="tg-total-risks">${analysis.totalRisksFound} risk patterns detected</div>
        </div>
        ${readabilityHTML}
        ${permissionsHTML}
        <div class="tg-summary-section">
          <h4>📝 Summary</h4>
          <div class="tg-summary-text">${summaryHTML}</div>
        </div>
        ${topRisks.length > 0 ? `
          <div class="tg-risks-section">
            <h4>🚩 Flagged Clauses</h4>
            ${risksHTML}
          </div>
          <div class="tg-ai-section">
            <div class="tg-ai-header">
              <h4>🤖 AI Simplified</h4>
              <button class="tg-ai-trigger" id="tg-ai-trigger">✨ Simplify with AI</button>
            </div>
            <div class="tg-ai-body" id="tg-ai-body">
              <div class="tg-ai-placeholder">Click the button above to get plain-English explanations of flagged clauses.</div>
            </div>
          </div>
        ` : ''}

        ${analysis.severityIntel && analysis.severityIntel.insights.length > 0 ? `
          <div class="tg-severity-section">
            <h4>🧠 Severity Intelligence</h4>
            <div class="tg-severity-stats">
              <div class="tg-sev-stat">
                <span class="tg-sev-stat-value" style="color: ${analysis.severityIntel.density.densityColor}">${analysis.severityIntel.density.overallDensity}</span>
                <span class="tg-sev-stat-label">Risks/1K Words</span>
              </div>
              <div class="tg-sev-stat">
                <span class="tg-sev-stat-value">${analysis.severityIntel.frequency.totalPatternMatches}</span>
                <span class="tg-sev-stat-label">Pattern Hits</span>
              </div>
              <div class="tg-sev-stat">
                <span class="tg-sev-stat-value">${analysis.severityIntel.spread.totalSections}</span>
                <span class="tg-sev-stat-label">Sections</span>
              </div>
            </div>
            <div class="tg-severity-insights">
              ${analysis.severityIntel.insights.map(ins => `
                <div class="tg-insight-item tg-insight-${ins.severity}">
                  <span class="tg-insight-icon">${ins.icon}</span>
                  <span class="tg-insight-text">${ins.text}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="tg-dark-patterns-results" id="tg-dp-results"></div>
      </div>
    `;

        document.body.appendChild(panel);

        // Animate in
        requestAnimationFrame(() => {
            panel.classList.add('tg-panel-visible');
        });

        document.getElementById('tg-panel-close').addEventListener('click', () => {
            panel.classList.remove('tg-panel-visible');
            setTimeout(() => panel.remove(), 300);
        });

        // AI Simplify button handler
        const aiTrigger = document.getElementById('tg-ai-trigger');
        const aiBody = document.getElementById('tg-ai-body');
        if (aiTrigger && aiBody) {
            aiTrigger.addEventListener('click', () => {
                triggerAISimplification(topRisks, aiBody, aiTrigger);
            });
        }
    }

    // =====================================================
    // 7b. AI SIMPLIFICATION TRIGGER
    // =====================================================

    function triggerAISimplification(risks, aiBody, aiTrigger) {
        // Disable button
        aiTrigger.disabled = true;
        aiTrigger.textContent = '⏳ Simplifying...';

        // Show skeleton loading
        const skeletonHTML = risks.slice(0, 8).map((_, i) => `
            <div class="tg-ai-card tg-ai-skeleton" style="animation-delay: ${i * 0.08}s">
                <div class="tg-skeleton-line tg-skeleton-title"></div>
                <div class="tg-skeleton-line tg-skeleton-long"></div>
                <div class="tg-skeleton-line tg-skeleton-medium"></div>
                <div class="tg-skeleton-line tg-skeleton-short"></div>
            </div>
        `).join('');
        aiBody.innerHTML = skeletonHTML;

        // Prepare clauses for the API
        const clauseData = risks.slice(0, 8).map(r => ({
            pattern: r.pattern,
            explanation: r.explanation,
            severity: r.severity,
            category: r.category || '',
            categoryLabel: r.categoryLabel,
            contexts: r.contexts || []
        }));

        // Check if extension context is valid
        if (!chrome.runtime?.id) {
            aiTrigger.textContent = '⚠️ Refresh Page';
            aiBody.innerHTML = '<div class="tg-ai-placeholder tg-ai-error">Extension updated. Please refresh the page.</div>';
            return;
        }

        // Send to background for AI simplification
        try {
            chrome.runtime.sendMessage(
                { type: 'SIMPLIFY_CLAUSES', clauses: clauseData },
                (response) => {
                    aiTrigger.textContent = '✨ Simplify with AI';
                    aiTrigger.disabled = false;

                    if (chrome.runtime.lastError) {
                        aiBody.innerHTML = '<div class="tg-ai-placeholder tg-ai-error">Failed to connect. Try again.</div>';
                        return;
                    }

                    if (!response || !response.success || !response.results) {
                        aiBody.innerHTML = `<div class="tg-ai-placeholder tg-ai-error">${response?.error || 'AI simplification failed. Please check your API key.'}</div>`;
                        return;
                    }

                    // Render results
                    const resultsHTML = response.results.map((result, i) => {
                        const sourceIcon = result.source === 'ai' ? '🤖' : result.source === 'cache' ? '💾' : '📋';
                        const sourceLabel = result.source === 'ai' ? 'AI' : result.source === 'cache' ? 'Cached' : 'Template';
                        const risk = risks[i];

                        return `
                        <div class="tg-ai-card" style="animation-delay: ${i * 0.06}s">
                            <div class="tg-ai-card-header">
                                <span class="tg-ai-clause-icon">${risk?.categoryIcon || '⚖️'}</span>
                                <span class="tg-ai-clause-pattern">"${risk?.pattern || result.clause || ''}"</span>
                                <span class="tg-ai-source" title="${sourceLabel}">${sourceIcon}</span>
                            </div>
                            <div class="tg-ai-row">
                                <span class="tg-ai-label">💬 Plain Meaning</span>
                                <p class="tg-ai-text">${result.plainMeaning}</p>
                            </div>
                            <div class="tg-ai-row">
                                <span class="tg-ai-label">⚠️ Risk</span>
                                <p class="tg-ai-text tg-ai-risk">${result.riskSummary}</p>
                            </div>
                            <div class="tg-ai-row">
                                <span class="tg-ai-label">👤 Impact on You</span>
                                <p class="tg-ai-text tg-ai-impact">${result.userImpact}</p>
                            </div>
                        </div>
                    `;
                    }).join('');

                    aiBody.innerHTML = resultsHTML;

                    // Update button to show done
                    aiTrigger.textContent = '✅ Simplified';
                    setTimeout(() => {
                        aiTrigger.textContent = '✨ Simplify with AI';
                    }, 2000);
                }
            );
        } catch (e) {
            console.warn('Terms Guard: Extension context invalidated');
            aiTrigger.textContent = '⚠️ Refresh Page';
            aiBody.innerHTML = '<div class="tg-ai-placeholder tg-ai-error">Extension context invalidated. Please refresh the page.</div>';
        }
    }

    // =====================================================
    // 8. MAIN SCAN FUNCTION
    // =====================================================

    function scanPage() {
        if (isScanning) return;
        isScanning = true;

        // Update FAB to show scanning
        const fabBtn = document.getElementById('tg-fab-btn');
        const fabLabel = document.getElementById('tg-fab-label');
        if (fabBtn) fabBtn.classList.add('tg-scanning');
        if (fabLabel) fabLabel.textContent = 'Scanning...';

        const extracted = extractTCText();
        if (!extracted || !extracted.text) {
            if (fabBtn) fabBtn.classList.remove('tg-scanning');
            if (fabLabel) fabLabel.textContent = 'No T&C found';
            setTimeout(() => {
                if (fabLabel) fabLabel.textContent = 'Scan T&C';
            }, 2000);
            isScanning = false;
            return;
        }

        // Check for valid extension context
        if (!chrome.runtime?.id) {
            if (fabBtn) fabBtn.classList.remove('tg-scanning');
            if (fabLabel) fabLabel.textContent = 'Refresh Page';
            isScanning = false;
            return;
        }

        // Send to background for analysis
        try {
            chrome.runtime.sendMessage(
                {
                    type: 'ANALYZE_TEXT',
                    text: extracted.text,
                    url: window.location.href
                },
                (response) => {
                    isScanning = false;

                    if (chrome.runtime.lastError) {
                        console.error('Terms Guard:', chrome.runtime.lastError);
                        if (fabBtn) fabBtn.classList.remove('tg-scanning');
                        if (fabLabel) fabLabel.textContent = 'Error';
                        return;
                    }

                    lastAnalysis = response;

                    // Update FAB
                    if (fabBtn) {
                        fabBtn.classList.remove('tg-scanning');
                        fabBtn.style.background = `linear-gradient(135deg, ${response.grade.color}, ${response.grade.color}dd)`;
                    }
                    if (fabLabel) fabLabel.textContent = `${response.grade.emoji} ${response.grade.label}`;

                    // Remove the banner if it's showing
                    const banner = document.getElementById('tg-banner');
                    if (banner) {
                        banner.classList.remove('tg-banner-visible');
                        setTimeout(() => banner.remove(), 400);
                    }

                    // Highlight risks on page
                    highlightRisks(response.risks, extracted.element);

                    // Add warnings to accept buttons
                    addAcceptButtonWarnings(response);

                    // Show results panel
                    showResultsPanel(response);

                    // Dark Pattern Detection — runs after analysis
                    if (typeof scanForDarkPatterns === 'function') {
                        try {
                            const darkPatterns = scanForDarkPatterns();
                            if (darkPatterns.length > 0) {
                                highlightDarkPatterns(darkPatterns);

                                // Send to background for trust score update
                                if (chrome.runtime?.id) {
                                    chrome.runtime.sendMessage({
                                        type: 'DARK_PATTERNS_FOUND',
                                        detections: darkPatterns.map(d => ({ type: d.type, label: d.label, severity: d.severity, description: d.description, context: d.context }))
                                    });
                                }

                                // Show dark pattern results in panel
                                const dpContainer = document.getElementById('tg-dp-results');
                                if (dpContainer) {
                                    dpContainer.innerHTML = `
                                    <div class="tg-dp-section">
                                        <h4>🕶️ Dark Patterns Detected <span class="tg-dp-count">${darkPatterns.length}</span></h4>
                                        <div class="tg-dp-list">
                                            ${darkPatterns.map(dp => `
                                                <div class="tg-dp-item tg-dp-sev-${dp.severity}">
                                                    <div class="tg-dp-item-header">
                                                        <span>${dp.icon}</span>
                                                        <span class="tg-dp-item-type">${dp.label}</span>
                                                        <span class="tg-dp-item-sev">${dp.severity.toUpperCase()}</span>
                                                    </div>
                                                    <div class="tg-dp-item-desc">${dp.description}</div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                `;
                                }
                            }
                        } catch (e) {
                            console.warn('Terms Guard: Dark pattern scan error', e);
                        }
                    }
                }
            );
        } catch (e) {
            console.warn('Terms Guard: Extension context invalidated');
            if (fabBtn) fabBtn.classList.remove('tg-scanning');
            if (fabLabel) fabLabel.textContent = 'Error';
            isScanning = false;
        }
    }

    // =====================================================
    // 9. LISTEN FOR MESSAGES FROM POPUP
    // =====================================================

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'SCAN_PAGE') {
            scanPage();
            sendResponse({ status: 'scanning' });
        }

        if (message.type === 'GET_PAGE_STATUS') {
            sendResponse({
                hasTC: detectTCContent(),
                lastAnalysis: lastAnalysis
            });
        }
    });

    // =====================================================
    // 10. INITIALIZATION
    // =====================================================

    function init() {
        // Always add the scan FAB
        createScanFAB();

        // Auto-detect T&C page and show banner
        if (detectTCContent()) {
            // Show the smart notification banner
            setTimeout(showAutoScanBanner, 1000);
            // Also auto-scan after a delay
            setTimeout(scanPage, 2500);
        }
    }

    // Wait for DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
