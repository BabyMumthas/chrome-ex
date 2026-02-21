// Terms Guard — Rights Loss Generator
// Maps detected risk categories to user rights being forfeited

const RIGHTS_MAP = {
    dataSharing: {
        rights: [
            { right: 'Right to Data Privacy', icon: '🔒', severity: 'critical', emotionalText: 'Your personal conversations, photos, and browsing habits could be sold to advertisers without your knowledge.' },
            { right: 'Right to Control Personal Info', icon: '🛡️', severity: 'high', emotionalText: 'You lose the ability to decide who sees your personal information.' },
            { right: 'Right to Data Portability', icon: '📦', severity: 'medium', emotionalText: 'Your data may be locked into their ecosystem with no way to take it with you.' }
        ]
    },
    autoRenewal: {
        rights: [
            { right: 'Right to Fair Billing', icon: '💳', severity: 'high', emotionalText: 'Money will be charged to your card automatically — even if you forgot you signed up.' },
            { right: 'Right to Easy Cancellation', icon: '🚪', severity: 'medium', emotionalText: 'Cancelling may require jumping through hoops designed to keep charging you.' }
        ]
    },
    liabilityWaiver: {
        rights: [
            { right: 'Right to Legal Recourse', icon: '⚖️', severity: 'critical', emotionalText: 'If their service causes you financial loss or harm, you may have no legal options.' },
            { right: 'Right to Compensation', icon: '💰', severity: 'high', emotionalText: 'Even if they make a mistake that costs you money, they won\'t pay you back.' }
        ]
    },
    contentOwnership: {
        rights: [
            { right: 'Right to Own Your Creations', icon: '🎨', severity: 'critical', emotionalText: 'Your photos, videos, and creative work could be used in their ads or resold — forever.' },
            { right: 'Right to Attribution', icon: '✍️', severity: 'medium', emotionalText: 'Your content could appear anywhere without your name attached to it.' }
        ]
    },
    accountTermination: {
        rights: [
            { right: 'Right to Account Continuity', icon: '🔑', severity: 'high', emotionalText: 'Years of your data, messages, and purchases could vanish overnight without warning.' },
            { right: 'Right to Data Retrieval', icon: '📥', severity: 'high', emotionalText: 'Once locked out, you may never recover your files, photos, or conversation history.' }
        ]
    },
    arbitration: {
        rights: [
            { right: 'Right to Sue in Court', icon: '🏛️', severity: 'critical', emotionalText: 'You surrender your constitutional right to a jury trial — disputes go to private arbitrators chosen by the company.' },
            { right: 'Right to Join Class Actions', icon: '👥', severity: 'critical', emotionalText: 'Even if millions are affected by the same abuse, you must fight alone.' }
        ]
    },
    dataRetention: {
        rights: [
            { right: 'Right to Be Forgotten', icon: '🗑️', severity: 'high', emotionalText: 'Even after you delete your account, they keep your data — potentially forever.' },
            { right: 'Right to Data Deletion', icon: '❌', severity: 'high', emotionalText: 'Your personal data stays in their servers, vulnerable to future breaches.' }
        ]
    },
    locationTracking: {
        rights: [
            { right: 'Right to Physical Privacy', icon: '📍', severity: 'critical', emotionalText: 'Every place you visit, every route you take — tracked, stored, and potentially shared.' },
            { right: 'Right to Anonymity', icon: '👤', severity: 'high', emotionalText: 'Your daily patterns and movements build a profile that identifies you uniquely.' }
        ]
    },
    privacyInvasion: {
        rights: [
            { right: 'Right to Digital Privacy', icon: '👁️', severity: 'critical', emotionalText: 'Your camera, microphone, and personal files could be accessed far beyond what\'s needed.' },
            { right: 'Right to Minimal Data Collection', icon: '📋', severity: 'high', emotionalText: 'They collect far more data than the service requires to function.' }
        ]
    },
    policyChanges: {
        rights: [
            { right: 'Right to Informed Consent', icon: '📜', severity: 'high', emotionalText: 'They can change the rules anytime — and your continued use is treated as agreement.' },
            { right: 'Right to Fair Notice', icon: '🔔', severity: 'medium', emotionalText: 'You may never know when terms change to something worse.' }
        ]
    }
};

/**
 * Generate rights loss analysis from detected category scores
 */
function generateRightsLoss(categoryScores) {
    const lostRights = [];

    for (const [catKey, catData] of Object.entries(categoryScores)) {
        if (catData.hits > 0 && RIGHTS_MAP[catKey]) {
            for (const right of RIGHTS_MAP[catKey].rights) {
                lostRights.push({
                    ...right,
                    category: catKey,
                    categoryLabel: catData.label,
                    categoryIcon: catData.icon,
                    hits: catData.hits
                });
            }
        }
    }

    // Sort by severity priority: critical > high > medium
    const severityOrder = { critical: 3, high: 2, medium: 1 };
    lostRights.sort((a, b) => (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0));

    return {
        rights: lostRights,
        criticalCount: lostRights.filter(r => r.severity === 'critical').length,
        highCount: lostRights.filter(r => r.severity === 'high').length,
        totalCount: lostRights.length
    };
}

// Make available globally
if (typeof window !== 'undefined') {
    window.RIGHTS_MAP = RIGHTS_MAP;
}
