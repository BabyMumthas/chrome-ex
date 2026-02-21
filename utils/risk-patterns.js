// Terms Guard — Risk Pattern Database
// Comprehensive database of risky clause patterns organized by category

const RISK_PATTERNS = {
    dataSharing: {
        label: "Data Sharing",
        icon: "📡",
        color: "#ef4444",
        patterns: [
            { text: "share with third parties", severity: 8, explanation: "Your data may be shared with unknown companies" },
            { text: "share your information with", severity: 7, explanation: "Your personal information could be distributed to others" },
            { text: "sell your data", severity: 10, explanation: "Your data may be sold for profit" },
            { text: "sell your personal", severity: 10, explanation: "Your personal information may be sold" },
            { text: "advertising partners", severity: 7, explanation: "Your data is shared with advertisers" },
            { text: "marketing partners", severity: 7, explanation: "Data shared with marketing companies" },
            { text: "business partners", severity: 5, explanation: "Data may be shared with business affiliates" },
            { text: "analytics providers", severity: 5, explanation: "Your usage data is tracked by third-party analytics" },
            { text: "data broker", severity: 10, explanation: "Data brokers aggregate and resell your information" },
            { text: "aggregate your data", severity: 6, explanation: "Your data is combined with others for analysis" },
            { text: "share with affiliates", severity: 5, explanation: "Sister companies may access your data" },
            { text: "transfer your data", severity: 6, explanation: "Your data may be moved to other entities" },
            { text: "disclose your information", severity: 7, explanation: "Your information may be revealed to others" },
            { text: "provide your data to", severity: 7, explanation: "Your data is given to external parties" },
            { text: "cross-border data transfer", severity: 6, explanation: "Your data may be sent to other countries with weaker privacy laws" }
        ]
    },
    autoRenewal: {
        label: "Auto-Renewal & Billing",
        icon: "💳",
        color: "#f59e0b",
        patterns: [
            { text: "automatically renew", severity: 7, explanation: "Your subscription will renew without asking" },
            { text: "auto-renew", severity: 7, explanation: "Automatic recurring charges" },
            { text: "recurring charges", severity: 6, explanation: "You will be charged repeatedly" },
            { text: "cancel before", severity: 5, explanation: "Must actively cancel to avoid charges" },
            { text: "non-refundable", severity: 7, explanation: "You cannot get your money back" },
            { text: "no refund", severity: 8, explanation: "Refunds are not available" },
            { text: "price change", severity: 5, explanation: "Prices may increase without notice" },
            { text: "change the fees", severity: 6, explanation: "Fees can be modified at any time" },
            { text: "modify the price", severity: 6, explanation: "Pricing may change without consent" },
            { text: "charge your payment method", severity: 5, explanation: "They can charge your payment method" },
            { text: "free trial", severity: 4, explanation: "Free trials may convert to paid subscriptions" },
            { text: "trial period", severity: 4, explanation: "After trial, charges begin automatically" }
        ]
    },
    liabilityWaiver: {
        label: "Liability Waiver",
        icon: "⚠️",
        color: "#f97316",
        patterns: [
            { text: "not responsible for", severity: 7, explanation: "Company disclaims responsibility" },
            { text: "not liable for", severity: 7, explanation: "Company avoids legal liability" },
            { text: "no liability", severity: 8, explanation: "Complete liability waiver" },
            { text: "at your own risk", severity: 8, explanation: "All risk falls on you" },
            { text: "as is", severity: 6, explanation: "No guarantees on quality or functionality" },
            { text: "without warranty", severity: 7, explanation: "No promises that the service works correctly" },
            { text: "limitation of liability", severity: 7, explanation: "Damages you can claim are capped" },
            { text: "indemnify", severity: 8, explanation: "You may have to pay for their legal costs" },
            { text: "hold harmless", severity: 7, explanation: "You can't hold them accountable for damages" },
            { text: "disclaimer of warranties", severity: 6, explanation: "They disclaim all promises about the product" },
            { text: "consequential damages", severity: 6, explanation: "They won't pay for indirect damage caused" },
            { text: "maximum aggregate liability", severity: 5, explanation: "Their liability is limited to a small amount" }
        ]
    },
    contentOwnership: {
        label: "Content Ownership",
        icon: "©️",
        color: "#8b5cf6",
        patterns: [
            { text: "irrevocable license", severity: 9, explanation: "You permanently give up rights to your content" },
            { text: "perpetual license", severity: 9, explanation: "They can use your content forever" },
            { text: "right to use your content", severity: 7, explanation: "They can use what you create/upload" },
            { text: "intellectual property", severity: 5, explanation: "IP rights may be affected" },
            { text: "worldwide license", severity: 8, explanation: "They can use your content anywhere in the world" },
            { text: "royalty-free", severity: 7, explanation: "They use your content without paying you" },
            { text: "sublicense", severity: 8, explanation: "They can give others the right to use your content" },
            { text: "derivative works", severity: 7, explanation: "They can modify and use your content" },
            { text: "transfer ownership", severity: 9, explanation: "You may lose ownership of your content" },
            { text: "grant us a license", severity: 7, explanation: "You're giving them rights to your content" },
            { text: "reproduce, modify, publish", severity: 8, explanation: "Broad rights to use your content in many ways" }
        ]
    },
    accountTermination: {
        label: "Account Termination",
        icon: "🚫",
        color: "#dc2626",
        patterns: [
            { text: "terminate without notice", severity: 8, explanation: "Your account can be deleted without warning" },
            { text: "suspend your account", severity: 6, explanation: "Your account may be frozen" },
            { text: "sole discretion", severity: 7, explanation: "They can make decisions without your input" },
            { text: "terminate at any time", severity: 7, explanation: "Service can end without warning" },
            { text: "right to remove", severity: 5, explanation: "Your content can be deleted" },
            { text: "modify or discontinue", severity: 6, explanation: "The service may change or shut down" },
            { text: "without prior notice", severity: 7, explanation: "Changes happen without informing you" },
            { text: "forfeit", severity: 8, explanation: "You may lose access to purchases or credits" }
        ]
    },
    arbitration: {
        label: "Legal Rights",
        icon: "⚖️",
        color: "#6366f1",
        patterns: [
            { text: "binding arbitration", severity: 9, explanation: "You give up right to sue in court" },
            { text: "waive right to jury", severity: 9, explanation: "You cannot have a jury trial" },
            { text: "class action waiver", severity: 9, explanation: "You can't join group lawsuits" },
            { text: "waive your right", severity: 8, explanation: "You're giving up a legal right" },
            { text: "dispute resolution", severity: 4, explanation: "Special rules for handling disagreements" },
            { text: "governing law", severity: 3, explanation: "Laws of a specific jurisdiction apply" },
            { text: "mandatory arbitration", severity: 9, explanation: "Disputes must go through arbitration, not court" },
            { text: "individual basis", severity: 7, explanation: "You must dispute individually, not as a group" }
        ]
    },
    dataRetention: {
        label: "Data Retention",
        icon: "🗄️",
        color: "#0ea5e9",
        patterns: [
            { text: "retain indefinitely", severity: 8, explanation: "Your data is kept forever" },
            { text: "after account deletion", severity: 7, explanation: "Data survives even after you delete your account" },
            { text: "backup copies", severity: 4, explanation: "Copies of your data may persist in backups" },
            { text: "retain your data", severity: 5, explanation: "Data is stored for extended periods" },
            { text: "keep your information", severity: 5, explanation: "Your info is stored beyond active use" },
            { text: "data retention", severity: 4, explanation: "Policies about how long data is kept" },
            { text: "preserve your data", severity: 5, explanation: "Data is maintained even when not needed" },
            { text: "even after you delete", severity: 8, explanation: "Deletion doesn't mean your data is gone" }
        ]
    },
    locationTracking: {
        label: "Location Tracking",
        icon: "📍",
        color: "#ec4899",
        patterns: [
            { text: "precise location", severity: 8, explanation: "Exact GPS coordinates are tracked" },
            { text: "gps data", severity: 8, explanation: "GPS is used to track your location" },
            { text: "track your location", severity: 7, explanation: "Your movements may be monitored" },
            { text: "location data", severity: 6, explanation: "Location information is collected" },
            { text: "geolocation", severity: 6, explanation: "Your geographic position is determined" },
            { text: "location history", severity: 7, explanation: "A history of where you've been is stored" },
            { text: "background location", severity: 9, explanation: "Location tracked even when app isn't open" },
            { text: "nearby devices", severity: 6, explanation: "Devices near you may be detected" }
        ]
    },
    privacyInvasion: {
        label: "Privacy Invasion",
        icon: "👁️",
        color: "#be185d",
        patterns: [
            { text: "access your contacts", severity: 7, explanation: "They can read your contact list" },
            { text: "access your camera", severity: 8, explanation: "Camera access may be used" },
            { text: "access your microphone", severity: 8, explanation: "Microphone access may be used" },
            { text: "browsing history", severity: 7, explanation: "Your web browsing is tracked" },
            { text: "device identifiers", severity: 5, explanation: "Your device is uniquely identified" },
            { text: "cookies and tracking", severity: 4, explanation: "Online tracking technologies are used" },
            { text: "fingerprinting", severity: 7, explanation: "Browser/device fingerprinting to identify you" },
            { text: "monitor your usage", severity: 6, explanation: "How you use the service is watched" },
            { text: "collect information from", severity: 5, explanation: "Information is gathered from multiple sources" },
            { text: "behavioral data", severity: 6, explanation: "Your behavior patterns are analyzed" }
        ]
    },
    policyChanges: {
        label: "Unilateral Changes",
        icon: "📜",
        color: "#78716c",
        patterns: [
            { text: "change these terms", severity: 6, explanation: "Terms can be changed without your agreement" },
            { text: "modify this agreement", severity: 6, explanation: "The agreement can be altered unilaterally" },
            { text: "update our policy", severity: 4, explanation: "Policies may change" },
            { text: "continued use constitutes acceptance", severity: 7, explanation: "Just using the service means you agree to changes" },
            { text: "deemed to have accepted", severity: 7, explanation: "You're assumed to agree without explicit consent" },
            { text: "without notice", severity: 7, explanation: "Changes can happen without telling you" },
            { text: "reserve the right to modify", severity: 6, explanation: "They can change rules whenever they want" },
            { text: "at our discretion", severity: 6, explanation: "Decisions are made without your input" }
        ]
    }
};

