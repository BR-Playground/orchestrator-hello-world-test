-- Seed two sample projects on account creation, so the /projects view isn't empty on first login. 
-- Per-user, RLS-isolated automatically by the inserted user_id.
--
-- Note: only fires for NEW signups. Existing users in dev projects don't get sample data retroactively.

CREATE OR REPLACE FUNCTION public.seed_sample_projects()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
AS $$
BEGIN
    INSERT INTO public.projects (user_id, name, description, status)
    VALUES
        (NEW.id,
         'Sample Project — try editing me',
         'This is a sample project so your /projects list isn''t empty on first login. Edit me, archive me, or delete me whenever you''re ready.',
         'active'),
        (NEW.id,
         'Draft idea — replace with your own',
         'A second sample so you can see how the status badge and filter behave.',
         'draft');
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_seed_projects
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.seed_sample_projects();