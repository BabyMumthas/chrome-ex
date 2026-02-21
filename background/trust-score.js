// Terms Guard — Explainable Trust Score Engine
// Combines all signals into a weighted, multi-factor trust score

const TRUST_WEIGHTS = {
    riskScore: 0.35,
    permissions: 0.15,
    darkPatterns: 0.20,
    readability: 0.10,
    industryComparison: 0.20
};

const TRUST_TIERS = [
    { min: 80, tier: 'A', label: 'Excellent', color: '#22c55e', description: 'Highly trustworthy — minimal concerns' },
    { min: 65, tier: 'B', label: 'Good', color: '#84cc16', description: 'Generally safe with minor issues' },
    { min: 50, tier: 'C', label: 'Fair', color: '#f59e0b', description: 'Some concerns — review recommended' },
    { min: 35, tier: 'D', label: 'Poor', color: '#f97316', description: 'Significant trust issues detected' },
    { min: 0, tier: 'F', label: 'Failing', color: '#ef4444', description: 'Major red flags — proceed with extreme caution' }
];

/**
 * Calculate explainable trust score
 * @param {Object} inputs — { riskScore, permissionCount, darkPatternCount, readabilityScore, industryDelta }
 * @param {number} textLength — character count for confidence calculation
 * @returns {Object} — { trustScore, tier, tierLabel, tierColor, factors[], confidence }
 */
function calculateTrustScore(inputs, textLength) {
    const {
        riskScore = 50,
        permissionCount = 0,
        darkPatternCount = 0,
        readabilityScore = 50,
        industryDelta = 0  // positive = worse than industry, negative = better
    } = inputs;

    // Normalize each factor to 0-100 (where 100 = best/most trustworthy)
    const factors = [];

    // 1. Risk Score (invert: low risk = high trust)
    const riskFactor = Math.max(0, 100 - riskScore);
    factors.push({
        name: 'Risk Analysis',
        icon: '🔍',
        rawValue: riskScore,
        normalizedScore: riskFactor,
        weight: TRUST_WEIGHTS.riskScore,
        weightedScore: riskFactor * TRUST_WEIGHTS.riskScore,
        description: riskScore <= 20 ? 'Very few risky clauses' :
            riskScore <= 40 ? 'Some concerning patterns' :
                riskScore <= 60 ? 'Multiple risk areas identified' :
                    riskScore <= 80 ? 'Significant risk language' : 'Extremely risky terms'
    });

    // 2. Permission Count (fewer = more trustworthy)
    const permScore = Math.max(0, 100 - (permissionCount * 15));
    factors.push({
        name: 'Permissions',
        icon: '🔐',
        rawValue: permissionCount,
        normalizedScore: permScore,
        weight: TRUST_WEIGHTS.permissions,
        weightedScore: permScore * TRUST_WEIGHTS.permissions,
        description: permissionCount === 0 ? 'No special permissions required' :
            permissionCount <= 2 ? 'Minimal permissions requested' :
                permissionCount <= 4 ? 'Several permissions needed' : 'Excessive permissions requested'
    });

    // 3. Dark Patterns (none = trustworthy)
    const darkScore = Math.max(0, 100 - (darkPatternCount * 20));
    factors.push({
        name: 'Dark Patterns',
        icon: '🕶️',
        rawValue: darkPatternCount,
        normalizedScore: darkScore,
        weight: TRUST_WEIGHTS.darkPatterns,
        weightedScore: darkScore * TRUST_WEIGHTS.darkPatterns,
        description: darkPatternCount === 0 ? 'No deceptive UI patterns found' :
            darkPatternCount <= 2 ? 'Minor manipulative elements detected' :
                darkPatternCount <= 4 ? 'Several dark patterns present' : 'Heavily uses deceptive design'
    });

    // 4. Readability (more readable = more trustworthy)
    const readFactor = Math.max(0, Math.min(100, readabilityScore));
    factors.push({
        name: 'Readability',
        icon: '📖',
        rawValue: readabilityScore,
        normalizedScore: readFactor,
        weight: TRUST_WEIGHTS.readability,
        weightedScore: readFactor * TRUST_WEIGHTS.readability,
        description: readabilityScore >= 60 ? 'Clear and understandable language' :
            readabilityScore >= 40 ? 'Moderately complex language' :
                readabilityScore >= 20 ? 'Difficult legal jargon' : 'Extremely complex and obscure'
    });

    // 5. Industry Comparison (better than avg = trustworthy)
    const industryFactor = Math.max(0, Math.min(100, 50 - industryDelta));
    factors.push({
        name: 'Industry Standing',
        icon: '📊',
        rawValue: industryDelta,
        normalizedScore: industryFactor,
        weight: TRUST_WEIGHTS.industryComparison,
        weightedScore: industryFactor * TRUST_WEIGHTS.industryComparison,
        description: industryDelta <= -10 ? 'Much better than industry average' :
            industryDelta <= 0 ? 'Better than industry average' :
                industryDelta <= 10 ? 'Slightly worse than average' : 'Much worse than industry peers'
    });

    // Calculate weighted total
    const trustScore = Math.round(factors.reduce((sum, f) => sum + f.weightedScore, 0));

    // Determine tier
    const tierObj = TRUST_TIERS.find(t => trustScore >= t.min) || TRUST_TIERS[TRUST_TIERS.length - 1];

    // Calculate confidence (0-1) based on available data
    let confidence = 0.5; // base
    if (textLength > 1000) confidence += 0.1;
    if (textLength > 5000) confidence += 0.1;
    if (permissionCount > 0 || darkPatternCount > 0) confidence += 0.1;
    if (readabilityScore > 0) confidence += 0.1;
    if (industryDelta !== 0) confidence += 0.1;
    confidence = Math.min(1, confidence);

    const confidenceLabel = confidence >= 0.8 ? 'High' : confidence >= 0.6 ? 'Moderate' : 'Low';

    return {
        trustScore,
        tier: tierObj.tier,
        tierLabel: tierObj.label,
        tierColor: tierObj.color,
        tierDescription: tierObj.description,
        factors,
        confidence: Math.round(confidence * 100) / 100,
        confidenceLabel
    };
}
