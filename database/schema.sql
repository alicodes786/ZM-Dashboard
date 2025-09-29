-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Staff table
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('daily_rate', 'monthly_salary')),
    daily_rate DECIMAL(10,2),
    monthly_salary DECIMAL(10,2),
    allocated_daily_hours DECIMAL(4,2) NOT NULL DEFAULT 8.0,
    active_status BOOLEAN DEFAULT true,
    pay_override_enabled BOOLEAN DEFAULT false,
    pay_override_amount DECIMAL(10,2)
);

-- Daily work entries table
CREATE TABLE daily_work_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date DATE NOT NULL,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    task_description TEXT NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    hours_worked DECIMAL(4,2) NOT NULL,
    calculated_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    override_cost DECIMAL(10,2),
    notes TEXT
);

-- Indexes for better performance
CREATE INDEX idx_staff_active_status ON staff(active_status);
CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_daily_work_entries_date ON daily_work_entries(date);
CREATE INDEX idx_daily_work_entries_staff_id ON daily_work_entries(staff_id);
CREATE INDEX idx_daily_work_entries_client_name ON daily_work_entries(client_name);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_staff_updated_at 
    BEFORE UPDATE ON staff 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_work_entries_updated_at 
    BEFORE UPDATE ON daily_work_entries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate task cost
CREATE OR REPLACE FUNCTION calculate_task_cost(
    p_staff_id UUID,
    p_hours_worked DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    v_payment_type VARCHAR(20);
    v_daily_rate DECIMAL;
    v_monthly_salary DECIMAL;
    v_allocated_hours DECIMAL;
    v_calculated_cost DECIMAL;
BEGIN
    SELECT payment_type, daily_rate, monthly_salary, allocated_daily_hours
    INTO v_payment_type, v_daily_rate, v_monthly_salary, v_allocated_hours
    FROM staff
    WHERE id = p_staff_id;
    
    IF v_payment_type = 'daily_rate' THEN
        -- Calculate hourly rate from daily rate and allocated hours
        v_calculated_cost := p_hours_worked * (v_daily_rate / v_allocated_hours);
    ELSE -- monthly_salary
        -- Calculate daily rate from monthly salary (assuming 22 working days)
        -- Then calculate hourly rate
        v_calculated_cost := p_hours_worked * ((v_monthly_salary / 22.0) / v_allocated_hours);
    END IF;
    
    RETURN ROUND(v_calculated_cost, 2);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically calculate cost on insert/update
CREATE OR REPLACE FUNCTION auto_calculate_cost()
RETURNS TRIGGER AS $$
BEGIN
    NEW.calculated_cost := calculate_task_cost(NEW.staff_id, NEW.hours_worked);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_calculate_daily_work_cost
    BEFORE INSERT OR UPDATE ON daily_work_entries
    FOR EACH ROW
    EXECUTE FUNCTION auto_calculate_cost();

-- Clients table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    company_name VARCHAR(255),
    contact_person VARCHAR(255),
    billing_address TEXT,
    active_status BOOLEAN DEFAULT true,
    notes TEXT
);

-- Jobs table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    job_type VARCHAR(50) DEFAULT 'maintenance' CHECK (job_type IN ('maintenance', 'repair', 'installation', 'inspection', 'emergency')),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'on_hold', 'completed', 'cancelled')),
    estimated_hours DECIMAL(6,2),
    estimated_cost DECIMAL(10,2),
    actual_hours DECIMAL(6,2) DEFAULT 0,
    actual_cost DECIMAL(10,2) DEFAULT 0,
    start_date DATE,
    target_completion_date DATE,
    completed_date DATE,
    location TEXT,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    notes TEXT
);

-- Add client_id and job_id to daily_work_entries
ALTER TABLE daily_work_entries 
ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
ADD COLUMN job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;

-- Indexes for better performance
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_active_status ON clients(active_status);
CREATE INDEX idx_jobs_client_id ON jobs(client_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_job_type ON jobs(job_type);
CREATE INDEX idx_jobs_priority ON jobs(priority);
CREATE INDEX idx_daily_work_entries_client_id ON daily_work_entries(client_id);
CREATE INDEX idx_daily_work_entries_job_id ON daily_work_entries(job_id);

-- Triggers to automatically update updated_at
CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update job actual hours and costs
CREATE OR REPLACE FUNCTION update_job_actuals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update actual hours and costs for the job
    IF NEW.job_id IS NOT NULL THEN
        UPDATE jobs 
        SET 
            actual_hours = (
                SELECT COALESCE(SUM(hours_worked), 0) 
                FROM daily_work_entries 
                WHERE job_id = NEW.job_id
            ),
            actual_cost = (
                SELECT COALESCE(SUM(COALESCE(override_cost, calculated_cost)), 0) 
                FROM daily_work_entries 
                WHERE job_id = NEW.job_id
            )
        WHERE id = NEW.job_id;
    END IF;
    
    -- Also update for old job if job_id changed
    IF TG_OP = 'UPDATE' AND OLD.job_id IS NOT NULL AND OLD.job_id != NEW.job_id THEN
        UPDATE jobs 
        SET 
            actual_hours = (
                SELECT COALESCE(SUM(hours_worked), 0) 
                FROM daily_work_entries 
                WHERE job_id = OLD.job_id
            ),
            actual_cost = (
                SELECT COALESCE(SUM(COALESCE(override_cost, calculated_cost)), 0) 
                FROM daily_work_entries 
                WHERE job_id = OLD.job_id
            )
        WHERE id = OLD.job_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update job actuals when work entries change
CREATE TRIGGER update_job_actuals_on_work_entry
    AFTER INSERT OR UPDATE OR DELETE ON daily_work_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_job_actuals();

-- Function to migrate existing client names to clients table
CREATE OR REPLACE FUNCTION migrate_client_names()
RETURNS void AS $$
DECLARE
    client_record RECORD;
    new_client_id UUID;
BEGIN
    -- Create clients from unique client_name values
    FOR client_record IN 
        SELECT DISTINCT client_name 
        FROM daily_work_entries 
        WHERE client_name IS NOT NULL 
        AND client_name != ''
        AND NOT EXISTS (
            SELECT 1 FROM clients WHERE LOWER(name) = LOWER(client_name)
        )
    LOOP
        INSERT INTO clients (name, active_status)
        VALUES (client_record.client_name, true)
        RETURNING id INTO new_client_id;
        
        -- Update daily_work_entries to reference the new client
        UPDATE daily_work_entries 
        SET client_id = new_client_id 
        WHERE LOWER(client_name) = LOWER(client_record.client_name);
    END LOOP;
    
    -- Handle existing clients (in case of re-runs)
    UPDATE daily_work_entries 
    SET client_id = clients.id
    FROM clients 
    WHERE LOWER(daily_work_entries.client_name) = LOWER(clients.name)
    AND daily_work_entries.client_id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies can be added here for future authentication
-- ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE daily_work_entries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
