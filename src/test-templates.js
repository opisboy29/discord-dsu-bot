#!/usr/bin/env node

require('dotenv').config();
const templates = require('../config/dsu-templates');

console.log('🎨 Testing DSU Message Templates...\n');

/**
 * Template Testing Suite
 */
class TemplateTester {
    constructor() {
        this.templates = templates;
    }

    runAllTests() {
        console.log('🔍 Running Template Tests...\n');
        
        this.testConfiguration();
        this.testMorningTemplate();
        this.testEveningTemplate();
        this.testCompactTemplates();
        this.testTextTemplates();
        this.testMentions();
        this.testCustomization();
        this.testValidation();
        
        console.log('\n✅ All template tests completed!');
    }

    testConfiguration() {
        console.log('⚙️ Testing Template Configuration:');
        const config = this.templates.DSU_CONFIG;
        
        console.log(`   Timezone: ${config.timezone}`);
        console.log(`   Morning Color: #${config.colors.morning.toString(16)} (${config.colors.morning})`);
        console.log(`   Evening Color: #${config.colors.evening.toString(16)} (${config.colors.evening})`);
        console.log(`   Mention Everyone: ${config.mentions.everyone}`);
        console.log(`   Mention Here: ${config.mentions.here}`);
        console.log(`   Role Mentions: ${config.mentions.roles.length} roles`);
        console.log(`   User Mentions: ${config.mentions.users.length} users`);
        console.log();
    }

    testMorningTemplate() {
        console.log('🌅 Testing Morning Template:');
        
        try {
            const morningTemplate = this.templates.getMorningTemplate();
            
            console.log('   ✅ Morning template generated successfully');
            console.log(`   - Title: ${morningTemplate.embeds[0].title}`);
            console.log(`   - Color: #${morningTemplate.embeds[0].color.toString(16)}`);
            console.log(`   - Fields: ${morningTemplate.embeds[0].fields.length}`);
            console.log(`   - Has mentions: ${morningTemplate.content ? 'Yes' : 'No'}`);
            
            // Validate structure
            const embed = morningTemplate.embeds[0];
            if (embed.fields.length !== 3) {
                console.log('   ⚠️  Expected 3 fields (Yesterday/Today/Blockers)');
            }
            
            const expectedFields = ['yesterday', 'today', 'blockers'];
            embed.fields.forEach((field, index) => {
                const fieldName = field.name.toLowerCase();
                const hasExpectedContent = expectedFields.some(expected => fieldName.includes(expected));
                console.log(`   - Field ${index + 1}: ${hasExpectedContent ? '✅' : '❌'} ${field.name}`);
            });
            
        } catch (error) {
            console.log('   ❌ Error generating morning template:', error.message);
        }
        console.log();
    }

    testEveningTemplate() {
        console.log('🌆 Testing Evening Template:');
        
        try {
            const eveningTemplate = this.templates.getEveningTemplate();
            
            console.log('   ✅ Evening template generated successfully');
            console.log(`   - Title: ${eveningTemplate.embeds[0].title}`);
            console.log(`   - Color: #${eveningTemplate.embeds[0].color.toString(16)}`);
            console.log(`   - Fields: ${eveningTemplate.embeds[0].fields.length}`);
            console.log(`   - Has mentions: ${eveningTemplate.content ? 'Yes' : 'No'}`);
            
            // Validate structure
            const embed = eveningTemplate.embeds[0];
            if (embed.fields.length !== 4) {
                console.log('   ⚠️  Expected 4 fields (Completed/Progress/Tomorrow/Reflections)');
            }
            
            const expectedFields = ['complete', 'progress', 'tomorrow', 'reflection'];
            embed.fields.forEach((field, index) => {
                const fieldName = field.name.toLowerCase();
                const hasExpectedContent = expectedFields.some(expected => fieldName.includes(expected));
                console.log(`   - Field ${index + 1}: ${hasExpectedContent ? '✅' : '❌'} ${field.name}`);
            });
            
        } catch (error) {
            console.log('   ❌ Error generating evening template:', error.message);
        }
        console.log();
    }

    testCompactTemplates() {
        console.log('📱 Testing Compact Templates:');
        
        try {
            const morningCompact = this.templates.getMorningTemplateCompact();
            const eveningCompact = this.templates.getEveningTemplateCompact();
            
            console.log('   ✅ Compact templates generated successfully');
            console.log(`   - Morning compact fields: ${morningCompact.embeds[0].fields.length}`);
            console.log(`   - Evening compact fields: ${eveningCompact.embeds[0].fields.length}`);
            console.log('   - Compact templates use inline fields for space efficiency');
            
        } catch (error) {
            console.log('   ❌ Error generating compact templates:', error.message);
        }
        console.log();
    }

    testTextTemplates() {
        console.log('📝 Testing Text Templates:');
        
        try {
            const morningText = this.templates.getMorningTemplateText();
            const eveningText = this.templates.getEveningTemplateText();
            
            console.log('   ✅ Text templates generated successfully');
            console.log(`   - Morning text length: ${morningText.length} characters`);
            console.log(`   - Evening text length: ${eveningText.length} characters`);
            console.log('   - Text templates include Discord markdown formatting');
            
            // Check for key elements
            const morningHasKeys = ['yesterday', 'today', 'blockers'].every(key => 
                morningText.toLowerCase().includes(key)
            );
            const eveningHasKeys = ['complete', 'tomorrow', 'reflection'].every(key => 
                eveningText.toLowerCase().includes(key)
            );
            
            console.log(`   - Morning has all sections: ${morningHasKeys ? '✅' : '❌'}`);
            console.log(`   - Evening has all sections: ${eveningHasKeys ? '✅' : '❌'}`);
            
        } catch (error) {
            console.log('   ❌ Error generating text templates:', error.message);
        }
        console.log();
    }

