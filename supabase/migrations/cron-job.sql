
-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the daily report to run at 9:00 AM every day
SELECT cron.schedule(
  'daily-report-at-9am',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url:='https://jzmzmjvtxcrxljnhhrjo.supabase.co/functions/v1/send-daily-report',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6bXptanZ0eGNyeGxqbmhocmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxNjI0NTEsImV4cCI6MjA1MzczODQ1MX0.IHa8Bm-N1H68IiCJzPtTpRIcKQvytVFBm16BnSXp00I"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
