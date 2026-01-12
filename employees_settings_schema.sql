-- ============================================================================
-- EMPLOYEES & SETTINGS SERVICES: DATABASE SCHEMA
-- ============================================================================
-- Fine-Grained RBAC | Activity Logging | Performance Optimized
-- 
-- Services:
-- 1. Employees Service - Team management, RBAC, performance tracking
-- 2. Settings Service - Business configuration, subscriptions, integrations
-- ============================================================================

-- ============================================================================
-- SECTION 1: EMPLOYEES SERVICE (Team Management)
-- ============================================================================

-- ============================================================================
-- 1.1 Employees Table
-- ============================================================================
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Link to user account (if invited)
  
  -- Personal Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url VARCHAR(500),
  
  -- Employment Details
  employee_id VARCHAR(50), -- Custom employee ID (e.g., EMP-001)
  position VARCHAR(100),
  department VARCHAR(100),
  hire_date DATE,
  termination_date DATE,
  
  -- Compensation (encrypted)
  salary_amount NUMERIC(12,2), -- Encrypted in application layer
  salary_currency VARCHAR(3) DEFAULT 'DZD',
  salary_frequency VARCHAR(20) CHECK (salary_frequency IN ('hourly', 'daily', 'monthly', 'yearly')),
  
  -- Access Control
  role_id UUID REFERENCES roles(id), -- Primary role
  is_active BOOLEAN DEFAULT true,
  
  -- POS Security
  pin_code VARCHAR(255), -- Hashed PIN for POS login
  pin_enabled BOOLEAN DEFAULT false,
  
  -- Two-Factor Authentication
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret VARCHAR(255),
  
  -- Permissions Override (JSON array of permission IDs)
  custom_permissions JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' 
    CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
  invitation_token VARCHAR(255),
  invitation_expires_at TIMESTAMPTZ,
  invitation_accepted_at TIMESTAMPTZ,
  
  -- Performance Stats (denormalized)
  total_sales NUMERIC(12,2) DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  avg_transaction_value NUMERIC(10,2),
  
  -- Attendance
  total_hours_worked NUMERIC(8,2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT unique_merchant_employee_id UNIQUE (merchant_id, employee_id),
  CONSTRAINT unique_merchant_email UNIQUE (merchant_id, email)
);

-- Indexes
CREATE INDEX idx_employees_merchant ON employees(merchant_id, is_active);
CREATE INDEX idx_employees_role ON employees(role_id);
CREATE INDEX idx_employees_status ON employees(status) WHERE status = 'pending';
CREATE INDEX idx_employees_email ON employees(email);

-- ============================================================================
-- 1.2 Roles Table (RBAC)
-- ============================================================================
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Role Details
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Role Type
  is_system_role BOOLEAN DEFAULT false, -- System roles (Admin, Manager, Cashier)
  is_custom BOOLEAN DEFAULT false,
  
  -- Color for UI
  color VARCHAR(7) DEFAULT '#3b82f6',
  
  -- Hierarchy (for role inheritance)
  parent_role_id UUID REFERENCES roles(id),
  level INTEGER DEFAULT 0, -- 0 = top-level, 1 = child, etc.
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_merchant_role_slug UNIQUE (merchant_id, slug)
);

-- Indexes
CREATE INDEX idx_roles_merchant ON roles(merchant_id);
CREATE INDEX idx_roles_parent ON roles(parent_role_id);
CREATE INDEX idx_roles_system ON roles(is_system_role) WHERE is_system_role = true;

-- ============================================================================
-- 1.3 Permissions Table (Fine-Grained)
-- ============================================================================
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Permission Details
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  
  -- Categorization
  category VARCHAR(50) NOT NULL, -- 'sales', 'inventory', 'customers', 'reports', 'settings'
  resource VARCHAR(50) NOT NULL, -- 'products', 'transactions', 'users', etc.
  action VARCHAR(50) NOT NULL,   -- 'create', 'read', 'update', 'delete', 'manage'
  
  -- Scope (what level this permission applies to)
  scope VARCHAR(20) DEFAULT 'own' 
    CHECK (scope IN ('own', 'team', 'all')),
  
  -- Risk Level (for audit/approval workflows)
  risk_level VARCHAR(20) DEFAULT 'low'
    CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-populate with common permissions
