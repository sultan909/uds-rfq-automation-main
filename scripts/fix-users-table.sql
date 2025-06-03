-- Manual schema fix for users table

-- First, create the enums if they don't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'EMPLOYEE', 'SALES');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE customer_type AS ENUM ('WHOLESALER', 'DEALER', 'RETAILER', 'DIRECT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE rfq_status AS ENUM ('NEW', 'DRAFT', 'PRICED', 'SENT', 'NEGOTIATING', 'ACCEPTED', 'DECLINED', 'PROCESSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Check if users table exists, if not create it
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'EMPLOYEE',
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- If table exists but role column is missing, add it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
        ALTER TABLE users ADD COLUMN role user_role NOT NULL DEFAULT 'EMPLOYEE';
    END IF;
END $$;

-- Verify the fix
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;
