-- =====================================================
-- SAVERY - Part 1: Extensions & Enums
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ENUM types
CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'team');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'trial');
CREATE TYPE transaction_type AS ENUM ('INCOME', 'EXPENSE', 'TRANSFER');
CREATE TYPE asset_type AS ENUM ('CASH', 'INVESTMENT', 'PROPERTY', 'DEBT');
CREATE TYPE kanban_status AS ENUM ('TODO', 'PLANNED', 'PAID', 'OVERDUE');
CREATE TYPE debt_type AS ENUM ('OWE', 'OWED');
CREATE TYPE budget_period AS ENUM ('MONTHLY', 'WEEKLY');
CREATE TYPE team_role AS ENUM ('owner', 'admin', 'member', 'viewer');
