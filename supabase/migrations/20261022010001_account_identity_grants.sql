-- The database's default function privileges also grant anon directly.
revoke all on function public.set_public_identity(text,text) from anon;
