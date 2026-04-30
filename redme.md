create table public."History" (
  id bigserial not null,
  created_date timestamp without time zone null default CURRENT_TIMESTAMP,
  voucher_no character varying(100) null,
  bank_ac_from character varying(255) null,
  company_name character varying(255) null,
  date_of_payment date null,
  purpose_of_payment text null,
  transaction_type character varying(100) null,
  project character varying(255) null,
  beneficiary_name character varying(255) null,
  po_number character varying(100) null,
  beneficiary_ac_name character varying(255) null,
  beneficiary_ac_number character varying(100) null,
  beneficiary_bank_name character varying(255) null,
  beneficiary_bank_ifsc character varying(50) null,
  particulars text null,
  amount numeric(15, 2) null,
  amount_in_words text null,
  entry_done_by character varying(100) null,
  checked_by character varying(100) null,
  approved_by character varying(100) null,
  pdf_link text null,
  month integer null,
  year integer null,
  name character varying(255) null,
  constraint History_pkey primary key (id)
) TABLESPACE pg_default;





create table public.login (
  name character varying(100) null,
  id integer not null,
  password character varying(255) null,
  role character varying(50) null,
  constraint login_pkey primary key (id)
) TABLESPACE pg_default;




create table public.master (
  id bigserial not null,
  company_name text null,
  transaction_type text null,
  project text null,
  bank_ac_from text null,
  payment_from_company text null,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  constraint master_pkey primary key (id)
) TABLESPACE pg_default;