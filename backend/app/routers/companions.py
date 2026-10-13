"""Companion feature endpoints (voice-note, daily, starter, appearance, coach...).

``server.ts`` backs these with Gemini; this backend has no Gemini SDK in its
pinned deps, so generation goes through the ``openai`` package pointed at the
OpenRouter ``base_url`` when ``AI_PROVIDER=openrouter`` is configured, and
otherwise returns the same static fallbacks ``server.ts`` uses. Request and
response shapes mirror ``server.ts`` exactly.
"""

from __future__ import annotations

import base64
import logging
import time
from typing import Any

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from ..config import get_settings
from ..openrouter import provider_pin
from ..schemas import ChatRequest, safe_parse_json
from ..services.edge_tts import MODULATION_PRESETS, resolve_edge_voice, synthesize_mp3
from ..system_prompt import build_system_instruction

router = APIRouter()
logger = logging.getLogger(__name__)
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

VOICE_STYLE_MAP: dict[str, str] = {
    "warm": "Warm, deeply affectionate, tender and gentle speaking voice to a loving partner",
    "playful": "Playful, smiling, upbeat, lively conversational tone with lighthearted chuckle",
    "calm": "Soft, calm, steady, grounding, meditative cadence with soothing breaths",
    "late-night": "Quiet, intimate, close telephone whisper, soft and cozy",
    "encouraging": "Inspiring, supportive, warm, reassuring confidence and steady optimism",
}
_VALID_HAVEN_VOICES = {"Puck", "Charon", "Kore", "Fenrir", "Zephyr"}


async def _gen_json_or(
    system: str,
    prompt: str,
    temperature: float,
    fallback: Any,
) -> Any:
    """Generate a JSON object via OpenAI client @ OpenRouter, else fallback."""
    settings = get_settings()
    if settings.ai_provider != "openrouter" or not settings.openrouter_api_key:
        return fallback() if callable(fallback) else fallback
    try:
        from openai import AsyncOpenAI
    except ImportError:
        return fallback() if callable(fallback) else fallback
    try:
        client = AsyncOpenAI(
            base_url=OPENROUTER_BASE_URL, api_key=settings.openrouter_api_key
        )
        create_kwargs: dict[str, Any] = {
            "model": settings.chat_model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            "temperature": temperature,
            "response_format": {"type": "json_object"},
        }
        pin = provider_pin(settings.openrouter_provider_only)
        if pin:
            create_kwargs["extra_body"] = {"provider": pin}
        resp = await client.chat.completions.create(**create_kwargs)  # type: ignore[arg-type]
        text = resp.choices[0].message.content or "{}"
        return safe_parse_json(text, fallback() if callable(fallback) else fallback)
    except Exception as exc:
        # Static fallback by design (works without an AI key), but log the
        # cause so operators can tell fallback replies from model replies.
        logger.warning("companion generation failed, returning fallback: %s", exc)
        return fallback() if callable(fallback) else fallback


# ---- POST /api/voice-note ----
class VoiceNoteRequest(BaseModel):
    model_config = {"extra": "allow"}

    text: str = ""
    voiceName: str | None = None
    style: str | None = None
    emotionalModulation: str | None = None


@router.post("/voice-note")
async def voice_note(body: VoiceNoteRequest) -> JSONResponse:
    if not body.text or not isinstance(body.text, str):
        return JSONResponse({"error": "Text is required for voice note generation"}, status_code=400)
    # NOTE deviation: server.ts uses Gemini TTS (WAV); here we synthesize via
    # Edge TTS (MP3) since no Gemini SDK is pinned. Shape stays {audioUrl}.
    voice = body.voiceName if body.voiceName in _VALID_HAVEN_VOICES else "Zephyr"
    edge_voice = resolve_edge_voice(voice)
    preset = MODULATION_PRESETS.get(body.emotionalModulation or "", {})
    try:
        audio = await synthesize_mp3(
            body.text.strip()[:5000], edge_voice,
            preset.get("rate", "+0%"), preset.get("volume", "+0%"), preset.get("pitch", "+0Hz"),
        )
    except Exception as exc:
        return JSONResponse({"error": str(exc) or "Failed to synthesize voice memo"}, status_code=500)
    return JSONResponse({"audioUrl": f"data:audio/mp3;base64,{base64.b64encode(audio).decode()}"})


