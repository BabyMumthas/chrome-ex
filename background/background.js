// Terms Guard — Background Service Worker
// Handles risk analysis when messages come from content script or popup

// Import all modules — risk patterns, AI simplifier, severity engine, trust score, rights map
try {
    importScripts('../utils/risk-patterns.js', 'ai-simplifier.js', 'severity-engine.js', 'trust-score.js', '../utils/rights-map.js');
} catch (e) {
    // Fallback: fetch and evaluate scripts if importScripts fails
    const scripts = ['utils/risk-patterns.js', 'background/ai-simplifier.js', 'background/severity-engine.js', 'background/trust-score.js', 'utils/rights-map.js'];
    scripts.forEach(script => {
        fetch(chrome.runtime.getURL(script))
            .then(r => r.text())
            .then(code => new Function(code)())
            .catch(err => console.error('Terms Guard: Failed to load ' + script, err));
    });
}

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'ANALYZE_TEXT') {
        const result = analyzeText(message.text, message.url);
        // Save to storage
        saveAnalysis(message.url, result);
        sendResponse(result);
    }

    if (message.type === 'GET_LAST_ANALYSIS') {
        chrome.storage.local.get(['lastAnalysis'], (data) => {
            sendResponse(data.lastAnalysis || null);
        });
        return true; // keeps channel open for async response
    }

    if (message.type === 'GET_HISTORY') {
        chrome.storage.local.get(['scanHistory'], (data) => {
            sendResponse(data.scanHistory || []);
        });
        return true;
    }

    if (message.type === 'CLEAR_HISTORY') {
        chrome.storage.local.set({ scanHistory: [] }, () => {
            sendResponse({ success: true });
        });
        return true;
    }

    // AI Clause Simplifier handlers
    if (message.type === 'SIMPLIFY_CLAUSES') {
        simplifyClausesWithAI(message.clauses)
            .then(results => sendResponse({ success: true, results }))
            .catch(err => sendResponse({ success: false, error: err.message }));
        return true;
    }

    if (message.type === 'SET_API_KEY') {
        setStoredApiKey(message.apiKey).then(() => {
            sendResponse({ success: true });
        });
        return true;
    }

    if (message.type === 'GET_API_KEY') {
        getStoredApiKey().then(key => {
            sendResponse({ hasKey: !!key, maskedKey: key ? '••••' + key.slice(-4) : null });
        });
        return true;
    }

    // Dark Pattern results handler — stores and refreshes trust score
    if (message.type === 'DARK_PATTERNS_FOUND') {
        // Store dark pattern count for trust score recalculation
        chrome.storage.local.set({ lastDarkPatterns: message.detections || [] });
        sendResponse({ success: true });
        return true;
    }

    return true; // keeps channel open
});

/**
 * Main analysis function — scans text for risky patterns
 */
