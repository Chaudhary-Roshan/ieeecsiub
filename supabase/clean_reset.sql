-- ====================================================================
-- IEEE CS UCET-IUB: Clean Database Truncate & Production Ready Reset
-- IEEE Computer Society Student Branch Chapter, UCET - IUB
-- ====================================================================

-- 1. Truncate all dynamic data tables (clears test rows completely)
TRUNCATE TABLE certificates CASCADE;
TRUNCATE TABLE certificate_versions CASCADE;
TRUNCATE TABLE upload_batches CASCADE;
TRUNCATE TABLE tickets CASCADE;
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE registrations CASCADE;
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE contact_messages CASCADE;
TRUNCATE TABLE news CASCADE;

-- 2. Clear events and insert the real event: IEEE DigitalFest 2026 – Projects Expo
DELETE FROM events;

INSERT INTO events (
  id,
  slug,
  title,
  description,
  learning_objectives,
  target_audience,
  start_date,
  end_date,
  venue,
  is_online,
  status,
  seats_limit,
  fee_pkr,
  certificate_type,
  certificate_rule,
  vtools_id,
  vtools_link,
  featured_image,
  gallery_images,
  event_report
) VALUES (
  'e0123456-789a-bcde-f012-3456789abcde'::uuid,
  '2026/digitalfest-projects-expo',
  'IEEE DigitalFest 2026 – Projects Expo',
  'Premier student innovation expo featuring hardware prototypes, AI/ML systems, cybersecurity defenses, IoT devices, and software solutions evaluated by academic and industry judges.',
  E'Cyber Physical Systems, Robotics & Embedded Hardware\nArtificial Intelligence, Machine Learning & Deep Neural Nets\nCyber Security, Ethical Hacking & Defensive Hardening\nInternet of Things (IoT) & Next-Generation Computing\nData Science, Big Data Analytics & Predictive Modeling\nSoftware Development, Cloud & Innovative Mobile Applications\nEmerging Technologies & Scalable System Architectures',
  'Undergraduate Engineering, Computer Science, IT & Software Engineering students with working prototypes',
  '2026-06-03 08:30:00+05',
  '2026-06-03 17:00:00+05',
  'Department of Information & Communication Engineering, The Islamia University of Bahawalpur (IUB)',
  FALSE,
  'COMPLETED',
  120,
  0.00,
  'Certificate of Participation & Project Merit',
  'Successfully set up project booth, demonstrated functional prototype, and presented project to evaluation jury at the Expo',
  'vtools-evt-10492',
  'https://events.vtools.ieee.org/m/10492',
  'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
  '["https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80", "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80", "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1000&q=80", "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80"]'::jsonb,
  'IEEE DigitalFest 2026 – Projects Expo concluded with grand success at the Department of Information & Communication Engineering, IUB. Over 60 student teams demonstrated working hardware & software prototypes across 7 tech domains. Organized in collaboration with IEEE Bahawalpur Subsection, IEEE CS, IEEE SPS, IEEE ComSoc, and Cyber Security Student Club under the leadership of Muhammad Roshan Ashraf. Cash prizes of Rs. 10,000 (1st Position), Rs. 5,000 (2nd Position), and Rs. 3,000 (3rd Position) awarded alongside official IEEE & IUB participation certificates.'
);

