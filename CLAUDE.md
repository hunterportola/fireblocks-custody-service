# Claude Agent Instructions

## Core Philosophy

### Think First, Act Second
- **ALWAYS** think through problems using first principles before implementing
- Apply a "measure twice, cut once" philosophy - plan thoroughly before coding
- Consider edge cases and potential issues before writing any code
- Think about the broader impact of changes on the system

### Simplicity First
- **ALWAYS** make the simplest implementation that solves the problem
- Avoid over-engineering or adding unnecessary complexity
- Follow YAGNI (You Aren't Gonna Need It) principle
- Prefer clarity over cleverness

## Development Practices

### Before Writing Code
1. **Check for existing types** - Never create duplicate types or interfaces
2. **Search for similar implementations** - Reuse existing patterns and utilities
3. **Understand the context** - Read surrounding code and understand the module's purpose
4. **Follow existing patterns** - Match the codebase's conventions and style

### After Making Changes
**MANDATORY**: After modifying ANY file, you MUST run lint checks ON THAT SPECIFIC FILE:
```bash
# Lint only the file you modified
npx eslint path/to/modified/file.ts

# Check TypeScript types for the specific file
npx tsc --noEmit path/to/modified/file.ts
```

**IMPORTANT**: Only lint and typecheck the files YOU modified, not the entire project!

- **Errors in YOUR changes MUST be resolved** before considering the task complete
- Warnings are acceptable but should be minimized where reasonable
- Do NOT attempt to fix pre-existing lint errors in files you didn't modify
- Focus only on ensuring your changes don't introduce new issues

## Specific Commands for This Project

### Linting and Type Checking
```bash
# Check code quality
npm run lint

# Fix auto-fixable lint issues
npm run lint:fix

# Check TypeScript types
npm run typecheck

# Run all CI checks (lint + test + typecheck)
npm run ci
```

### Testing
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Development
```bash
# Start development server
npm run dev

# Build the project
npm run build

# Format code
npm run format
```

## Task Completion Checklist

Before marking any task as complete:
- [ ] Code follows existing patterns and conventions
- [ ] Used existing types instead of creating duplicates
- [ ] Implementation is the simplest solution that works
- [ ] `npm run lint` passes without errors
- [ ] `npm run typecheck` passes without errors
- [ ] Changes have been tested (if applicable)
- [ ] No sensitive information (keys, secrets) in code

## Security Considerations
- Never commit secrets, API keys, or sensitive data
- Always validate and sanitize user inputs
- Follow security best practices for the specific technology stack
- Be mindful of SQL injection, XSS, and other common vulnerabilities

## Communication Style
- Be concise and direct in responses
- Focus on solving the task at hand
- Explain complex decisions briefly
- Avoid unnecessary verbosity

## Remember
1. **Think more** - Take time to understand before acting
2. **Use first principles** - Break down problems to fundamentals
3. **Measure twice, cut once** - Plan thoroughly, implement once
4. **Simplest solution wins** - Avoid complexity
5. **Check existing code** - Reuse types and patterns
6. **Always lint and typecheck** - No exceptions