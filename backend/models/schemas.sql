CREATE TABLE public.conversation_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT conversation_messages_pkey PRIMARY KEY (id),
  CONSTRAINT conversation_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id)
);
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New Conversation'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  message_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.receipt_items (
  id integer NOT NULL DEFAULT nextval('receipt_items_id_seq'::regclass),
  receipt_id integer NOT NULL,
  description text NOT NULL,
  unit_price numeric NOT NULL,
  quantity numeric NOT NULL,
  line_total numeric DEFAULT (unit_price * quantity),
  CONSTRAINT receipt_items_pkey PRIMARY KEY (id),
  CONSTRAINT receipt_items_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES public.receipts(id)
);
CREATE TABLE public.receipts (
  id integer NOT NULL DEFAULT nextval('receipts_id_seq'::regclass),
  user_id uuid NOT NULL,
  merchant_name text NOT NULL,
  merchant_address text,
  merchant_phone text,
  merchant_email text,
  transaction_date date NOT NULL,
  subtotal_amount numeric NOT NULL,
  tax_amount numeric NOT NULL,
  total_amount numeric NOT NULL,
  expense_category text,
  payment_method text,
  image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT receipts_pkey PRIMARY KEY (id),
  CONSTRAINT receipts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  name text,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);