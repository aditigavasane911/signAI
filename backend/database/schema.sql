-- ==============================================================================
-- SignAI PostgreSQL / Supabase Database Schema
-- Run this script in your Supabase SQL Editor or directly against PostgreSQL
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Profiles Table (Mirrors Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- 3. Automatic Profile Creation Trigger on Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = now();
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if already exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Translation & Gesture Recognition History Table
CREATE TABLE IF NOT EXISTS public.translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    recognition_mode VARCHAR(50) NOT NULL DEFAULT 'isl',
    predicted_label VARCHAR(100) NOT NULL,
    confidence NUMERIC(5, 4) NOT NULL,
    status VARCHAR(20) DEFAULT 'match',
    hand_count INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own translations"
    ON public.translations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own translations"
    ON public.translations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own translations"
    ON public.translations FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_translations_user_created ON public.translations(user_id, created_at DESC);

-- 5. Saved Phrases & Bookmarks Table
CREATE TABLE IF NOT EXISTS public.saved_phrases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    phrase_key VARCHAR(100) NOT NULL,
    phrase_name VARCHAR(150) NOT NULL,
    category VARCHAR(50) DEFAULT 'everyday',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, phrase_key)
);

ALTER TABLE public.saved_phrases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own saved phrases"
    ON public.saved_phrases FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved phrases"
    ON public.saved_phrases FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved phrases"
    ON public.saved_phrases FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_phrases_user ON public.saved_phrases(user_id);
