# System Patterns

## System Architecture
- Modular, component-based architecture (React or similar for frontend)
- RESTful or GraphQL API for backend communication
- Database for persistent storage (e.g., PostgreSQL, MongoDB)
- Integration modules for QuickBooks API and external marketplace APIs
- Automated data extraction pipeline for emails and Excel attachments

## Key Technical Decisions
- Emphasis on automation, integration, and data accuracy
- Secure authentication and authorization
- Scalable and maintainable codebase
- Robust error handling for integrations and data extraction
- Data mapping for SKU variations and customer-specific SKUs

## Design Patterns in Use
- MVC (Model-View-Controller) or MVVM for separation of concerns
- Repository pattern for data access
- Observer pattern for real-time updates/notifications
- Adapter pattern for integrating with external APIs (QuickBooks, marketplaces)
- Strategy pattern for pricing recommendations

## Component Relationships
- RFQ Intake Component (handles email, Excel, phone input) interacts with API and Dashboard
- Dashboard aggregates and displays RFQ, inventory, and sales data
- Integration modules synchronize data with QuickBooks and marketplaces
- Notification system observes RFQ status changes and integration events 