-- Avatars Storage bucket + MIME allowlist + 5 MB size cap.
-- Idempotent: safe to re-run against an existing project.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
        'avatars',
        'avatars',
        true,
        5242880,  -- 5 MB
        array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
    )
    ON CONFLICT (id) DO NOTHING;