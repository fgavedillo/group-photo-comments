create table email_queue (
  id uuid default uuid_generate_v4() primary key,
  to_addresses text[],
  cc_addresses text[],
  subject text,
  html_content text,
  status text default 'pending',
  scheduled_for timestamp with time zone,
  created_at timestamp with time zone default now(),
  processed_at timestamp with time zone,
  error text,
  retry_count int default 0,
  is_periodic boolean default false,
  period_type text, -- 'daily', 'weekly', 'monthly'
  last_success timestamp with time zone
);

-- Políticas de seguridad
create policy "Users can insert emails"
  on email_queue
  for insert
  to authenticated
  with check (true);

create policy "Users can view their emails"
  on email_queue
  for select
  to authenticated
  using (true); 