INSERT INTO permissions (name, slug, category, resource, action, scope, risk_level) VALUES
-- Sales Permissions
('Create Sale', 'sales.create', 'sales', 'transactions', 'create', 'all', 'low'),
('View Sales', 'sales.read', 'sales', 'transactions', 'read', 'own', 'low'),
('View All Sales', 'sales.read_all', 'sales', 'transactions', 'read', 'all', 'medium'),
('Process Refund', 'sales.refund', 'sales', 'transactions', 'update', 'all', 'high'),
('Delete Sale', 'sales.delete', 'sales', 'transactions', 'delete', 'all', 'critical'),

-- Inventory Permissions
('Add Product', 'inventory.products.create', 'inventory', 'products', 'create', 'all', 'low'),
('View Products', 'inventory.products.read', 'inventory', 'products', 'read', 'all', 'low'),
('Edit Product', 'inventory.products.update', 'inventory', 'products', 'update', 'all', 'medium'),
('Delete Product', 'inventory.products.delete', 'inventory', 'products', 'delete', 'all', 'high'),
('Adjust Stock', 'inventory.stock.adjust', 'inventory', 'stock', 'update', 'all', 'high'),
('View Stock', 'inventory.stock.read', 'inventory', 'stock', 'read', 'all', 'low'),

-- Customer Permissions
('Add Customer', 'customers.create', 'customers', 'customers', 'create', 'all', 'low'),
('View Customers', 'customers.read', 'customers', 'customers', 'read', 'all', 'low'),
('Edit Customer', 'customers.update', 'customers', 'customers', 'update', 'all', 'medium'),
('Delete Customer', 'customers.delete', 'customers', 'customers', 'delete', 'all', 'high'),
('View Customer Data', 'customers.pii.read', 'customers', 'customers', 'read', 'all', 'high'),

-- Reports Permissions
('View Sales Reports', 'reports.sales.read', 'reports', 'reports', 'read', 'own', 'low'),
('View All Reports', 'reports.all.read', 'reports', 'reports', 'read', 'all', 'medium'),
('Export Reports', 'reports.export', 'reports', 'reports', 'create', 'all', 'medium'),
('View Financial Reports', 'reports.financial.read', 'reports', 'reports', 'read', 'all', 'high'),

-- Employee Permissions
('Add Employee', 'employees.create', 'employees', 'employees', 'create', 'all', 'high'),
('View Employees', 'employees.read', 'employees', 'employees', 'read', 'all', 'low'),
('Edit Employee', 'employees.update', 'employees', 'employees', 'update', 'all', 'high'),
('Delete Employee', 'employees.delete', 'employees', 'employees', 'delete', 'all', 'critical'),
('Manage Roles', 'employees.roles.manage', 'employees', 'roles', 'manage', 'all', 'critical'),

-- Settings Permissions
('View Settings', 'settings.read', 'settings', 'settings', 'read', 'all', 'low'),
('Edit Settings', 'settings.update', 'settings', 'settings', 'update', 'all', 'critical'),
('Manage Integrations', 'settings.integrations.manage', 'settings', 'integrations', 'manage', 'all', 'high'),
('View API Keys', 'settings.api_keys.read', 'settings', 'api_keys', 'read', 'all', 'high'),
('Manage API Keys', 'settings.api_keys.manage', 'settings', 'api_keys', 'manage', 'all', 'critical');

-- Indexes
CREATE INDEX idx_permissions_category ON permissions(category);
CREATE INDEX idx_permissions_resource ON permissions(resource, action);
CREATE INDEX idx_permissions_risk ON permissions(risk_level);

-- ============================================================================
-- 1.4 Role Permissions (Many-to-Many)
-- ============================================================================
CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  
  -- Optional: Constraint on permission (e.g., can only view own sales)
  constraints JSONB,
  
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES users(id),
  
  PRIMARY KEY (role_id, permission_id)
);

-- Indexes
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_perm ON role_permissions(permission_id);

