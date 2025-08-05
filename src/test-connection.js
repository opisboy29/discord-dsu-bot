#!/usr/bin/env node

require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

console.log('🔍 Testing Discord Bot Connection...\n');

// Check environment variables
console.log('📋 Environment Configuration:');
console.log(`   DISCORD_BOT_TOKEN: ${process.env.DISCORD_BOT_TOKEN ? '✅ Set' : '❌ Missing'}`);
console.log(`   DSU_CHANNEL_ID: ${process.env.DSU_CHANNEL_ID ? '✅ Set' : '❌ Missing'}`);
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}\n`);

if (!process.env.DISCORD_BOT_TOKEN) {
    console.error('❌ DISCORD_BOT_TOKEN is not set in environment variables');
    console.log('💡 Please check your .env file configuration');
    process.exit(1);
}

if (!process.env.DSU_CHANNEL_ID) {
    console.error('❌ DSU_CHANNEL_ID is not set in environment variables');
    console.log('💡 Please add your Discord channel ID to .env file');
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

let testResults = {
    connection: false,
    channelAccess: false,
    permissions: false
};

client.once('ready', async () => {
    console.log('✅ Bot Connection Successful!');
    console.log(`   Bot Name: ${client.user.tag}`);
    console.log(`   Bot ID: ${client.user.id}`);
    console.log(`   Guilds: ${client.guilds.cache.size} server(s)\n`);
    
    testResults.connection = true;

    // Test channel access
    console.log('🔍 Testing Channel Access...');
    try {
        const channel = await client.channels.fetch(process.env.DSU_CHANNEL_ID);
        
        if (!channel) {
            console.error('❌ Channel not found or bot doesn\'t have access');
            console.log('💡 Check if bot is invited to server and channel ID is correct');
        } else {
            console.log('✅ Channel Access Successful!');
            console.log(`   Channel: #${channel.name}`);
            console.log(`   Guild: ${channel.guild.name}`);
            console.log(`   Type: ${channel.type}\n`);
            
            testResults.channelAccess = true;

            // Test permissions
            console.log('🔍 Testing Bot Permissions...');
            
            const permissions = channel.permissionsFor(client.user);
            const requiredPermissions = [
                'SendMessages',
                'ViewChannel',
                'EmbedLinks'
            ];

            let hasAllPermissions = true;
            
            for (const permission of requiredPermissions) {
                const hasPermission = permissions.has(permission);
                console.log(`   ${hasPermission ? '✅' : '❌'} ${permission}`);
                if (!hasPermission) hasAllPermissions = false;
            }

            if (hasAllPermissions) {
                console.log('✅ All required permissions granted!\n');
                testResults.permissions = true;

                // Test message sending
                console.log('🔍 Testing Message Sending...');
                try {
                    const testMessage = await channel.send({
                        embeds: [{
                            title: '🧪 Bot Connection Test',
                            description: 'This is a test message to verify bot functionality.',
                            color: 0x00ff00,
                            fields: [
                                {
                                    name: '✅ Connection Status',
                                    value: 'Bot is working correctly!',
                                    inline: false
                                },
                                {
                                    name: '🕒 Test Time',
                                    value: new Date().toLocaleString('en-US', {
                                        timeZone: 'Asia/Jakarta',
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    }),
                                    inline: false
                                }
                            ],
                            footer: {
                                text: 'Automated DSU Bot - Connection Test'
                            },
                            timestamp: new Date().toISOString()
                        }]
                    });

                    console.log('✅ Test message sent successfully!');
                    console.log(`   Message ID: ${testMessage.id}\n`);

                    // Clean up test message after 5 seconds
                    setTimeout(async () => {
                        try {
                            await testMessage.delete();
                            console.log('🧹 Test message cleaned up');
                        } catch (error) {
                            console.log('⚠️  Could not delete test message (this is normal)');
                        }
                        
                        printTestSummary();
                        process.exit(0);
                    }, 5000);

                } catch (error) {
                    console.error('❌ Failed to send test message:', error.message);
                    printTestSummary();
                    process.exit(1);
                }
            } else {
                console.log('❌ Missing required permissions!\n');
                console.log('💡 To fix permissions:');
                console.log('   1. Go to your Discord server');
                console.log('   2. Check bot role permissions');
                console.log('   3. Ensure bot has required permissions in the channel');
                printTestSummary();
                process.exit(1);
            }
        }
    } catch (error) {
        console.error('❌ Channel access failed:', error.message);
        console.log('💡 Common issues:');
        console.log('   - Incorrect channel ID');
        console.log('   - Bot not invited to server');
        console.log('   - Bot doesn\'t have access to channel\n');
        printTestSummary();
        process.exit(1);
    }
});

client.on('error', (error) => {
    console.error('❌ Discord client error:', error);
    printTestSummary();
    process.exit(1);
});

function printTestSummary() {
    console.log('\n📊 Test Summary:');
    console.log(`   Connection: ${testResults.connection ? '✅ Pass' : '❌ Fail'}`);
    console.log(`   Channel Access: ${testResults.channelAccess ? '✅ Pass' : '❌ Fail'}`);
    console.log(`   Permissions: ${testResults.permissions ? '✅ Pass' : '❌ Fail'}`);
    
    const allPassed = testResults.connection && testResults.channelAccess && testResults.permissions;
    console.log(`\n🎯 Overall Result: ${allPassed ? '✅ All Tests Passed!' : '❌ Some Tests Failed'}`);
    
    if (allPassed) {
        console.log('\n🚀 Your bot is ready for production!');
        console.log('   Run "npm start" to start the DSU automation');
    } else {
        console.log('\n🔧 Please fix the issues above before running the bot');
    }
}

// Login and start test
console.log('🔌 Attempting to connect to Discord...\n');

client.login(process.env.DISCORD_BOT_TOKEN)
    .catch(error => {
        console.error('❌ Failed to login to Discord:', error.message);
        console.log('\n💡 Common login issues:');
        console.log('   - Invalid bot token');
        console.log('   - Bot token not set in .env file');
        console.log('   - Network connectivity issues');
        printTestSummary();
        process.exit(1);
    });

// Timeout after 30 seconds
setTimeout(() => {
    console.error('⏰ Connection test timed out after 30 seconds');
    printTestSummary();
    process.exit(1);
}, 30000);