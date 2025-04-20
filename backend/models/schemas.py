# -- Users table
# create table users (
#   id uuid primary key default gen_random_uuid(),
#   email text unique not null,
#   password_hash text not null,
#   name text
# );

# -- Receipts table
# create table receipts (
#   id serial primary key,
#   user_id uuid references users(id) on delete cascade,
#   vendor text,
#   transaction_date date,
#   total_amount numeric,
#   expense_category text,
#   items jsonb
# );
