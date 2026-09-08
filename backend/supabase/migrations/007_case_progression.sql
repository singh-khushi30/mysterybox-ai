-- Sequential case unlocking. Existing Case #001 rows are numbered, not deleted.

alter table cases
  add column if not exists case_number integer,
  add column if not exists unlock_order integer,
  add column if not exists teaser text;

update cases
set
  case_number = 1,
  unlock_order = 1,
  teaser = coalesce(
    teaser,
    'A private supper at Blackwood Manor. The last guest never signed the letter.'
  )
where slug = 'the-last-guest-at-blackwood-manor';

update cases
set
  case_number = coalesce(case_number, 1),
  unlock_order = coalesce(unlock_order, case_number, 1)
where case_number is null or unlock_order is null;

alter table cases
  alter column case_number set not null,
  alter column unlock_order set not null;

alter table cases
  drop constraint if exists cases_case_number_key,
  drop constraint if exists cases_unlock_order_key;

alter table cases
  add constraint cases_case_number_key unique (case_number),
  add constraint cases_unlock_order_key unique (unlock_order);

create index if not exists idx_cases_unlock_order on cases (unlock_order);