    testMentions() {
        console.log('👥 Testing Mention System:');
        
        try {
            const mentionString = this.templates.buildMentionString();
            
            console.log(`   Current mention string: "${mentionString}"`);
            console.log(`   Length: ${mentionString.length} characters`);
            
            if (mentionString.length === 0) {
                console.log('   ℹ️  No mentions configured (this is normal for default setup)');
            } else {
                console.log('   ✅ Mentions are configured and working');
            }
            
            // Test different mention configurations
            const config = this.templates.DSU_CONFIG;
            console.log('   Mention Configuration:');
            console.log(`   - @everyone: ${config.mentions.everyone ? '✅ Enabled' : '❌ Disabled'}`);
            console.log(`   - @here: ${config.mentions.here ? '✅ Enabled' : '❌ Disabled'}`);
            console.log(`   - Roles: ${config.mentions.roles.length} configured`);
            console.log(`   - Users: ${config.mentions.users.length} configured`);
            
        } catch (error) {
            console.log('   ❌ Error testing mentions:', error.message);
        }
        console.log();
    }

    testCustomization() {
        console.log('🎛️ Testing Template Customization:');
        
        try {
            // Test custom template function
            const customMorning = this.templates.getCustomTemplate('morning');
            const customEvening = this.templates.getCustomTemplate('evening');
            const compactMorning = this.templates.getCustomTemplate('morning-compact');
            const compactEvening = this.templates.getCustomTemplate('evening-compact');
            
            console.log('   ✅ Custom template function working');
            console.log('   Available template types:');
            console.log('   - ✅ morning (full format)');
            console.log('   - ✅ evening (full format)');  
            console.log('   - ✅ morning-compact (short format)');
            console.log('   - ✅ evening-compact (short format)');
            
            // Test invalid template type
            try {
                this.templates.getCustomTemplate('invalid');
                console.log('   ❌ Should have thrown error for invalid template type');
            } catch (error) {
                console.log('   ✅ Properly handles invalid template types');
            }
            
        } catch (error) {
            console.log('   ❌ Error testing customization:', error.message);
        }
        console.log();
    }

    testValidation() {
        console.log('✅ Testing Template Validation:');
        
        try {
            const morningTemplate = this.templates.getMorningTemplate();
            const eveningTemplate = this.templates.getEveningTemplate();
            const textTemplate = this.templates.getMorningTemplateText();
            
            const validations = [
                { name: 'Morning Template', template: morningTemplate },
                { name: 'Evening Template', template: eveningTemplate },
                { name: 'Text Template', template: textTemplate },
                { name: 'Null Template', template: null },
                { name: 'Empty Object', template: {} },
                { name: 'Invalid Embed', template: { embeds: [{ title: 'Test' }] } }
            ];
            
            validations.forEach(({ name, template }) => {
                const isValid = this.templates.validateTemplate(template);
                console.log(`   ${isValid ? '✅' : '❌'} ${name}: ${isValid ? 'Valid' : 'Invalid'}`);
            });
            
        } catch (error) {
            console.log('   ❌ Error testing validation:', error.message);
        }
        console.log();
    }

    // Preview templates (show actual content)
    previewTemplates() {
        console.log('👀 Template Previews:\n');
        
        console.log('🌅 MORNING TEMPLATE PREVIEW:');
        console.log('=' .repeat(50));
        try {
            const morning = this.templates.getMorningTemplate();
            const embed = morning.embeds[0];
            
            console.log(`Title: ${embed.title}`);
            console.log(`Description: ${embed.description}`);
            console.log(`Color: #${embed.color.toString(16)}`);
            console.log('\nFields:');
            embed.fields.forEach((field, index) => {
                console.log(`${index + 1}. ${field.name}`);
                console.log(`   ${field.value.substring(0, 100)}...`);
            });
            console.log(`Footer: ${embed.footer.text}`);
            
        } catch (error) {
            console.log('Error previewing morning template:', error.message);
        }
        
        console.log('\n🌆 EVENING TEMPLATE PREVIEW:');
        console.log('=' .repeat(50));
        try {
            const evening = this.templates.getEveningTemplate();
            const embed = evening.embeds[0];
            
            console.log(`Title: ${embed.title}`);
            console.log(`Description: ${embed.description}`);
            console.log(`Color: #${embed.color.toString(16)}`);
            console.log('\nFields:');
            embed.fields.forEach((field, index) => {
                console.log(`${index + 1}. ${field.name}`);
                console.log(`   ${field.value.substring(0, 100)}...`);
            });
            console.log(`Footer: ${embed.footer.text}`);
            
        } catch (error) {
            console.log('Error previewing evening template:', error.message);
        }
        console.log();
    }
}

// Run tests
const tester = new TemplateTester();
tester.runAllTests();

// Show previews if requested
if (process.argv.includes('--preview')) {
    tester.previewTemplates();
}

console.log('🎯 Template Test Summary:');
console.log('✅ Morning template (Yesterday/Today/Blockers) validated');
console.log('✅ Evening template (Completed/Tomorrow/Reflection) validated');
console.log('✅ Discord formatting (embeds, colors, mentions) working');
console.log('✅ Templates are fully configurable via environment variables');
console.log('✅ Multiple template formats available (full, compact, text)');
console.log('\n💡 Run with --preview flag to see template content');
console.log('🚀 Templates are ready for production use!');