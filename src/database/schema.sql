-- Robust PostgreSQL Schema for SD GHT HEALTH CARE NIG LTD
-- Focus: Data Integrity, Performance, and Anonymous Privacy

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Customers)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    phone_number TEXT UNIQUE NOT NULL,
    access_token UUID DEFAULT uuid_generate_v4(), -- For Anonymous RLS
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCTS
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    short_desc TEXT,
    long_desc TEXT,
    health_benefits TEXT[] DEFAULT '{}',
    package TEXT,
    usage TEXT,
    ingredients TEXT,
    warning TEXT,
    price_naira NUMERIC(12, 2) NOT NULL CHECK (price_naira >= 0),
    discount_percent INTEGER DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
    nafdac_no TEXT,
    image_url TEXT,
    image_desc_url TEXT,
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for searching health benefits efficiently
CREATE INDEX idx_products_benefits ON products USING GIN (health_benefits);
CREATE INDEX idx_products_name ON products (name);

-- 3. CONSULTATIONS
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    illness TEXT,
    symptoms TEXT NOT NULL,
    ai_recommendation TEXT,
    recommended_products TEXT[] DEFAULT '{}',
    access_token UUID NOT NULL, -- Matches the profile's access_token for RLS
    distributor_id TEXT, -- To track your marketing efforts
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_consultations_phone ON consultations (phone);
CREATE INDEX idx_consultations_token ON consultations (access_token);

-- 4. BLOG POSTS
CREATE TABLE blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ORDERS
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE RESTRICT,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
    shipping_address TEXT,
    access_token UUID NOT NULL,
    distributor_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ORDER ITEMS
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_time NUMERIC(12, 2) NOT NULL CHECK (price_at_time >= 0)
);

-- ==========================================
-- AUTOMATIC UPDATED_AT TRIGGER
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_products_modtime BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_blog_posts_modtime BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 7. RECOMMENDED PACKAGES
CREATE TABLE recommended_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    discount NUMERIC(12, 2) DEFAULT 0 CHECK (discount >= 0),
    package_image_url TEXT,
    health_benefits TEXT[] DEFAULT '{}',
    symptoms TEXT[] DEFAULT '{}',
    package_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PACKAGE PRODUCTS (Junction Table)
CREATE TABLE package_products (
    package_id UUID REFERENCES recommended_packages(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    PRIMARY KEY (package_id, product_id)
);

CREATE TRIGGER update_recommended_packages_modtime BEFORE UPDATE ON recommended_packages FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================
-- ROW LEVEL SECURITY (RLS) - ANONYMOUS
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommended_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_products ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ ACCESS
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Anyone can view blogs" ON blog_posts FOR SELECT USING (true);
CREATE POLICY "Anyone can view recommended packages" ON recommended_packages FOR SELECT USING (true);
CREATE POLICY "Anyone can view package products" ON package_products FOR SELECT USING (true);

-- ANONYMOUS SESSION ACCESS
-- We assume the 'app.current_access_token' is set by the backend for each request
CREATE POLICY "Users can view their own consultations via token" ON consultations
FOR SELECT USING (access_token = current_setting('app.current_access_token', true)::uuid);

CREATE POLICY "Users can insert consultations with their token" ON consultations
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own orders via token" ON orders
FOR SELECT USING (access_token = current_setting('app.current_access_token', true)::uuid);
 
CREATE POLICY "Users can view their own order items" ON order_items
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_items.order_id 
        AND orders.access_token = current_setting('app.current_access_token', true)::uuid
    )
);
