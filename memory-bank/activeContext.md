# Active Context

## Current Work Focus
- Implementing and refining customer and inventory management UI, including detail, edit, and history pages.
- Improving sidebar UX: collapsible layout, toggle button placement, and tooltips for navigation clarity.
- Added quote creation workflow: Create Quote page, navigation from RFQ Management and RFQ Detail, and Add New RFQ button.
- Refactored SKU mapping management: reusable dialog for editing, batch update/delete, and customer autocomplete.

## Recent Changes
- Added customer view, edit, and history pages with seamless navigation.
- Implemented SKU item history on inventory detail page.
- Enhanced sidebar: fixed toggle overlap, increased collapsed width, and added tooltips for collapsed nav items.
- Implemented Create Quote page for RFQs, accessible from both RFQ Management and RFQ Detail pages.
- Added 'Add New RFQ' button next to the search button on the RFQ Management page.
- SKU mapping dialog refactored: now supports full CRUD, customer autocomplete, and backend PUT integration.
- AllMappings and RecentlyAdded tabs use the shared dialog and backend sync.

## Next Steps
- Further refine UI/UX based on feedback.
- Continue implementing PRD features and improving accessibility.
- Monitor and optimize backend-frontend sync for SKU mapping.

## Active Decisions and Considerations
- Prioritizing user experience and accessibility in navigation and data management.
- Ensuring all new features are discoverable and easy to use.
- Centralizing quote and SKU mapping management for streamlined RFQ workflows.
- Using full replacement (PUT) for SKU mapping updates to ensure backend consistency. 