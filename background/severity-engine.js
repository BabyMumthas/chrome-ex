// Terms Guard — Severity Intelligence Engine
// Clause frequency analysis, risk density metrics, and section spread detection

/**
 * Analyze clause frequency — which risk patterns appear most frequently
 */
function analyzeClauseFrequency(risks) {
    const freqMap = {};

    for (const risk of risks) {
        const key = risk.category;
        if (!freqMap[key]) {
            freqMap[key] = {
                category: key,
                label: risk.categoryLabel,
                icon: risk.categoryIcon,
                color: risk.categoryColor,
                totalOccurrences: 0,
                uniquePatterns: 0,
                patterns: []
            };
        }
        freqMap[key].totalOccurrences += risk.occurrences;
        freqMap[key].uniquePatterns++;
        freqMap[key].patterns.push({
            text: risk.pattern,
            count: risk.occurrences,
            severity: risk.severity
        });
    }

    // Sort by total occurrences descending
    const sorted = Object.values(freqMap).sort((a, b) => b.totalOccurrences - a.totalOccurrences);

    return {
        categories: sorted,
        mostFrequent: sorted[0] || null,
        totalPatternMatches: risks.reduce((s, r) => s + r.occurrences, 0)
    };
}

/**
 * Calculate risk density — risks per 1000 words
 */
function calculateRiskDensity(text, risks) {
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    const totalOccurrences = risks.reduce((s, r) => s + r.occurrences, 0);

    const overallDensity = wordCount > 0 ? Math.round((totalOccurrences / wordCount) * 1000 * 100) / 100 : 0;

    // Density per category
    const categoryDensity = {};
    for (const risk of risks) {
        if (!categoryDensity[risk.category]) {
            categoryDensity[risk.category] = { label: risk.categoryLabel, icon: risk.categoryIcon, occurrences: 0 };
        }
        categoryDensity[risk.category].occurrences += risk.occurrences;
    }

    for (const [key, cat] of Object.entries(categoryDensity)) {
        cat.density = wordCount > 0 ? Math.round((cat.occurrences / wordCount) * 1000 * 100) / 100 : 0;
    }

    // Density rating
    let densityLevel, densityColor;
    if (overallDensity < 2) { densityLevel = 'Low'; densityColor = '#22c55e'; }
    else if (overallDensity < 5) { densityLevel = 'Moderate'; densityColor = '#f59e0b'; }
    else if (overallDensity < 10) { densityLevel = 'High'; densityColor = '#f97316'; }
    else { densityLevel = 'Very High'; densityColor = '#ef4444'; }

    return {
        wordCount,
        totalOccurrences,
        overallDensity,
        densityLevel,
        densityColor,
        categoryDensity: Object.values(categoryDensity).sort((a, b) => b.density - a.density)
    };
}

/**
 * Detect section spread — which headings/sections contain risks
 */
function detectSectionSpread(text, risks) {
    // Split text by common section headings
    const sectionPattern = /^(?:\d+\.?\s*)?(?:#{1,3}\s+)?(.{3,80})$/gm;
    const sections = [];
    let match;

    while ((match = sectionPattern.exec(text)) !== null) {
        const title = match[1].trim();
        // Filter to likely headings (capitalized, not too long, not all lowercase sentences)
        if (title.length < 80 && (
            /^[A-Z0-9]/.test(title) ||
            /^\d+\./.test(match[0])
        )) {
            sections.push({
                title: title,
                position: match.index,
                endPosition: 0 // will be set below
            });
        }
    }

    // Set end positions
    for (let i = 0; i < sections.length; i++) {
        sections[i].endPosition = i < sections.length - 1 ? sections[i + 1].position : text.length;
    }

    // If no sections found, treat entire text as one section
    if (sections.length === 0) {
        sections.push({ title: 'Full Document', position: 0, endPosition: text.length });
    }

    // Find which sections each risk category appears in
    const categorySpread = {};
    const lowerText = text.toLowerCase();

    for (const risk of risks) {
        if (!categorySpread[risk.category]) {
            categorySpread[risk.category] = {
                label: risk.categoryLabel,
                icon: risk.categoryIcon,
                sections: new Set()
            };
        }

        // Find which sections contain this pattern
        const patternLower = risk.pattern.toLowerCase();
        for (const section of sections) {
            const sectionText = lowerText.substring(section.position, section.endPosition);
            if (sectionText.includes(patternLower)) {
                categorySpread[risk.category].sections.add(section.title);
            }
        }
    }

    // Convert sets to arrays and sort by spread
    const spreadResults = Object.entries(categorySpread)
        .map(([key, val]) => ({
            category: key,
            label: val.label,
            icon: val.icon,
            sectionCount: val.sections.size,
            sections: [...val.sections]
        }))
        .filter(s => s.sectionCount > 0)
        .sort((a, b) => b.sectionCount - a.sectionCount);

    return {
        totalSections: sections.length,
        spreadResults,
        mostSpread: spreadResults[0] || null
    };
}

/**
 * Generate human-readable severity insights
 */
function generateSeverityInsights(frequency, density, spread) {
    const insights = [];

    // Frequency insights
    if (frequency.mostFrequent) {
        insights.push({
            icon: '🔁',
            type: 'frequency',
            text: `${frequency.mostFrequent.icon} ${frequency.mostFrequent.label} appears ${frequency.mostFrequent.totalOccurrences} times — the most frequent risk category.`,
            severity: frequency.mostFrequent.totalOccurrences > 5 ? 'high' : 'medium'
        });
    }

    if (frequency.totalPatternMatches > 15) {
        insights.push({
            icon: '📊',
            type: 'frequency',
            text: `${frequency.totalPatternMatches} total risk pattern matches found across all categories.`,
            severity: 'high'
        });
    }

    // Density insights
    if (density.overallDensity >= 5) {
        insights.push({
            icon: '⚡',
            type: 'density',
            text: `Risk density is ${density.overallDensity} per 1,000 words — unusually concentrated risk language.`,
            severity: 'high'
        });
    } else if (density.overallDensity >= 2) {
        insights.push({
            icon: '📏',
            type: 'density',
            text: `Risk density is ${density.overallDensity} per 1,000 words — moderate concentration of risk clauses.`,
            severity: 'medium'
        });
    }

    // Spread insights
    for (const s of spread.spreadResults) {
        if (s.sectionCount >= 3) {
            insights.push({
                icon: '🕸️',
                type: 'spread',
                text: `${s.icon} ${s.label} appears in ${s.sectionCount} separate sections — deeply embedded throughout the document.`,
                severity: s.sectionCount >= 5 ? 'high' : 'medium'
            });
        }
    }

    // Word count insight
    if (density.wordCount > 5000) {
        insights.push({
            icon: '📄',
            type: 'length',
            text: `This document is ${density.wordCount.toLocaleString()} words — significantly longer than average.`,
            severity: density.wordCount > 10000 ? 'high' : 'medium'
        });
    }

    return insights;
}
