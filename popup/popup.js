// Terms Guard — Popup Script
// Manages the popup dashboard UI, communicates with background and content scripts

document.addEventListener('DOMContentLoaded', () => {
    const scanBtn = document.getElementById('scanBtn');
    const scanHint = document.getElementById('scanHint');
    const results = document.getElementById('results');
    const emptyState = document.getElementById('emptyState');
    const scoreNumber = document.getElementById('scoreNumber');
    const scoreGrade = document.getElementById('scoreGrade');
    const scoreCount = document.getElementById('scoreCount');
    const gaugeFill = document.getElementById('gaugeFill');
    const summaryBody = document.getElementById('summaryBody');
    const categoriesBody = document.getElementById('categoriesBody');
    const risksBody = document.getElementById('risksBody');
    const risksBadge = document.getElementById('risksBadge');
    const historySection = document.getElementById('historySection');
    const historyBody = document.getElementById('historyBody');
    const clearHistoryBtn = document.getElementById('clearHistory');
    const exportReportBtn = document.getElementById('exportReport');

    // New feature elements
    const verdictCard = document.getElementById('verdictCard');
    const verdictIcon = document.getElementById('verdictIcon');
    const verdictText = document.getElementById('verdictText');
    const verdictMeta = document.getElementById('verdictMeta');
    const readabilityScore = document.getElementById('readabilityScore');
    const readabilityLevel = document.getElementById('readabilityLevel');
    const readabilityDesc = document.getElementById('readabilityDesc');
    const readabilityStats = document.getElementById('readabilityStats');
    const permissionsSection = document.getElementById('permissionsSection');
    const permissionsBody = document.getElementById('permissionsBody');
    const permissionsBadge = document.getElementById('permissionsBadge');
    const comparisonBody = document.getElementById('comparisonBody');
    const tipsSection = document.getElementById('tipsSection');
    const tipsBody = document.getElementById('tipsBody');

    // AI Simplifier elements
    const aiSection = document.getElementById('aiSection');
    const aiBody = document.getElementById('aiBody');
    const aiSimplifyBtn = document.getElementById('aiSimplifyBtn');

    // Settings modal elements
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const modalClose = document.getElementById('modalClose');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const apiKeySave = document.getElementById('apiKeySave');
    const apiKeyStatus = document.getElementById('apiKeyStatus');

    // Trust Score elements
    const trustSection = document.getElementById('trustSection');
    const trustBody = document.getElementById('trustBody');
    const trustTierBadge = document.getElementById('trustTierBadge');

    // Rights at Risk elements
    const rightsSection = document.getElementById('rightsSection');
    const rightsBody = document.getElementById('rightsBody');
    const rightsBadge = document.getElementById('rightsBadge');

    // Severity Intelligence elements
    const severitySection = document.getElementById('severitySection');
    const severityBody = document.getElementById('severityBody');

    // Dark Patterns elements
    const darkPatternsSection = document.getElementById('darkPatternsSection');
    const dpBody = document.getElementById('dpBody');
    const dpBadge = document.getElementById('dpBadge');

    let currentAnalysis = null;

    // Try to load last analysis
    loadLastAnalysis();
    loadHistory();

    // =====================================================
    // SCAN BUTTON
    // =====================================================

    scanBtn.addEventListener('click', async () => {
        scanBtn.classList.add('scanning');
        scanBtn.querySelector('.scan-btn-text').textContent = 'Scanning...';
        scanHint.textContent = 'Analyzing page content for risky clauses...';

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab) {
                showError('No active tab found');
                return;
            }

            // Send message to content script to scan
            chrome.tabs.sendMessage(tab.id, { type: 'SCAN_PAGE' }, (response) => {
                if (chrome.runtime.lastError) {
                    showError('Could not connect to page. Try refreshing the page first.');
                    resetScanBtn();
                    return;
                }
            });

            // Wait briefly then fetch results from background
            setTimeout(() => {
                chrome.runtime.sendMessage({ type: 'GET_LAST_ANALYSIS' }, (analysis) => {
                    resetScanBtn();

                    if (analysis) {
                        displayResults(analysis);
                    } else {
                        scanHint.textContent = 'Scan complete. Results will appear shortly...';
                        pollForResults();
                    }
                });
            }, 2000);

        } catch (error) {
            showError('Failed to scan: ' + error.message);
            resetScanBtn();
        }
    });

    // =====================================================
    // POLL FOR RESULTS
    // =====================================================

    function pollForResults(attempts = 0) {
        if (attempts > 5) {
            scanHint.textContent = 'No Terms & Conditions detected on this page.';
            return;
        }

        setTimeout(() => {
            chrome.runtime.sendMessage({ type: 'GET_LAST_ANALYSIS' }, (analysis) => {
                if (analysis && analysis.timestamp) {
                    const analysisTime = new Date(analysis.timestamp).getTime();
                    const now = Date.now();
                    if (now - analysisTime < 10000) {
                        displayResults(analysis);
                        return;
                    }
                }
                pollForResults(attempts + 1);
            });
        }, 1000);
    }

    // =====================================================
    // DISPLAY RESULTS
    // =====================================================

    function displayResults(analysis) {
        currentAnalysis = analysis;
        emptyState.style.display = 'none';
        results.style.display = 'block';
        exportReportBtn.style.display = 'flex';

        // 1. Quick Verdict
        displayVerdict(analysis.verdict);

        // 2. Animate score
        animateScore(analysis.riskScore, analysis.grade);

        // 3. Readability
        displayReadability(analysis.readability);

        // 4. Permissions
        displayPermissions(analysis.permissions);

        // 5. Industry Comparison
        displayComparison(analysis.industryComparison);

        // 6. Summary
        displaySummary(analysis.summary);

        // 7. Categories
        displayCategories(analysis.categoryScores);

        // 8. Risks
        displayRisks(analysis.risks);

        // 9. AI Simplified section
        displayAISection(analysis.risks);

        // 9a. Trust Score
        displayTrustScore(analysis.trustScore);

        // 9b. Rights at Risk
        displayRightsLoss(analysis.rightsLoss);

        // 9c. Severity Intelligence
        displaySeverityIntel(analysis.severityIntel);

        // 9d. Dark Patterns (load from storage)
        loadDarkPatterns();

        // 10. Tips
        displayTips(analysis.recommendations);

        // Update history
        loadHistory();
    }

    // =====================================================
    // QUICK VERDICT
    // =====================================================

    function displayVerdict(verdict) {
        if (!verdict) return;

        verdictIcon.textContent = verdict.icon;
        verdictText.textContent = verdict.text;
        verdictMeta.textContent = `${verdict.totalRisks} risk${verdict.totalRisks !== 1 ? 's' : ''} found • ${verdict.gradeLabel}`;
        verdictMeta.style.color = verdict.gradeColor;

        // Set card border glow based on grade
        verdictCard.style.borderColor = verdict.gradeColor + '40';
        verdictCard.style.boxShadow = `0 4px 20px ${verdict.gradeColor}15, inset 0 0 30px ${verdict.gradeColor}08`;
    }

    // =====================================================
    // SCORE ANIMATION
    // =====================================================

    function animateScore(score, grade) {
        let current = 0;
        const increment = Math.max(1, Math.floor(score / 30));
        const timer = setInterval(() => {
            current = Math.min(current + increment, score);
            scoreNumber.textContent = current;
            if (current >= score) {
                scoreNumber.textContent = score;
                clearInterval(timer);
            }
        }, 40);

        const circumference = 2 * Math.PI * 52;
        const offset = circumference - (score / 100) * circumference;
        gaugeFill.style.stroke = grade.color;
        gaugeFill.style.strokeDasharray = circumference;
        setTimeout(() => {
            gaugeFill.style.strokeDashoffset = offset;
        }, 100);

        scoreGrade.textContent = `${grade.emoji} ${grade.label}`;
        scoreGrade.style.color = grade.color;
        scoreCount.textContent = `Risk Score: ${score}/100`;
    }

    // =====================================================
    // READABILITY SCORE
    // =====================================================

    function displayReadability(readability) {
        if (!readability) return;

        readabilityScore.textContent = readability.score;
        readabilityScore.style.color = readability.color;
        readabilityLevel.textContent = readability.level;
        readabilityLevel.style.color = readability.color;
        readabilityDesc.textContent = readability.description;

        const stats = readability.stats;
        readabilityStats.innerHTML = `
            <div class="stat-row">
                <span class="stat-label">Words</span>
                <span class="stat-value">${stats.words.toLocaleString()}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Sentences</span>
                <span class="stat-value">${stats.sentences.toLocaleString()}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Avg words/sentence</span>
                <span class="stat-value">${stats.avgWordsPerSentence}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Avg syllables/word</span>
                <span class="stat-value">${stats.avgSyllablesPerWord}</span>
            </div>
        `;
    }

    // =====================================================
    // PERMISSION DETECTOR
    // =====================================================

    function displayPermissions(permissions) {
        if (!permissions || permissions.length === 0) {
            permissionsSection.style.display = 'none';
            return;
        }

        permissionsSection.style.display = 'block';
        permissionsBadge.textContent = permissions.length;

        const html = `<div class="permissions-grid">${permissions.map((perm, i) => `
                <div class="permission-badge" style="animation-delay: ${i * 0.06}s">
                    <span class="permission-icon">${perm.icon}</span>
                    <span class="permission-label">${perm.label}</span>
                </div>
            `).join('')
            }</div>`;

        permissionsBody.innerHTML = html;
    }

    // =====================================================
    // INDUSTRY COMPARISON
    // =====================================================

    function displayComparison(comparison) {
        if (!comparison) return;

        const siteBarWidth = Math.min(100, comparison.siteScore);
        const avgBarWidth = Math.min(100, comparison.industryAvg);
        const comparisonColor = comparison.comparison === 'better' ? '#22c55e' :
            comparison.comparison === 'similar' ? '#f59e0b' : '#ef4444';
        const comparisonIcon = comparison.comparison === 'better' ? '✅' :
            comparison.comparison === 'similar' ? '➡️' : '⚠️';

        comparisonBody.innerHTML = `
            <div class="comparison-header">
                <span>${comparison.icon} ${comparison.industry}</span>
                <span class="comparison-verdict" style="color: ${comparisonColor}">${comparisonIcon} ${comparison.comparison === 'better' ? 'Better' : comparison.comparison === 'similar' ? 'Similar' : 'Worse'}</span>
            </div>
            <div class="comparison-bars">
                <div class="comparison-row">
                    <span class="comparison-label">This site</span>
                    <div class="comparison-bar-wrapper">
                        <div class="comparison-bar comparison-bar-site" style="width: ${siteBarWidth}%; background: ${comparisonColor};"></div>
                    </div>
                    <span class="comparison-value">${comparison.siteScore}</span>
                </div>
                <div class="comparison-row">
                    <span class="comparison-label">Avg ${comparison.industry}</span>
                    <div class="comparison-bar-wrapper">
                        <div class="comparison-bar comparison-bar-avg" style="width: ${avgBarWidth}%; background: #6b6890;"></div>
                    </div>
                    <span class="comparison-value">${comparison.industryAvg}</span>
                </div>
            </div>
            <div class="comparison-text">${comparison.comparisonText}</div>
        `;
    }

    // =====================================================
    // SUMMARY
    // =====================================================

    function displaySummary(summary) {
        if (!summary || summary.length === 0) {
            summaryBody.innerHTML = '<p class="summary-text">No summary available.</p>';
            return;
        }

        const html = summary.map(line => {
            if (!line) return '';
            return `<p class="summary-text">${line}</p>`;
        }).join('');

        summaryBody.innerHTML = html;
    }

    // =====================================================
    // CATEGORIES
    // =====================================================

    function displayCategories(categories) {
        const activeCategories = Object.entries(categories)
            .filter(([, cat]) => cat.hits > 0)
            .sort(([, a], [, b]) => b.severity - a.severity);

        if (activeCategories.length === 0) {
            categoriesBody.innerHTML = '<p class="summary-text">No risk categories triggered.</p>';
            return;
        }

        const html = activeCategories.map(([key, cat]) => {
            const pct = Math.round((cat.severity / cat.maxSeverity) * 100);
            return `
        <div class="category-item">
          <span class="category-icon">${cat.icon}</span>
          <div class="category-info">
            <div class="category-name">${cat.label}</div>
            <div class="category-bar-wrapper">
              <div class="category-bar" style="width: ${pct}%; background: ${cat.color};"></div>
            </div>
          </div>
          <span class="category-hits">${cat.hits} hit${cat.hits !== 1 ? 's' : ''}</span>
        </div>
      `;
        }).join('');

        categoriesBody.innerHTML = html;
    }

    // =====================================================
    // RISKS
    // =====================================================

    function displayRisks(risks) {
        const topRisks = risks.slice(0, 10);
        risksBadge.textContent = risks.length;

        if (topRisks.length === 0) {
            risksBody.innerHTML = '<p class="summary-text">No specific risk patterns detected.</p>';
            return;
        }

        const html = topRisks.map((risk, i) => {
            const severityClass = risk.severity >= 8 ? 'severity-high'
                : risk.severity >= 5 ? 'severity-medium'
                    : 'severity-low';

            return `
        <div class="risk-item" style="animation-delay: ${i * 0.05}s">
          <div class="risk-item-header">
            <span class="risk-item-icon">${risk.categoryIcon}</span>
            <span class="risk-item-pattern">"${escapeHtml(risk.pattern)}"</span>
            <span class="risk-item-severity ${severityClass}">${risk.severity}/10</span>
          </div>
          <div class="risk-item-explain">${escapeHtml(risk.explanation)}</div>
        </div>
      `;
        }).join('');

        risksBody.innerHTML = html;
    }

    // =====================================================
    // PRIVACY TIPS
    // =====================================================

    function displayTips(recommendations) {
        if (!recommendations || recommendations.length === 0) {
            tipsSection.style.display = 'none';
            return;
        }

        tipsSection.style.display = 'block';

        const html = recommendations.map((rec, i) => `
            <div class="tip-item" style="animation-delay: ${i * 0.06}s">
                <span class="tip-icon">${rec.icon}</span>
                <span class="tip-text">${escapeHtml(rec.tip)}</span>
            </div>
        `).join('');

        tipsBody.innerHTML = html;
    }

    // =====================================================
    // AI SIMPLIFIED SECTION
    // =====================================================

    function displayAISection(risks) {
        if (!risks || risks.length === 0) {
            aiSection.style.display = 'none';
            return;
        }

        aiSection.style.display = 'block';
        aiBody.innerHTML = '<div class="ai-placeholder">Click ✨ Simplify to get plain-English explanations</div>';

        // Remove old listener and add new one
        const newBtn = aiSimplifyBtn.cloneNode(true);
        aiSimplifyBtn.parentNode.replaceChild(newBtn, aiSimplifyBtn);

        newBtn.addEventListener('click', () => {
            runAISimplification(risks, aiBody, newBtn);
        });
    }

    function runAISimplification(risks, container, btn) {
        btn.disabled = true;
        btn.textContent = '⏳ Working...';

        // Show skeleton loading
        const topRisks = risks.slice(0, 8);
        container.innerHTML = topRisks.map((_, i) => `
            <div class="ai-card ai-skeleton" style="animation-delay: ${i * 0.06}s">
                <div class="skeleton-line skeleton-title"></div>
                <div class="skeleton-line skeleton-long"></div>
                <div class="skeleton-line skeleton-medium"></div>
                <div class="skeleton-line skeleton-short"></div>
            </div>
        `).join('');

        const clauseData = topRisks.map(r => ({
            pattern: r.pattern,
            explanation: r.explanation,
            severity: r.severity,
            category: r.category || '',
            categoryLabel: r.categoryLabel || '',
            contexts: r.contexts || []
        }));

        chrome.runtime.sendMessage(
            { type: 'SIMPLIFY_CLAUSES', clauses: clauseData },
            (response) => {
                btn.textContent = '✨ Simplify';
                btn.disabled = false;

                if (chrome.runtime.lastError) {
                    container.innerHTML = '<div class="ai-placeholder ai-error">Connection failed. Try again.</div>';
                    return;
                }

                if (!response || !response.success || !response.results) {
                    container.innerHTML = `<div class="ai-placeholder ai-error">${response?.error || 'Failed. Set your API key in ⚙ Settings.'}</div>`;
                    return;
                }

                const html = response.results.map((result, i) => {
                    const risk = topRisks[i];
                    const sourceIcon = result.source === 'ai' ? '🤖' : result.source === 'cache' ? '💾' : '📋';
                    const sourceLabel = result.source === 'ai' ? 'AI Generated' : result.source === 'cache' ? 'Cached' : 'Template';

                    return `
                        <div class="ai-card" style="animation-delay: ${i * 0.06}s">
                            <div class="ai-card-header">
                                <span class="ai-clause-icon">${risk?.categoryIcon || '⚖️'}</span>
                                <span class="ai-clause-text">"${escapeHtml(risk?.pattern || result.clause || '')}"</span>
                                <span class="ai-source" title="${sourceLabel}">${sourceIcon}</span>
                            </div>
                            <div class="ai-row">
                                <span class="ai-label">💬 Plain Meaning</span>
                                <p class="ai-text">${escapeHtml(result.plainMeaning)}</p>
                            </div>
                            <div class="ai-row">
                                <span class="ai-label">⚠️ Risk</span>
                                <p class="ai-text ai-risk-text">${escapeHtml(result.riskSummary)}</p>
                            </div>
                            <div class="ai-row">
                                <span class="ai-label">👤 Impact on You</span>
                                <p class="ai-text ai-impact-text">${escapeHtml(result.userImpact)}</p>
                            </div>
                        </div>
                    `;
                }).join('');

                container.innerHTML = html;
                btn.textContent = '✅ Done';
                setTimeout(() => { btn.textContent = '✨ Simplify'; }, 2000);
            }
        );
    }

    // =====================================================
    // TRUST SCORE SECTION
    // =====================================================

    function displayTrustScore(trustData) {
        if (!trustData || !trustSection) return;

        trustSection.style.display = 'block';
        if (trustTierBadge) {
            trustTierBadge.style.background = trustData.tierColor + '22';
            trustTierBadge.style.color = trustData.tierColor;
            trustTierBadge.textContent = `${trustData.tier} — ${trustData.tierLabel}`;
        }

        const factorsHTML = trustData.factors.map(f => `
            <div class="popup-trust-factor">
                <div class="popup-factor-label">${f.icon} ${f.name}</div>
                <div class="popup-factor-bar-wrap">
                    <div class="popup-factor-bar" style="width: ${f.normalizedScore}%; background: ${f.normalizedScore >= 60 ? '#22c55e' : f.normalizedScore >= 40 ? '#f59e0b' : '#ef4444'}"></div>
                </div>
                <div class="popup-factor-score">${Math.round(f.normalizedScore)}</div>
            </div>
        `).join('');

        trustBody.innerHTML = `
            <div class="popup-trust-gauge">
                <div class="popup-trust-score" style="color: ${trustData.tierColor}">${trustData.trustScore}</div>
                <div class="popup-trust-label">${trustData.tierDescription}</div>
                <div class="popup-trust-confidence">Confidence: ${trustData.confidenceLabel} (${Math.round(trustData.confidence * 100)}%)</div>
            </div>
            <div class="popup-trust-factors">${factorsHTML}</div>
        `;
    }

    // =====================================================
    // RIGHTS AT RISK SECTION
    // =====================================================

    function displayRightsLoss(rightsData) {
        if (!rightsData || !rightsData.rights || rightsData.rights.length === 0 || !rightsSection) return;

        rightsSection.style.display = 'block';
        if (rightsBadge) {
            rightsBadge.textContent = rightsData.criticalCount + ' critical';
            rightsBadge.style.background = 'rgba(239,68,68,0.15)';
            rightsBadge.style.color = '#ef4444';
        }

        const html = rightsData.rights.slice(0, 6).map((r, i) => `
            <div class="popup-right-item popup-right-${r.severity}" style="animation-delay: ${i * 0.06}s">
                <div class="popup-right-header">
                    <span class="popup-right-icon">${r.icon}</span>
                    <span class="popup-right-name">${escapeHtml(r.right)}</span>
                    <span class="popup-right-sev popup-sev-${r.severity}">${r.severity.toUpperCase()}</span>
                </div>
                <div class="popup-right-emotion">${escapeHtml(r.emotionalText)}</div>
            </div>
        `).join('');

        rightsBody.innerHTML = html;
    }

    // =====================================================
    // SEVERITY INTELLIGENCE SECTION
    // =====================================================

    function displaySeverityIntel(severityData) {
        if (!severityData || !severitySection) return;
        if (!severityData.insights || severityData.insights.length === 0) return;

        severitySection.style.display = 'block';

        const statsHTML = `
            <div class="popup-sev-stats">
                <div class="popup-sev-stat">
                    <span class="popup-sev-stat-value" style="color: ${severityData.density.densityColor}">${severityData.density.overallDensity}</span>
                    <span class="popup-sev-stat-label">Risks/1K Words</span>
                </div>
                <div class="popup-sev-stat">
                    <span class="popup-sev-stat-value">${severityData.frequency.totalPatternMatches}</span>
                    <span class="popup-sev-stat-label">Pattern Hits</span>
                </div>
                <div class="popup-sev-stat">
                    <span class="popup-sev-stat-value">${severityData.spread.totalSections}</span>
                    <span class="popup-sev-stat-label">Sections</span>
                </div>
            </div>
        `;

        const insightsHTML = severityData.insights.map(ins => `
            <div class="popup-insight-item popup-insight-${ins.severity}">
                <span class="popup-insight-icon">${ins.icon}</span>
                <span class="popup-insight-text">${escapeHtml(ins.text)}</span>
            </div>
        `).join('');

        severityBody.innerHTML = statsHTML + insightsHTML;
    }

    // =====================================================
    // DARK PATTERNS SECTION
    // =====================================================

    function loadDarkPatterns() {
        if (!darkPatternsSection) return;

        chrome.storage.local.get(['lastDarkPatterns'], (data) => {
            const detections = data.lastDarkPatterns || [];
            if (detections.length === 0) {
                darkPatternsSection.style.display = 'none';
                return;
            }

            darkPatternsSection.style.display = 'block';
            if (dpBadge) dpBadge.textContent = detections.length;

            const html = detections.map((dp, i) => `
                <div class="popup-dp-item popup-dp-sev-${dp.severity}" style="animation-delay: ${i * 0.06}s">
                    <div class="popup-dp-header">
                        <span class="popup-dp-type">${dp.label}</span>
                        <span class="popup-dp-sev">${dp.severity.toUpperCase()}</span>
                    </div>
                    <div class="popup-dp-desc">${escapeHtml(dp.description)}</div>
                </div>
            `).join('');

            dpBody.innerHTML = html;
        });
    }

    // =====================================================
    // SETTINGS MODAL (API KEY)
    // =====================================================

    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'flex';
        // Check if key exists
        chrome.runtime.sendMessage({ type: 'GET_API_KEY' }, (response) => {
            if (response && response.hasKey) {
                apiKeyStatus.textContent = `✅ Key saved (${response.maskedKey})`;
                apiKeyStatus.style.color = '#22c55e';
            } else {
                apiKeyStatus.textContent = 'No API key set';
                apiKeyStatus.style.color = '#6b6890';
            }
        });
    });

    modalClose.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) settingsModal.style.display = 'none';
    });

    apiKeySave.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (!key) {
            apiKeyStatus.textContent = '⚠️ Please enter a valid API key';
            apiKeyStatus.style.color = '#f59e0b';
            return;
        }

        apiKeySave.textContent = 'Saving...';
        chrome.runtime.sendMessage({ type: 'SET_API_KEY', apiKey: key }, (response) => {
            if (response && response.success) {
                apiKeyStatus.textContent = '✅ API key saved successfully!';
                apiKeyStatus.style.color = '#22c55e';
                apiKeyInput.value = '';
                apiKeySave.textContent = 'Save Key';
                setTimeout(() => { settingsModal.style.display = 'none'; }, 1000);
            } else {
                apiKeyStatus.textContent = '❌ Failed to save key';
                apiKeyStatus.style.color = '#ef4444';
                apiKeySave.textContent = 'Save Key';
            }
        });
    });

    // =====================================================
    // EXPORT REPORT
    // =====================================================

    exportReportBtn.addEventListener('click', () => {
        if (!currentAnalysis) return;

        const a = currentAnalysis;
        let report = '';
        report += '═══════════════════════════════════════════\n';
        report += '      TERMS GUARD — RISK SCAN REPORT\n';
        report += '═══════════════════════════════════════════\n\n';
        report += `📅 Date: ${new Date(a.timestamp).toLocaleString()}\n`;
        report += `🌐 URL: ${a.url}\n\n`;

        // Verdict
        if (a.verdict) {
            report += `── VERDICT ──────────────────────────────\n`;
            report += `${a.verdict.icon} ${a.verdict.text}\n\n`;
        }

        // Score
        report += `── RISK SCORE ──────────────────────────\n`;
        report += `${a.grade.emoji} Score: ${a.riskScore}/100 — ${a.grade.label}\n`;
        report += `Total risks found: ${a.totalRisksFound}\n\n`;

        // Readability
        if (a.readability) {
            report += `── READABILITY ─────────────────────────\n`;
            report += `Score: ${a.readability.score}/100 (${a.readability.level})\n`;
            report += `${a.readability.description}\n`;
            report += `Words: ${a.readability.stats.words} | Sentences: ${a.readability.stats.sentences}\n\n`;
        }

        // Permissions
        if (a.permissions && a.permissions.length > 0) {
            report += `── PERMISSIONS DETECTED ────────────────\n`;
            a.permissions.forEach(p => {
                report += `${p.icon} ${p.label}\n`;
            });
            report += '\n';
        }

        // Industry Comparison
        if (a.industryComparison) {
            report += `── INDUSTRY COMPARISON ─────────────────\n`;
            report += `${a.industryComparison.icon} ${a.industryComparison.industry}\n`;
            report += `This site: ${a.industryComparison.siteScore} | Industry avg: ${a.industryComparison.industryAvg}\n`;
            report += `${a.industryComparison.comparisonText}\n\n`;
        }

        // Summary
        if (a.summary && a.summary.length > 0) {
            report += `── SUMMARY ─────────────────────────────\n`;
            a.summary.forEach(line => {
                if (line) report += `${line}\n`;
            });
            report += '\n';
        }

        // Flagged Clauses
        if (a.risks && a.risks.length > 0) {
            report += `── FLAGGED CLAUSES ─────────────────────\n`;
            a.risks.forEach((risk, i) => {
                report += `${i + 1}. [${risk.severity}/10] "${risk.pattern}"\n`;
                report += `   ${risk.categoryIcon} ${risk.categoryLabel}: ${risk.explanation}\n`;
            });
            report += '\n';
        }

        // Recommendations
        if (a.recommendations && a.recommendations.length > 0) {
            report += `── PRIVACY TIPS ────────────────────────\n`;
            a.recommendations.forEach(rec => {
                report += `${rec.icon} ${rec.tip}\n`;
            });
            report += '\n';
        }

        report += '═══════════════════════════════════════════\n';
        report += 'Generated by Terms Guard — T&C Risk Scanner\n';
        report += '═══════════════════════════════════════════\n';

        // Download as text file
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const domain = a.url ? new URL(a.url).hostname : 'scan';
        link.download = `terms-guard-report-${domain}.txt`;
        link.click();
        URL.revokeObjectURL(url);

        showToast('Report downloaded!');
    });

    // =====================================================
    // LOAD LAST ANALYSIS
    // =====================================================

    function loadLastAnalysis() {
        chrome.runtime.sendMessage({ type: 'GET_LAST_ANALYSIS' }, (analysis) => {
            if (analysis && analysis.riskScore !== undefined) {
                displayResults(analysis);
            }
        });
    }

    // =====================================================
    // HISTORY
    // =====================================================

    function loadHistory() {
        chrome.runtime.sendMessage({ type: 'GET_HISTORY' }, (history) => {
            if (!history || history.length === 0) {
                historySection.style.display = 'none';
                return;
            }

            historySection.style.display = 'block';

            const html = history.slice(0, 5).map(item => {
                const url = new URL(item.url);
                const domain = url.hostname;
                const timeAgo = getTimeAgo(new Date(item.timestamp));

                return `
          <div class="history-item">
            <span class="history-grade">${item.grade?.emoji || '—'}</span>
            <div class="history-info">
              <div class="history-url">${escapeHtml(domain)}</div>
              <div class="history-meta">${timeAgo} • ${item.totalRisks} risk${item.totalRisks !== 1 ? 's' : ''}</div>
            </div>
            <span class="history-score" style="color: ${item.grade?.color || '#6b6890'}">${item.riskScore}</span>
          </div>
        `;
            }).join('');

            historyBody.innerHTML = html;
        });
    }

    // Clear history
    clearHistoryBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ type: 'CLEAR_HISTORY' }, () => {
            historySection.style.display = 'none';
            showToast('History cleared');
        });
    });

    // =====================================================
    // HELPERS
    // =====================================================

    function resetScanBtn() {
        scanBtn.classList.remove('scanning');
        scanBtn.querySelector('.scan-btn-text').textContent = 'Scan This Page';
        scanHint.textContent = 'Click to analyze Terms & Conditions on the current page';
    }

    function showError(message) {
        scanHint.textContent = message;
        scanHint.style.color = '#fca5a5';
        setTimeout(() => {
            scanHint.style.color = '';
            resetScanBtn();
        }, 3000);
    }

    function showToast(message) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('visible'));
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    function getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        return date.toLocaleDateString();
    }
});
