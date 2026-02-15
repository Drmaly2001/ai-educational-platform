-- AI Educational Platform - Initial Database Schema
-- Supabase PostgreSQL Migration

-- Enable UUID extension (optional, using serial IDs for now)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

---------------------------------------------------
-- 1. Schools
---------------------------------------------------
CREATE TABLE IF NOT EXISTS schools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'US',
    postal_code VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(255),
    website TEXT,
    logo_url TEXT,
    description TEXT,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(50) DEFAULT 'active',
    max_teachers INTEGER DEFAULT 5,
    max_students INTEGER DEFAULT 100,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schools_code ON schools(code);
CREATE INDEX IF NOT EXISTS idx_schools_slug ON schools(slug);
CREATE INDEX IF NOT EXISTS idx_schools_is_active ON schools(is_active);

---------------------------------------------------
-- 2. Users
---------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'school_admin', 'teacher', 'student', 'parent')),
    school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

---------------------------------------------------
-- 3. Syllabi
---------------------------------------------------
CREATE TABLE IF NOT EXISTS syllabi (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50),
    curriculum_standard VARCHAR(50),
    duration_weeks INTEGER,
    learning_objectives JSONB,
    weekly_breakdown JSONB,
    assessment_plan JSONB,
    revision_schedule JSONB,
    resources JSONB DEFAULT '[]',
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_syllabi_school_id ON syllabi(school_id);
CREATE INDEX IF NOT EXISTS idx_syllabi_subject ON syllabi(subject);
CREATE INDEX IF NOT EXISTS idx_syllabi_is_published ON syllabi(is_published);

