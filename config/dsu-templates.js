/**
 * DSU Message Templates - Rich Discord Embeds
 * 
 * @author opisboy29
 * @repository git@github.com:opisboy29/discord-dsu-bot.git
 * @description Customizable message templates for morning and evening DSU
 */

// =================================================================
// DSU TEMPLATE CONFIGURATION
// =================================================================

// Template configuration - easily customizable
const DSU_CONFIG = {
    timezone: process.env.TIMEZONE || 'Asia/Jakarta',
    
    // Team mentions (add role IDs or user IDs to mention)
    mentions: {
        everyone: process.env.MENTION_EVERYONE === 'true',
        here: process.env.MENTION_HERE === 'true',
        roles: process.env.MENTION_ROLES ? process.env.MENTION_ROLES.split(',') : [],
        users: process.env.MENTION_USERS ? process.env.MENTION_USERS.split(',') : []
    },
    
    // Colors (hex values converted to decimal)
    colors: {
        morning: parseInt(process.env.MORNING_COLOR || '3498db', 16), // Blue
        evening: parseInt(process.env.EVENING_COLOR || 'e74c3c', 16), // Red/Orange
        success: parseInt(process.env.SUCCESS_COLOR || '2ecc71', 16), // Green
        warning: parseInt(process.env.WARNING_COLOR || 'f39c12', 16), // Orange
    },
    
    // Custom messages
    messages: {
        morningGreeting: process.env.MORNING_GREETING || 'Good morning team! Time for our morning DSU check-in.',
        eveningGreeting: process.env.EVENING_GREETING || 'Good evening team! Let\'s wrap up the day with our evening reflection.',
        morningFooter: process.env.MORNING_FOOTER || '💡 Reply to this message with your updates | Automated DSU Bot',
        eveningFooter: process.env.EVENING_FOOTER || '🌙 Have a great evening! | Automated DSU Bot'
    }
};

