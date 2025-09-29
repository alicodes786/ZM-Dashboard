-- Phase 2 Schema Updates: Simplified Margin Calculation
-- This replaces the previous schema-updates-phase2.sql

-- Add margin-related fields to daily_work_entries (simplified)
ALTER TABLE daily_work_entries 
ADD COLUMN IF NOT EXISTS client_cost DECIMAL(10,2), -- Total amount charged to client
ADD COLUMN IF NOT EXISTS margin_amount DECIMAL(10,2), -- Profit amount (client_cost - labor_cost)  
ADD COLUMN IF NOT EXISTS margin_percentage DECIMAL(5,2); -- Profit percentage

-- Function to calculate margin (simplified - no client_rate)
CREATE OR REPLACE FUNCTION calculate_work_entry_margins()
RETURNS TRIGGER AS $$
DECLARE
    v_labor_cost DECIMAL(10,2);
    v_client_cost DECIMAL(10,2);
    v_margin_amount DECIMAL(10,2);
    v_margin_percentage DECIMAL(5,2);
BEGIN
    -- Get labor cost (what we pay staff)
    v_labor_cost := COALESCE(NEW.calculated_cost, 0);
    
    -- Calculate client cost (simplified logic)
    IF NEW.override_cost IS NOT NULL THEN
        -- Admin set a specific price for the client
        v_client_cost := NEW.override_cost;
    ELSE
        -- No override, so client cost = labor cost (no margin)
        v_client_cost := v_labor_cost;
    END IF;
    
    -- Calculate margin
    v_margin_amount := v_client_cost - v_labor_cost;
    
    -- Calculate margin percentage
    IF v_client_cost > 0 THEN
        v_margin_percentage := (v_margin_amount / v_client_cost) * 100;
    ELSE
        v_margin_percentage := 0;
    END IF;
    
    -- Update the record
    NEW.client_cost := ROUND(v_client_cost, 2);
    NEW.margin_amount := ROUND(v_margin_amount, 2);
    NEW.margin_percentage := ROUND(v_margin_percentage, 2);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to calculate margins automatically
DROP TRIGGER IF EXISTS calculate_margins_trigger ON daily_work_entries;
CREATE TRIGGER calculate_margins_trigger
    BEFORE INSERT OR UPDATE ON daily_work_entries
    FOR EACH ROW
    EXECUTE FUNCTION calculate_work_entry_margins();

-- Update existing records to have client_cost = override_cost or calculated_cost
UPDATE daily_work_entries 
SET client_cost = COALESCE(override_cost, calculated_cost)
WHERE client_cost IS NULL;

-- Recalculate margins for existing records
UPDATE daily_work_entries 
SET 
    margin_amount = ROUND(COALESCE(client_cost, 0) - COALESCE(calculated_cost, 0), 2),
    margin_percentage = CASE 
        WHEN COALESCE(client_cost, 0) > 0 THEN 
            ROUND(((COALESCE(client_cost, 0) - COALESCE(calculated_cost, 0)) / COALESCE(client_cost, 0)) * 100, 2)
        ELSE 0 
    END
WHERE margin_amount IS NULL OR margin_percentage IS NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_work_entries_margin_amount ON daily_work_entries(margin_amount);
CREATE INDEX IF NOT EXISTS idx_daily_work_entries_client_cost ON daily_work_entries(client_cost);

-- Function to get daily margin summary (simplified)
CREATE OR REPLACE FUNCTION get_daily_margin_summary(p_date DATE)
RETURNS TABLE (
    total_labor_cost DECIMAL(10,2),
    total_client_cost DECIMAL(10,2), 
    total_margin_amount DECIMAL(10,2),
    average_margin_percentage DECIMAL(5,2),
    entries_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(calculated_cost), 0) as total_labor_cost,
        COALESCE(SUM(client_cost), 0) as total_client_cost,
        COALESCE(SUM(margin_amount), 0) as total_margin_amount,
        CASE 
            WHEN COALESCE(SUM(client_cost), 0) > 0 THEN
                ROUND((COALESCE(SUM(margin_amount), 0) / COALESCE(SUM(client_cost), 0)) * 100, 2)
            ELSE 0
        END as average_margin_percentage,
        COUNT(*)::INTEGER as entries_count
    FROM daily_work_entries 
    WHERE date = p_date;
END;
$$ LANGUAGE plpgsql;