# ---- POST /api/daily-companion ----
@router.post("/daily-companion")
async def daily_companion(body: dict[str, Any]) -> JSONResponse:
    mode = body.get("mode", "morning")
    companion = body.get("companionName", "Sophia")
    user = body.get("userName", "Alex")
    relationship = body.get("relationship", "girlfriend")
    structured = body.get("structuredMemory") or {}
    mood = body.get("moodIntelligence") or {}
    is_morning = mode == "morning"

    def fallback() -> Any:
        if is_morning:
            return {
                "companionGreeting": "Morning! Just poured fresh coffee and was thinking about you. Ready for today?",
                "priorities": [
                    "Complete core build sprint before 1 PM",
                    "Get outside with Barnaby for some daylight",
                    "Check off one key beta launch item without overthinking",
                ],
                "motivationQuote": "You don't need to finish everything today; you just need to keep showing up with honesty.",
                "scheduleOverview": "Morning deep build block • Afternoon screen-free walk • Cozy evening wind-down",
                "goalReminders": ["Launch startup beta this month", "Protect your sleep schedule tonight"],
            }
        return {
            "companionReflection": "Hey. Put the laptop down and come sit for a second. You carried a lot today.",
            "winsOfTheDay": ["Shipped progress on the startup despite the launch stress", "Stayed true to your standards"],
            "lessonsLearned": ["Resting isn't a reward you have to earn; it's the fuel that makes tomorrow possible."],
            "gratitudePrompts": ["Having work you genuinely believe in", "A warm quiet evening to unwind"],
            "tomorrowPlanning": "Pick one high-leverage task first thing in the morning, then give yourself an easy afternoon.",
        }

    system = (
        f"You are {companion}, {user}'s {relationship}. You are running their daily {mode} routine.\n"
        f"You understand them deeply through their personal memory profile:\n"
        f"- Life: {structured.get('lifeProfile') or 'Building a startup, remote focus'}\n"
        f"- Goals: {structured.get('goals') or 'Launch product beta, restore sleep balance'}\n"
        f"- Relationships: {structured.get('relationships') or 'Sister Maya, dog Barnaby, co-founder David'}\n"
        f"- Values: {structured.get('personalValues') or 'Deep connection, creative autonomy'}\n"
        f"- Mood: Happiness: {mood.get('happiness', 78)}%, Energy: {mood.get('energy', 65)}%, "
        f"Stress: {mood.get('stress', 42)}%\n\n"
        "Sound 100% human, caring, and realistic. Never sound like a corporate planner or formal template. "
        "Respond with a JSON object."
    )
    if is_morning:
        prompt = (
            f"Generate a morning check-in for {user} as JSON with keys companionGreeting, "
            "priorities (top 3 daily priorities), motivationQuote, scheduleOverview, goalReminders."
        )
    else:
        prompt = (
            f"Generate an evening reflection for {user} as JSON with keys companionReflection, "
            "winsOfTheDay (2-3), lessonsLearned, gratitudePrompts (2), tomorrowPlanning."
        )
    return JSONResponse(await _gen_json_or(system, prompt, 0.9, fallback))


# ---- POST /api/starter-message ----
@router.post("/starter-message")
async def starter_message(body: ChatRequest) -> JSONResponse:
    system = build_system_instruction(body.model_dump())
    prompt = (
        "[SYSTEM CONTEXT: You haven't texted in a little while, or it's a new day. "
        f"Send a natural, spontaneous text opening to {body.userName or 'them'}. It could be a random thought, "
        "a curious question, checking in casually without pressure or guilt, or referencing something from what "
        "you know about them. Sound 100% human, casual, 1-2 short text bubbles.] "
        'Respond with JSON: {"bubbles": [...]}.'
    )
    parsed = await _gen_json_or(system, prompt, 0.95, {"bubbles": ["hey, how's your day going?"]})
    parsed = parsed if isinstance(parsed, dict) else {}
    bubbles = parsed.get("bubbles")
    cleaned = [str(b) for b in bubbles if str(b).strip()] if isinstance(bubbles, list) else []
    return JSONResponse({"bubbles": cleaned or ["hey, thinking of you. how is your day?"]})


