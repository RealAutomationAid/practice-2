-- SUT Analysis Database Schema for Supabase
-- This file contains the SQL commands needed to create the SUT analysis table

-- Create the winners_sut_analysis table
CREATE TABLE IF NOT EXISTS winners_sut_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    target_url TEXT NOT NULL,
    login_url TEXT,
    username TEXT,
    password_encrypted TEXT, -- Store encrypted password
    crawl_settings JSONB DEFAULT '{}',
    crawl_data JSONB DEFAULT '{}',
    ai_analysis JSONB DEFAULT '{}',
    screenshots JSONB DEFAULT '[]',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'crawling', 'analyzing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_email TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_winners_sut_analysis_status ON winners_sut_analysis(status);
CREATE INDEX IF NOT EXISTS idx_winners_sut_analysis_created_at ON winners_sut_analysis(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_winners_sut_analysis_created_by ON winners_sut_analysis(created_by_email);

-- Create RLS (Row Level Security) policies
ALTER TABLE winners_sut_analysis ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all SUT analyses
CREATE POLICY "Allow authenticated users to view SUT analyses" ON winners_sut_analysis
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert SUT analyses
CREATE POLICY "Allow authenticated users to insert SUT analyses" ON winners_sut_analysis
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update SUT analyses
CREATE POLICY "Allow authenticated users to update SUT analyses" ON winners_sut_analysis
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete SUT analyses
CREATE POLICY "Allow authenticated users to delete SUT analyses" ON winners_sut_analysis
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_winners_sut_analysis_updated_at
    BEFORE UPDATE ON winners_sut_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE winners_sut_analysis IS 'Stores SUT (System Under Test) analysis data including crawl results and AI analysis';
COMMENT ON COLUMN winners_sut_analysis.name IS 'Human-readable name for the SUT analysis';
COMMENT ON COLUMN winners_sut_analysis.target_url IS 'The main URL to be analyzed';
COMMENT ON COLUMN winners_sut_analysis.login_url IS 'Optional login URL if different from target_url';
COMMENT ON COLUMN winners_sut_analysis.username IS 'Username for authentication (optional)';
COMMENT ON COLUMN winners_sut_analysis.password_encrypted IS 'Encrypted password for authentication (optional)';
COMMENT ON COLUMN winners_sut_analysis.crawl_settings IS 'JSON object with crawl configuration options';
COMMENT ON COLUMN winners_sut_analysis.crawl_data IS 'JSON object containing raw crawl data and page structure';
COMMENT ON COLUMN winners_sut_analysis.ai_analysis IS 'JSON object containing AI-generated analysis and recommendations';
COMMENT ON COLUMN winners_sut_analysis.screenshots IS 'JSON array of screenshot metadata and storage paths';
COMMENT ON COLUMN winners_sut_analysis.status IS 'Current status of the analysis process';
COMMENT ON COLUMN winners_sut_analysis.error_message IS 'Error message if analysis failed';