function analyzeText(text, url) {
    const lowerText = text.toLowerCase();
    const foundRisks = [];
    const categoryScores = {};
    let totalSeverity = 0;
    let maxPossibleSeverity = 0;

    // Scan each category
    for (const [categoryKey, category] of Object.entries(RISK_PATTERNS)) {
        let categoryHits = 0;
        let categorySeverity = 0;

        for (const pattern of category.patterns) {
            maxPossibleSeverity += pattern.severity;
            const regex = new RegExp(escapeRegex(pattern.text), 'gi');
            const matches = lowerText.match(regex);

            if (matches) {
                categoryHits += matches.length;
                categorySeverity += pattern.severity;
                totalSeverity += pattern.severity;

                // Find the context (surrounding sentence)
                const contextSnippets = findContext(text, pattern.text);

                foundRisks.push({
                    category: categoryKey,
                    categoryLabel: category.label,
                    categoryIcon: category.icon,
                    categoryColor: category.color,
                    pattern: pattern.text,
                    severity: pattern.severity,
                    explanation: pattern.explanation,
                    occurrences: matches.length,
                    contexts: contextSnippets
                });
            }
        }

        categoryScores[categoryKey] = {
            label: category.label,
            icon: category.icon,
            color: category.color,
            hits: categoryHits,
            severity: categorySeverity,
            maxSeverity: category.patterns.reduce((sum, p) => sum + p.severity, 0)
        };
    }

    // Calculate overall risk score (0-100)
    const riskScore = Math.min(100, Math.round((totalSeverity / Math.max(maxPossibleSeverity * 0.3, 1)) * 100));

    // Determine risk grade
    const grade = getGrade(riskScore);

    // Generate plain-English summary
    const summary = generateSummary(foundRisks, categoryScores, grade);

    // Sort risks by severity (highest first)
    foundRisks.sort((a, b) => b.severity - a.severity);

    // ===== NEW FEATURES =====

    // 1. Quick Verdict
    const verdict = generateVerdict(grade, foundRisks);

    // 2. Readability Score
    const readability = calculateReadability(text);

    // 3. Permission Detection
    const permissions = detectPermissions(lowerText);

    // 4. Recommendations
    const recommendations = generateRecommendations(foundRisks, categoryScores);

    // 5. Industry Comparison
    const industryComparison = getIndustryComparison(url, riskScore);

    // ===== SEVERITY INTELLIGENCE ENGINE =====
    const frequency = analyzeClauseFrequency(foundRisks);
    const density = calculateRiskDensity(text, foundRisks);
    const spread = detectSectionSpread(text, foundRisks);
    const severityInsights = generateSeverityInsights(frequency, density, spread);

    const severityIntel = { frequency, density, spread, insights: severityInsights };

    // ===== RIGHTS LOSS GENERATOR =====
    const rightsLoss = generateRightsLoss(categoryScores);

    // ===== EXPLAINABLE TRUST SCORE =====
    const industryDelta = industryComparison ? (riskScore - (industryComparison.industryAvg || 50)) : 0;
    const trustScore = calculateTrustScore({
        riskScore,
        permissionCount: permissions?.length || 0,
        darkPatternCount: 0, // updated when content script sends dark pattern results
        readabilityScore: readability?.score || 50,
        industryDelta
    }, text.length);

    return {
        riskScore,
        grade,
        summary,
        risks: foundRisks,
        categoryScores,
        totalRisksFound: foundRisks.length,
        url: url || '',
        timestamp: new Date().toISOString(),
        // Existing features
        verdict,
        readability,
        permissions,
        recommendations,
        industryComparison,
        // New features
        severityIntel,
        rightsLoss,
        trustScore
    };
}

/**
 * Generate a quick one-line verdict
 */
function generateVerdict(grade, risks) {
    const templates = VERDICT_TEMPLATES[grade.key] || VERDICT_TEMPLATES.MODERATE;
    const randomIndex = Math.floor(Math.random() * templates.length);
    const verdictText = templates[randomIndex];

    const thumbsIcon = (grade.key === 'SAFE' || grade.key === 'LOW') ? '👍' :
        grade.key === 'MODERATE' ? '🤔' : '👎';

    return {
        icon: thumbsIcon,
        text: verdictText,
        totalRisks: risks.length,
        gradeLabel: grade.label,
        gradeColor: grade.color
    };
}

/**
 * Calculate Flesch Reading Ease score
 * Higher = easier to read (90-100 = very easy, 0-30 = very hard)
 */
