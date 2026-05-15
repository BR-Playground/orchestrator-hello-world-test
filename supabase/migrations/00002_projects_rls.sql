ALTER TABLE projects ENABLE row level security;

CREATE POLICY "Users can view their own projects"
    ON projects FOR select
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
    ON projects FOR insert
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
    ON projects FOR update
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
    ON projects FOR delete
    USING (auth.uid() = user_id);