// Severity thresholds for overall risk grade
const RISK_GRADES = {
    SAFE: { min: 0, max: 20, label: "Safe", color: "#22c55e", emoji: "✅" },
    LOW: { min: 21, max: 40, label: "Low Risk", color: "#84cc16", emoji: "🟢" },
    MODERATE: { min: 41, max: 60, label: "Moderate", color: "#f59e0b", emoji: "🟡" },
    HIGH: { min: 61, max: 80, label: "High Risk", color: "#f97316", emoji: "🟠" },
    DANGER: { min: 81, max: 100, label: "Danger", color: "#ef4444", emoji: "🔴" }
};

// Keywords that indicate a page contains Terms & Conditions
const TC_KEYWORDS = [
    "terms and conditions",
    "terms of service",
    "terms of use",
    "privacy policy",
    "user agreement",
    "license agreement",
    "end user license",
    "cookie policy",
    "acceptable use policy",
    "data processing agreement",
    "subscriber agreement",
    "service agreement",
    "community guidelines"
];

// Keywords for "Accept" buttons
const ACCEPT_BUTTON_KEYWORDS = [
    "accept all",
    "accept",
    "i agree",
    "agree",
    "i accept",
    "agree and continue",
    "accept and continue",
    "got it",
    "ok",
    "continue",
    "allow all",
    "accept cookies",
    "allow cookies",
    "consent"
];