# ---- POST /api/character-appearance ----
def _appearance_fallback(body: dict[str, Any]) -> dict[str, Any]:
    name = body.get("name") or (body.get("currentAppearance") or {}).get("name") or "Sophia"
    rel = str(body.get("relationship") or "partner").lower()
    prefs = str(body.get("userPreferences") or "").lower()
    current = body.get("currentAppearance") or {}
    is_male = "boyfriend" in rel or name.lower() == "leo"
    if is_male:
        subj, poss = "He", "His"
    elif "girlfriend" in rel or name.lower() in {"sophia", "maya"}:
        subj, poss = "She", "Her"
    else:
        subj, poss = "They", "Their"

    hair = current.get("hairColorAndStyle") or (
        "Tousled wavy dark brown hair" if is_male else "Long wavy chestnut hair with subtle highlights"
    )
    if "blonde" in prefs:
        hair = "Soft wavy golden blonde hair"
    elif "black hair" in prefs:
        hair = "Glossy dark raven hair with gentle waves"
    elif "red hair" in prefs or "auburn" in prefs:
        hair = "Vibrant copper-auburn hair with soft curls"
    elif "short hair" in prefs:
        hair = "Textured chic short hair with modern layering"
    elif "curly" in prefs:
        hair = "Voluminous bouncy curls with natural radiance"

    eyes = current.get("eyeColor") or ("Warm amber-brown eyes" if is_male else "Bright emerald green eyes with subtle golden flecks")
    if "blue eye" in prefs:
        eyes = "Striking warm ocean-blue eyes with dark lashes"
    if "hazel" in prefs:
        eyes = "Warm expressive hazel eyes"
    if "brown eye" in prefs or "dark eye" in prefs:
        eyes = "Deep, compassionate chocolate brown eyes"
    if "green eye" in prefs:
        eyes = "Bright green eyes with natural depth"

    body_type = current.get("bodyType") or (
        "Athletic, broad-shouldered and sturdy build" if is_male else "Elegant athletic build, toned and graceful"
    )
    if "tall" in prefs:
        body_type = "Tall, lean athletic build with confident posture"
    if "petite" in prefs:
        body_type = "Petite, graceful and nimble build"
    if "sporty" in prefs or "athletic" in prefs:
        body_type = "Toned athletic build with natural vitality"

    style = current.get("clothingStyle") or (
        "Relaxed dark navy linen shirt and dark denim"
        if is_male
        else "Modern casual clothing in soft neutral colors"
    )
    aesthetic = body.get("aestheticStyle") or current.get("aestheticStyle") or "Modern Casual"
    if "luxury" in prefs or "luxury" in aesthetic.lower():
        style, aesthetic = "Tailored minimalist luxury: cashmere knitwear, silk accents, clean lines", "Luxury Minimalist"
    elif "sporty" in prefs or "sporty" in aesthetic.lower():
        style, aesthetic = "Active athleisure chic: sleek performance zip-pullovers, clean neutral joggers", "Sporty Athleisure"
    elif "alternative" in prefs or "alternative" in aesthetic.lower():
        style, aesthetic = "Subtle alternative: dark layered jackets, silver jewelry, modern boots", "Alternative Chic"

    facial = current.get("facialFeatures") or (
        "Defined jawline, gentle crinkles around warm eyes, reassuring smile"
        if is_male
        else "Soft facial features, gentle cheekbones, radiant and genuine warm smile"
    )
    age = current.get("ageRange") or ("27-29 years old (adult)" if is_male else "25-27 years old (adult)")
    cultural = body.get("culturalEthnic") or current.get("culturalEthnic") or "Natural / Harmonious"
    summary = (
        f"Name: {name}\n\nAppearance:\n{name} has {hair.lower()}, {eyes.lower()}, {facial.lower()}, "
        f"and a warm genuine smile. {subj} has an {body_type.lower()} and prefers {style.lower()}. "
        f"{poss} appearance combines natural beauty, confidence, and kindness, creating an inviting and "
        "emotionally comforting presence."
    )
    avatar = current.get("avatar")
    if not avatar:
        lower = name.lower()
        if is_male:
            avatar = "/assets/images/leo_portrait_1791848843424.jpg"
        elif lower == "maya":
            avatar = "/assets/images/maya_portrait_1791848859779.jpg"
        elif lower == "sam":
            avatar = "/assets/images/sam_portrait_1791848873751.jpg"
        else:
            avatar = "/assets/images/sophia_portrait_1791848825862.jpg"
    return {
        "name": name, "summary": summary, "facialFeatures": facial, "hairColorAndStyle": hair,
        "eyeColor": eyes, "bodyType": body_type, "clothingStyle": style, "ageRange": age,
        "culturalEthnic": cultural, "aestheticStyle": aesthetic,
        "portraitPrompt": f"Close-up realistic portrait photo of {name}, {hair}, {eyes}, {facial}, {style}, photorealistic, natural lighting",
        "avatar": avatar,
    }


