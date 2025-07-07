# AGENT.md

## Build/Test/Lint Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx next build` - Type check and build
- No test command configured

## Architecture
- Next.js 13 app router with TypeScript
- Static export configuration (`output: 'export'`)
- `/app` directory structure: `/employee`, `/employer`, `/auth`, `/api`
- API routes in `/app/api`
- Shared components in `/components` (shadcn/ui)
- Custom hooks in `/hooks`
- Types in `/types/index.ts`
- Utilities in `/lib/utils.ts`

## Code Style
- TypeScript strict mode enabled
- Import aliases: `@/*` maps to root
- Component naming: PascalCase
- File naming: kebab-case for pages, PascalCase for components
- Use `cn()` utility for className merging
- Tailwind CSS with custom design tokens
- Client components: `'use client'` directive at top
- Export interfaces from `/types/index.ts`
- Use React.forwardRef for reusable components