function calculateReadability(text) {
    // Clean the text
    const cleanText = text.replace(/[^a-zA-Z0-9\s.!?]/g, ' ').replace(/\s+/g, ' ').trim();

    // Count sentences
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const sentenceCount = Math.max(sentences.length, 1);

    // Count words
    const words = cleanText.split(/\s+/).filter(w => w.length > 0);
    const wordCount = Math.max(words.length, 1);

    // Count syllables (approximate)
    let syllableCount = 0;
    for (const word of words) {
        syllableCount += countSyllables(word);
    }
    syllableCount = Math.max(syllableCount, 1);

    // Flesch Reading Ease Formula
    const score = 206.835 - (1.015 * (wordCount / sentenceCount)) - (84.6 * (syllableCount / wordCount));
    const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

    // Determine readability level
    let level, color, description;
    if (clampedScore >= 80) {
        level = 'Easy'; color = '#22c55e';
        description = 'Simple language that most people can understand easily.';
    } else if (clampedScore >= 60) {
        level = 'Moderate'; color = '#84cc16';
        description = 'Standard language, readable by most adults.';
    } else if (clampedScore >= 40) {
        level = 'Difficult'; color = '#f59e0b';
        description = 'Complex legal language — may be intentionally hard to understand.';
    } else if (clampedScore >= 20) {
        level = 'Very Hard'; color = '#f97316';
        description = 'Dense legal jargon — designed for lawyers, not regular users.';
    } else {
        level = 'Extremely Hard'; color = '#ef4444';
        description = 'Nearly impenetrable language — a red flag in itself.';
    }

    return {
        score: clampedScore,
        level,
        color,
        description,
        stats: {
            words: wordCount,
            sentences: sentenceCount,
            avgWordsPerSentence: Math.round(wordCount / sentenceCount),
            avgSyllablesPerWord: (syllableCount / wordCount).toFixed(1)
        }
    };
}

/**
 * Count syllables in a word (approximation)
 */
function countSyllables(word) {
    word = word.toLowerCase().trim();
    if (word.length <= 3) return 1;

    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');

    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
}

/**
 * Detect permissions the T&C claims
 */
function detectPermissions(lowerText) {
    const detectedPermissions = [];

    for (const [key, perm] of Object.entries(PERMISSION_PATTERNS)) {
        let found = false;
        for (const pattern of perm.patterns) {
            if (lowerText.includes(pattern.toLowerCase())) {
                found = true;
                break;
            }
        }
        if (found) {
            detectedPermissions.push({
                key,
                icon: perm.icon,
                label: perm.label
            });
        }
    }

    return detectedPermissions;
}

/**
 * Generate actionable recommendations based on detected risks
 */
function generateRecommendations(risks, categoryScores) {
    const tips = [];
    const seenCategories = new Set();

    // Get active categories sorted by severity
    const activeCategories = Object.entries(categoryScores)
        .filter(([, cat]) => cat.hits > 0)
        .sort(([, a], [, b]) => b.severity - a.severity);

    for (const [catKey] of activeCategories) {
        if (seenCategories.has(catKey)) continue;
        seenCategories.add(catKey);

        const catRecommendations = RECOMMENDATIONS[catKey];
        if (catRecommendations && catRecommendations.length > 0) {
            // Pick 1-2 recommendations per category
            const count = Math.min(2, catRecommendations.length);
            for (let i = 0; i < count; i++) {
                tips.push({
                    category: catKey,
                    icon: RISK_PATTERNS[catKey]?.icon || '💡',
                    tip: catRecommendations[i]
                });
            }
        }

        // Limit total tips
        if (tips.length >= 8) break;
    }

    return tips;
}

/**
 * Compare against industry averages
 */
function getIndustryComparison(url, riskScore) {
    if (!url) return null;

    const lowerUrl = url.toLowerCase();

    for (const [key, industry] of Object.entries(INDUSTRY_AVERAGES)) {
        for (const domain of industry.domains) {
            if (lowerUrl.includes(domain)) {
                const diff = riskScore - industry.avg;
                let comparison;
                if (diff > 10) comparison = 'worse';
                else if (diff > -10) comparison = 'similar';
                else comparison = 'better';

                return {
                    industry: industry.label,
                    icon: industry.icon,
                    industryAvg: industry.avg,
                    siteScore: riskScore,
                    difference: diff,
                    comparison,
                    comparisonText: diff > 10
                        ? `This site is riskier than the average ${industry.label} service.`
                        : diff > -10
                            ? `This site is roughly on par with average ${industry.label} services.`
                            : `This site is safer than the average ${industry.label} service.`
                };
            }
        }
    }

    // If no industry match, return general comparison
    const generalAvg = 58;
    const diff = riskScore - generalAvg;
    return {
        industry: 'All Services',
        icon: '🌐',
        industryAvg: generalAvg,
        siteScore: riskScore,
        difference: diff,
        comparison: diff > 10 ? 'worse' : diff > -10 ? 'similar' : 'better',
        comparisonText: diff > 10
            ? 'This site is riskier than the average web service.'
            : diff > -10
                ? 'This site is roughly on par with average web services.'
                : 'This site is safer than the average web service.'
    };
}