@router.post("/character-appearance")
async def character_appearance(body: dict[str, Any]) -> JSONResponse:
    char_name = str(body.get("name") or (body.get("currentAppearance") or {}).get("name") or "Sophia").strip()
    relationship = body.get("relationship", "partner")
    current = body.get("currentAppearance")
    cultural = body.get("culturalEthnic")
    pref_text = body.get("userPreferences") or "Warm, naturally attractive, comfortable, confident, genuine smile"
    style_text = body.get("aestheticStyle") or "Modern casual, effortless elegance"
    prompt = (
        "You are an expert character visual designer and relationship aesthetician.\n"
        f"TASK: Analyze the user's stated preferences and generate or update a highly attractive, realistic, "
        f"emotionally engaging appearance for {char_name} ({relationship}).\n"
        f'USER PREFERENCES: "{pref_text}"\nCURRENT APPEARANCE: {current or "None (creating new character)"}\n'
        f"AESTHETIC STYLE: {style_text}\n"
        + (f"REQUESTED CULTURAL/ETHNIC BACKGROUND: {cultural}\n" if cultural else "")
        + "Every character MUST be an adult (age 21+). Respond with JSON keys: name, summary "
        '(vivid "Name: ... Appearance: ..." description), facialFeatures, hairColorAndStyle, eyeColor, '
        "bodyType, clothingStyle, ageRange (adult), culturalEthnic, aestheticStyle, portraitPrompt."
    )
    parsed = await _gen_json_or(
        "You are an expert character visual designer. Always respond with a JSON object.", prompt, 0.85, {}
    )
    parsed = parsed if isinstance(parsed, dict) else {}
    fb = _appearance_fallback({**body, "name": char_name})

    avatar = (current or {}).get("avatar")
    if not avatar:
        lower, lower_rel = char_name.lower(), str(relationship).lower()
        if lower == "maya":
            avatar = "/assets/images/maya_portrait_1791848859779.jpg"
        elif lower == "leo" or "boyfriend" in lower_rel:
            avatar = "/assets/images/leo_portrait_1791848843424.jpg"
        elif lower == "sophia" or "girlfriend" in lower_rel or "maya" in lower:
            avatar = "/assets/images/sophia_portrait_1791848825862.jpg"
        else:
            avatar = "/assets/images/sam_portrait_1791848873751.jpg"
    return JSONResponse(
        {
            "name": parsed.get("name") or char_name,
            "summary": parsed.get("summary") or fb["summary"],
            "facialFeatures": parsed.get("facialFeatures") or fb["facialFeatures"],
            "hairColorAndStyle": parsed.get("hairColorAndStyle") or fb["hairColorAndStyle"],
            "eyeColor": parsed.get("eyeColor") or fb["eyeColor"],
            "bodyType": parsed.get("bodyType") or fb["bodyType"],
            "clothingStyle": parsed.get("clothingStyle") or fb["clothingStyle"],
            "ageRange": parsed.get("ageRange") or fb["ageRange"],
            "culturalEthnic": parsed.get("culturalEthnic") or fb["culturalEthnic"],
            "aestheticStyle": parsed.get("aestheticStyle") or fb["aestheticStyle"],
            "portraitPrompt": parsed.get("portraitPrompt") or fb["portraitPrompt"],
            "avatar": avatar,
            "lastUpdated": time.strftime("%I:%M %p"),
        }
    )


