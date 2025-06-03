import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting database setup for negotiation tables...');

    // Check if negotiation_communications table exists
    const checkCommTable = await db.execute(
      sql`SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'negotiation_communications'
      )`
    );

    // Check if sku_negotiation_history table exists
    const checkSkuTable = await db.execute(
      sql`SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sku_negotiation_history'
      )`
    );

    const commTableExists = checkCommTable.rows[0]?.exists;
    const skuTableExists = checkSkuTable.rows[0]?.exists;

    console.log('Table existence check:', {
      negotiation_communications: commTableExists,
      sku_negotiation_history: skuTableExists
    });

    let created = [];

    // Create negotiation_communications table if it doesn't exist
    if (!commTableExists) {
      await db.execute(sql`
        CREATE TABLE negotiation_communications (
          id SERIAL PRIMARY KEY,
          rfq_id INTEGER NOT NULL,
          version_id INTEGER,
          communication_type VARCHAR(20) NOT NULL,
          direction VARCHAR(10) NOT NULL,
          subject VARCHAR(255),
          content TEXT NOT NULL,
          contact_person VARCHAR(255),
          communication_date TIMESTAMP NOT NULL,
          follow_up_required BOOLEAN DEFAULT false,
          follow_up_date TIMESTAMP,
          follow_up_completed BOOLEAN DEFAULT false,
          follow_up_completed_at TIMESTAMP,
          entered_by_user_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      created.push('negotiation_communications');
      console.log('Created negotiation_communications table');
    }

    // Create sku_negotiation_history table if it doesn't exist
    if (!skuTableExists) {
      await db.execute(sql`
        CREATE TABLE sku_negotiation_history (
          id SERIAL PRIMARY KEY,
          rfq_id INTEGER NOT NULL,
          sku_id INTEGER NOT NULL,
          version_id INTEGER,
          communication_id INTEGER,
          change_type VARCHAR(20) NOT NULL,
          old_quantity INTEGER,
          new_quantity INTEGER,
          old_unit_price DECIMAL(10,2),
          new_unit_price DECIMAL(10,2),
          change_reason TEXT,
          changed_by VARCHAR(20) DEFAULT 'CUSTOMER',
          entered_by_user_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      created.push('sku_negotiation_history');
      console.log('Created sku_negotiation_history table');
    }

    return NextResponse.json({
      success: true,
      message: 'Database setup completed',
      tablesCreated: created,
      tablesExisted: {
        negotiation_communications: commTableExists,
        sku_negotiation_history: skuTableExists
      }
    });

  } catch (error) {
    console.error('Error setting up negotiation database:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to setup negotiation database',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
