# 🚀 Complete UDS RFQ Project Setup Guide

## Overview
This guide will help you set up the UDS RFQ Management System from scratch with a fresh database, including all the Enhanced Negotiation System features and seed data.

## Prerequisites
- ✅ Node.js (v18 or higher)
- ✅ PostgreSQL (v12 or higher)
- ✅ npm or pnpm

## 📋 Step-by-Step Setup

### Step 1: Database Preparation
Make sure you have a PostgreSQL database ready and update your connection string in `.env.local`:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/uds_temp
```

### Step 2: Install Dependencies
```bash
cd E:\Web-development-Business\Mai-Automations\Cody-by-client\nabeel\uds-rfq
npm install
```

### Step 3: Setup Database Schema

#### Option A: Automated Setup (Recommended)
Run the PowerShell script:
```powershell
.\setup-database.ps1
```

Or the batch file:
```cmd
setup-database.bat
```

#### Option B: Manual Setup
Run each SQL file in order using psql:
```bash
psql "your_database_url" -f database-setup-part1.sql
psql "your_database_url" -f database-setup-part2.sql
psql "your_database_url" -f database-setup-part3.sql
psql "your_database_url" -f database-setup-part4.sql
psql "your_database_url" -f database-setup-part5.sql
```

### Step 4: Seed the Database
```bash
npm run db:seed
```

This will create:
- **5 users** (admin, manager, sales team, employee)
- **8 customers** (including main customers: Randmar, UGS, DCS)
- **5 vendors**
- **10 inventory items** with realistic SKUs
- **Multiple RFQs** in different statuses
- **50-150 negotiation communications** with professional content
- **30-80 SKU change records** with realistic adjustments
- **Complete business data** for testing all features

### Step 5: Start the Development Server
```bash
npm run dev
```

### Step 6: Access the Application
Open your browser and navigate to:
```
http://localhost:3000
```

## 🔐 Default Login Credentials

After seeding, you can log in with these accounts:

### Admin Account
- **Email**: admin@example.com
- **Password**: Password123!
- **Role**: Admin (full access)

### Manager Account
- **Email**: manager@example.com  
- **Password**: Password123!
- **Role**: Manager (procurement access)

### Sales Account
- **Email**: sales1@example.com
- **Password**: Password123!
- **Role**: Sales (negotiation access)
## 🎯 What You'll Have After Setup

### Complete RFQ Management System
- ✅ User management with role-based access
- ✅ Customer and vendor management
- ✅ Inventory tracking with SKU mapping
- ✅ RFQ creation and processing workflow
- ✅ Quotation management with versioning
- ✅ Comprehensive reporting and analytics

### Enhanced Negotiation System
- ✅ **Communication Timeline** - Professional email, phone, meeting records
- ✅ **SKU Change Tracking** - Price and quantity modifications with reasons
- ✅ **Follow-up Management** - Automated reminders and completion tracking
- ✅ **Visual Indicators** - Highlighted negotiated items and change history
- ✅ **Bulk Operations** - Multi-item selection and bulk price adjustments
- ✅ **Export Capabilities** - Excel export with negotiation data

### Realistic Test Data
- ✅ **Multiple RFQ statuses** - NEW, NEGOTIATING, ACCEPTED, etc.
- ✅ **Professional communications** - Realistic email exchanges and meeting notes
- ✅ **Meaningful SKU changes** - Volume discounts, competitive adjustments
- ✅ **Time-sequenced data** - Proper chronological relationships
- ✅ **Business scenarios** - Customer negotiations, internal strategy notes

## 🧪 Testing the System

### 1. Basic RFQ Workflow
1. Navigate to **RFQ Management**
2. View existing RFQs in different statuses
3. Click on any RFQ to see detailed view
4. Test the **Items**, **Negotiation**, and **History** tabs

### 2. Negotiation Features
1. Open an RFQ with "NEGOTIATING" status
2. Click the **Negotiation** tab
3. See communication timeline with real conversations
4. View SKU change history with price adjustments
5. Test adding new communications and changes

### 3. Advanced Features
1. Test **bulk item selection** in edit mode
2. Use **negotiation mode** for inline editing
3. Export RFQ data to Excel (includes negotiation sheets)
4. Check **follow-up management** with pending items

## 🔧 Database Schema Overview

The system includes 23+ tables:
- **Core**: users, customers, vendors, inventory_items
- **RFQ Flow**: rfqs, rfq_items, quotations, quotation_items
- **Versioning**: quotation_versions, quotation_version_items
- **Negotiation**: negotiation_communications, sku_negotiation_history
- **Business**: sales_history, purchase_orders, market_pricing
- **Support**: audit_log, settings, email_templates

## 📊 Sample Data Statistics

After seeding, you'll have:
- **~100 RFQs** across all customers and statuses
- **~300 RFQ items** with realistic pricing
- **~50-150 communications** with professional content
- **~30-80 SKU changes** with business justifications
- **~200 sales history** records for pricing analysis
- **Complete audit trail** for all system activities

## 🎉 Success Indicators

You'll know the setup worked when:
1. ✅ Login page loads at http://localhost:3000
2. ✅ You can log in with provided credentials
3. ✅ Dashboard shows RFQ statistics and charts
4. ✅ RFQ Management page shows multiple RFQs
5. ✅ Negotiation tab loads with communication data
6. ✅ No console errors or database connection issues

## 🆘 Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL in .env.local
- Ensure database exists and is accessible

### Permission Issues
- Run PowerShell as Administrator if needed
- Check PostgreSQL user permissions
- Verify database user has CREATE privileges

### Missing Dependencies
- Run `npm install` to ensure all packages installed
- Check Node.js version (v18+ required)
- Verify PostgreSQL version (v12+ required)

### Seed Data Issues
- Ensure database schema is created first
- Check console output for specific errors
- Verify all tables were created successfully

### Application Not Loading
- Check if port 3000 is available
- Look for error messages in console
- Verify all environment variables are set

## 📞 Quick Command Reference

```bash
# Setup database (choose one method)
.\setup-database.ps1              # PowerShell (recommended)
setup-database.bat                # Batch file
npm run db:setup                  # If tsx works

# Seed database with test data
npm run db:seed

# Start development server
npm run dev

# Other useful commands
npm run db:studio                 # Open Drizzle Studio
npm run build                     # Build for production
npm run db:drop                   # ⚠️ Drop all data (careful!)
```

## 🌟 Project Features Summary

This setup provides a complete, production-ready RFQ management system with:

### Core Features
- **User Authentication** with role-based permissions
- **Customer & Vendor Management** with contact tracking
- **Inventory Management** with SKU mapping and variations
- **RFQ Workflow** from creation to completion
- **Quotation System** with versioning and approval workflow
- **Reporting & Analytics** with export capabilities

### Enhanced Negotiation System
- **Communication Logging** for all customer interactions
- **Change Tracking** with complete audit trails
- **Follow-up Management** with automated reminders
- **Visual Timeline** showing negotiation progression
- **Bulk Operations** for efficient price adjustments
- **Professional Export** with negotiation data included

The system is now ready for production use with realistic test data that demonstrates all features! 🚀