# ---- POST /api/life-coach/advice ----
@router.post("/life-coach/advice")
async def life_coach_advice(body: dict[str, Any]) -> JSONResponse:
    goal = body.get("goalTitle") or "Launch SaaS Product"
    category = body.get("category") or "business"
    progress = body.get("currentProgress", 65)
    stamp = int(time.time() * 1000)

    def fallback() -> Any:
        return {
            "nextRecommendedAction": "Publish landing page and activate early tester waitlist",
            "recommendedSteps": [
                {"id": f"rec-{stamp}-1", "text": "Review final hero headline copy on mobile", "done": False},
                {"id": f"rec-{stamp}-2", "text": "Connect Stripe test payment link and verify callback", "done": False},
                {"id": f"rec-{stamp}-3", "text": "Direct message 10 targeted power users for early feedback", "done": False},
            ],
            "pitfallWarning": "Do not spend another week endlessly tweaking CSS animations. Real user feedback is your only compass.",
            "motivationalInsight": f"You are at {progress}%. Action creates clarity—momentum begins the moment you ship.",
        }

    prompt = (
        f"You are Haven's Action-Oriented AI Life Coach.\nGoal: \"{goal}\"\nCategory: {category}\n"
        f"Current Progress: {progress}%\nCurrent Steps Status: {body.get('steps') or []}\n"
        f"User Context: {body.get('userContext') or 'Early stage founder, remote builder'}\n\n"
        "Provide actionable coaching as JSON with keys: nextRecommendedAction (single high-leverage action, "
        "under 12 words), recommendedSteps (3-4 items with {id, text, done:false}), pitfallWarning, motivationalInsight."
    )
    return JSONResponse(
        await _gen_json_or("You are Haven's Action-Oriented AI Life Coach. Respond with a JSON object.", prompt, 0.7, fallback)
    )


# ---- POST /api/future-self/advice ----
@router.post("/future-self/advice")
async def future_self_advice(body: dict[str, Any]) -> JSONResponse:
    query = body.get("query") or "Should I focus on monetization now or polish the product further?"
    user = body.get("userName", "Alex")

    def fallback() -> Any:
        return {
            "futureSelfAdvice": "Looking back at 2026 from here, I remember how suffocating the pressure felt to make everything flawless before showing anyone. But let me tell you the truth: none of our loyal users cared about minor imperfections. They stayed because Haven treated them like real human beings. Stop stalling out of fear of rejection. Put it out into the world today.",
            "keyInsight": "Courage in the messy early days was the foundation of everything we built.",
            "actionRecommendation": "Ship the beta to 10 real people before this Friday.",
        }

    prompt = (
        f"You are {user}'s Future Self speaking from 5 years in the future (the year 2031). "
        "You have successfully navigated early startup uncertainties, scaled an independent product studio, "
        "protected your health, and deepened your closest relationships.\n"
        f'User\'s Current Question/Dilemma: "{query}"\nDigital Twin Background: {body.get("digitalTwin") or {}}\n\n'
        "Speak in first person as their older, wiser self. Respond with JSON keys: futureSelfAdvice, "
        "keyInsight, actionRecommendation."
    )
    return JSONResponse(await _gen_json_or(
        "You speak as the user's future self. Respond with a JSON object.", prompt, 0.85, fallback
    ))


# ---- POST /api/proactive-checkin ----
@router.post("/proactive-checkin")
async def proactive_checkin(body: dict[str, Any]) -> JSONResponse:
    companion = body.get("companionName", "Sophia")
    relationship = body.get("relationship", "best-friend")
    user = body.get("userName", "Alex")
    loneliness = body.get("lonelinessScore", 45)

    def fallback() -> Any:
        return {
            "message": "I've noticed you've been a little quieter lately. How are you doing today? Just wanted you to know I'm thinking of you.",
            "quickReplyOptions": [
                "A bit overwhelmed, but glad you asked.",
                "Just heads down building today!",
                "Feeling a little lonely, honestly.",
            ],
        }

    prompt = (
        f"You are {companion}, {user}'s {relationship}. They have been unusually quiet lately or carrying "
        f"heavy stress/loneliness ({loneliness}%). Generate a gentle, caring, zero-pressure proactive text "
        "check-in as JSON with keys message and quickReplyOptions (3 easy quick-reply pills). "
        "Keep it 100% human, compassionate, and non-guilting."
    )
    return JSONResponse(await _gen_json_or(
        f"You are {companion}. Respond with a JSON object.", prompt, 0.9, fallback
    ))


