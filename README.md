# UDS Prototype

## Overview

UDS Prototype is a specialized system designed to automate and streamline the Request for Quote (RFQ) process. This application integrates with QuickBooks and marketplace data sources to provide a seamless workflow for handling quotes, orders, and customer requirements.

## Features

- **RFQ Management**: Automated processing and tracking of Request for Quotes
- **QuickBooks Integration**: Sync financial data directly with your accounting system
- **Marketplace Data Integration**: Connect with third-party marketplaces for expanded reach
- **Email Parsing**: Automatically extract and process information from email inquiries
- **User-friendly Dashboard**: Monitor and manage all RFQs in one place
- **Reporting Tools**: Generate insights and analytics on your quote processes

## Tech Stack

- **Frontend**: Next.js with App Router, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Next.js API routes
- **Database**: SQL database with Drizzle ORM
- **Authentication**: NextAuth.js for secure user authentication
- **Email Integration**: API-based email parsing and processing

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-organization/uds-prototype.git
   cd uds-prototype
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   - Copy the `.env.example` file to `.env.local`
   - Fill in the required environment variables

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
uds-prototype/
├── app/                   # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   ├── rfq/               # RFQ management pages
│   └── ...
├── components/            # Reusable React components
│   ├── ui/                # UI components (shadcn/ui)
│   ├── forms/             # Form components
│   └── ...
├── lib/                   # Utility functions and shared code
│   ├── db/                # Database models and connections
│   ├── api/               # API utilities
│   └── ...
├── hooks/                 # Custom React hooks
├── public/                # Static assets
└── ...
```

## Development Guidelines

Please refer to the `PLANNING.md` file for:
- Detailed architecture and design decisions
- Implementation phases
- Technical standards and practices
- Integration specifications

## Contributing

1. Before starting work on a new feature, consult the `PLANNING.md` file
2. Branch from the main branch with a descriptive name
3. Follow the coding standards outlined in `.claude-rules.md`
4. Submit a pull request with a clear description of changes
