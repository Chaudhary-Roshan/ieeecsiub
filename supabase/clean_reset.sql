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
TRUNCATE TABLE team_members CASCADE;
TRUNCATE TABLE event_teams CASCADE;

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
  '/ieee-cs-logo.png',
  '[]'::jsonb,
  'IEEE DigitalFest 2026 – Projects Expo concluded with grand success at the Department of Information & Communication Engineering, IUB. Over 60 student teams demonstrated working hardware & software prototypes across 7 tech domains. Organized in collaboration with IEEE Bahawalpur Subsection, IEEE CS, IEEE SPS, IEEE ComSoc, and Cyber Security Student Club under the leadership of Muhammad Roshan Ashraf. Cash prizes of Rs. 10,000 (1st Position), Rs. 5,000 (2nd Position), and Rs. 3,000 (3rd Position) awarded alongside official IEEE & IUB participation certificates.'
);

-- 3. Insert Official Chapter Officers & Faculty Leadership
INSERT INTO team_members (id, name, position, committee_year, photo_url, approved_bio, order_index, is_current)
VALUES
  ('team-1', 'Dr. Asjad Amin', 'Branch Counselor / Senior Advisor', '2026-2027', '', 'Associate Professor and Branch Counselor for IEEE UCET-IUB Student Branch. Guiding chapter excellence and university-wide engineering leadership.', 0, true),
  ('team-2', 'Dr. Aoun Muhammad', 'Faculty Advisor', '2026-2027', '', 'Assistant Professor, Department of Computer Science & Engineering, UCET. Dedicated to computing research, IEEE CS accreditation, and student research mentoring.', 1, true),
  ('team-3', 'Muhammad Roshan Ashraf', 'Chapter Chair', '2026-2027', '', 'Leading chapter strategy, technical programs, and web infrastructure. Passionate about AI systems, software architecture, and developer education.', 2, true),
  ('team-4', 'Fatima Noor', 'Vice Chair & Content Lead', '2026-2027', '', 'Overseeing chapter communications, technical reporting, and workshop moderation.', 3, true),
  ('team-5', 'Hamza Tariq', 'Treasurer', '2026-2027', '', 'Managing transparent financial records, workshop budgeting, and official payment reconciliations.', 4, true),
  ('team-6', 'Ayesha Siddiqa', 'General Secretary', '2026-2027', '', 'Responsible for IEEE vTools reporting, executive documentation, and meeting minutes.', 5, true),
  ('team-arch-1', 'Usman Ghani', 'Former Chapter Chair (2025)', '2025-2026', '', 'Pioneered early chapter initiatives and student branch collaboration in 2025.', 6, false);