/**
 * Get the risk grade based on score
 */
function getGrade(score) {
    for (const [key, grade] of Object.entries(RISK_GRADES)) {
        if (score >= grade.min && score <= grade.max) {
            return { key, ...grade };
        }
    }
    return { key: 'DANGER', ...RISK_GRADES.DANGER };
}

/**
 * Generate a plain-English summary
 */
function generateSummary(risks, categoryScores, grade) {
    const lines = [];

    if (risks.length === 0) {
        lines.push("No specific risk patterns were detected in this text. This could mean the terms are relatively safe, or the text may not be a standard Terms & Conditions page.");
        return lines;
    }

    // Opening line based on grade
    if (grade.key === 'SAFE' || grade.key === 'LOW') {
        lines.push("This agreement appears relatively safe with few concerning clauses.");
    } else if (grade.key === 'MODERATE') {
        lines.push("This agreement has some clauses worth reviewing carefully before accepting.");
    } else if (grade.key === 'HIGH') {
        lines.push("⚠️ This agreement contains several concerning clauses that could affect your rights and privacy.");
    } else {
        lines.push("🚨 This agreement contains multiple high-risk clauses. Review carefully before accepting!");
    }

    // Top concerns
    const activeCategories = Object.entries(categoryScores)
        .filter(([, cat]) => cat.hits > 0)
        .sort(([, a], [, b]) => b.severity - a.severity);

    if (activeCategories.length > 0) {
        lines.push("");
        lines.push("Key concerns:");
        for (const [, cat] of activeCategories.slice(0, 5)) {
            const severityPct = Math.round((cat.severity / cat.maxSeverity) * 100);
            lines.push(`${cat.icon} ${cat.label}: ${cat.hits} issue${cat.hits > 1 ? 's' : ''} found (${severityPct}% risk)`);
        }
    }

    // Top 3 most severe risks
    const topRisks = risks.sort((a, b) => b.severity - a.severity).slice(0, 3);
    if (topRisks.length > 0) {
        lines.push("");
        lines.push("Most critical findings:");
        for (const risk of topRisks) {
            lines.push(`• ${risk.explanation}`);
        }
    }

    return lines;
}

/**
 * Find context around a matched pattern
 */
function findContext(text, pattern) {
    const contexts = [];
    const lowerText = text.toLowerCase();
    const lowerPattern = pattern.toLowerCase();
    let startIndex = 0;

    while (startIndex < lowerText.length && contexts.length < 3) {
        const idx = lowerText.indexOf(lowerPattern, startIndex);
        if (idx === -1) break;

        // Get surrounding context (100 chars before and after)
        const contextStart = Math.max(0, idx - 100);
        const contextEnd = Math.min(text.length, idx + pattern.length + 100);
        let context = text.substring(contextStart, contextEnd).trim();

        if (contextStart > 0) context = '...' + context;
        if (contextEnd < text.length) context = context + '...';

        contexts.push({
            text: context,
            matchStart: idx - contextStart,
            matchEnd: idx - contextStart + pattern.length
        });

        startIndex = idx + pattern.length;
    }

    return contexts;
}

/**
 * Save analysis result to storage
 */
function saveAnalysis(url, result) {
    // Save as last analysis
    chrome.storage.local.set({ lastAnalysis: result });

    // Add to history
    chrome.storage.local.get(['scanHistory'], (data) => {
        const history = data.scanHistory || [];

        // Remove old entry for same URL
        const filtered = history.filter(h => h.url !== url);

        // Add new entry at beginning
        filtered.unshift({
            url: url,
            riskScore: result.riskScore,
            grade: result.grade,
            totalRisks: result.totalRisksFound,
            timestamp: result.timestamp
        });

        // Keep only last 50 entries
        chrome.storage.local.set({ scanHistory: filtered.slice(0, 50) });
    });
}

/**
 * Escape special regex characters
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
