// Terms Guard — AI Clause Simplifier Module
// Sends flagged clauses to Gemini LLM API for plain-English simplification
// Features: batching, caching (chrome.storage), template fallback

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const CACHE_KEY = 'aiSimplifierCache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// =====================================================
// MAIN ENTRY POINT
// =====================================================

/**
 * Simplify flagged clauses using AI (with cache + fallback)
 * @param {Array} clauses - Array of { pattern, explanation, severity, categoryLabel, contexts }
 * @returns {Array} - Array of { clause, plainMeaning, riskSummary, userImpact, source }
 */
async function simplifyClausesWithAI(clauses) {
    if (!clauses || clauses.length === 0) return [];

    // 1. Hash each clause for cache lookup
    const clauseEntries = clauses.map(c => ({
        ...c,
        hash: hashClause(c.pattern + (c.contexts?.[0]?.text || ''))
    }));

    // 2. Check cache
    const cached = await getCachedResults(clauseEntries.map(c => c.hash));

    // 3. Separate cached vs uncached
    const uncached = [];
    const results = [];

    for (const entry of clauseEntries) {
        if (cached[entry.hash]) {
            results.push({ ...cached[entry.hash], source: 'cache' });
        } else {
            uncached.push(entry);
            results.push(null); // placeholder
        }
    }

    // 4. If all cached, return immediately
    if (uncached.length === 0) return results;

    // 5. Try API call for uncached clauses
    let apiResults = null;
    try {
        const apiKey = await getStoredApiKey();
        if (apiKey) {
            apiResults = await callGeminiAPI(uncached, apiKey);
        }
    } catch (err) {
        console.warn('Terms Guard AI: API call failed, using template fallback', err);
    }

    // 6. Fill in results — API or fallback
    let uncachedIdx = 0;
    for (let i = 0; i < results.length; i++) {
        if (results[i] === null) {
            const clause = uncached[uncachedIdx];
            if (apiResults && apiResults[uncachedIdx]) {
                results[i] = {
                    clause: clause.pattern,
                    ...apiResults[uncachedIdx],
                    source: 'ai'
                };
            } else {
                results[i] = {
                    clause: clause.pattern,
                    ...generateTemplateSummary(clause),
                    source: 'template'
                };
            }
            uncachedIdx++;
        }
    }

    // 7. Cache all new results
    const newCacheEntries = {};
    uncachedIdx = 0;
    for (let i = 0; i < clauseEntries.length; i++) {
        if (!cached[clauseEntries[i].hash] && results[i]) {
            newCacheEntries[clauseEntries[i].hash] = {
                clause: results[i].clause,
                plainMeaning: results[i].plainMeaning,
                riskSummary: results[i].riskSummary,
                userImpact: results[i].userImpact,
                timestamp: Date.now()
            };
        }
    }
    if (Object.keys(newCacheEntries).length > 0) {
        await cacheResults(newCacheEntries);
    }

    return results;
}

// =====================================================
// GEMINI API CALL (BATCHED)
// =====================================================

async function callGeminiAPI(clauses, apiKey) {
    const clauseTexts = clauses.map((c, i) => {
        const context = c.contexts?.[0]?.text || c.pattern;
        return `Clause ${i + 1} [${c.categoryLabel}, Severity: ${c.severity}/10]:\n"${context}"`;
    }).join('\n\n');

    const prompt = `You are a legal terms analyzer. For each clause below, provide:
1. **Plain Meaning**: What this clause actually means in simple, everyday English (1-2 sentences)
2. **Risk Summary**: What specific risk this poses to the user (1 sentence)  
3. **User Impact**: Concrete action/consequence for the user, starting with "You..." (1 sentence)

Respond ONLY with a valid JSON array. Each element must have exactly these keys: "plainMeaning", "riskSummary", "userImpact". No markdown, no extra text.

${clauseTexts}`;

    const url = `${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 2048,
                responseMimeType: 'application/json'
            }
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errText}`);
    }

    const data = await response.json();

    // Extract the text from the response
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) throw new Error('Empty API response');

    // Parse JSON — remove potential markdown fences
    const cleanJson = resultText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    if (!Array.isArray(parsed)) throw new Error('API response is not an array');

    return parsed;
}

// =====================================================
// TEMPLATE FALLBACK
// =====================================================

