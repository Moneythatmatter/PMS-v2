<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:module-isolation-rules -->
### Module Isolation Constraint
- When working on a specific PMS module (e.g., Maintenance, Front Office, Housekeeping, Sales & Marketing, POS), do NOT modify files or components in other modules.
- Confine all code changes, component edits, and additions strictly to the designated module's directory and its dedicated data/types unless explicitly instructed by the user.
<!-- END:module-isolation-rules -->
