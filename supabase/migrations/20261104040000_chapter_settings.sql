-- Migration: Add chapter_settings table for dynamic contact, WhatsApp, social, and address management
CREATE TABLE IF NOT EXISTS public.chapter_settings (
    id TEXT PRIMARY KEY DEFAULT 'current',
    email_general TEXT NOT NULL DEFAULT 'ieeecsiub.contact@gmail.com',
    email_verify TEXT NOT NULL DEFAULT 'ieeecsiub.contact@gmail.com',
    whatsapp_group_url TEXT NOT NULL DEFAULT 'https://chat.whatsapp.com/sample-ieee-cs-ucet-iub',
    whatsapp_chat_number TEXT NOT NULL DEFAULT '923000000000',
    linkedin_url TEXT NOT NULL DEFAULT 'https://www.linkedin.com/company/ieee-cs-ucet-iub',
    instagram_url TEXT NOT NULL DEFAULT 'https://www.instagram.com/ieeecsucetiub',
    facebook_url TEXT NOT NULL DEFAULT 'https://www.facebook.com/ieeecsucetiub',
    github_url TEXT NOT NULL DEFAULT 'https://github.com/ieee-cs-ucet-iub',
    parent_branch_url TEXT NOT NULL DEFAULT 'https://edu.ieee.org/pk-ucetiub',
    section_url TEXT NOT NULL DEFAULT 'https://ieeebahawalpurssection.org/',
    address_room_1 TEXT NOT NULL DEFAULT 'Room No. 1.25, Department of Information and Communication Engineering, Old Engineering Building, UCET',
    address_room_2 TEXT NOT NULL DEFAULT 'Room No. 105, Faculty of Engineering, IUB, Baghdad-ul-Jadeed Campus, Bahawalpur, Pakistan.',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by TEXT
);

-- Insert default row if not exists
INSERT INTO public.chapter_settings (id, email_general, email_verify, whatsapp_group_url, whatsapp_chat_number, linkedin_url, instagram_url, facebook_url, github_url, parent_branch_url, section_url, address_room_1, address_room_2)
VALUES (
    'current',
    'ieeecsiub.contact@gmail.com',
    'ieeecsiub.contact@gmail.com',
    'https://chat.whatsapp.com/sample-ieee-cs-ucet-iub',
    '923000000000',
    'https://www.linkedin.com/company/ieee-cs-ucet-iub',
    'https://www.instagram.com/ieeecsucetiub',
    'https://www.facebook.com/ieeecsucetiub',
    'https://github.com/ieee-cs-ucet-iub',
    'https://edu.ieee.org/pk-ucetiub',
    'https://ieeebahawalpurssection.org/',
    'Room No. 1.25, Department of Information and Communication Engineering, Old Engineering Building, UCET',
    'Room No. 105, Faculty of Engineering, IUB, Baghdad-ul-Jadeed Campus, Bahawalpur, Pakistan.'
)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.chapter_settings ENABLE ROW LEVEL SECURITY;

-- Permissions: Everyone can read
GRANT SELECT ON public.chapter_settings TO anon, authenticated, service_role;
DROP POLICY IF EXISTS "Public can view chapter settings" ON public.chapter_settings;
CREATE POLICY "Public can view chapter settings" ON public.chapter_settings FOR SELECT USING (true);

-- Permissions: Allow updates
GRANT ALL ON public.chapter_settings TO authenticated, service_role;
GRANT UPDATE, INSERT ON public.chapter_settings TO anon;
DROP POLICY IF EXISTS "Allow updates on chapter settings" ON public.chapter_settings;
CREATE POLICY "Allow updates on chapter settings" ON public.chapter_settings FOR ALL USING (true) WITH CHECK (true);

-- Reload schema
NOTIFY pgrst, 'reload schema';

