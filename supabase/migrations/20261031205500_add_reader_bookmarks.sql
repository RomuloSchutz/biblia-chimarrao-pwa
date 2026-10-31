create table public.reader_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  book_key text not null,
  book_title text not null,
  cfi text not null,
  href text,
  updated_at timestamptz not null default now(),
  primary key (user_id, book_key)
);

alter table public.reader_bookmarks enable row level security;

revoke all on table public.reader_bookmarks from anon, authenticated;
grant select, insert, update, delete on table public.reader_bookmarks to authenticated;

create policy "reader_bookmarks_select_own"
on public.reader_bookmarks for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "reader_bookmarks_insert_own"
on public.reader_bookmarks for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "reader_bookmarks_update_own"
on public.reader_bookmarks for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "reader_bookmarks_delete_own"
on public.reader_bookmarks for delete
to authenticated
using ((select auth.uid()) = user_id);

create index reader_bookmarks_user_id_idx on public.reader_bookmarks(user_id);