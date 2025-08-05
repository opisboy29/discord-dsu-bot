# 📅 DSU Scheduling System Documentation

**Author**: opisboy29  
**Repository**: [discord-dsu-bot](https://github.com/opisboy29/discord-dsu-bot)

Complete guide to the Discord DSU Bot's intelligent scheduling system with timezone handling and weekday-only logic.

## 🎯 Overview

The DSU Bot uses **node-cron** with **Asia/Jakarta timezone** to automatically send Daily Standup Update reminders at:
- **🌅 Morning DSU**: 9:00 AM WIB (Monday-Friday)
- **🌆 Evening DSU**: 5:00 PM WIB (Monday-Friday)

## ⏰ Cron Configuration

### Default Schedule
```javascript
// Morning DSU: 9:00 AM WIB, Weekdays only
MORNING_SCHEDULE=0 9 * * 1-5

// Evening DSU: 5:00 PM WIB, Weekdays only  
EVENING_SCHEDULE=0 17 * * 1-5
```

### Cron Format Explanation
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of Week (0-7, Sun-Sat)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of Month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

### Examples
- `0 9 * * 1-5` = 9:00 AM, Monday through Friday
- `0 17 * * 1-5` = 5:00 PM, Monday through Friday
- `30 8 * * 1-5` = 8:30 AM, Monday through Friday
- `0 9 * * *` = 9:00 AM, Every day

## 🌏 Timezone Handling

### WIB (Asia/Jakarta) Configuration
```javascript
// Environment variable
TIMEZONE=Asia/Jakarta

// Used throughout the system
const timezone = process.env.TIMEZONE || 'Asia/Jakarta';
```

### Timezone Features
- **Accurate Local Time**: All scheduling based on WIB timezone
- **Weekday Detection**: Uses local timezone for accurate day calculation
- **Logging**: Timestamps in WIB for consistent logging
- **Status Reporting**: Current time displayed in WIB

### Time Zone Conversion Examples
| WIB Time | UTC Time | Description |
|----------|----------|-------------|
| 9:00 AM  | 2:00 AM  | Morning DSU |
| 5:00 PM  | 10:00 AM | Evening DSU |
| 12:00 PM | 5:00 AM  | Noon |
| 12:00 AM | 5:00 PM  | Midnight |

## 📅 Weekday-Only Logic

### Implementation
```javascript
isWeekday() {
    const now = new Date();
    const localTime = new Date(now.toLocaleString('en-US', { timeZone: this.timezone }));
    const dayOfWeek = localTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday through Friday
}
```

### Weekday Schedule
- ✅ **Monday** (1) - DSU Sent
- ✅ **Tuesday** (2) - DSU Sent  
- ✅ **Wednesday** (3) - DSU Sent
- ✅ **Thursday** (4) - DSU Sent
- ✅ **Friday** (5) - DSU Sent
- ❌ **Saturday** (6) - Skipped
- ❌ **Sunday** (0) - Skipped

### Weekend Handling
```javascript
// Automatic weekend detection and skipping
if (this.isWeekday()) {
    await this.sendMorningDSU();
} else {
    logger.info('🚫 Skipping morning DSU - Weekend detected');
}
```

## 🔧 Configuration Options

### Environment Variables
```env
# Timezone Configuration
TIMEZONE=Asia/Jakarta

# Custom Schedule Override
MORNING_SCHEDULE=0 9 * * 1-5
EVENING_SCHEDULE=0 17 * * 1-5

# Enable/Disable Scheduling (for testing)
ENABLE_SCHEDULING=true
```