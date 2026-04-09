-- Add mock money to a user's balance
create or replace function add_money(user_id uuid, amount numeric)
returns void as $$
begin
  update public.profiles set money_balance = money_balance + amount where id = user_id;
  insert into public.notifications(user_id, type, payload)
  values (user_id, 'money_added', json_build_object('amount', amount, 'description', 'Mock money added'));
end;
$$ language plpgsql security definer;

-- Hold escrow when a job is booked
create or replace function hold_escrow(p_job_id uuid, p_customer_id uuid, p_amount numeric)
returns void as $$
begin
  if (select money_balance from public.profiles where id = p_customer_id) < p_amount then
    raise exception 'Insufficient balance';
  end if;
  update public.profiles set money_balance = money_balance - p_amount where id = p_customer_id;
  -- Note: We'll handle transactions differently since the existing schema doesn't have a transactions table
end;
$$ language plpgsql security definer;

-- Release escrow to employee on job completion
create or replace function release_escrow(
  p_job_id uuid,
  p_employee_id uuid,
  p_amount numeric,
  p_platform_fee numeric
)
returns void as $$
declare
  payout numeric := p_amount - p_platform_fee;
begin
  update public.profiles set money_balance = money_balance + payout where id = p_employee_id;
  
  -- Add notification for employee
  insert into public.notifications(user_id, type, payload)
  values (p_employee_id, 'payout_received', json_build_object('job_id', p_job_id, 'amount', payout, 'platform_fee', p_platform_fee));
  
  -- Add notification for customer
  insert into public.notifications(user_id, type, payload)
  values (
    (select customer_id from public.jobs where id = p_job_id),
    'payout_sent',
    json_build_object('job_id', p_job_id, 'amount', payout, 'platform_fee', p_platform_fee)
  );
end;
$$ language plpgsql security definer;

-- Get jobs sorted by distance from employee location
create or replace function get_nearby_jobs(
  lat double precision,
  lng double precision,
  radius_meters double precision default 50000
)
returns setof public.jobs as $$
begin
  return query
  select * from public.jobs
  where status = 'OPEN'
    and st_dwithin(
      location_coordinates,
      st_point(lng, lat)::geography,
      radius_meters
    )
  order by st_distance(location_coordinates, st_point(lng, lat)::geography) asc;
end;
$$ language plpgsql security definer;

-- Claim a job function
create or replace function claim_job(p_job_id uuid, p_employee_id uuid)
returns uuid as $$
declare
  employee_name text;
  job_count int;
begin
  -- Get employee's name
  select full_name into employee_name from public.profiles where id = p_employee_id;
  
  -- Check if job is still open
  if not exists (select 1 from public.jobs where id = p_job_id and status = 'OPEN') then
    raise exception 'Job is no longer available';
  end if;
  
  -- Update job with employee and change status
  update public.jobs 
  set worker_id = p_employee_id, worker_name = employee_name, status = 'IN_PROGRESS', updated_at = now()
  where id = p_job_id and status = 'OPEN';
  
  -- Notify customer
  insert into public.notifications(user_id, type, payload)
  values (
    (select customer_id from public.jobs where id = p_job_id),
    'job_claimed',
    json_build_object('job_id', p_job_id, 'employee_id', p_employee_id)
  );
  
  return p_job_id;
end;
$$ language plpgsql security definer;
