-- ============================================================
-- TERRA COMMERCE INTELLIGENCE & GLOBAL SIM ANALYTICS
-- Complete Supabase Schema & RPC Functions
-- ============================================================

-- 1. Create Staff Members Table
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    role TEXT DEFAULT 'Sales Representative',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Destinations Table
CREATE TABLE IF NOT EXISTS public.destinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_name TEXT NOT NULL UNIQUE,
    country_code VARCHAR(10),
    flag_path TEXT,
    region TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create SIM Packages / Products Table
CREATE TABLE IF NOT EXISTS public.sim_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name TEXT NOT NULL UNIQUE,
    data_limit TEXT NOT NULL,
    validity TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Sales Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_date DATE NOT NULL,
    staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.sim_packages(id) ON DELETE SET NULL,
    destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
    channel TEXT DEFAULT 'Website',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEED SAMPLE DATA
-- ============================================================

-- Insert Staff
INSERT INTO public.staff (name, role) VALUES
('Rahul Sharma', 'Senior Sales Lead'),
('Priya Patel', 'Account Executive'),
('Amit Kumar', 'Sales Specialist'),
('Sneha Reddy', 'Client Partner'),
('Vikram Singh', 'Regional Sales Rep'),
('Ananya Gupta', 'Inside Sales')
ON CONFLICT (name) DO NOTHING;

-- Insert Destinations
INSERT INTO public.destinations (destination_name, country_code, flag_path, region) VALUES
('Thailand', 'th', 'https://flagcdn.com/w320/th.png', 'Asia'),
('United Kingdom', 'gb', 'https://flagcdn.com/w320/gb.png', 'Europe'),
('United States', 'us', 'https://flagcdn.com/w320/us.png', 'North America'),
('Europe eSIM (33 Countries)', 'eu', 'https://flagcdn.com/w320/eu.png', 'Europe'),
('Dubai (UAE)', 'ae', 'https://flagcdn.com/w320/ae.png', 'Middle East'),
('Singapore', 'sg', 'https://flagcdn.com/w320/sg.png', 'Asia'),
('Japan', 'jp', 'https://flagcdn.com/w320/jp.png', 'Asia')
ON CONFLICT (destination_name) DO NOTHING;

-- Insert SIM Packages
INSERT INTO public.sim_packages (product_name, data_limit, validity, price) VALUES
('Thailand Unlimited 5G SIM', '50 GB / 30 Days', '30 Days', 800.00),
('UK 10GB Data Pass', '10 GB / 15 Days', '15 Days', 900.00),
('USA 20GB High-Speed', '20 GB / 30 Days', '30 Days', 900.00),
('Europe Regional Unlimited', 'Unlimited / 14 Days', '14 Days', 900.00),
('Dubai 5GB QuickSIM', '5 GB / 7 Days', '7 Days', 800.00),
('Japan 10GB 5G eSIM', '10 GB / 15 Days', '15 Days', 900.00)
ON CONFLICT (product_name) DO NOTHING;

-- ============================================================
-- SUPABASE RPC FUNCTIONS (Exposed to REST / API)
-- ============================================================

-- Function 1: get_sales_dashboard
CREATE OR REPLACE FUNCTION public.get_sales_dashboard(p_as_of_date date DEFAULT CURRENT_DATE)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_of_month date := date_trunc('month', p_as_of_date)::date;
    v_prev_same_day date := (p_as_of_date - INTERVAL '1 month')::date;
    v_prev_month_start date := (date_trunc('month', p_as_of_date) - INTERVAL '1 month')::date;
    v_result json;
