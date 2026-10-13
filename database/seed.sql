-- Haven seed data. No secrets. Idempotent: safe to re-run (ON CONFLICT DO NOTHING).
-- Embeddings are intentionally NULL — generate them via the backend
-- (EMBEDDING_MODEL) before testing match_memories / match_document_chunks.

insert into public.users (id, email, name, avatar_url)
values
  ('11111111-1111-1111-1111-111111111111', 'demo@opencode.local', 'Demo User', null)
on conflict (id) do nothing;

insert into public.conversations (id, user_id, title)
values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'First chat')
on conflict (id) do nothing;

insert into public.messages (id, conversation_id, role, content, model)
values
  ('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222222', 'user', 'hey! how was your day?', null),
  ('33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222222', 'assistant', 'pretty good actually! i finally finished that espresso walk route we talked about. you?', 'demo-seed')
on conflict (id) do nothing;

insert into public.memories (id, user_id, memory, content, importance, metadata)
values
  ('77777777-7777-7777-7777-777777777771', '11111111-1111-1111-1111-111111111111', 'loves morning espresso walks', 'loves morning espresso walks', 0.8, '{"kind": "preference"}'),
  ('77777777-7777-7777-7777-777777777772', '11111111-1111-1111-1111-111111111111', 'listens to indie folk when stressed', 'listens to indie folk when stressed', 0.5, '{"kind": "habit"}')
on conflict (id) do nothing;

insert into public.voices (id, user_id, voice_name, language, provider)
values
  ('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', 'sk-SK-ViktoriaNeural', 'sk-SK', 'edge-tts'),
  ('44444444-4444-4444-4444-444444444442', '11111111-1111-1111-1111-111111111111', 'en-US-AriaNeural', 'en-US', 'edge-tts')
on conflict (id) do nothing;

insert into public.documents (id, user_id, title)
values
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 'Haven onboarding notes')
on conflict (id) do nothing;

insert into public.document_chunks (id, document_id, chunk_index, content)
values
  ('66666666-6666-6666-6666-666666666661', '55555555-5555-5555-5555-555555555555', 0, 'OpenCode runs entirely on a free-tier stack: Vercel, OpenShift Sandbox, Supabase Free.'),
  ('66666666-6666-6666-6666-666666666662', '55555555-5555-5555-5555-555555555555', 1, 'Speech runs in-container: Faster-Whisper base for STT, Edge TTS for synthesis.')
on conflict (id) do nothing;
