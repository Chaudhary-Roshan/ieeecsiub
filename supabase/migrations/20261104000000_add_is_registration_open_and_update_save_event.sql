-- Migration: Add is_registration_open and update save_event RPC
-- Ensures public registration toggle can be opened or closed by Chapter Administrators

-- 1. Add is_registration_open column to public.events if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'events'
      AND column_name = 'is_registration_open'
  ) THEN
    ALTER TABLE public.events ADD COLUMN is_registration_open BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- 2. Update public.save_event RPC to persist is_registration_open and payment_instructions
CREATE OR REPLACE FUNCTION public.save_event(event_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id TEXT;
  v_slug TEXT;
  v_base_slug TEXT;
  v_target_id UUID;
  v_result JSONB;
BEGIN
  SET LOCAL statement_timeout = '60s';
  SET LOCAL lock_timeout = '5s';

  v_id := event_data->>'id';
  v_slug := COALESCE(event_data->>'slug', 'event-' || floor(extract(epoch from now())));
  v_base_slug := regexp_replace(v_slug, '^202[0-9]/', '');

  -- Locate existing event by ID (if UUID), exact slug, or base slug
  SELECT id INTO v_target_id FROM public.events
  WHERE 
    (v_id IS NOT NULL AND id::text = v_id)
    OR slug = v_slug
    OR slug = ('2026/' || v_base_slug)
    OR regexp_replace(slug, '^202[0-9]/', '') = v_base_slug
  LIMIT 1;

  IF v_target_id IS NOT NULL THEN
    -- UPDATE existing event
    UPDATE public.events
    SET
      slug = COALESCE(event_data->>'slug', slug),
      title = COALESCE(event_data->>'title', title),
      description = COALESCE(event_data->>'description', description),
      learning_objectives = COALESCE(event_data->>'learning_objectives', event_data->>'learningObjectives', learning_objectives),
      target_audience = COALESCE(event_data->>'target_audience', event_data->>'targetAudience', target_audience),
      start_date = COALESCE((event_data->>'start_date')::timestamptz, (event_data->>'startDate')::timestamptz, start_date),
      end_date = COALESCE((event_data->>'end_date')::timestamptz, (event_data->>'endDate')::timestamptz, end_date),
      venue = COALESCE(event_data->>'venue', venue),
      is_online = COALESCE((event_data->>'is_online')::boolean, (event_data->>'isOnline')::boolean, is_online),
      meeting_link = COALESCE(event_data->>'meeting_link', event_data->>'meetingLink', meeting_link),
      status = COALESCE((event_data->>'status')::event_status, status),
      status_reason = COALESCE(event_data->>'status_reason', event_data->>'statusReason', status_reason),
      is_registration_open = COALESCE((event_data->>'is_registration_open')::boolean, (event_data->>'isRegistrationOpen')::boolean, is_registration_open),
      seats_limit = COALESCE((event_data->>'seats_limit')::int, (event_data->>'seatsLimit')::int, seats_limit),
      fee_pkr = COALESCE((event_data->>'fee_pkr')::numeric, (event_data->>'feePkr')::numeric, fee_pkr),
      payment_instructions = CASE 
        WHEN event_data ? 'payment_instructions' THEN event_data->>'payment_instructions'
        WHEN event_data ? 'paymentInstructions' THEN event_data->>'paymentInstructions'
        ELSE payment_instructions
      END,
      certificate_type = COALESCE(event_data->>'certificate_type', event_data->>'certificateType', certificate_type),
      certificate_rule = COALESCE(event_data->>'certificate_rule', event_data->>'certificateRule', certificate_rule),
      vtools_id = COALESCE(event_data->>'vtools_id', event_data->>'vtoolsId', vtools_id),
      vtools_link = COALESCE(event_data->>'vtools_link', event_data->>'vtoolsLink', vtools_link),
      featured_image = COALESCE(event_data->>'featured_image', event_data->>'featuredImage', featured_image),
      gallery_images = COALESCE(event_data->'gallery_images', event_data->'galleryImages', gallery_images),
      event_report = COALESCE(event_data->>'event_report', event_data->>'eventReport', event_report),
      speakers = COALESCE(event_data->'speakers', '[]'::jsonb),
      is_published = COALESCE((event_data->>'is_published')::boolean, is_published),
      updated_at = NOW()
    WHERE id = v_target_id
    RETURNING to_jsonb(public.events.*) INTO v_result;
  ELSE
    -- INSERT new event
    INSERT INTO public.events (
      slug, title, description, learning_objectives, target_audience,
      start_date, end_date, venue, is_online, meeting_link,
      status, status_reason, is_registration_open, seats_limit, fee_pkr, payment_instructions,
      certificate_type, certificate_rule, vtools_id, vtools_link,
      featured_image, gallery_images, event_report, speakers, is_published, created_at, updated_at
    ) VALUES (
      v_slug,
      COALESCE(event_data->>'title', 'Untitled Event'),
      COALESCE(event_data->>'description', ''),
      COALESCE(event_data->>'learning_objectives', event_data->>'learningObjectives'),
      COALESCE(event_data->>'target_audience', event_data->>'targetAudience'),
      COALESCE((event_data->>'start_date')::timestamptz, (event_data->>'startDate')::timestamptz, NOW()),
      COALESCE((event_data->>'end_date')::timestamptz, (event_data->>'endDate')::timestamptz, NOW() + INTERVAL '1 day'),
      COALESCE(event_data->>'venue', 'UCET IUB'),
      COALESCE((event_data->>'is_online')::boolean, (event_data->>'isOnline')::boolean, false),
      COALESCE(event_data->>'meeting_link', event_data->>'meetingLink'),
      COALESCE((event_data->>'status')::event_status, 'UPCOMING'::event_status),
      COALESCE(event_data->>'status_reason', event_data->>'statusReason'),
      COALESCE((event_data->>'is_registration_open')::boolean, (event_data->>'isRegistrationOpen')::boolean, true),
      COALESCE((event_data->>'seats_limit')::int, (event_data->>'seatsLimit')::int, 60),
      COALESCE((event_data->>'fee_pkr')::numeric, (event_data->>'feePkr')::numeric, 0),
      COALESCE(event_data->>'payment_instructions', event_data->>'paymentInstructions'),
      COALESCE(event_data->>'certificate_type', event_data->>'certificateType', 'Certificate of Participation'),
      COALESCE(event_data->>'certificate_rule', event_data->>'certificateRule', 'Minimum 80% physical attendance verified via digital check-in'),
      COALESCE(event_data->>'vtools_id', event_data->>'vtoolsId'),
      COALESCE(event_data->>'vtools_link', event_data->>'vtoolsLink'),
      COALESCE(event_data->>'featured_image', event_data->>'featuredImage', '/ieee-cs-logo.png'),
      COALESCE(event_data->'gallery_images', event_data->'galleryImages', '[]'::jsonb),
      COALESCE(event_data->>'event_report', event_data->>'eventReport'),
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