-- ============================================================================
-- 1.5 Activity Log (Audit Trail)
-- ============================================================================
-- PARTITIONED by month for performance
CREATE TABLE activity_log (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES users(id),
  
  -- Actor (who performed the action)
  actor_id UUID REFERENCES employees(id),
  actor_type VARCHAR(20) DEFAULT 'employee', -- 'employee', 'system', 'api'
  actor_name VARCHAR(200),
  actor_email VARCHAR(255),
  actor_ip INET,
  
  -- Action
  action VARCHAR(100) NOT NULL, -- 'created', 'updated', 'deleted', 'viewed'
  resource_type VARCHAR(50) NOT NULL, -- 'product', 'sale', 'customer', etc.
  resource_id VARCHAR(100),
  
  -- Details
  description TEXT,
  changes JSONB, -- Before/after values for updates
  metadata JSONB, -- Additional context
  
  -- Risk classification
  severity VARCHAR(20) DEFAULT 'low'
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Device/context
  user_agent TEXT,
  device_id VARCHAR(100),
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE activity_log_2026_01 PARTITION OF activity_log
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE activity_log_2026_02 PARTITION OF activity_log
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- ... create remaining months

-- Indexes
CREATE INDEX idx_activity_merchant ON activity_log(merchant_id, created_at DESC);
CREATE INDEX idx_activity_actor ON activity_log(actor_id, created_at DESC);
CREATE INDEX idx_activity_resource ON activity_log(resource_type, resource_id);
CREATE INDEX idx_activity_severity ON activity_log(severity) 
  WHERE severity IN ('high', 'critical');

-- ============================================================================
-- 1.6 Employee Performance Metrics (Denormalized)
-- ============================================================================
CREATE MATERIALIZED VIEW mv_employee_performance AS
WITH sales_data AS (
  SELECT 
    jsonb_array_elements(items) ->> 'sold_by' AS employee_id,
    DATE(created_at) AS sale_date,
    total_amount,
    created_at
  FROM transactions
  WHERE payment_status = 'completed'
    AND jsonb_array_elements(items) ? 'sold_by'
)
SELECT 
  employee_id::UUID,
  COUNT(*) AS total_sales_count,
  SUM(total_amount) AS total_sales_amount,
  AVG(total_amount) AS avg_sale_amount,
  MAX(created_at) AS last_sale_at,
  
  -- Sales by time period
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) AS sales_today,
  COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)) AS sales_this_week,
  COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) AS sales_this_month,
  
  SUM(total_amount) FILTER (WHERE created_at >= CURRENT_DATE) AS revenue_today,
  SUM(total_amount) FILTER (WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)) AS revenue_this_week,
  SUM(total_amount) FILTER (WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) AS revenue_this_month
  
FROM sales_data
GROUP BY employee_id;

CREATE UNIQUE INDEX idx_mv_employee_perf ON mv_employee_performance(employee_id);

-- ============================================================================
-- 1.7 Attendance Tracking (Basic Time & Attendance)
-- ============================================================================
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  -- Clock in/out times
  clock_in_time TIMESTAMPTZ NOT NULL,
  clock_out_time TIMESTAMPTZ,
  
  -- Duration (calculated)
  hours_worked NUMERIC(5,2) GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (clock_out_time - clock_in_time)) / 3600
  ) STORED,
  
  -- Location (for multi-location businesses)
  location_id UUID,
  
  -- Notes
  notes TEXT,
  
  -- Approval (for timesheet systems)
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_attendance_employee ON attendance_records(employee_id, clock_in_time DESC);
CREATE INDEX idx_attendance_pending ON attendance_records(is_approved) 
  WHERE is_approved = false;

-- ============================================================================
-- SECTION 2: SETTINGS SERVICE
-- ============================================================================

