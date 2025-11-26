-- Stackbird Database Schema for Supabase (PostgreSQL)
-- Run this in Supabase SQL Editor to create all required tables

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  "openId" VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  "loginMethod" VARCHAR(64),
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "lastSignedIn" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  "stripeCustomerId" VARCHAR(255),
  "stripeSubscriptionId" VARCHAR(255),
  "stripePriceId" VARCHAR(255),
  "currentPeriodStart" TIMESTAMP,
  "currentPeriodEnd" TIMESTAMP,
  "cancelAtPeriodEnd" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Credits table
CREATE TABLE IF NOT EXISTS credits (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  remaining INTEGER NOT NULL DEFAULT 10,
  total INTEGER NOT NULL DEFAULT 10,
  "resetDate" TIMESTAMP NOT NULL,
  plan VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Usage logs table
CREATE TABLE IF NOT EXISTS usage_logs (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN ('ai_message', 'code_execution', 'file_operation')),
  "creditsUsed" INTEGER NOT NULL DEFAULT 1,
  metadata TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  "filesKey" VARCHAR(512),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  "projectId" INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  "conversationId" INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Files table
CREATE TABLE IF NOT EXISTS files (
  id SERIAL PRIMARY KEY,
  "projectId" INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  path VARCHAR(512) NOT NULL,
  "fileKey" VARCHAR(512) NOT NULL,
  url TEXT NOT NULL,
  "mimeType" VARCHAR(128),
  size INTEGER,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_openid ON users("openId");
CREATE INDEX IF NOT EXISTS idx_subscriptions_userid ON subscriptions("userId");
CREATE INDEX IF NOT EXISTS idx_credits_userid ON credits("userId");
CREATE INDEX IF NOT EXISTS idx_usage_logs_userid ON usage_logs("userId");
CREATE INDEX IF NOT EXISTS idx_projects_userid ON projects("userId");
CREATE INDEX IF NOT EXISTS idx_conversations_projectid ON conversations("projectId");
CREATE INDEX IF NOT EXISTS idx_messages_conversationid ON messages("conversationId");
CREATE INDEX IF NOT EXISTS idx_files_projectid ON files("projectId");

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to auto-update updatedAt
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credits_updated_at BEFORE UPDATE ON credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Stackbird database schema created successfully!' AS status;