const TEMPLATE_MAP = {
    dataSharing: {
        plainMeaning: 'This clause allows the company to share your personal information with other companies or partners.',
        riskSummary: 'Your data could end up with advertisers, data brokers, or unknown third parties.',
        userImpact: 'You may receive targeted ads and your data could be sold without your explicit consent.'
    },
    autoRenewal: {
        plainMeaning: 'Your subscription will automatically renew and charge your payment method unless you cancel before the renewal date.',
        riskSummary: 'You could be charged unexpectedly if you forget to cancel.',
        userImpact: 'You need to set a reminder to cancel before the billing cycle or you will be charged again.'
    },
    liabilityWaiver: {
        plainMeaning: 'The company limits or removes their responsibility if something goes wrong with their service.',
        riskSummary: 'If the service causes you harm or loss, you may have limited legal options.',
        userImpact: 'You accept the service "as is" and cannot hold them responsible for damages.'
    },
    contentOwnership: {
        plainMeaning: 'By using this service, you grant the company broad rights to use, modify, and distribute your content.',
        riskSummary: 'Content you create or upload could be used by the company for any purpose.',
        userImpact: 'You may lose control over how your photos, posts, or creative work is used.'
    },
    accountTermination: {
        plainMeaning: 'The company can suspend or permanently delete your account at their discretion, sometimes without warning.',
        riskSummary: 'You could lose access to your account and all associated data at any time.',
        userImpact: 'You should regularly back up any important data stored on this platform.'
    },
    arbitration: {
        plainMeaning: 'Disputes must be resolved through private arbitration rather than a public court or class-action lawsuit.',
        riskSummary: 'You waive your right to sue in court or join class-action lawsuits.',
        userImpact: 'You may have limited legal recourse and must handle disputes individually through arbitration.'
    },
    dataRetention: {
        plainMeaning: 'The company keeps your personal data even after you stop using the service or delete your account.',
        riskSummary: 'Your data persists in their systems indefinitely, even after you leave.',
        userImpact: 'You should explicitly request data deletion and verify it is done under GDPR/CCPA rights.'
    },
    locationTracking: {
        plainMeaning: 'The service collects your location data, potentially including precise GPS coordinates and location history.',
        riskSummary: 'Your movements and location habits could be tracked and stored.',
        userImpact: 'You should disable location permissions when not actively needed.'
    },
    privacyInvasion: {
        plainMeaning: 'The service requests access to sensitive personal data like contacts, camera, or browsing habits.',
        riskSummary: 'Extensive personal information could be collected beyond what is necessary.',
        userImpact: 'You should review and restrict app permissions to only what is essential.'
    },
    policyChanges: {
        plainMeaning: 'The company can change these terms at any time, and continued use means you accept the new terms.',
        riskSummary: 'Terms could become less favorable without you realizing it.',
        userImpact: 'You should periodically re-check the terms or set up notifications for policy updates.'
    }
};

// Severity-based modifiers for templates
const SEVERITY_PREFIX = {
    high: '⚠️ This is a high-risk clause. ',
    medium: 'This clause warrants attention. ',
    low: 'This is a relatively standard clause. '
};

function generateTemplateSummary(clause) {
    const template = TEMPLATE_MAP[clause.category] || TEMPLATE_MAP.dataSharing;
    const severity = clause.severity >= 7 ? 'high' : clause.severity >= 4 ? 'medium' : 'low';
    const prefix = SEVERITY_PREFIX[severity];

    return {
        plainMeaning: prefix + template.plainMeaning,
        riskSummary: template.riskSummary,
        userImpact: template.userImpact
    };
}

// =====================================================
// CACHING
// =====================================================

async function getCachedResults(hashes) {
    return new Promise((resolve) => {
        chrome.storage.local.get([CACHE_KEY], (data) => {
            const cache = data[CACHE_KEY] || {};
            const results = {};
            const now = Date.now();

            for (const hash of hashes) {
                if (cache[hash] && (now - cache[hash].timestamp) < CACHE_TTL) {
                    results[hash] = cache[hash];
                }
            }
            resolve(results);
        });
    });
}

async function cacheResults(newEntries) {
    return new Promise((resolve) => {
        chrome.storage.local.get([CACHE_KEY], (data) => {
            const cache = data[CACHE_KEY] || {};

            // Merge new entries
            Object.assign(cache, newEntries);

            // Prune expired entries (keep max 200)
            const now = Date.now();
            const entries = Object.entries(cache);
            const validEntries = entries
                .filter(([, v]) => (now - v.timestamp) < CACHE_TTL)
                .slice(-200);

            const pruned = Object.fromEntries(validEntries);

            chrome.storage.local.set({ [CACHE_KEY]: pruned }, resolve);
        });
    });
}

// =====================================================
// API KEY MANAGEMENT
// =====================================================

async function getStoredApiKey() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['geminiApiKey'], (data) => {
            resolve(data.geminiApiKey || null);
        });
    });
}

async function setStoredApiKey(key) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ geminiApiKey: key }, resolve);
    });
}

// =====================================================
// UTILITIES
// =====================================================

function hashClause(text) {
    let hash = 0;
    const str = text.toLowerCase().trim();
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return 'ai_' + Math.abs(hash).toString(36);
}
