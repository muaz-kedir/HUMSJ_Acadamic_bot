# Contributing to Telegram Bot Starter

Thank you for your interest in improving this template!

## How to Contribute

### Reporting Issues

- Check if the issue already exists
- Provide clear reproduction steps
- Include your environment (OS, Node version, etc.)

### Suggesting Features

- Explain the use case
- Describe the expected behavior
- Consider if it fits the "starter template" scope

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Test thoroughly
5. Update documentation
6. Commit with clear messages
7. Push and create a PR

## Development Guidelines

### Code Style

- Follow existing code patterns
- Use TypeScript strict mode
- Add comments for complex logic
- Run `npm run lint` before committing
- Format with `npm run format`

### Testing Changes

Before submitting:

```bash
# Clean environment
rm -rf node_modules dist .env
docker rm -f telegram_bot_db

# Test setup script
./setup.sh

# Verify bot works
npm run dev
# Test /start command and message echo
```

### Documentation

- Update README.md for user-facing changes
- Update TEMPLATE_USAGE.md for template usage
- Add JSDoc comments for new functions
- Include examples where helpful

## Template Philosophy

This is a **starter template**, not a full framework. Keep it:

- ✅ Simple and minimal
- ✅ Well-documented
- ✅ Production-ready
- ✅ Easy to customize
- ❌ Not over-engineered
- ❌ Not opinionated about features
- ❌ Not bloated with dependencies

## Questions?

Open an issue for discussion before major changes.

Thank you for contributing! 🙏
