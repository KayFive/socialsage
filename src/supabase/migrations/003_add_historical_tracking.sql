-- File: supabase/migrations/003_add_historical_tracking.sql
-- Targeted migration for your existing schema

-- Add missing columns to your existing instagram_accounts table
ALTER TABLE instagram_accounts 
ADD COLUMN IF NOT EXISTS refresh_token TEXT,
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'personal',
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS username TEXT;

-- Update existing records to populate username from instagram_handle
UPDATE instagram_accounts 
SET username = instagram_handle 
WHERE username IS NULL;

-- Create daily_snapshots table for historical data
CREATE TABLE daily_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_account_id UUID REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  
  -- Profile metrics
  followers_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER NOT NULL DEFAULT 0,
  media_count INTEGER NOT NULL DEFAULT 0,
  
  -- Engagement metrics (aggregated from recent posts)
  total_likes INTEGER NOT NULL DEFAULT 0,
  total_comments INTEGER NOT NULL DEFAULT 0,
  total_shares INTEGER NOT NULL DEFAULT 0,
  total_saves INTEGER NOT NULL DEFAULT 0,
  
  -- Calculated metrics
  engagement_rate DECIMAL(5,3) DEFAULT 0,
  avg_likes_per_post DECIMAL(10,2) DEFAULT 0,
  avg_comments_per_post DECIMAL(10,2) DEFAULT 0,
  
  -- Reach and impressions (if available from business accounts)
  total_reach BIGINT DEFAULT 0,
  total_impressions BIGINT DEFAULT 0,
  
  -- Post activity for the day
  posts_published_count INTEGER DEFAULT 0,
  
  -- Raw data backup
  raw_profile_data JSONB,
  raw_insights_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(instagram_account_id, snapshot_date)
);

-- Create post_snapshots table for individual post tracking
CREATE TABLE post_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_account_id UUID REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  instagram_post_id TEXT NOT NULL,
  snapshot_date DATE NOT NULL,
  
  -- Post details
  post_type TEXT, -- 'IMAGE', 'VIDEO', 'CAROUSEL_ALBUM', 'REEL'
  caption TEXT,
  permalink TEXT,
  media_url TEXT,
  thumbnail_url TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Engagement metrics at time of snapshot
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  
  -- Insights (if available)
  reach INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  
  -- Raw data
  raw_post_data JSONB,
  raw_insights_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(instagram_account_id, instagram_post_id, snapshot_date)
);

-- Create growth_analytics table for calculated growth metrics
CREATE TABLE growth_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_account_id UUID REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  analysis_date DATE NOT NULL,
  period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly'
  
  -- Growth calculations
  followers_growth INTEGER DEFAULT 0,
  followers_growth_rate DECIMAL(5,3) DEFAULT 0,
  posts_growth INTEGER DEFAULT 0,
  engagement_growth_rate DECIMAL(5,3) DEFAULT 0,
  
  -- Period comparisons
  period_start_date DATE,
  period_end_date DATE,
  period_followers_start INTEGER,
  period_followers_end INTEGER,
  period_posts_start INTEGER,
  period_posts_end INTEGER,
  period_avg_engagement_start DECIMAL(5,3),
  period_avg_engagement_end DECIMAL(5,3),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(instagram_account_id, analysis_date, period_type)
);

-- Create sync_logs table to track data collection
CREATE TABLE sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instagram_account_id UUID REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL, -- 'profile', 'posts', 'insights', 'full'
  status TEXT NOT NULL, -- 'started', 'completed', 'failed'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  records_processed INTEGER DEFAULT 0,
  
  -- Raw response data for debugging
  api_response JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_daily_snapshots_account_date ON daily_snapshots(instagram_account_id, snapshot_date DESC);
CREATE INDEX idx_post_snapshots_account_date ON post_snapshots(instagram_account_id, snapshot_date DESC);
CREATE INDEX idx_post_snapshots_post_id ON post_snapshots(instagram_post_id);
CREATE INDEX idx_growth_analytics_account_period ON growth_analytics(instagram_account_id, period_type, analysis_date DESC);
CREATE INDEX idx_sync_logs_account_status ON sync_logs(instagram_account_id, status, started_at DESC);
CREATE INDEX idx_instagram_accounts_user_active ON instagram_accounts(user_id, is_active);

-- Enable RLS on new tables
ALTER TABLE daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_snapshots (following your existing pattern)
CREATE POLICY "Users can view their account snapshots"
  ON daily_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM instagram_accounts 
      WHERE instagram_accounts.id = daily_snapshots.instagram_account_id 
      AND instagram_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Service can insert snapshots"
  ON daily_snapshots FOR INSERT
  WITH CHECK (true); -- Service role will handle this

CREATE POLICY "Service can update snapshots"
  ON daily_snapshots FOR UPDATE
  USING (true); -- Service role will handle this

-- RLS Policies for post_snapshots
CREATE POLICY "Users can view their post snapshots"
  ON post_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM instagram_accounts 
      WHERE instagram_accounts.id = post_snapshots.instagram_account_id 
      AND instagram_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Service can insert post snapshots"
  ON post_snapshots FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update post snapshots"
  ON post_snapshots FOR UPDATE
  USING (true);

-- RLS Policies for growth_analytics
CREATE POLICY "Users can view their growth analytics"
  ON growth_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM instagram_accounts 
      WHERE instagram_accounts.id = growth_analytics.instagram_account_id 
      AND instagram_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Service can insert growth analytics"
  ON growth_analytics FOR INSERT
  WITH CHECK (true);

-- RLS Policies for sync_logs
CREATE POLICY "Users can view their sync logs"
  ON sync_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM instagram_accounts 
      WHERE instagram_accounts.id = sync_logs.instagram_account_id 
      AND instagram_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Service can insert sync logs"
  ON sync_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update sync logs"
  ON sync_logs FOR UPDATE
  USING (true);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to new tables
CREATE TRIGGER update_daily_snapshots_updated_at
    BEFORE UPDATE ON daily_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_post_snapshots_updated_at
    BEFORE UPDATE ON post_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_growth_analytics_updated_at
    BEFORE UPDATE ON growth_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_logs_updated_at
    BEFORE UPDATE ON sync_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a function to get growth analytics (matching your naming convention)
CREATE OR REPLACE FUNCTION get_growth_analytics(
  account_id UUID,
  period_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  followers_count INTEGER,
  posts_count INTEGER,
  engagement_rate DECIMAL,
  daily_growth INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ds.snapshot_date as date,
    ds.followers_count,
    ds.media_count as posts_count,
    ds.engagement_rate,
    COALESCE(
      ds.followers_count - LAG(ds.followers_count) OVER (ORDER BY ds.snapshot_date),
      0
    ) as daily_growth
  FROM daily_snapshots ds
  WHERE ds.instagram_account_id = account_id
    AND ds.snapshot_date >= CURRENT_DATE - INTERVAL '%s days'
  ORDER BY ds.snapshot_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;