-- ============================================================================
-- 2.1 Business Settings (Core Configuration)
-- ============================================================================
CREATE TABLE business_settings (
  merchant_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  
  -- Business Profile
  business_name VARCHAR(200) NOT NULL,
  legal_name VARCHAR(200),
  business_type VARCHAR(50), -- 'sole_proprietorship', 'llc', 'corporation'
  registration_number VARCHAR(100), -- RC number
  tax_id VARCHAR(100), -- NIF
  
  -- Contact Information
  email VARCHAR(255),
  phone VARCHAR(20),
  website VARCHAR(255),
  
  -- Address
  address TEXT,
  city VARCHAR(100),
  wilaya VARCHAR(50),
  postal_code VARCHAR(10),
  country VARCHAR(3) DEFAULT 'DZA',
  
  -- Branding
  logo_url VARCHAR(500),
  primary_color VARCHAR(7) DEFAULT '#3b82f6',
  
  -- Currency & Localization
  currency VARCHAR(3) DEFAULT 'DZD',
  timezone VARCHAR(50) DEFAULT 'Africa/Algiers',
  language VARCHAR(10) DEFAULT 'ar',
  date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  time_format VARCHAR(10) DEFAULT '24h',
  
  -- Fiscal Settings
  fiscal_year_start_month INTEGER DEFAULT 1 CHECK (fiscal_year_start_month BETWEEN 1 AND 12),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2.2 POS Settings
-- ============================================================================
CREATE TABLE pos_settings (
  merchant_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  
  -- Receipt Settings
  receipt_header TEXT, -- Custom header text
  receipt_footer TEXT, -- Custom footer text
  receipt_logo_url VARCHAR(500),
  receipt_template VARCHAR(20) DEFAULT 'standard', -- 'standard', 'minimal', 'detailed'
  
  -- Auto-print settings
  auto_print_receipt BOOLEAN DEFAULT true,
  print_customer_copy BOOLEAN DEFAULT true,
  print_merchant_copy BOOLEAN DEFAULT false,
  
  -- Receipt paper size
  paper_size VARCHAR(10) DEFAULT '80mm' CHECK (paper_size IN ('58mm', '80mm')),
  
  -- Tax Settings
  default_tax_rate NUMERIC(5,2) DEFAULT 19.00, -- TVA 19%
  tax_inclusive BOOLEAN DEFAULT true, -- Prices include tax
  
  -- Payment Methods (enabled/disabled)
  payment_methods JSONB DEFAULT '{
    "cash": {"enabled": true, "label": "نقداً"},
    "card": {"enabled": true, "label": "بطاقة"},
    "wallet": {"enabled": false, "label": "محفظة"},
    "transfer": {"enabled": false, "label": "تحويل"}
  }'::jsonb,
  
  -- Default payment method
  default_payment_method VARCHAR(20) DEFAULT 'cash',
  
  -- Discount Settings
  allow_discounts BOOLEAN DEFAULT true,
  max_discount_percentage NUMERIC(5,2) DEFAULT 20.00,
  require_manager_approval BOOLEAN DEFAULT true, -- For discounts > threshold
  
  -- Cash Drawer
  cash_drawer_enabled BOOLEAN DEFAULT true,
  starting_cash_amount NUMERIC(10,2) DEFAULT 1000.00,
  
  -- Barcode Scanner
  barcode_scanner_enabled BOOLEAN DEFAULT true,
  barcode_beep_enabled BOOLEAN DEFAULT true,
  
  -- Customer Display
  customer_display_enabled BOOLEAN DEFAULT false,
  
  -- Offline Mode
  offline_mode_enabled BOOLEAN DEFAULT true,
  max_offline_transactions INTEGER DEFAULT 1000,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2.3 Notification Settings
-- ============================================================================
CREATE TABLE notification_settings (
  merchant_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  
  -- Email Notifications
  email_enabled BOOLEAN DEFAULT true,
  email_daily_summary BOOLEAN DEFAULT true,
  email_weekly_report BOOLEAN DEFAULT true,
  email_low_stock_alert BOOLEAN DEFAULT true,
  email_new_review BOOLEAN DEFAULT true,
  
  -- SMS Notifications
  sms_enabled BOOLEAN DEFAULT false,
  sms_daily_summary BOOLEAN DEFAULT false,
  sms_low_stock_alert BOOLEAN DEFAULT true,
  
  -- Push Notifications (Mobile App)
  push_enabled BOOLEAN DEFAULT true,
  push_new_sale BOOLEAN DEFAULT true,
  push_new_customer BOOLEAN DEFAULT false,
  push_low_stock BOOLEAN DEFAULT true,
  
  -- Alert Thresholds
  low_stock_threshold INTEGER DEFAULT 10,
  high_value_transaction_threshold NUMERIC(10,2) DEFAULT 50000.00,
  
  -- Notification Times
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2.4 API Keys (For Integrations)
-- ============================================================================
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Key Details
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- The actual key (hashed)
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  key_prefix VARCHAR(10) NOT NULL, -- First 8 chars for identification (e.g., "sk_live_")
  
  -- Permissions (subset of role permissions)
  permissions JSONB DEFAULT '[]'::jsonb,
  
  -- Rate Limiting
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_day INTEGER DEFAULT 10000,
  
  -- IP Whitelist (optional)
  allowed_ips JSONB, -- Array of IP addresses
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Usage Stats
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  
  -- Expiration
  expires_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_api_keys_merchant ON api_keys(merchant_id, is_active);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_expiry ON api_keys(expires_at) 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();

-- ============================================================================
-- 2.5 Webhooks (Event Subscriptions)
-- ============================================================================
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Webhook Details
  name VARCHAR(100) NOT NULL,
  url VARCHAR(500) NOT NULL,
  
  -- Events to subscribe to
  events JSONB NOT NULL, -- Array of event types: ['transaction.created', 'product.updated']
  
  -- Security
  secret VARCHAR(255), -- For HMAC signature verification
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Reliability
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  
  -- Stats
  total_deliveries INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,
  last_delivery_at TIMESTAMPTZ,
  last_delivery_status VARCHAR(20),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_webhooks_merchant ON webhooks(merchant_id, is_active);

-- ============================================================================
-- 2.6 Webhook Delivery Log (For debugging)
-- ============================================================================
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  
  -- Request
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  
  -- Response
  status_code INTEGER,
  response_body TEXT,
  response_time_ms INTEGER,
  
  -- Result
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  
  -- Retry info
  attempt_number INTEGER DEFAULT 1,
  next_retry_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id, created_at DESC);
CREATE INDEX idx_webhook_deliveries_retry ON webhook_deliveries(next_retry_at)
  WHERE success = false AND next_retry_at IS NOT NULL;

-- ============================================================================
-- 2.7 Subscription & Billing
-- ============================================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Plan Details
  plan_tier VARCHAR(20) NOT NULL 
    CHECK (plan_tier IN ('free', 'starter', 'growth', 'enterprise')),
  plan_name VARCHAR(100),
  
  -- Pricing
  price_amount NUMERIC(10,2) NOT NULL,
  price_currency VARCHAR(3) DEFAULT 'DZD',
  billing_cycle VARCHAR(20) NOT NULL 
    CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
  
  -- Status
  status VARCHAR(20) DEFAULT 'active'
    CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'expired')),
  
  -- Dates
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  -- Features/Limits
  max_employees INTEGER,
  max_products INTEGER,
  max_locations INTEGER,
  features JSONB, -- Array of enabled features
  
  -- Payment
  payment_method_id VARCHAR(100), -- External payment provider ID
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_renewal ON subscriptions(current_period_end)
  WHERE status = 'active';

