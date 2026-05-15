-- Status is an enum, similar to kanban with 3 states
create type project_status as enum ('draft', 'active', 'archived');

create table projects (
    id          uuid    primary key default gen_random_uuid(),
    user_id     uuid    not null references auth.users(id) on delete cascade,
    name        text    not null check (length(name) between 1 and 100),
    description text    check (description is null or length(description) <= 1000),
    status      project_status  not null default 'draft',
    created_at  timestamptz     not null default now(),
    updated_at  timestamptz     not null default now()
);

-- index for listing a user's projects, sorted by the newest first
create index projects_user_id_created_at_idx
    on projects (user_id, created_at desc);

grant select, insert, update, delete on projects to authenticated;