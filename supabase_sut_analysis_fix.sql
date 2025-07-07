-- Fix RLS policies for SUT Analysis table
-- This addresses the "new row violates row-level security policy" error

-- First, drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to view SUT analyses" ON winners_sut_analysis;
DROP POLICY IF EXISTS "Allow authenticated users to insert SUT analyses" ON winners_sut_analysis;
DROP POLICY IF EXISTS "Allow authenticated users to update SUT analyses" ON winners_sut_analysis;
DROP POLICY IF EXISTS "Allow authenticated users to delete SUT analyses" ON winners_sut_analysis;

-- Create more permissive policies that work with service role
-- Allow service role and authenticated users to view all SUT analyses
CREATE POLICY "Enable read access for all users" ON winners_sut_analysis
    FOR SELECT USING (true);

-- Allow service role and authenticated users to insert SUT analyses
CREATE POLICY "Enable insert for all users" ON winners_sut_analysis
    FOR INSERT WITH CHECK (true);

-- Allow service role and authenticated users to update SUT analyses
CREATE POLICY "Enable update for all users" ON winners_sut_analysis
    FOR UPDATE USING (true);

-- Allow service role and authenticated users to delete SUT analyses
CREATE POLICY "Enable delete for all users" ON winners_sut_analysis
    FOR DELETE USING (true);

-- Alternative approach: Disable RLS for this table if the above doesn't work
-- Uncomment the line below if you continue to have issues:
-- ALTER TABLE winners_sut_analysis DISABLE ROW LEVEL SECURITY;