-- ============================================================================
-- SECTION 3: TRIGGERS & FUNCTIONS
-- ============================================================================

-- ============================================================================
-- 3.1 Activity Logging Trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into activity log
  INSERT INTO activity_log (
    merchant_id,
    actor_id,
    action,
    resource_type,
    resource_id,
    description,
    changes,
    severity
  )
  VALUES (
    COALESCE(NEW.merchant_id, OLD.merchant_id),
    current_setting('app.current_employee_id', true)::UUID,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    TG_OP || ' ' || TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'UPDATE' THEN 
        jsonb_build_object(
          'before', to_jsonb(OLD),
          'after', to_jsonb(NEW)
        )
      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
      ELSE to_jsonb(NEW)
    END,
    'low'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply to critical tables
CREATE TRIGGER log_employees_activity
AFTER INSERT OR UPDATE OR DELETE ON employees
FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_roles_activity
AFTER INSERT OR UPDATE OR DELETE ON roles
FOR EACH ROW EXECUTE FUNCTION log_activity();

-- ============================================================================
-- 3.2 Update Employee Performance Stats
-- ============================================================================
CREATE OR REPLACE FUNCTION update_employee_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_employee_performance;
END;
$$ LANGUAGE plpgsql;

-- Schedule: Refresh every hour
-- pg_cron: SELECT cron.schedule('refresh-employee-stats', '0 * * * *', 'SELECT update_employee_stats()');

-- ============================================================================
-- 3.3 Validate Role Permissions (Prevent Privilege Escalation)
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_role_assignment()
RETURNS TRIGGER AS $$
DECLARE
  actor_role_level INTEGER;
  new_role_level INTEGER;
BEGIN
  -- Get actor's role level
  SELECT r.level INTO actor_role_level
  FROM employees e
  JOIN roles r ON r.id = e.role_id
  WHERE e.id = current_setting('app.current_employee_id', true)::UUID;
  
  -- Get new role level
  SELECT level INTO new_role_level
  FROM roles
  WHERE id = NEW.role_id;
  
  -- Prevent assigning higher-level role than actor has
  IF new_role_level < actor_role_level THEN
    RAISE EXCEPTION 'Cannot assign role with higher privileges than your own';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_employee_role_assignment
BEFORE INSERT OR UPDATE OF role_id ON employees
FOR EACH ROW EXECUTE FUNCTION validate_role_assignment();

-- ============================================================================
-- SECTION 4: INITIAL DATA (System Roles)
-- ============================================================================

-- Create default roles (system-wide, not merchant-specific)
-- These will be copied for each merchant on signup

CREATE TABLE system_roles_template (
  name VARCHAR(100) PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  level INTEGER,
  default_permissions TEXT[] -- Array of permission slugs
);

INSERT INTO system_roles_template (name, slug, description, level, default_permissions) VALUES
(
  'Admin',
  'admin',
  'Full access to all features and settings',
  0,
  ARRAY[
    'sales.create', 'sales.read_all', 'sales.refund', 'sales.delete',
    'inventory.products.create', 'inventory.products.read', 'inventory.products.update', 'inventory.products.delete',
    'inventory.stock.adjust', 'inventory.stock.read',
    'customers.create', 'customers.read', 'customers.update', 'customers.delete', 'customers.pii.read',
    'reports.all.read', 'reports.export', 'reports.financial.read',
    'employees.create', 'employees.read', 'employees.update', 'employees.delete', 'employees.roles.manage',
    'settings.read', 'settings.update', 'settings.integrations.manage', 'settings.api_keys.manage'
  ]
),
(
  'Manager',
  'manager',
  'Can manage daily operations but cannot change critical settings',
  1,
  ARRAY[
    'sales.create', 'sales.read_all', 'sales.refund',
    'inventory.products.create', 'inventory.products.read', 'inventory.products.update',
    'inventory.stock.adjust', 'inventory.stock.read',
    'customers.create', 'customers.read', 'customers.update',
    'reports.all.read', 'reports.export',
    'employees.read'
  ]
),
(
  'Cashier',
  'cashier',
  'Can process sales and basic inventory operations',
  2,
  ARRAY[
    'sales.create', 'sales.read',
    'inventory.products.read', 'inventory.stock.read',
    'customers.create', 'customers.read',
    'reports.sales.read'
  ]
),
(
  'Sales Associate',
  'sales_associate',
  'Can process sales only',
  2,
  ARRAY[
    'sales.create', 'sales.read',
    'inventory.products.read',
    'customers.read'
  ]
);

-- ============================================================================
-- SECTION 5: UTILITY VIEWS
-- ============================================================================

-- ============================================================================
-- 5.1 Employee Permissions View (Resolved)
-- ============================================================================
-- This view resolves all permissions for an employee (role + custom)
CREATE VIEW v_employee_permissions AS
SELECT DISTINCT
  e.id AS employee_id,
  e.merchant_id,
  p.id AS permission_id,
  p.slug AS permission_slug,
  p.name AS permission_name,
  p.category,
  p.resource,
  p.action,
  p.scope,
  'role' AS source
FROM employees e
JOIN roles r ON r.id = e.role_id
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE e.is_active = true

UNION

SELECT DISTINCT
  e.id AS employee_id,
  e.merchant_id,
  p.id AS permission_id,
  p.slug AS permission_slug,
  p.name AS permission_name,
  p.category,
  p.resource,
  p.action,
  p.scope,
  'custom' AS source
FROM employees e
CROSS JOIN LATERAL jsonb_array_elements_text(e.custom_permissions) AS perm_slug
JOIN permissions p ON p.slug = perm_slug::TEXT
WHERE e.is_active = true;

-- ============================================================================
-- 5.2 Active Employees Summary
-- ============================================================================
CREATE VIEW v_active_employees AS
SELECT 
  e.*,
  r.name AS role_name,
  r.slug AS role_slug,
  u.email AS user_email,
  COALESCE(p.total_sales_amount, 0) AS total_sales,
  COALESCE(p.sales_this_month, 0) AS sales_this_month
FROM employees e
LEFT JOIN roles r ON r.id = e.role_id
LEFT JOIN users u ON u.id = e.user_id
LEFT JOIN mv_employee_performance p ON p.employee_id = e.id
WHERE e.is_active = true;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================