// Permission patterns — detect what permissions the app claims access to
const PERMISSION_PATTERNS = {
    camera: { icon: "📷", label: "Camera", patterns: ["access your camera", "camera access", "camera permission", "use your camera", "capture photos", "capture video"] },
    microphone: { icon: "🎙️", label: "Microphone", patterns: ["access your microphone", "microphone access", "mic access", "record audio", "voice recording", "audio capture"] },
    location: { icon: "📍", label: "Location", patterns: ["access your location", "precise location", "gps data", "geolocation", "location data", "track your location", "location history", "background location"] },
    contacts: { icon: "👥", label: "Contacts", patterns: ["access your contacts", "contact list", "address book", "phone contacts"] },
    storage: { icon: "💾", label: "Storage/Files", patterns: ["access your files", "device storage", "file access", "read your files", "write to storage", "local storage"] },
    notifications: { icon: "🔔", label: "Notifications", patterns: ["send you notifications", "push notification", "notification permission", "send alerts"] },
    biometrics: { icon: "🔑", label: "Biometrics", patterns: ["fingerprint", "face recognition", "biometric data", "facial recognition", "face id", "touch id", "biometric identifier"] },
    bluetooth: { icon: "📶", label: "Bluetooth/WiFi", patterns: ["bluetooth", "nearby devices", "wifi network", "wireless connection", "network access"] },
    calendar: { icon: "📅", label: "Calendar", patterns: ["access your calendar", "calendar events", "calendar data"] },
    sms: { icon: "💬", label: "SMS/Messages", patterns: ["read your messages", "send sms", "text messages", "access messages", "message content"] }
};

