-- Authentication Schema for ZM Dashboard
-- Simple user authentication with admin and staff roles

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Plain text password
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff')),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    active_status BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL -- Link to staff table if user is staff
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active_status ON users(active_status);
CREATE INDEX IF NOT EXISTS idx_users_staff_id ON users(staff_id);

-- Trigger to update updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create default admin user (password is 'admin123')
INSERT INTO users (username, password, role, full_name, email, active_status) 
VALUES (
    'admin',
    'admin123', -- Plain text password
    'admin',
    'System Administrator',
    'admin@company.com',
    true
) ON CONFLICT (username) DO NOTHING;

-- Drop old function first (in case it exists with different parameters)
DROP FUNCTION IF EXISTS authenticate_user(VARCHAR, VARCHAR);

-- Function to authenticate user (simple text password)
CREATE OR REPLACE FUNCTION authenticate_user(p_username VARCHAR, p_password VARCHAR)
RETURNS TABLE (
    user_id UUID,
    username VARCHAR,
    role VARCHAR,
    full_name VARCHAR,
    email VARCHAR,
    staff_id UUID
) AS $$
BEGIN
    -- Simple authentication - just match username and password
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.role,
        u.full_name,
        u.email,
        u.staff_id
    FROM users u
    WHERE u.username = p_username 
    AND u.password = p_password 
    AND u.active_status = true;
    
    -- Update last login time
    UPDATE users 
    SET last_login = NOW() 
    WHERE users.username = p_username AND users.active_status = true;
END;
$$ LANGUAGE plpgsql;

-- Drop old password update function first
DROP FUNCTION IF EXISTS update_user_password(UUID, VARCHAR);

-- Function to update password (simple text)
CREATE OR REPLACE FUNCTION update_user_password(p_user_id UUID, p_new_password VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE users 
    SET password = p_new_password, updated_at = NOW()
    WHERE id = p_user_id AND active_status = true;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

