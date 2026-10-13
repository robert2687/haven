# Haven marketplace

Shareable packs for Haven agents. Layout:

- `prompts/` — raw system-prompt markdown (mirrors `backend/app/agents/*.py`).
- `assistants/` — JSON assistant cards: which agent + model + tools.
- `workflows/` — JSON multi-step chains over assistants.
- `tools/` — JSON tool cards: backend endpoint + input/output schema.

Assistants run through `POST /api/subagent` with the card's `system`
prompt; workflows are executed by the caller step-by-step (reasoning_details
passed back unmodified between turns).
