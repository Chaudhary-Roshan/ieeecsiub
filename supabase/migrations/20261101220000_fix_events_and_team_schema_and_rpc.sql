-- Migration: 20261101220000_fix_events_and_team_schema_and_rpc.sql
-- Purpose: Add missing columns and create SECURITY DEFINER RPCs for safe event and team administration

-- 1. Ensure columns exist on public.events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS registered_count INT DEFAULT 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS speakers JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);

-- 2. Ensure columns exist on public.team_members
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Atomic RPC: Save Chapter Event (INSERT or UPDATE)
CREATE OR REPLACE FUNCTION public.save_event(event_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id TEXT;
  v_slug TEXT;
  v_result JSONB;
BEGIN
  v_id := event_data->>'id';
  v_slug := COALESCE(event_data->>'slug', 'event-' || floor(extract(epoch from now())));

  -- If ID exists and record is present in DB, perform UPDATE
  IF v_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.events WHERE id = v_id) THEN
    UPDATE public.events
    SET
      slug = v_slug,
      title = COALESCE(event_data->>'title', title),
      description = COALESCE(event_data->>'description', description),
      learning_objectives = event_data->>'learning_objectives',
      target_audience = event_data->>'target_audience',
      start_date = COALESCE((event_data->>'start_date')::timestamptz, start_date),
      end_date = COALESCE((event_data->>'end_date')::timestamptz, end_date),
      venue = COALESCE(event_data->>'venue', venue),
      is_online = COALESCE((event_data->>'is_online')::boolean, is_online),
      meeting_link = event_data->>'meeting_link',
      status = COALESCE((event_data->>'status')::event_status, status),
      status_reason = event_data->>'status_reason',
      seats_limit = COALESCE((event_data->>'seats_limit')::int, seats_limit),
      fee_pkr = COALESCE((event_data->>'fee_pkr')::numeric, fee_pkr),
      payment_instructions = event_data->>'payment_instructions',
      certificate_type = COALESCE(event_data->>'certificate_type', certificate_type),
      certificate_rule = event_data->>'certificate_rule',
      vtools_id = event_data->>'vtools_id',
      vtools_link = event_data->>'vtools_link',
      featured_image = COALESCE(event_data->>'featured_image', featured_image),
      gallery_images = COALESCE(event_data->'gallery_images', '[]'::jsonb),
      event_report = event_data->>'event_report',
      speakers = COALESCE(event_data->'speakers', '[]'::jsonb),
      is_published = COALESCE((event_data->>'is_published')::boolean, is_published),
      updated_at = NOW()
    WHERE id = v_id
    RETURNING to_jsonb(public.events.*) INTO v_result;
  ELSE
    -- Perform INSERT
    INSERT INTO public.events (
      slug, title, description, learning_objectives, target_audience,
      start_date, end_date, venue, is_online, meeting_link,
      status, status_reason, seats_limit, fee_pkr, payment_instructions,
      certificate_type, certificate_rule, vtools_id, vtools_link,
      featured_image, gallery_images, event_report, speakers, is_published, created_at, updated_at
    ) VALUES (
      v_slug,
      COALESCE(event_data->>'title', 'Untitled Event'),
      COALESCE(event_data->>'description', ''),
      event_data->>'learning_objectives',
      event_data->>'target_audience',
      COALESCE((event_data->>'start_date')::timestamptz, NOW()),
      COALESCE((event_data->>'end_date')::timestamptz, NOW() + INTERVAL '1 day'),
      COALESCE(event_data->>'venue', 'TBD'),
      COALESCE((event_data->>'is_online')::boolean, false),
      event_data->>'meeting_link',
      COALESCE((event_data->>'status')::event_status, 'UPCOMING'::event_status),
      event_data->>'status_reason',
      COALESCE((event_data->>'seats_limit')::int, 60),
      COALESCE((event_data->>'fee_pkr')::numeric, 0),
      event_data->>'payment_instructions',
      COALESCE(event_data->>'certificate_type', 'Certificate of Participation'),
      event_data->>'certificate_rule',
      event_data->>'vtools_id',
      event_data->>'vtools_link',
      COALESCE(event_data->>'featured_image', '/ieee-cs-logo.png'),
      COALESCE(event_data->'gallery_images', '[]'::jsonb),
      event_data->>'event_report',
      COALESCE(event_data->'speakers', '[]'::jsonb),
      COALESCE((event_data->>'is_published')::boolean, true),
      NOW(),
      NOW()
    )
    RETURNING to_jsonb(public.events.*) INTO v_result;
  END IF;

  RETURN jsonb_build_object('success', true, 'event', v_result);
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_event(JSONB) TO anon, authenticated, service_role;

-- 4. Atomic RPC: Delete Chapter Event
CREATE OR REPLACE FUNCTION public.delete_event(p_event_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.events WHERE id = p_event_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_event(TEXT) TO anon, authenticated, service_role;

-- 5. Atomic RPC: Save Team Member
CREATE OR REPLACE FUNCTION public.save_team_member(member_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id TEXT;
  v_result JSONB;
BEGIN
  v_id := member_data->>'id';

  IF v_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.team_members WHERE id = v_id) THEN
    UPDATE public.team_members
    SET
      name = COALESCE(member_data->>'name', name),
      position = COALESCE(member_data->>'position', position),
      committee_year = COALESCE(member_data->>'committee_year', committee_year),
      photo_url = COALESCE(member_data->>'photo_url', photo_url),
      approved_bio = COALESCE(member_data->>'approved_bio', approved_bio),
      is_current = COALESCE((member_data->>'is_current')::boolean, is_current),
      order_index = COALESCE((member_data->>'order_index')::int, order_index),
      email = member_data->>'email',
      linkedin_url = member_data->>'linkedin_url',
      updated_at = NOW()
    WHERE id = v_id
    RETURNING to_jsonb(public.team_members.*) INTO v_result;
  ELSE
    INSERT INTO public.team_members (
      name, position, committee_year, photo_url, approved_bio, is_current, order_index, email, linkedin_url, created_at, updated_at
    ) VALUES (
      COALESCE(member_data->>'name', 'Member'),
      COALESCE(member_data->>'position', 'Executive Member'),
      COALESCE(member_data->>'committee_year', '2026-2027'),
      COALESCE(member_data->>'photo_url', '/team/placeholder.png'),
      COALESCE(member_data->>'approved_bio', ''),
      COALESCE((member_data->>'is_current')::boolean, true),
      COALESCE((member_data->>'order_index')::int, 10),
      member_data->>'email',
      member_data->>'linkedin_url',
      NOW(),
      NOW()
    )
    RETURNING to_jsonb(public.team_members.*) INTO v_result;
  END IF;

  RETURN jsonb_build_object('success', true, 'member', v_result);
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_team_member(JSONB) TO anon, authenticated, service_role;

-- 6. Atomic RPC: Delete Team Member
CREATE OR REPLACE FUNCTION public.delete_team_member(p_member_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.team_members WHERE id = p_member_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_team_member(TEXT) TO anon, authenticated, service_role;