// Helper functions
const getCurrentDate = () => {
    const now = new Date();
    const options = { 
        timeZone: DSU_CONFIG.timezone,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    return now.toLocaleDateString('en-US', options);
};

const getCurrentTime = () => {
    const now = new Date();
    const options = {
        timeZone: DSU_CONFIG.timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    return now.toLocaleTimeString('en-US', options);
};

const buildMentionString = () => {
    let mentions = [];
    
    if (DSU_CONFIG.mentions.everyone) {
        mentions.push('@everyone');
    }
    
    if (DSU_CONFIG.mentions.here) {
        mentions.push('@here');
    }
    
    // Add role mentions
    DSU_CONFIG.mentions.roles.forEach(roleId => {
        if (roleId.trim()) {
            mentions.push(`<@&${roleId.trim()}>`);
        }
    });
    
    // Add user mentions
    DSU_CONFIG.mentions.users.forEach(userId => {
        if (userId.trim()) {
            mentions.push(`<@${userId.trim()}>`);
        }
    });
    
    return mentions.length > 0 ? mentions.join(' ') + ' ' : '';
};

// =================================================================
// MORNING DSU TEMPLATE (Yesterday/Today/Blockers)
// =================================================================

const getMorningTemplate = () => {
    const currentDate = getCurrentDate();
    const currentTime = getCurrentTime();
    const mentions = buildMentionString();
    
    return {
        content: mentions, // Mentions go in content, not embed
        embeds: [{
            title: "🌅 **Daily Standup Update - Morning**",
            description: `${DSU_CONFIG.messages.morningGreeting}\n\n**📅 ${currentDate}** • **🕘 ${currentTime} WIB**`,
            color: DSU_CONFIG.colors.morning,
            fields: [
                {
                    name: "🔙 **What did you do yesterday?**",
                    value: `> *Share your accomplishments and completed tasks from yesterday*\n\n` +
                           `**Examples:**\n` +
                           `• ✅ Completed feature XYZ implementation\n` +
                           `• 🐛 Fixed critical bug in payment system\n` +
                           `• 📊 Finished Q3 performance analysis\n` +
                           `• 🤝 Had client meeting about requirements\n\n` +
                           `**📝 Your turn:** *Reply with your yesterday's accomplishments...*`,
                    inline: false
                },
                {
                    name: "🎯 **What will you do today?**", 
                    value: `> *Outline your goals and planned tasks for today*\n\n` +
                           `**Examples:**\n` +
                           `• 🚀 Deploy new feature to staging\n` +
                           `• 📋 Review PR#123 for authentication module\n` +
                           `• 🎨 Design mockups for dashboard redesign\n` +
                           `• 📞 Schedule follow-up call with stakeholders\n\n` +
                           `**📝 Your turn:** *Reply with today's priorities...*`,
                    inline: false
                },
                {
                    name: "🚧 **Any blockers or challenges?**",
                    value: `> *Identify obstacles that need team support or attention*\n\n` +
                           `**Examples:**\n` +
                           `• ⏳ Waiting for API documentation from backend team\n` +
                           `• 🔒 Need access to production logs for debugging\n` +
                           `• ❓ Unclear requirements for user permissions\n` +
                           `• 🤝 Need code review from senior developer\n\n` +
                           `**📝 Your turn:** *Reply with any blockers or say "No blockers"...*`,
                    inline: false
                }
            ],
            footer: {
                text: DSU_CONFIG.messages.morningFooter,
                icon_url: null
            },
            timestamp: new Date().toISOString()
        }]
    };
};

// =================================================================
// EVENING DSU TEMPLATE (Completed/Tomorrow/Reflection)
// =================================================================

const getEveningTemplate = () => {
    const currentDate = getCurrentDate();
    const currentTime = getCurrentTime();
    const mentions = buildMentionString();
    
    return {
        content: mentions, // Mentions go in content, not embed
        embeds: [{
            title: "🌆 **Daily Standup Update - Evening**",
            description: `${DSU_CONFIG.messages.eveningGreeting}\n\n**📅 ${currentDate}** • **🕘 ${currentTime} WIB**`,
            color: DSU_CONFIG.colors.evening,
            fields: [
                {
                    name: "✅ **What did you complete today?**",
                    value: `> *Celebrate your accomplishments and finished tasks*\n\n` +
                           `**Examples:**\n` +
                           `• 🎉 Successfully deployed v2.1 to production\n` +
                           `• ✍️ Completed documentation for API endpoints\n` +
                           `• 🎨 Finished UI components for user dashboard\n` +
                           `• 🐛 Resolved 3 critical bugs in authentication\n\n` +
                           `**📝 Your turn:** *Reply with today's achievements...*`,
                    inline: false
                },
                {
                    name: "🔄 **What's still in progress?**",
                    value: `> *Update the team on ongoing work and partial completions*\n\n` +
                           `**Examples:**\n` +
                           `• 🔨 Database migration 70% complete\n` +
                           `• 📋 Code review in progress for PR#145\n` +
                           `• 🧪 Testing new payment integration\n` +
                           `• 💬 Ongoing discussion with client about scope\n\n` +
                           `**📝 Your turn:** *Reply with work in progress...*`,
                    inline: false
                },
                {
                    name: "📋 **What's planned for tomorrow?**",
                    value: `> *Share your priorities and goals for the next day*\n\n` +
                           `**Examples:**\n` +
                           `• 🚀 Start implementing user notification system\n` +
                           `• 📊 Analyze performance metrics from today's deployment\n` +
                           `• 🤝 Meet with product team for sprint planning\n` +
                           `• 🔍 Investigate reported performance issues\n\n` +
                           `**📝 Your turn:** *Reply with tomorrow's plans...*`,
                    inline: false
                },
                {
                    name: "💭 **Any reflections or learnings?**",
                    value: `> *Share insights, lessons learned, or suggestions for improvement*\n\n` +
                           `**Examples:**\n` +
                           `• 💡 Learned new debugging technique for async issues\n` +
                           `• 🎯 Code reviews are more effective in smaller chunks\n` +
                           `• 🤝 Pair programming helped solve complex algorithm\n` +
                           `• 📈 Our testing process caught 5 bugs before production\n\n` +
                           `**📝 Your turn:** *Reply with insights or say "No reflections"...*`,
                    inline: false
                }
            ],
            footer: {
                text: DSU_CONFIG.messages.eveningFooter,
                icon_url: null
            },
            timestamp: new Date().toISOString()
        }]
    };
};

// =================================================================
// ALTERNATIVE TEMPLATES & CUSTOMIZATION
// =================================================================

// Simple text versions (fallback for servers that don't support embeds)
const getMorningTemplateText = () => {
    const currentDate = getCurrentDate();
    const currentTime = getCurrentTime();
    const mentions = buildMentionString();
    
    return `${mentions}🌅 **Daily Standup Update - Morning** 
📅 ${currentDate} • 🕘 ${currentTime} WIB

${DSU_CONFIG.messages.morningGreeting}

**🔙 What did you do yesterday?**
• ✅ [Your accomplishments from yesterday]
• 🎯 [Tasks you completed]
• 🐛 [Issues you resolved]

**🎯 What will you do today?**
• 🚀 [Today's main goals]
• 📋 [Planned tasks and priorities]
• 🔨 [Projects you'll work on]

**🚧 Any blockers or challenges?**
• ⏳ [Current blockers or dependencies]
• 🆘 [Help needed from team]
• ❓ [Questions or unclear requirements]

${DSU_CONFIG.messages.morningFooter}`;
};

const getEveningTemplateText = () => {
    const currentDate = getCurrentDate();
    const currentTime = getCurrentTime();
    const mentions = buildMentionString();
    
    return `${mentions}🌆 **Daily Standup Update - Evening**
📅 ${currentDate} • 🕘 ${currentTime} WIB

${DSU_CONFIG.messages.eveningGreeting}

**✅ What did you complete today?**
• 🎉 [Tasks you finished]
• ⭐ [Goals you achieved]
• 🐛 [Issues you resolved]

**🔄 What's still in progress?**
• 🔨 [Ongoing tasks]
• 📋 [Work in progress]
• 🧪 [Testing or reviews pending]

**📋 What's planned for tomorrow?**
• 🚀 [Tomorrow's priorities]
• 🎯 [Next day goals]
• 📞 [Scheduled meetings or activities]

**💭 Any reflections or learnings?**
• 💡 [What went well today]
• 🔄 [What could be improved]
• 📚 [Key learnings or insights]

${DSU_CONFIG.messages.eveningFooter}`;
};

// =================================================================
// COMPACT TEMPLATES (for teams preferring shorter messages)
// =================================================================

const getMorningTemplateCompact = () => {
    const currentDate = getCurrentDate();
    const mentions = buildMentionString();
    
    return {
        content: mentions,
        embeds: [{
            title: "🌅 Morning DSU",
            description: `**${currentDate}** - Share your updates!`,
            color: DSU_CONFIG.colors.morning,
            fields: [
                {
                    name: "🔙 Yesterday",
                    value: "*What did you accomplish?*",
                    inline: true
                },
                {
                    name: "🎯 Today", 
                    value: "*What are your goals?*",
                    inline: true
                },
                {
                    name: "🚧 Blockers",
                    value: "*Any obstacles?*",
                    inline: true
                }
            ],
            footer: {
                text: "💡 Reply with your updates",
                icon_url: null
            },
            timestamp: new Date().toISOString()
        }]
    };
};

const getEveningTemplateCompact = () => {
    const currentDate = getCurrentDate();
    const mentions = buildMentionString();
    
    return {
        content: mentions,
        embeds: [{
            title: "🌆 Evening DSU",
            description: `**${currentDate}** - Wrap up your day!`,
            color: DSU_CONFIG.colors.evening,
            fields: [
                {
                    name: "✅ Completed",
                    value: "*What did you finish?*",
                    inline: true
                },
                {
                    name: "📋 Tomorrow",
                    value: "*What's planned?*", 
                    inline: true
                },
                {
                    name: "💭 Reflections",
                    value: "*Any learnings?*",
                    inline: true
                }
            ],
            footer: {
                text: "🌙 Have a great evening!",
                icon_url: null
            },
            timestamp: new Date().toISOString()
        }]
    };
};

// =================================================================
// TEMPLATE CUSTOMIZATION FUNCTIONS
// =================================================================

const getCustomTemplate = (templateType, customConfig = {}) => {
    // Merge custom config with defaults
    const config = { ...DSU_CONFIG, ...customConfig };
    
    if (templateType === 'morning') {
        return getMorningTemplate();
    } else if (templateType === 'evening') {
        return getEveningTemplate();
    } else if (templateType === 'morning-compact') {
        return getMorningTemplateCompact();
    } else if (templateType === 'evening-compact') {
        return getEveningTemplateCompact();
    }
    
    throw new Error(`Unknown template type: ${templateType}`);
};

// Template validation function
const validateTemplate = (template) => {
    try {
        if (!template) return false;
        if (template.embeds && Array.isArray(template.embeds)) {
            return template.embeds.every(embed => 
                embed.title && 
                embed.color !== undefined && 
                Array.isArray(embed.fields)
            );
        }
        return typeof template === 'string' && template.length > 0;
    } catch (error) {
        return false;
    }
};

// =================================================================
// EXPORTS
// =================================================================

module.exports = {
    // Main templates
    getMorningTemplate,
    getEveningTemplate,
    
    // Text-only fallback templates
    getMorningTemplateText,
    getEveningTemplateText,
    
    // Compact templates
    getMorningTemplateCompact,
    getEveningTemplateCompact,
    
    // Utility functions
    getCurrentDate,
    getCurrentTime,
    buildMentionString,
    getCustomTemplate,
    validateTemplate,
    
    // Configuration access
    DSU_CONFIG
};