// Industry average risk scores for comparison
const INDUSTRY_AVERAGES = {
    socialMedia: { label: "Social Media", avg: 72, icon: "📱", domains: ["facebook", "instagram", "twitter", "tiktok", "snapchat", "linkedin", "reddit", "pinterest", "tumblr", "mastodon"] },
    ecommerce: { label: "E-Commerce", avg: 55, icon: "🛒", domains: ["amazon", "ebay", "shopify", "etsy", "walmart", "aliexpress", "flipkart", "alibaba"] },
    streaming: { label: "Streaming", avg: 62, icon: "🎬", domains: ["netflix", "spotify", "youtube", "hulu", "disney", "hbo", "primevideo", "twitch", "apple.com/tv"] },
    gaming: { label: "Gaming", avg: 67, icon: "🎮", domains: ["steam", "epic", "playstation", "xbox", "nintendo", "roblox", "ea.com", "ubisoft", "riot"] },
    finance: { label: "Finance", avg: 48, icon: "🏦", domains: ["paypal", "stripe", "venmo", "cashapp", "wise", "revolut", "banking"] },
    cloud: { label: "Cloud/SaaS", avg: 52, icon: "☁️", domains: ["google", "microsoft", "apple", "dropbox", "icloud", "onedrive", "notion", "slack"] },
    health: { label: "Health/Fitness", avg: 70, icon: "🏥", domains: ["fitbit", "myfitnesspal", "strava", "headspace", "calm", "peloton"] },
    education: { label: "Education", avg: 42, icon: "🎓", domains: ["coursera", "udemy", "edx", "khan", "duolingo"] },
    news: { label: "News/Media", avg: 58, icon: "📰", domains: ["cnn", "bbc", "nytimes", "reuters", "washingtonpost", "guardian", "medium", "substack"] }
};

// Actionable recommendations per risk category
const RECOMMENDATIONS = {
    dataSharing: [
        "Use a disposable email address for sign-up to limit data exposure",
        "Check if the service offers a 'Do Not Sell My Data' option",
        "Consider using a privacy-focused browser extension like uBlock Origin"
    ],
    autoRenewal: [
        "Set a calendar reminder before the renewal date",
        "Use a virtual/prepaid card to control charges",
        "Check cancellation policy before subscribing"
    ],
    liabilityWaiver: [
        "Document any issues with the service for potential claims",
        "Consider if the service is worth the risk given the waivers",
        "Look for alternative services with fewer liability waivers"
    ],
    contentOwnership: [
        "Watermark your original content before uploading",
        "Keep backups of all content you upload to the platform",
        "Read the content license terms carefully before posting creative work"
    ],
    accountTermination: [
        "Export/download your data regularly as a backup",
        "Don't rely solely on this service for critical data storage",
        "Check if there's a data export tool available"
    ],
    arbitration: [
        "Be aware that you may be waiving your right to sue",
        "Check if you can opt out of arbitration within 30 days",
        "Understand what jurisdiction governs disputes"
    ],
    dataRetention: [
        "Request data deletion after closing your account",
        "Check GDPR/CCPA rights for data erasure in your region",
        "Minimize the personal data you share with the service"
    ],
    locationTracking: [
        "Disable location permissions when not actively needed",
        "Use a VPN to mask your IP-based location",
        "Review app-level location permission settings on your device"
    ],
    privacyInvasion: [
        "Revoke camera/microphone access when not in use",
        "Use browser privacy settings to limit tracking",
        "Consider using a privacy-focused browser like Firefox or Brave"
    ],
    policyChanges: [
        "Subscribe to email notifications about policy updates",
        "Periodically re-scan terms to check for new risks",
        "Screenshot current terms for your records"
    ]
};

// Quick verdict templates
const VERDICT_TEMPLATES = {
    SAFE: [
        "Looks good! This agreement appears fair and transparent.",
        "Green light — no major red flags detected in these terms.",
        "These terms seem reasonable. Standard clauses with minimal risk."
    ],
    LOW: [
        "Mostly safe with a few standard clauses to be aware of.",
        "Minor concerns found, but nothing unusual for this type of service.",
        "Generally acceptable — just a couple of items to keep in mind."
    ],
    MODERATE: [
        "Proceed with caution — several clauses deserve your attention.",
        "Some concerning patterns found. Review the flagged items before accepting.",
        "Mixed bag — this agreement has both standard and questionable clauses."
    ],
    HIGH: [
        "Think twice — this agreement has significant risks to your privacy and rights.",
        "Multiple red flags detected. Consider alternatives before accepting.",
        "Warning: This agreement grants extensive rights over your data and content."
    ],
    DANGER: [
        "Major concerns! This agreement is heavily stacked against you.",
        "Danger zone — extreme risk to your privacy, data, and legal rights.",
        "Highly risky! These terms contain numerous concerning clauses."
    ]
};

// Make available globally for content scripts
if (typeof window !== 'undefined') {
    window.RISK_PATTERNS = RISK_PATTERNS;
    window.RISK_GRADES = RISK_GRADES;
    window.TC_KEYWORDS = TC_KEYWORDS;
    window.ACCEPT_BUTTON_KEYWORDS = ACCEPT_BUTTON_KEYWORDS;
    window.PERMISSION_PATTERNS = PERMISSION_PATTERNS;
    window.INDUSTRY_AVERAGES = INDUSTRY_AVERAGES;
    window.RECOMMENDATIONS = RECOMMENDATIONS;
    window.VERDICT_TEMPLATES = VERDICT_TEMPLATES;
}
