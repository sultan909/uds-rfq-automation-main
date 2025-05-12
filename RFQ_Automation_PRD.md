# Product Requirements Document (PRD)

## 1. Overview

Client operates in the gray market of the toner industry and requires an automated system to streamline their RFQ (Request for Quote) process. The system will integrate with QuickBooks via API and external marketplace-style websites to enhance pricing and inventory decision-making.

## 2. Objectives

- Automate data extraction from customer RFQs, QuickBooks and external sources.
- Provide SKU details, customer details and pricing recommendations.
- Assist in pricing for RFQ responses by providing relevant customer, inventory and marketplace information.
- Improve efficiency through a responsive web-based dashboard with analytic capabilities.

## 3. Key Features

### 3.1 Data Integration & Sources

- Seamlessly extract inventory and sales data from QuickBooks via API.
- Integrate with external marketplace-style websites to track SKU pricing.

### 3.2 RFQ Automation & Assistance

- Easily process RFQs received via phone, email (text and/or Excel attachments).
- Identify non-standard SKUs and retain customer SKU mapping database.
- Recommend pricing based on historical customer sales data, inventory costs and market trends.
- Toggle between CAD and USD in dashboards.
- Allow users to manually update price and quantities before finalizing quotes.
- Enable hyperlinks to QuickBooks for data drill downs.
- Create, edit and save different RFQ templates.
- Extract quotes to PDF, Excel or Image to paste into email.

### 3.3 Reporting & Dashboard

- Provide a responsive, secure cloud-based dashboard for real-time data visualization.
- Include user authentication and login capabilities.
- Allow users to sort and filter data by RFQ status, SKU, dates, customer, customer type, and totals.
- Support data export to Excel.

### 3.4 User Access & Roles

- Implement login authentication with a single user role for now.
- Secure access to the system with password-protected accounts.

## 4. User Epics for Client RFQ Automation System

User epics are high-level categories that group related user stories together. They represent larger features or functions within a system that address a specific business need. Each epic is broken down into smaller, more detailed user stories that describe individual tasks or actions users can perform.

### RFQ Management

**Receive & Process RFQs**
- As a user, I can easily extract RFQ data from emails and Excel attachments so that I do not have to manually input requests.
- As a user, I can manually enter RFQs received via phone so that all RFQs are tracked in one place.
- As a user, I can see missing or inconsistent SKU data flagged automatically so that I can correct them quickly.

**SKU Variation Matching**
- As a user, I can receive suggestions for the correct standard SKU when dealing with a non-standard SKU so that I can respond to RFQs accurately.
- As a user, I can filter and search SKUs based on attributes such as stock level and pricing history so that I can make informed decisions.

### Pricing & Quotation

**Currency Management**
- As a user, I can toggle between CAD and USD in pricing views so that I can handle international transactions efficiently.
- As a user, I can track previously declined RFQs and prices so that I can adjust my pricing strategy.

**Market Data Integration**
- As a user, I can track real-time SKU prices and availability from external sources so that I can stay competitive.

### Reporting & Insights

**Data Visualization**
- As a user, I can view a dashboard displaying historical RFQ trends, sales data, and SKU performance so that I can make data-driven decisions.
- As a user, I can click on sales history data points to see customer and SKU specific purchase trends so that I can tailor my sales approach.

**RFQ Templates & Export**
- As a user, I can create, edit and save different RFQ templates so that I can have my favorite columns saved for different uses.
- As a user, I can export RFQ and dashboard info into Excel so that I can easily share and analyze data.

### Authentication & Security

**System Access**
- As a user, I can securely log in to the system so that only authorized personnel can access sensitive data.
- As a user, I can access only relevant data based on my role so that security and confidentiality are maintained.

### System Performance & Reliability

**Speed & Availability**
- As a user, I can process RFQs within seconds so that I can respond quickly to customer inquiries.
- As a user, I can rely on 99.9% system uptime so that my business operations are never disrupted.

## 5. Dashboard Features, Fields, and Views

Based on the guidance provided and needs expressed by Client, the solution, and its dashboard, will include the following fields of information:

### Pricing

- Historical RFQs and quotes
  - RFQ ID
  - Date received
  - Date quote sent
  - Customer
  - Total SKU
  - Total request
  - Total quote
  - Status
- Currency toggle
- Create new RFQ

### Inventory

- By SKU
- Purchase info
- Sales info
- Stock info
- Revenue by SKU
- Requested units by month
- Units sold per month
- Quantity info
- Missed opportunities
- Low inventory (alert)
- Images
- Add New SKU

### Customer

- Name
- Type
- Sales
- No. of RFQs
- No. of Quotes
- Create new customer

### RFQs

- Customer name
- Costs by SKU
- Stock
- Stock in transit
- SKU ID
- Requested price
- Requested quantity
- Quantity purchased - Last three months
- Quantity purchased - LTM
- Customer
- Customer Type
- Customer last purchased date
- Customer last price paid
- Market pricing
- Notes/comments

## 6. Scope Agreement Clause

This document outlines the final scope of work for the project, as agreed upon by all parties. Any features, functionalities, or modifications beyond what is explicitly detailed in this scope will require a formal change order, subject to additional costs and timeline adjustments.

The client acknowledges that the defined scope meets their requirements and that any requested changes or additions after signing will not be included in the initial project delivery without a separate written agreement.

This agreement supersedes all prior discussions, proposals, or understandings related to the project scope.

## 7. Change Order Addendum: RFQ to QuickBooks Integration

### Executive Summary
As part of the evolving needs identified during the RFQ automation project's Discovery stage, the client has requested an extension to the existing workflow. The proposed enhancement will enable accepted RFQs to be pushed into QuickBooks in order to automatically generate estimates. This document outlines the scope, cost, and timeline impact of this change request.

### Scope of Work

The following functionality will be delivered under this change:

- Develop functionality to push RFQ data (SKUs, quantities, pricing, customer details) into QuickBooks.
- Mapping of RFQ data (SKU, quantity, pricing, customer info) to QuickBooks estimate fields.
- Implement error handling and confirmation for successful estimate creation.
- Testing and validation to ensure data accuracy and integrity between systems.
- Update user interface to trigger the pushback operation.
- Documentation of the integration steps and system behavior.