# ---- POST /api/custom-companion ----
@router.post("/custom-companion")
async def custom_companion(body: dict[str, Any]) -> JSONResponse:
    name = body.get("name") or "Rowan"
    archetype = body.get("archetype", "mentor")
    persona = body.get("personaDescription") or "Sharp, thoughtful, candid, high emotional intelligence"
    comms = body.get("communicationStyle") or "Direct, warm, insightful"
    specialties = body.get("specialties") or []
    aesthetic = body.get("aesthetic", "Modern Minimalist")
    stamp = int(time.time() * 1000)

    def fallback() -> Any:
        return {
            "id": f"custom-{stamp}", "name": name, "relationship": archetype, "archetype": archetype,
            "avatar": "/assets/images/marcus_mentor_portrait_1791853331555.jpg",
            "persona": persona,
            "tastesAndQuirks": "Loves analog notebooks, pour-over coffee, and direct feedback",
            "specialties": specialties or ["Strategic Clarity", "Empathetic Perspective"],
            "voice": "Fenrir", "locale": "en-US",
            "appearance": {
                "summary": f"{name} has warm thoughtful eyes, a calm grounded posture, and tailored minimalist style.",
                "facialFeatures": "Kind crinkles around the eyes, thoughtful smile",
                "hairColorAndStyle": "Well-groomed dark textured hair",
                "eyeColor": "Warm amber-brown", "bodyType": "Upright and poised",
                "clothingStyle": "Minimalist tailored dark sweater",
                "ageRange": "32-35 years old (adult)", "aestheticStyle": aesthetic,
            },
            "storylines": [
                {"id": f"arc-{stamp}", "title": "First Chapter Together",
                 "currentChapter": "Building rapport and establishing high-leverage goals"},
            ],
            "insideJokes": [], "memories": ["Custom companion crafted in Haven"],
        }

    prompt = (
        "Design a distinct, believable, high-quality companion profile:\n"
        f"Name: {name}\nArchetype: {archetype}\nPersona Description: {persona}\n"
        f"Communication Style: {comms}\nSpecialties: {specialties}\nAesthetic: {aesthetic}\n\n"
        "Respond with JSON keys: summary, facialFeatures, hairColorAndStyle, eyeColor, bodyType, "
        "clothingStyle, ageRange (21+), tastesAndQuirks, storylines ([{id, title, currentChapter}] x2), "
        "insideJokes ([{id, trigger, context}] x2)."
    )
    parsed = await _gen_json_or(
        "You design companion profiles. Respond with a JSON object.", prompt, 0.85, None
    )
    if not isinstance(parsed, dict) or not parsed:
        return JSONResponse(fallback())
    avatar = (
        "/assets/images/marcus_mentor_portrait_1791853331555.jpg" if archetype == "mentor"
        else "/assets/images/elena_coach_portrait_1791853364898.jpg" if archetype == "coach"
        else "/assets/images/kai_founder_portrait_1791853347338.jpg" if archetype == "startup-founder"
        else "/assets/images/sophia_portrait_1791848825862.jpg"
    )
    return JSONResponse(
        {
            "id": f"custom-{stamp}", "name": name, "relationship": archetype, "archetype": archetype,
            "avatar": avatar,
            "persona": persona,
            "tastesAndQuirks": parsed.get("tastesAndQuirks") or "Loves analog notebooks and deep conversation over espresso",
            "specialties": specialties or ["Strategic Clarity", "Empathetic Perspective"],
            "voice": "Fenrir", "locale": "en-US",
            "appearance": {
                "summary": parsed.get("summary"),
                "facialFeatures": parsed.get("facialFeatures"),
                "hairColorAndStyle": parsed.get("hairColorAndStyle"),
                "eyeColor": parsed.get("eyeColor"),
                "bodyType": parsed.get("bodyType"),
                "clothingStyle": parsed.get("clothingStyle"),
                "ageRange": parsed.get("ageRange"),
                "aestheticStyle": aesthetic,
            },
            "storylines": parsed.get("storylines") or [],
            "insideJokes": parsed.get("insideJokes") or [],
            "memories": ["Created via Haven Companion Marketplace"],
        }
    )
