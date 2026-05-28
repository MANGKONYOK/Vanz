-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.address (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  address_name text NOT NULL,
  address_type text NOT NULL,
  address_line_1 text NOT NULL,
  address_line_2 text NOT NULL,
  city text NOT NULL,
  province text NOT NULL,
  country_code character varying NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT address_pkey PRIMARY KEY (id)
);
CREATE TABLE public.customer (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  profile_id bigint NOT NULL,
  code character varying NOT NULL UNIQUE,
  address_id bigint NOT NULL,
  membership_level character varying NOT NULL,
  total_spent numeric NOT NULL DEFAULT '0'::numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT customer_pkey PRIMARY KEY (id),
  CONSTRAINT Customer_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.address(id),
  CONSTRAINT Customer_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profile(id)
);
CREATE TABLE public.deliverer (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  profile_id bigint NOT NULL,
  code character varying NOT NULL UNIQUE,
  vehicle_type character varying NOT NULL,
  license_plate character varying NOT NULL,
  current_status character varying NOT NULL,
  rating numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT deliverer_pkey PRIMARY KEY (id),
  CONSTRAINT Deliverer_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profile(id)
);
CREATE TABLE public.deliverer_location_log (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  deliverer_id bigint NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  captured_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT deliverer_location_log_pkey PRIMARY KEY (id),
  CONSTRAINT DeliveryPerson_Location_Log_deliverer_id_fkey FOREIGN KEY (deliverer_id) REFERENCES public.deliverer(id)
);
CREATE TABLE public.delivery (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  order_id bigint NOT NULL,
  deliverer_id bigint NOT NULL,
  delivery_type text NOT NULL,
  pickup_time timestamp without time zone,
  delivery_time timestamp without time zone,
  delivery_fee numeric NOT NULL,
  CONSTRAINT delivery_pkey PRIMARY KEY (id),
  CONSTRAINT Delivery_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.order(id),
  CONSTRAINT Delivery_deliverer_id_fkey FOREIGN KEY (deliverer_id) REFERENCES public.deliverer(id)
);
CREATE TABLE public.dispatch_assignment (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  order_id bigint NOT NULL,
  deliverer_id bigint NOT NULL,
  status character varying NOT NULL,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  responded_at timestamp with time zone,
  CONSTRAINT dispatch_assignment_pkey PRIMARY KEY (id),
  CONSTRAINT Dispatch_Assignment_deliverer_id_fkey FOREIGN KEY (deliverer_id) REFERENCES public.deliverer(id),
  CONSTRAINT Dispatch_Assignment_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.order(id)
);
CREATE TABLE public.expense_voucher (
  id bigint NOT NULL,
  delivery_id bigint NOT NULL,
  code text NOT NULL UNIQUE,
  voucher_date text NOT NULL,
  status text NOT NULL,
  total_amount double precision NOT NULL,
  updated_at timestamp with time zone NOT NULL,
  CONSTRAINT expense_voucher_pkey PRIMARY KEY (id),
  CONSTRAINT Expense_Voucher_delivery_id_fkey FOREIGN KEY (delivery_id) REFERENCES public.delivery(id)
);
CREATE TABLE public.expense_voucher_items (
  id bigint NOT NULL,
  expense_voucher_id bigint NOT NULL,
  expense_type text NOT NULL,
  description text NOT NULL,
  amount double precision NOT NULL,
  receipt_reference_code text NOT NULL,
  CONSTRAINT expense_voucher_items_pkey PRIMARY KEY (id),
  CONSTRAINT Expense_Voucher_Items_expense_voucher_id_fkey FOREIGN KEY (expense_voucher_id) REFERENCES public.expense_voucher(id)
);
CREATE TABLE public.favorite_store (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  customer_id bigint NOT NULL,
  store_id bigint NOT NULL,
  CONSTRAINT favorite_store_pkey PRIMARY KEY (id),
  CONSTRAINT Favorite_Store_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(id),
  CONSTRAINT Favorite_Store_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.store(id)
);
CREATE TABLE public.order (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  customer_id bigint NOT NULL,
  store_id bigint NOT NULL,
  code text NOT NULL UNIQUE,
  total_price numeric NOT NULL,
  address_snapshot text NOT NULL,
  status text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_pkey PRIMARY KEY (id),
  CONSTRAINT Order_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customer(id),
  CONSTRAINT Order_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.store(id)
);
CREATE TABLE public.order_items (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  order_id bigint NOT NULL,
  product_id bigint NOT NULL,
  quantity numeric NOT NULL,
  unit_price text NOT NULL,
  extended_price numeric NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT Order_Items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.order(id),
  CONSTRAINT Order_Items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.store_products(id)
);
CREATE TABLE public.payment (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  delivery_id bigint NOT NULL,
  code text NOT NULL UNIQUE,
  payment_period_start date NOT NULL,
  payment_period_end date NOT NULL,
  total_payment numeric NOT NULL,
  status character varying NOT NULL,
  payment_datetime timestamp without time zone NOT NULL,
  CONSTRAINT payment_pkey PRIMARY KEY (id),
  CONSTRAINT Payment_delivery_id_fkey FOREIGN KEY (delivery_id) REFERENCES public.delivery(id)
);
CREATE TABLE public.payment_items (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  payment_id bigint NOT NULL,
  order_id bigint NOT NULL,
  delivery_fee numeric NOT NULL,
  bonus numeric NOT NULL DEFAULT '0'::numeric,
  adjustment_amount numeric NOT NULL DEFAULT '0'::numeric,
  CONSTRAINT payment_items_pkey PRIMARY KEY (id),
  CONSTRAINT Payment_Items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.order(id),
  CONSTRAINT Payment_Items_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payment(id)
);
CREATE TABLE public.profile (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  full_name text NOT NULL,
  phone character varying NOT NULL,
  email character varying NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profile_pkey PRIMARY KEY (id)
);
CREATE TABLE public.promotion (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  store_id bigint NOT NULL,
  name text NOT NULL,
  code character varying NOT NULL UNIQUE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  discount_type character varying NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT promotion_pkey PRIMARY KEY (id),
  CONSTRAINT Promotion_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.store(id)
);
CREATE TABLE public.promotion_items (
  id bigint NOT NULL,
  promotion_id bigint NOT NULL,
  product_id bigint NOT NULL,
  discount_value numeric NOT NULL,
  CONSTRAINT promotion_items_pkey PRIMARY KEY (id),
  CONSTRAINT Promotion_Items_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES public.promotion(id),
  CONSTRAINT Promotion_Items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.store_products(id)
);
CREATE TABLE public.store (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  code character varying NOT NULL UNIQUE,
  address_id bigint NOT NULL,
  category text NOT NULL,
  rating numeric NOT NULL,
  status character varying NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT store_pkey PRIMARY KEY (id),
  CONSTRAINT Store_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.address(id)
);
CREATE TABLE public.store_products (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  store_id bigint NOT NULL,
  name text NOT NULL,
  unit_price numeric NOT NULL,
  status character varying NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT store_products_pkey PRIMARY KEY (id),
  CONSTRAINT Store_Products_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.store(id)
);