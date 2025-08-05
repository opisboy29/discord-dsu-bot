Show help for the session management system:

## Session Management Commands

The session system helps document development work for future reference.

### Available Commands:

- `/start [name]` - Start a new session with optional name
- `/update [notes]` - Add notes to current session  
- `/end` - End session with comprehensive summary
- `/list` - List all session files
- `/current` - Show current session status
- `/help` - Show this help

### How It Works:

1. Sessions are markdown files in `.claude/sessions/`
2. Files use `YYYY-MM-DD-HHMM-name.md` format
3. Only one session can be active at a time
4. Sessions track progress, issues, solutions, and learnings

### Best Practices:

- Start a session when beginning significant work
- Update regularly with important changes or findings
- End with thorough summary for future reference
- Review past sessions before starting similar work

### Example Workflow:

```
/start refactor-auth
/update Added Google OAuth restriction
/update Fixed Next.js 15 params Promise issue  
/end
```