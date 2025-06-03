# Tech Context

## Technologies Used
- Frontend: React 18+ with Next.js (App Router)
- Backend: Node.js/Express API
- Database: PostgreSQL
- Authentication: JWT or OAuth2
- **UI Framework**: Tailwind CSS with shadcn/ui component library (STANDARD)
- **Table Components**: shadcn/ui Table components (MANDATORY for consistency)
- **Alternative Tables**: PrimeReact DataTable (EXCEPTION CASE ONLY with approval)
- State Management: React Context API (Currency Context, etc.)
- Data Handling: XLSX library for Excel export/import
- Integration: QuickBooks API, external marketplace APIs (planned)
- Data Extraction: Email and Excel parsing libraries (planned)
- Deployment: Docker, cloud hosting (AWS, Azure, etc.)

## Development Setup
- Node.js and npm for package management
- Next.js development server with hot reload
- TypeScript for type safety
- Version control with Git
- Environment variables for configuration
- ESLint and Prettier for code quality
- **Documentation Standards**: .cursorrules for project intelligence patterns

## Technical Constraints
- Must support secure data handling and API integrations
- Should be scalable for increased usage and new integrations
- Responsive design for multiple device types
- **CRITICAL**: All financial data must handle null/undefined/NaN gracefully
- **MANDATORY**: Use shadcn/ui Table components unless advanced features require PrimeReact
- **REQUIRED**: Document all architectural decisions in .cursorrules and memory bank
- Error boundaries required to prevent application crashes

## Dependencies
- Next.js, React, TypeScript
- Tailwind CSS, shadcn/ui components (PRIMARY)
- PrimeReact (EXCEPTION CASE ONLY)
- XLSX for Excel operations
- Lucide React for icons
- sonner for toast notifications
- Database drivers, authentication libraries
- QuickBooks SDK, email/Excel parsing libraries (planned)
- Docker for containerization

## Error Handling Standards
- All numeric values must use fallback patterns (|| 0)
- Currency formatting must handle invalid inputs gracefully
- React components must implement defensive programming
- API responses should be validated before use
- **TABLE SAFETY**: All table cells must handle null/undefined data gracefully

## Documentation Requirements
- **PROJECT INTELLIGENCE**: All patterns documented in .cursorrules
- **ARCHITECTURAL DECISIONS**: Component library choices must be documented
- **CONSISTENCY ENFORCEMENT**: Deviations from standards require approval and documentation
- **MEMORY BANK MAINTENANCE**: Regular updates to reflect current project state 