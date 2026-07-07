-- wow-seg: tabla única tipo blob para espejar el JSON del Gist.
-- Una sola fila (id = 1) con JSONB de toda la app.

create table if not exists public.wow_data (
  id          integer primary key default 1,
  blob        jsonb   not null default '{}'::jsonb,
  hash        text    not null default '',
  updated_at  timestamptz not null default now(),
  constraint wow_data_single_row check (id = 1)
);

-- Habilitar RLS y exponer la fila única a anon (lectura/escritura).
-- Es un app de un solo usuario (crypto del navegador); no hay multi-tenant.
alter table public.wow_data enable row level security;

drop policy if exists "wow_data anon all" on public.wow_data;
create policy "wow_data anon all"
  on public.wow_data
  for all
  to anon
  using (true)
  with check (true);

-- Sincronizar updated_at automáticamente en cada UPDATE.
create or replace function public.touch_wow_data()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_wow_data on public.wow_data;
create trigger trg_touch_wow_data
  before update on public.wow_data
  for each row execute function public.touch_wow_data();

-- Asegurar que la fila existe.
insert into public.wow_data (id, blob, hash)
values (1, '{}'::jsonb, '')
on conflict (id) do nothing;