---------------------------------------------------
-- 4. Classes
---------------------------------------------------
CREATE TABLE IF NOT EXISTS classes (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    subject VARCHAR(100),
    grade_level VARCHAR(50),
    academic_year VARCHAR(20),
    term VARCHAR(50),
    section VARCHAR(50),
    teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    syllabus_id INTEGER REFERENCES syllabi(id) ON DELETE SET NULL,
    max_students INTEGER DEFAULT 50,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_subject ON classes(subject);
CREATE INDEX IF NOT EXISTS idx_classes_grade_level ON classes(grade_level);
CREATE INDEX IF NOT EXISTS idx_classes_academic_year ON classes(academic_year);

---------------------------------------------------
-- 5. Lessons
---------------------------------------------------
CREATE TABLE IF NOT EXISTS lessons (
    id SERIAL PRIMARY KEY,
    syllabus_id INTEGER REFERENCES syllabi(id) ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    week_number INTEGER,
    day_number INTEGER,
    topic VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    difficulty_level VARCHAR(50) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    duration_minutes INTEGER DEFAULT 60,
    learning_goals JSONB,
    prerequisites JSONB,
    explanation TEXT,
    examples JSONB,
    activities JSONB,
    discussion_questions JSONB,
    homework TEXT,
    resources JSONB DEFAULT '[]',
    differentiated_versions JSONB,
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_model_version VARCHAR(50),
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_syllabus_id ON lessons(syllabus_id);
CREATE INDEX IF NOT EXISTS idx_lessons_class_id ON lessons(class_id);
CREATE INDEX IF NOT EXISTS idx_lessons_week_number ON lessons(week_number);
CREATE INDEX IF NOT EXISTS idx_lessons_topic ON lessons(topic);
CREATE INDEX IF NOT EXISTS idx_lessons_is_published ON lessons(is_published);

---------------------------------------------------
-- 6. Fees Types
---------------------------------------------------
CREATE TABLE IF NOT EXISTS fees_types (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fees_types_school_id ON fees_types(school_id);
CREATE INDEX IF NOT EXISTS idx_fees_types_is_active ON fees_types(is_active);

---------------------------------------------------
-- 7. Fees Groups
---------------------------------------------------
CREATE TABLE IF NOT EXISTS fees_groups (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fees_groups_school_id ON fees_groups(school_id);
CREATE INDEX IF NOT EXISTS idx_fees_groups_is_active ON fees_groups(is_active);

---------------------------------------------------
-- 8. Fees Masters
---------------------------------------------------
CREATE TABLE IF NOT EXISTS fees_masters (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    fees_group_id INTEGER NOT NULL REFERENCES fees_groups(id) ON DELETE CASCADE,
    fees_type_id INTEGER NOT NULL REFERENCES fees_types(id) ON DELETE CASCADE,
    amount DOUBLE PRECISION NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    academic_year VARCHAR(20),
    term VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fees_masters_school_id ON fees_masters(school_id);
CREATE INDEX IF NOT EXISTS idx_fees_masters_fees_group_id ON fees_masters(fees_group_id);
CREATE INDEX IF NOT EXISTS idx_fees_masters_fees_type_id ON fees_masters(fees_type_id);
CREATE INDEX IF NOT EXISTS idx_fees_masters_academic_year ON fees_masters(academic_year);

---------------------------------------------------
-- 9. Fees Discounts
---------------------------------------------------
CREATE TABLE IF NOT EXISTS fees_discounts (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    amount DOUBLE PRECISION NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fees_discounts_school_id ON fees_discounts(school_id);
CREATE INDEX IF NOT EXISTS idx_fees_discounts_is_active ON fees_discounts(is_active);

---------------------------------------------------
-- 10. Fees Assigns
---------------------------------------------------
CREATE TABLE IF NOT EXISTS fees_assigns (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fees_master_id INTEGER NOT NULL REFERENCES fees_masters(id) ON DELETE CASCADE,
    discount_id INTEGER REFERENCES fees_discounts(id) ON DELETE SET NULL,
    total_amount DOUBLE PRECISION NOT NULL,
    paid_amount DOUBLE PRECISION DEFAULT 0.0,
    balance DOUBLE PRECISION NOT NULL,
    status VARCHAR(20) DEFAULT 'unpaid' CHECK (status IN ('paid', 'partial', 'unpaid')),
    due_date TIMESTAMP WITH TIME ZONE,
    is_carried_forward BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fees_assigns_school_id ON fees_assigns(school_id);
CREATE INDEX IF NOT EXISTS idx_fees_assigns_student_id ON fees_assigns(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_assigns_fees_master_id ON fees_assigns(fees_master_id);
CREATE INDEX IF NOT EXISTS idx_fees_assigns_status ON fees_assigns(status);

---------------------------------------------------
-- 11. Fees Payments
---------------------------------------------------
CREATE TABLE IF NOT EXISTS fees_payments (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fees_assign_id INTEGER NOT NULL REFERENCES fees_assigns(id) ON DELETE CASCADE,
    fees_master_id INTEGER NOT NULL REFERENCES fees_masters(id) ON DELETE CASCADE,
    amount DOUBLE PRECISION NOT NULL,
    payment_method VARCHAR(30) NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'online', 'cheque')),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    transaction_id VARCHAR(100),
    receipt_number VARCHAR(100) UNIQUE,
    bank_name VARCHAR(100),
    cheque_number VARCHAR(50),
    cheque_date TIMESTAMP WITH TIME ZONE,
    note TEXT,
    collected_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_verified BOOLEAN DEFAULT TRUE,
    verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fees_payments_school_id ON fees_payments(school_id);
CREATE INDEX IF NOT EXISTS idx_fees_payments_student_id ON fees_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_payments_fees_assign_id ON fees_payments(fees_assign_id);
CREATE INDEX IF NOT EXISTS idx_fees_payments_fees_master_id ON fees_payments(fees_master_id);
CREATE INDEX IF NOT EXISTS idx_fees_payments_transaction_id ON fees_payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_fees_payments_receipt_number ON fees_payments(receipt_number);

---------------------------------------------------
-- 12. Fees Reminders
---------------------------------------------------
CREATE TABLE IF NOT EXISTS fees_reminders (
    id SERIAL PRIMARY KEY,
    school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    fees_assign_id INTEGER NOT NULL REFERENCES fees_assigns(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reminder_type VARCHAR(30) NOT NULL CHECK (reminder_type IN ('email', 'sms', 'in_app')),
    message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fees_reminders_school_id ON fees_reminders(school_id);
CREATE INDEX IF NOT EXISTS idx_fees_reminders_student_id ON fees_reminders(student_id);

---------------------------------------------------
-- Auto-update updated_at trigger function
---------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN
        SELECT unnest(ARRAY[
            'schools', 'users', 'syllabi', 'classes', 'lessons',
            'fees_types', 'fees_groups', 'fees_masters', 'fees_discounts',
            'fees_assigns', 'fees_payments', 'fees_reminders'
        ])
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trigger_update_%I_updated_at ON %I;
            CREATE TRIGGER trigger_update_%I_updated_at
                BEFORE UPDATE ON %I
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END;
$$;

---------------------------------------------------
-- Enable Row Level Security (RLS) on all tables
---------------------------------------------------
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabi ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees_masters ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees_assigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees_reminders ENABLE ROW LEVEL SECURITY;
