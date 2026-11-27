-- Atomic protection against two clients reserving overlapping appointment times.
-- Run this in Supabase SQL Editor after reviewing the preflight query below.
-- The exclusion constraint is the final guard even when two API requests race.
 
create extension if not exists btree_gist;
 
-- Preflight: this must return no rows before applying the constraint.
select
  a.appointment_id,
  a.booking_date,
  a.start_time,
  a.end_time,
  b.appointment_id as conflicting_appointment_id,
  b.start_time as conflicting_start_time,
  b.end_time as conflicting_end_time
from public.appointment_clients a
join public.appointment_clients b
  on a.booking_date = b.booking_date
 and a.appointment_id < b.appointment_id
 and a.booking_status in ('pending', 'confirmed', 'completed')
 and b.booking_status in ('pending', 'confirmed', 'completed')
 and (a.booking_date + a.start_time - interval '5 minutes', a.booking_date + a.end_time + interval '5 minutes')
     overlaps
     (b.booking_date + b.start_time - interval '5 minutes', b.booking_date + b.end_time + interval '5 minutes');
 
-- Exclude overlapping time ranges across all active individual client bookings.
-- Adjacent appointments are permitted; the existing 5-minute buffer remains
-- enforced by the application-level availability checks.
alter table public.appointment_clients
  add constraint appointment_clients_no_active_overlap
  exclude using gist (
    tsrange(booking_date + start_time - interval '5 minutes', booking_date + end_time + interval '5 minutes', '[)') with &&
  )
  where (booking_status in ('pending', 'confirmed', 'completed'));
