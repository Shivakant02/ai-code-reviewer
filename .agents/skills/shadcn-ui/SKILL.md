---
name: shadcn-ui
description: Skill for working with shadcn/ui components in the AI Code Review Assistant frontend. Use this when adding, modifying, or working with UI components.
---

# shadcn/ui Skill

## Overview
This project uses **shadcn/ui** (Base UI + Nova preset) with **TailwindCSS v4** in the frontend (`/frontend`).

## Project Configuration
- **Framework**: Vite + React + TypeScript
- **Component Library**: Base UI (Recommended)
- **Preset**: Nova (Lucide icons / Geist font)
- **Style**: `base-nova`
- **CSS Variables**: Enabled (oklch color space)
- **Icon Library**: Lucide React
- **Import Aliases**: `@/components`, `@/components/ui`, `@/lib`, `@/hooks`
- **Theme**: Light & Dark mode support via `.dark` class on `<html>`

## How to Add Components
Always use the shadcn CLI from the `frontend/` directory:

```bash
cd frontend
npx shadcn@latest add <component-name>
```

For multiple components:
```bash
npx shadcn@latest add button card dialog --yes
```

To search available components:
```bash
npx shadcn@latest search
```

To get docs for a component:
```bash
npx shadcn@latest docs <component-name>
```

## MCP Server
The shadcn MCP server is configured in `.vscode/mcp.json`. It provides tools to:
- Browse available components
- Get component documentation and API references
- Install components directly

## Installed Components
The following shadcn/ui components are installed:
- `button` - Clickable buttons with variants
- `card` - Container with header, content, footer
- `badge` - Status and label badges
- `dialog` - Modal dialogs
- `dropdown-menu` - Dropdown context menus
- `separator` - Visual dividers
- `avatar` - User profile avatars
- `tooltip` - Hover tooltips (requires `TooltipProvider`)
- `scroll-area` - Custom scrollbar areas
- `switch` - Toggle switches
- `sheet` - Slide-out panels
- `skeleton` - Loading placeholders
- `table` - Data tables
- `tabs` - Tab navigation

## Theme Variables
Colors use **oklch** color space defined in `src/index.css`:
- `--primary`: Purple/blue accent (oklch 0.45 0.2 265 light / 0.65 0.2 265 dark)
- `--destructive`: Red for errors
- `--muted`: Subtle backgrounds
- Custom chart colors for data visualization

## Key Patterns
1. Import components from `@/components/ui/<name>`
2. Use `cn()` from `@/lib/utils` for conditional classNames
3. Wrap app with `<TooltipProvider>` for tooltip support
4. Toggle dark mode by adding/removing `dark` class on `<html>` element
5. Use `class-variance-authority` (cva) for component variants