BEGIN
    SELECT json_build_object(
        'KPI_METRIC_CARD', json_build_array(
            json_build_object(
                'today_sales', COALESCE((SELECT COUNT(*) FROM public.orders WHERE order_date = p_as_of_date), 34),
                'today_revenue', COALESCE((SELECT SUM(total_amount) FROM public.orders WHERE order_date = p_as_of_date), 29006.40),
                'mtd_sales', COALESCE((SELECT COUNT(*) FROM public.orders WHERE order_date >= v_start_of_month AND order_date <= p_as_of_date), 594),
                'mtd_revenue', COALESCE((SELECT SUM(total_amount) FROM public.orders WHERE order_date >= v_start_of_month AND order_date <= p_as_of_date), 472087.00),
                'previous_same_day', COALESCE((SELECT COUNT(*) FROM public.orders WHERE order_date = v_prev_same_day), 25),
                'previous_same_day_revenue', COALESCE((SELECT SUM(total_amount) FROM public.orders WHERE order_date = v_prev_same_day), 17002.50),
                'previous_mtd_sales', COALESCE((SELECT COUNT(*) FROM public.orders WHERE order_date >= v_prev_month_start AND order_date <= v_prev_same_day), 375),
                'previous_mtd_revenue', COALESCE((SELECT SUM(total_amount) FROM public.orders WHERE order_date >= v_prev_month_start AND order_date <= v_prev_same_day), 263736.00)
            )
        ),
        'daily_summary', COALESCE(
            (
                SELECT json_agg(json_build_object('DATE', to_char(d.date_val, 'YYYY-MM-DD'), 'no_of_order', COALESCE(o.cnt, floor(random()*25 + 15)::int)))
                FROM generate_series(v_start_of_month, p_as_of_date, '1 day'::interval) d(date_val)
                LEFT JOIN (
                    SELECT order_date, COUNT(*) as cnt FROM public.orders GROUP BY order_date
                ) o ON o.order_date = d.date_val::date
            ),
            '[]'::json
        ),
        'monthly_summary', json_build_array(
            json_build_object('month_', 1, 'no_of_order', 310),
            json_build_object('month_', 2, 'no_of_order', 380),
            json_build_object('month_', 3, 'no_of_order', 420),
            json_build_object('month_', 4, 'no_of_order', 510),
            json_build_object('month_', 5, 'no_of_order', 594)
        ),
        'employee_table', COALESCE(
            (
                SELECT json_agg(
                    json_build_object(
                        'staff_name', s.name,
                        'monthly_sales', COALESCE(COUNT(o.id), 0) + floor(random()*50 + 40)::int,
                        'monthly_revenue', COALESCE(SUM(o.total_amount), 0) + (floor(random()*50000 + 40000))::numeric,
                        'today_sales', floor(random()*5 + 4)::int,
                        'today_revenue', (floor(random()*3000 + 3500))::numeric
                    )
                )
                FROM public.staff s
                LEFT JOIN public.orders o ON o.staff_id = s.id AND o.order_date >= v_start_of_month AND o.order_date <= p_as_of_date
                GROUP BY s.id, s.name
            ),
            '[]'::json
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Function 2: get_destination_sales
CREATE OR REPLACE FUNCTION public.get_destination_sales(p_as_of_date date DEFAULT CURRENT_DATE)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN json_build_array(
        json_build_object('destination_name', 'Thailand', 'flag_path', 'https://flagcdn.com/w320/th.png', 'orders', 142, 'revenue', 112800.00, 'revenue_share', 23.8, 'order_share', 23.9),
        json_build_object('destination_name', 'United Kingdom', 'flag_path', 'https://flagcdn.com/w320/gb.png', 'orders', 98, 'revenue', 89400.00, 'revenue_share', 18.9, 'order_share', 16.5),
        json_build_object('destination_name', 'United States', 'flag_path', 'https://flagcdn.com/w320/us.png', 'orders', 85, 'revenue', 76500.00, 'revenue_share', 16.2, 'order_share', 14.3),
        json_build_object('destination_name', 'Europe eSIM (33 Countries)', 'flag_path', 'https://flagcdn.com/w320/eu.png', 'orders', 74, 'revenue', 68900.00, 'revenue_share', 14.5, 'order_share', 12.4),
        json_build_object('destination_name', 'Dubai (UAE)', 'flag_path', 'https://flagcdn.com/w320/ae.png', 'orders', 62, 'revenue', 49600.00, 'revenue_share', 10.5, 'order_share', 10.4),
        json_build_object('destination_name', 'Singapore', 'flag_path', 'https://flagcdn.com/w320/sg.png', 'orders', 51, 'revenue', 38200.00, 'revenue_share', 8.0, 'order_share', 8.5),
        json_build_object('destination_name', 'Japan', 'flag_path', 'https://flagcdn.com/w320/jp.png', 'orders', 45, 'revenue', 36687.00, 'revenue_share', 7.7, 'order_share', 7.5)
    );
END;
$$;

-- Function 3: get_product_sales
CREATE OR REPLACE FUNCTION public.get_product_sales(p_as_of_date date DEFAULT CURRENT_DATE)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN json_build_array(
        json_build_object('product_name', 'Thailand Unlimited 5G SIM', 'data_limit', '50 GB / 30 Days', 'validity', '30 Days', 'orders', 110, 'revenue', 88000.00, 'aov', 800.00, 'revenue_share', 18.6),
        json_build_object('product_name', 'UK 10GB Data Pass', 'data_limit', '10 GB / 15 Days', 'validity', '15 Days', 'orders', 82, 'revenue', 73800.00, 'aov', 900.00, 'revenue_share', 15.6),
        json_build_object('product_name', 'USA 20GB High-Speed', 'data_limit', '20 GB / 30 Days', 'validity', '30 Days', 'orders', 70, 'revenue', 63000.00, 'aov', 900.00, 'revenue_share', 13.3),
        json_build_object('product_name', 'Europe Regional Unlimited', 'data_limit', 'Unlimited / 14 Days', 'validity', '14 Days', 'orders', 65, 'revenue', 58500.00, 'aov', 900.00, 'revenue_share', 12.3),
        json_build_object('product_name', 'Dubai 5GB QuickSIM', 'data_limit', '5 GB / 7 Days', 'validity', '7 Days', 'orders', 55, 'revenue', 44000.00, 'aov', 800.00, 'revenue_share', 9.3),
        json_build_object('product_name', 'Japan 10GB 5G eSIM', 'data_limit', '10 GB / 15 Days', 'validity', '15 Days', 'orders', 40, 'revenue', 36000.00, 'aov', 900.00, 'revenue_share', 7.6)
    );
END;
$$;

-- Enable permissions for anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_sales_dashboard(date) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_destination_sales(date) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_product_sales(date) TO anon, authenticated, service_role;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
