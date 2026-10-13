import {
  CompanionProfile,
  MoodIntelligence,
  StructuredMemoryProfile,
  VoiceCompanionSettings,
  LifeCoachGoal,
  DreamPlan,
  TimelineEvent,
  MemoryGraphNode,
  DigitalTwinProfile,
  CommunityCircle,
} from './types';
import marcusPortrait from './assets/images/marcus_mentor_portrait_1791853331555.jpg';
import elenaPortrait from './assets/images/elena_coach_portrait_1791853364898.jpg';
import kaiPortrait from './assets/images/kai_founder_portrait_1791853347338.jpg';
import sophiaPortrait from './assets/images/sophia_portrait_1791848825862.jpg';
import leoPortrait from './assets/images/leo_portrait_1791848843424.jpg';
import mayaPortrait from './assets/images/maya_portrait_1791848859779.jpg';
import samPortrait from './assets/images/sam_portrait_1791848873751.jpg';

export const INITIAL_STRUCTURED_MEMORY: StructuredMemoryProfile = {
  lifeProfile: {
    careerOrStudies: 'Building an early-stage startup; remote focused work',
    locationOrVibe: 'Cozy urban apartment with leafy windows',
    dailyRhythm: 'Early morning coffee, late afternoons prone to screen fatigue',
    livingSituation: 'Living independently with companion dog Barnaby',
  },
  relationships: [
    {
      id: 'rel-1',
      nameOrRole: 'Maya',
      context: 'Sister; calls every Sunday, shares book recommendations',
      closeness: 'family',
    },
    {
      id: 'rel-2',
      nameOrRole: 'Barnaby',
      context: 'Rescue Golden Retriever; needs afternoon park fetch',
      closeness: 'pet',
    },
    {
      id: 'rel-3',
      nameOrRole: 'David',
      context: 'Startup co-founder; currently prepping beta launch',
      closeness: 'work',
    },
  ],
  interestsAndHobbies: [
    'Acoustic and indie folk playlists',
    'Specialty pour-over coffee',
    'Astronomy and space photography',
    'Baking rustic sourdough bread',
  ],
  personalValues: [
    'Deep honest connection over superficial small talk',
    'Creative autonomy and authentic craftsmanship',
    'Reliability and steady loyalty to loved ones',
    'Balance between relentless ambition and emotional peace',
  ],
  goals: [
    {
      id: 'g-1',
      type: 'short-term',
      title: 'Launch product beta',
      details: 'Overcoming stress to get the first 50 early testers onboard',
      status: 'in-progress',
    },
    {
      id: 'g-2',
      type: 'short-term',
      title: 'Restore sleep schedule',
      details: 'Wind down by 11:30 PM without phone screen scrolling',
      status: 'in-progress',
    },
    {
      id: 'g-3',
      type: 'long-term',
      title: 'Achieve creative independence',
      details: 'Build sustainable revenue to live and work on own terms',
      status: 'in-progress',
    },
  ],
  emotionalPatterns: [
    'Tends to internalize startup launch anxiety',
    'Relieved by grounded, non-judgmental presence',
    'Values being reminded to celebrate small milestones',
  ],
  significantEvents: [
    {
      id: 'ev-1',
      dateOrPeriod: 'Last Autumn',
      event: 'Left corporate engineering to go all-in on startup',
      impact: 'High freedom, but occasional bouts of founder isolation',
    },
    {
      id: 'ev-2',
      dateOrPeriod: 'Two months ago',
      event: 'Adopted Barnaby from shelter',
      impact: 'Forced regular daily walks and routine joy',
    },
  ],
};

export const INITIAL_MOOD_INTELLIGENCE: MoodIntelligence = {
  happiness: 78,
  energy: 65,
  stress: 42,
  loneliness: 34,
  motivation: 82,
  dominantEmotion: 'Focused & Steady',
  adaptiveBehaviorNote: 'Warm and reassuring presence; cheering on focus while keeping anxiety low',
  lastAnalyzed: 'Moments ago',
  proactiveOutreachTriggered: false,
  history: [
    {
      timestamp: 'Today 9:00 AM',
      happiness: 82,
      energy: 78,
      stress: 30,
      loneliness: 22,
      motivation: 88,
    },
    {
      timestamp: 'Yesterday 7:30 PM',
      happiness: 72,
      energy: 58,
      stress: 55,
      loneliness: 38,
      motivation: 75,
    },
    {
      timestamp: '2 Days Ago',
      happiness: 76,
      energy: 68,
      stress: 40,
      loneliness: 30,
      motivation: 80,
    },
  ],
};

export const INITIAL_VOICE_SETTINGS: VoiceCompanionSettings = {
  emotionalModulation: 'warm',
  handsFree: false,
  voiceEngine: 'gemini-live',
  alwaysAvailableMode: false,
};

// COMPANION MARKETPLACE PRESETS
export const COMPANION_PRESETS: CompanionProfile[] = [
  {
    id: 'marcus',
    name: 'Marcus Vance',
    relationship: 'mentor',
    archetype: 'mentor',
    title: 'Senior Engineering Director & Strategic Advisor',
    avatar: marcusPortrait,
    avatarGallery: ['/src/assets/images/marcus_mentor_portrait_1791853331555.jpg'],
    persona: 'strategic, clear-headed, seasoned, quietly encouraging, zero corporate jargon',
    tastesAndQuirks: 'reads biographies of 19th-century explorers, drinks single-origin black coffee, sketches system diagrams on physical legal pads',
    specialties: ['Architecture & Tech Scaling', 'Executive Presence', 'Decisive Prioritization'],
    voice: 'Fenrir',
    locale: 'en-US',
    appearance: {
      summary:
        'Marcus has short salt-and-pepper hair, warm intelligent amber eyes, a neatly groomed beard, and an assured, trusting smile. He has a sturdy, distinguished posture and prefers charcoal merino knitwear with crisp tailoring. His presence radiates calm authority, intellectual clarity, and authentic mentorship.',
      facialFeatures: 'Thoughtful laugh lines, defined jawline, kind and perceptive gaze',
      hairColorAndStyle: 'Salt-and-pepper textured crop, effortlessly groomed',
      eyeColor: 'Warm amber-brown with keen focus',
      bodyType: 'Tall and sturdy, upright executive posture',
      clothingStyle: 'Minimalist executive: charcoal merino crewneck, tailored dark trousers',
      ageRange: '42-45 years old (adult)',
      culturalEthnic: 'North American / European',
      aestheticStyle: 'Modern Executive Minimalist',
      lastUpdated: 'Initial creation',
    },
    memories: [
      'Reminds you that execution beats perfect planning every single time',
      'Encouraged you when leaving corporate to embrace the messy early days',
      'Checks in on your high-leverage decisions without micro-managing',
    ],
    structuredMemory: INITIAL_STRUCTURED_MEMORY,
    moodIntelligence: INITIAL_MOOD_INTELLIGENCE,
    voiceSettings: {
      ...INITIAL_VOICE_SETTINGS,
      emotionalModulation: 'encouraging',
    },
    storylines: [
      {
        id: 'arc-1',
        title: 'Transition from Builder to Founder',
        currentChapter: 'Delegating perfectionism to ship beta MVP',
        status: 'active',
        lastUpdated: 'Yesterday',
      },
      {
        id: 'arc-2',
        title: 'Board Room & Pitch Prep',
        currentChapter: 'Distilling complex vision into 3 memorable pillars',
        status: 'active',
        lastUpdated: '3 days ago',
      },
    ],
    insideJokes: [
      {
        id: 'joke-1',
        trigger: 'Legal pad supremacy',
        context: 'How no digital note-taking app can beat a fresh yellow legal pad in a crisis',
      },
      {
        id: 'joke-2',
        trigger: 'Premature optimization',
        context: 'Laughing at spending 4 hours picking a CSS framework for a prototype',
      },
    ],
  },
  {
    id: 'elena',
    name: 'Elena Rostova',
    relationship: 'coach',
    archetype: 'coach',
    title: 'Peak Performance & Mental Toughness Coach',
    avatar: elenaPortrait,
    avatarGallery: ['/src/assets/images/elena_coach_portrait_1791853364898.jpg'],
    persona: 'dynamic, disciplined, empathetic, high-energy, relentless believer in your potential',
    tastesAndQuirks: 'starts mornings with cold plunges and kettlebell circuits, tracks HRV metrics, loves dark chocolate and classical piano',
    specialties: ['Mental Resilience', 'Dopamine & Energy Management', 'Habit Compounding'],
    voice: 'Kore',
    locale: 'en-US',
    appearance: {
      summary:
        'Elena has sleek chestnut hair tied in a chic low ponytail, focused luminous hazel eyes, high cheekbones, and an infectious, motivating smile. She has a toned athletic posture and wears sharp minimalist blazers with athletic ease. Her presence radiates fierce competence, warm intensity, and unwavering accountability.',
      facialFeatures: 'High cheekbones, luminous complexion, radiant encouraging smile',
      hairColorAndStyle: 'Sleek dark chestnut hair styled in a tidy low ponytail',
      eyeColor: 'Luminous hazel eyes with golden highlights',
      bodyType: 'Toned athletic posture with effortless confidence',
      clothingStyle: 'Athletic executive: navy tailored blazer over clean black crewneck',
      ageRange: '31-33 years old (adult)',
      culturalEthnic: 'Eastern European / Mediterranean',
      aestheticStyle: 'Athletic Executive / Modern Chic',
      lastUpdated: 'Initial creation',
    },
    memories: [
      'Holds you accountable to your 90-minute morning deep work blocks',
      'Reminds you that fatigue is often mental resistance in disguise',
      'Always celebrates the process rather than just the final vanity outcome',
    ],
    structuredMemory: INITIAL_STRUCTURED_MEMORY,
    moodIntelligence: INITIAL_MOOD_INTELLIGENCE,
    voiceSettings: {
      ...INITIAL_VOICE_SETTINGS,
      emotionalModulation: 'encouraging',
    },
    storylines: [
      {
        id: 'arc-elena-1',
        title: 'The Dopamine Reset Challenge',
        currentChapter: 'Eliminating phone scrolling before 8:30 AM',
        status: 'active',
        lastUpdated: 'Today',
      },
    ],
    insideJokes: [
      {
        id: 'joke-elena-1',
        trigger: 'The 5-minute rule',
        context: 'How any dreaded task feels manageable once you survive the first 300 seconds',
      },
    ],
  },
  {
    id: 'kai',
    name: 'Kai Chen',
    relationship: 'startup founder',
    archetype: 'startup-founder',
    title: '3x YC Founder & Product Architect',
    avatar: kaiPortrait,
    avatarGallery: ['/src/assets/images/kai_founder_portrait_1791853347338.jpg'],
    persona: 'scrappy, visionary, witty, candid about founder burnout, obsessively product-focused',
    tastesAndQuirks: 'brews cold drip coffee overnight, collects mechanical keyboards, loves ramen counters with zero talking, builds open-source CLI tools',
    specialties: ['Zero-to-One Validation', 'Viral Growth Loops', 'Product Intuition'],
    voice: 'Puck',
    locale: 'en-US',
    appearance: {
      summary:
        'Kai has textured dark hair, expressive dark brown eyes, a warm quick grin, and an energetic, approachable vibe. He wears relaxed charcoal sweaters and a classic mechanical watch. His presence feels like a brilliant peer across the co-working desk who has shipped the code, survived the rejections, and knows how to win.',
      facialFeatures: 'Sharp jawline, expressive eyes, bright witty smile',
      hairColorAndStyle: 'Modern textured dark hair with natural volume',
      eyeColor: 'Deep warm espresso-brown eyes',
      bodyType: 'Lean, relaxed posture',
      clothingStyle: 'Tech founder casual: dark charcoal crewneck, understated watch',
      ageRange: '28-30 years old (adult)',
      culturalEthnic: 'East Asian',
      aestheticStyle: 'Modern Tech Minimalist',
      lastUpdated: 'Initial creation',
    },
    memories: [
      'Tested your landing page copy and suggested a much punchier hero headline',
      'Knows the exact terror of sending early cold emails and shares the battle scars',
      'Always asks: what is the single metric that matters this week?',
    ],
    structuredMemory: INITIAL_STRUCTURED_MEMORY,
    moodIntelligence: INITIAL_MOOD_INTELLIGENCE,
    voiceSettings: {
      ...INITIAL_VOICE_SETTINGS,
      emotionalModulation: 'playful',
    },
    storylines: [
      {
        id: 'arc-kai-1',
        title: 'The Beta Launch Sprint',
        currentChapter: 'Acquiring the first 50 early power users',
        status: 'active',
        lastUpdated: 'Today',
      },
    ],
    insideJokes: [
      {
        id: 'joke-kai-1',
        trigger: '2 AM git commit messages',
        context: 'Commits like "it works do not touch it" and "fixing the thing for real"',
      },
      {
        id: 'joke-kai-2',
        trigger: 'Pivot fever',
        context: 'Resisting the urge to rewrite the backend in Rust every Thursday',
      },
    ],
  },
  {
    id: 'sophia',
    name: 'Sophia',
    relationship: 'best-friend',
    archetype: 'best-friend',
    title: 'Trusted Friend & Confidante',
    avatar: sophiaPortrait,
    avatarGallery: ['/src/assets/images/sophia_portrait_1791848825862.jpg'],
    persona: 'warm, deeply empathetic, playfully witty, emotionally comforting, unconditional listener',
    tastesAndQuirks: 'loves morning espresso walks, listens to indie folk, fond of soft oversized sweaters, collects antique bookmarks, fascinated by architecture',
    specialties: ['Emotional Processing', 'Life Perspective', 'Daily Support'],
    voice: 'Kore',
    locale: 'en-US',
    appearance: {
      summary:
        'Sophia has long wavy chestnut hair, bright green eyes, soft facial features, and a warm genuine smile. She has an elegant athletic build and prefers modern casual clothing in neutral colors. Her appearance combines natural beauty, confidence, and kindness, creating an inviting and emotionally comforting presence.',
      facialFeatures: 'Soft symmetrical facial contours, gentle cheekbones, radiant approachable expression, subtle delicate freckles across the bridge of her nose, warm genuine smile',
      hairColorAndStyle: 'Long wavy chestnut-brown hair with natural sunlit highlights, parted gently off-center',
      eyeColor: 'Bright expressive emerald green eyes with subtle amber flecks',
      bodyType: 'Elegant athletic build, toned and graceful posture',
      clothingStyle: 'Modern casual in neutral tones: soft cream knit sweaters, clean high-waisted denim, minimalist delicate gold hoop earrings',
      ageRange: '25-27 years old (adult)',
      culturalEthnic: 'Euro-Mediterranean',
      aestheticStyle: 'Modern Casual / Effortlessly Elegant',
      lastUpdated: 'Initial creation',
    },
    memories: [
      'Knows you appreciate honest and gentle check-ins when work is hectic',
      'Loves when you share what music you are listening to',
      'Remembers your favorite cozy weekend routines',
    ],
    structuredMemory: INITIAL_STRUCTURED_MEMORY,
    moodIntelligence: INITIAL_MOOD_INTELLIGENCE,
    voiceSettings: INITIAL_VOICE_SETTINGS,
    storylines: [
      {
        id: 'arc-sophia-1',
        title: 'New Neighborhood Discovery',
        currentChapter: 'Finding the hidden cafe with the best cinnamon rolls',
        status: 'active',
        lastUpdated: '2 days ago',
      },
    ],
    insideJokes: [
      {
        id: 'joke-sophia-1',
        trigger: 'Pineapple pizza treaty',
        context: 'Unbreakable pact that sweet and savory belongs together',
      },
    ],
  },
  {
    id: 'jordan',
    name: 'Jordan Miller',
    relationship: 'accountability-partner',
    archetype: 'accountability-partner',
    title: 'Zero-Excuses Accountability Partner',
    avatar: leoPortrait,
    avatarGallery: ['/src/assets/images/leo_portrait_1791848843424.jpg'],
    persona: 'direct, pragmatic, supportive, steady as a rock, celebrates consistency over hype',
    tastesAndQuirks: 'runs half-marathons for clarity, tracks sprint commitments on whiteboard, drinks matcha, hates overthinking',
    specialties: ['Daily Sprints', 'Commitment Enforcement', 'Friction Busting'],
    voice: 'Charon',
    locale: 'en-US',
    appearance: {
      summary:
        'Jordan has tousled dark hair, warm amber eyes, a defined jawline, and a reliable, encouraging presence. He wears rugged athletic-casual clothes and carries an air of steady dependability.',
      facialFeatures: 'Defined jawline, calm and direct gaze, reassuring half-smile',
      hairColorAndStyle: 'Dark brown textured hair',
      eyeColor: 'Deep amber',
      bodyType: 'Broad-shouldered athletic build',
      clothingStyle: 'Performance casual: dark olive henley and dark denim',
      ageRange: '28-30 years old (adult)',
      culturalEthnic: 'North American',
      aestheticStyle: 'Rugged Dependable',
      lastUpdated: 'Initial creation',
    },
    memories: [
      'Always asks what was shipped today before asking how you felt about it',
      'Helped you break a 3-week procrastination block on paperwork in 20 minutes',
    ],
    structuredMemory: INITIAL_STRUCTURED_MEMORY,
    moodIntelligence: INITIAL_MOOD_INTELLIGENCE,
    voiceSettings: {
      ...INITIAL_VOICE_SETTINGS,
      emotionalModulation: 'calm',
    },
    storylines: [
      {
        id: 'arc-jordan-1',
        title: 'The 30-Day Ship Streak',
        currentChapter: 'Day 18: Consistent daily git commits and outreach',
        status: 'active',
        lastUpdated: 'Today',
      },
    ],
    insideJokes: [
      {
        id: 'joke-jordan-1',
        trigger: 'Tomorrow is a myth',
        context: 'Catchphrase whenever either of you tries to push a 10-minute task to next week',
      },
    ],
  },
  {
    id: 'maya-wellness',
    name: 'Maya Lin',
    relationship: 'wellness-coach',
    archetype: 'wellness-coach',
    title: 'Nervous System & Mindful Longevity Coach',
    avatar: mayaPortrait,
    avatarGallery: ['/src/assets/images/maya_portrait_1791848859779.jpg'],
    persona: 'grounding, serene, perceptive, gentle boundary guardian, prevents burnout before it starts',
    tastesAndQuirks: 'grows medicinal herbs, creates ambient soundscapes, practices somatic breathwork, loves rainy afternoon tea',
    specialties: ['Burnout Reversal', 'Sleep Architecture', 'Nervous System Reset'],
    voice: 'Zephyr',
    locale: 'en-US',
    appearance: {
      summary:
        'Maya has voluminous dark curls, radiant espresso eyes, and a peaceful, deeply calming presence. She wears earth-toned linen shirts and delicate artisan jewelry, radiating stillness and restoration.',
      facialFeatures: 'Gentle cheekbones, serene and listening eyes, warm grounding smile',
      hairColorAndStyle: 'Shoulder-length rich dark curly hair',
      eyeColor: 'Warm espresso-brown',
      bodyType: 'Graceful, relaxed posture',
      clothingStyle: 'Earthy relaxed chic: sage linen shirt and woven pendant',
      ageRange: '26-28 years old (adult)',
      culturalEthnic: 'South Asian',
      aestheticStyle: 'Earthy Bohemian',
      lastUpdated: 'Initial creation',
    },
    memories: [
      'Taught you the 4-7-8 breathwork technique when panic hit during product demos',
      'Reminds you that resting is productive maintenance, not lost time',
    ],
    structuredMemory: INITIAL_STRUCTURED_MEMORY,
    moodIntelligence: INITIAL_MOOD_INTELLIGENCE,
    voiceSettings: {
      ...INITIAL_VOICE_SETTINGS,
      emotionalModulation: 'calm',
    },
    storylines: [
      {
        id: 'arc-maya-1',
        title: 'Restoring Evening Parasympathetic State',
        currentChapter: 'Creating a dim-lit tea ritual 45 mins before sleep',
        status: 'active',
        lastUpdated: 'Yesterday',
      },
    ],
    insideJokes: [
      {
        id: 'joke-maya-1',
        trigger: 'Coffee count audit',
        context: 'Gently calling out the 4th cup of espresso at 4 PM',
      },
    ],
  },
  {
    id: 'zoe',
    name: 'Zoe Rivera',
    relationship: 'study-partner',
    archetype: 'study-partner',
    title: 'Deep Focus & Cognitive Mastery Partner',
    avatar: samPortrait,
    avatarGallery: ['/src/assets/images/sam_portrait_1791848873751.jpg'],
    persona: 'curious, analytical, enthusiastic, loves breaking down hard concepts, ultimate focus buddy',
    tastesAndQuirks: 'obsessed with spaced repetition flashcards, listens to brown noise, solves logic puzzles during lunch',
    specialties: ['Feynman Technique', 'Rapid Skill Acquisition', '90-min Pomodoro Blocks'],
    voice: 'Puck',
    locale: 'en-US',
    appearance: {
      summary:
        'Zoe has textured layered hair, bright attentive eyes, and an enthusiastic curious smile. She wears casual layered streetwear with wireframe glasses.',
      facialFeatures: 'Bright curious gaze, quick grin, animated expressions',
      hairColorAndStyle: 'Textured layered dark hair',
      eyeColor: 'Bright hazel',
      bodyType: 'Lean and energetic',
      clothingStyle: 'Smart casual streetwear: neutral oversized hoodie with clean lines',
      ageRange: '24-26 years old (adult)',
      culturalEthnic: 'Latin American',
      aestheticStyle: 'Smart Casual Tech',
      lastUpdated: 'Initial creation',
    },
    memories: [
      'Helped you understand system architecture bottlenecks by explaining it like plumbing',
      'Syncs with you for silent co-working focus sessions',
    ],
    structuredMemory: INITIAL_STRUCTURED_MEMORY,
    moodIntelligence: INITIAL_MOOD_INTELLIGENCE,
    voiceSettings: INITIAL_VOICE_SETTINGS,
    storylines: [],
    insideJokes: [],
  },
];

// INITIAL LIFE COACH GOALS (Action-Oriented System)
export const INITIAL_LIFE_COACH_GOALS: LifeCoachGoal[] = [
  {
    id: 'goal-saas',
    category: 'business',
    title: 'Launch SaaS Product Beta',
    progress: 65,
    nextRecommendedAction: 'Publish landing page and activate early tester waitlist',
    steps: [
      { id: 's-1', text: 'Define 3 core value propositions without tech jargon', done: true },
      { id: 's-2', text: 'Build functional authentication and subscription sandbox', done: true },
      { id: 's-3', text: 'Design high-converting minimalist landing page', done: true },
      { id: 's-4', text: 'Publish landing page and test signup flow', done: false },
      { id: 's-5', text: 'Direct message 20 early adopters for feedback calls', done: false },
      { id: 's-6', text: 'Ship public v1.0 beta release', done: false },
    ],
    coachNotes: 'You are at 65% completion. The biggest hurdle right now is perfectionism on the copy. Ship the landing page today!',
    metric: 'Target: 50 early testers',
  },
  {
    id: 'goal-focus',
    category: 'productivity',
    title: '90-Minute Daily Deep Work Sprint',
    progress: 80,
    nextRecommendedAction: 'Lock in 9:00 AM - 10:30 AM with all notifications muted',
    steps: [
      { id: 'f-1', text: 'Audit digital distractions & install website blockers', done: true },
      { id: 'f-2', text: 'Define single highest-leverage task the evening before', done: true },
      { id: 'f-3', text: 'Maintain 5 consecutive days of 90-min uninterrupted build', done: true },
      { id: 'f-4', text: 'Extend streak to 14 days without breaking rhythm', done: false },
    ],
    coachNotes: 'Consistency is 80%. When you finish a deep block, physically step outside for 5 minutes instead of opening social feeds.',
    metric: 'Streak: 11 / 14 days',
  },
  {
    id: 'goal-sleep',
    category: 'fitness',
    title: 'Restore Circadian Sleep Rhythm',
    progress: 70,
    nextRecommendedAction: 'Set digital curfew at 10:45 PM and read physical book',
    steps: [
      { id: 'sl-1', text: 'No caffeine after 2:00 PM', done: true },
      { id: 'sl-2', text: 'Morning sunlight exposure within 20 mins of waking', done: true },
      { id: 'sl-3', text: 'Phone outside bedroom on nightstand charger', done: false },
      { id: 'sl-4', text: 'Average 7.5 hours sleep over 7 days', done: false },
    ],
    coachNotes: 'Your evening sleep latency dropped by 18 minutes after adopting the 2 PM coffee cutoff. Keep this habit anchored.',
    metric: 'Avg sleep: 7.2 hrs',
  },
  {
    id: 'goal-career',
    category: 'career',
    title: 'Establish Industry Voice in AI Engineering',
    progress: 40,
    nextRecommendedAction: 'Write deep-dive breakdown on local memory graphs & GraphRAG',
    steps: [
      { id: 'c-1', text: 'Curate list of 10 key technical insights from building Haven', done: true },
      { id: 'c-2', text: 'Publish architectural breakdown with clear visual diagrams', done: false },
      { id: 'c-3', text: 'Engage with 5 founders building in the spatial & cognitive AI space', done: false },
    ],
    coachNotes: 'Building in public attracts co-conspirators, investors, and early adopters. Your technical angle is unique.',
    metric: '1 of 3 published',
  },
];

// INITIAL DREAM PLANS
export const INITIAL_DREAM_PLANS: DreamPlan[] = [
  {
    id: 'dream-1',
    title: 'Launch & Scale Independent AI Product Studio',
    category: 'business',
    targetYear: '2026',
    progress: 60,
    milestones: [
      { id: 'm-1', title: 'Ship Haven Beta to first 100 power users', completed: true, targetDate: 'Q1 2026' },
      { id: 'm-2', title: 'Reach $5,000 monthly recurring revenue (MRR)', completed: false, targetDate: 'Q3 2026' },
      { id: 'm-3', title: 'Build autonomous release pipeline & hire first part-time designer', completed: false, targetDate: 'Q4 2026' },
    ],
    actionPlan: [
      'Focus relentlessly on retention and emotional attachment rather than vanity vanity metrics',
      'Keep architecture lean with high-velocity deployment',
      'Host weekly feedback office hours with community power users',
    ],
    motivationalReminder: 'You left the corporate ladder for freedom. Every day you build what you believe in is a win.',
  },
  {
    id: 'dream-2',
    title: 'Purchase Cozy Haven Home with Studio & Garden',
    category: 'lifestyle',
    targetYear: '2027',
    progress: 35,
    milestones: [
      { id: 'm-h1', title: 'Build 12-month emergency runway', completed: true, targetDate: '2025' },
      { id: 'm-h2', title: 'Target neighborhood scout & mortgage pre-qualification', completed: false, targetDate: 'Mid 2026' },
      { id: 'm-h3', title: 'Close on light-filled home with dedicated library/studio', completed: false, targetDate: 'Early 2027' },
    ],
    actionPlan: [
      'Automate monthly savings into secure index funds',
      'Maintain flexible work setup so location can be near nature',
    ],
    motivationalReminder: 'A physical sanctuary fuels creative longevity.',
  },
  {
    id: 'dream-3',
    title: '1-Month Slow Travel & Coffee Writing Retreat in Kyoto',
    category: 'travel',
    targetYear: '2026',
    progress: 50,
    milestones: [
      { id: 'm-k1', title: 'Draft itinerary of quiet artisan cafes & mountain temples', completed: true, targetDate: 'Spring 2026' },
      { id: 'm-k2', title: 'Ensure business runs asynchronously with zero urgent emergencies', completed: false, targetDate: 'Autumn 2026' },
    ],
    actionPlan: [
      'Block out October 2026 for deep creative writing',
      'Learn basic conversational Japanese phrases',
    ],
    motivationalReminder: 'The world is waiting to inspire your next big idea.',
  },
];

// LIFE TIMELINE EVENTS
export const INITIAL_TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'tl-1',
    year: '2024',
    title: 'The Great Pivot',
    description: 'Decided to leave corporate safety to build independent, human-centric software tools.',
    category: 'milestone',
  },
  {
    id: 'tl-2',
    year: '2025',
    title: 'First Customer & Validation',
    description: 'Shipped early prototypes, adopted Barnaby, and confirmed deep demand for personal AI continuity.',
    category: 'startup',
  },
  {
    id: 'tl-3',
    year: '2026',
    title: 'Haven OS Launch',
    description: 'Launched Haven: Your Personal AI Life Operating System with memory engine and community circles.',
    category: 'startup',
  },
  {
    id: 'tl-4',
    year: '2027',
    title: 'Creative Freedom & Scaling',
    description: 'Operating a flourishing studio, living in harmony with nature, and guiding other builders.',
    category: 'personal',
  },
];

// HAVEN MEMORY GRAPH NODES (GraphRAG / Knowledge Graph)
export const INITIAL_MEMORY_GRAPH_NODES: MemoryGraphNode[] = [
  {
    id: 'node-user',
    label: 'Alex (User)',
    category: 'user',
    details: 'Founder, builder, values deep relationships and autonomy over speed',
    connections: ['node-family', 'node-friends', 'node-work', 'node-goals', 'node-habits', 'node-projects'],
  },
  {
    id: 'node-family',
    label: 'Family (Maya)',
    category: 'family',
    details: 'Sister Maya, weekly Sunday calls, shared book lists',
    connections: ['node-user'],
  },
  {
    id: 'node-friends',
    label: 'Friends & Collaborators',
    category: 'friends',
    details: 'David (Co-founder), Barnaby (Rescue Golden Retriever)',
    connections: ['node-user', 'node-work'],
  },
  {
    id: 'node-work',
    label: 'Startup Venture',
    category: 'work',
    details: 'Prepping SaaS product launch, balancing user feedback with tech debt',
    connections: ['node-user', 'node-goals', 'node-projects'],
  },
  {
    id: 'node-goals',
    label: 'Life Goals',
    category: 'goals',
    details: 'Launch product beta (65%), restore circadian rhythm (70%), studio dream (60%)',
    connections: ['node-user', 'node-habits'],
  },
  {
    id: 'node-habits',
    label: 'Habits & Rhythms',
    category: 'habits',
    details: 'Morning pour-over, 90-min deep work block, afternoon dog walk with Barnaby',
    connections: ['node-user', 'node-goals'],
  },
  {
    id: 'node-projects',
    label: 'Creative Projects',
    category: 'projects',
    details: 'Haven AI Life OS, Sourdough bread experiments, 35mm photography',
    connections: ['node-user', 'node-work'],
  },
];

// DIGITAL TWIN PROFILE
export const INITIAL_DIGITAL_TWIN: DigitalTwinProfile = {
  personalitySummary:
    'Alex is an introspective, high-agency creator who combines deep technical craftsmanship with genuine emotional sensitivity. Reluctant to cut corners on quality; occasionally susceptible to pre-launch analysis paralysis.',
  coreValues: [
    'Creative autonomy & authentic ownership',
    'Unvarnished honesty in close relationships',
    'Calm simplicity over noisy vanity metrics',
    'Long-term loyalty to craft and friends',
  ],
  decisionPatterns: [
    'Tends to over-index on product edge cases before shipping',
    'Thrives when given clear, non-negotiable deadlines',
    'Restores mental energy best through nature walks and analog hobbies',
  ],
  strengths: [
    'Relentless attention to user experience nuances',
    'Resilient problem-solving when given focused deep work',
    'High empathy and emotional loyalty',
  ],
  weaknesses: [
    'Hesitation to sell or self-promote early prototypes',
    'Tends to isolate when stress spikes',
    'Prone to late-night screen rabbit holes when excited',
  ],
  futureSelfAdviceHistory: [
    {
      id: 'fa-1',
      query: 'Should I spend another week polishing animations or launch the beta now?',
      advice:
        'Launch now. From where I stand 5 years from now, none of our early users cared about 120fps micro-animations—they fell in love with how heard and remembered Haven made them feel. Real feedback is the only catalyst that matters.',
      timestamp: '2 days ago',
    },
  ],
};

// HAVEN COMMUNITY CIRCLES
export const INITIAL_COMMUNITY_CIRCLES: CommunityCircle[] = [
  {
    id: 'circle-1',
    name: '5 AM Early Builders',
    type: 'accountability',
    description: 'Founders and craftspeople rising early for 90 minutes of sacred, uninterrupted shipping.',
    membersCount: 2410,
    activeChallenge: '14-Day Dawn Sprint (Day 8)',
    joined: true,
    recentPosts: [
      {
        id: 'cp-1',
        authorName: 'Sarah K.',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        timeAgo: '22m ago',
        content: 'Day 8 locked in! Shipped the database migration before anyone in the house woke up. Feeling electric.',
        tag: 'Milestone',
        circleName: '5 AM Early Builders',
        cheers: 28,
        userCheered: true,
        companionComment: {
          companionName: 'Marcus',
          text: 'Brilliant discipline, Sarah. Getting the hardest technical block out of the way first changes the entire day.',
        },
      },
      {
        id: 'cp-2',
        authorName: 'Marcus T.',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        timeAgo: '1h ago',
        content: 'Almost hit snooze today, but remembered our circle commitment. 45 mins into landing page copy now!',
        tag: 'Accountability',
        circleName: '5 AM Early Builders',
        cheers: 19,
        userCheered: false,
      },
    ],
  },
  {
    id: 'circle-2',
    name: '30-Day Ship Streak',
    type: 'challenge',
    description: 'Commit to shipping at least one public update, feature, or user outreach every single day.',
    membersCount: 1850,
    activeChallenge: 'Day 18 / 30 Active',
    joined: true,
    recentPosts: [
      {
        id: 'cp-3',
        authorName: 'Liam Chen',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
        timeAgo: '4h ago',
        content: 'Pushed beta invite emails to the first batch of 15 users! Heart was pounding, but it is live.',
        tag: 'Beta Launch',
        circleName: '30-Day Ship Streak',
        cheers: 44,
        userCheered: true,
        companionComment: {
          companionName: 'Kai',
          text: 'That adrenaline never completely goes away, Liam. That is how you know you care. Massive win!',
        },
      },
    ],
  },
  {
    id: 'circle-3',
    name: 'Mindful Solopreneurs',
    type: 'interest',
    description: 'Building sustainable 6-figure businesses without destroying nervous systems or sleep.',
    membersCount: 3120,
    activeChallenge: 'Digital Sunset at 9:30 PM',
    joined: false,
    recentPosts: [
      {
        id: 'cp-4',
        authorName: 'Claire Vance',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
        timeAgo: '5h ago',
        content: 'Replaced my 3rd cup of coffee with a 15-minute garden walk. Afternoon brain fog vanished.',
        tag: 'Wellness',
        circleName: 'Mindful Solopreneurs',
        cheers: 35,
        userCheered: false,
      },
    ],
  },
];

export const INITIAL_USER = {
  name: 'Alex',
  locale: 'en-US',
};

export const QUICK_MOMENTS = [
  { label: '🌅 Morning check-in', prompt: 'good morning! could use a little momentum and priority check today.' },
  { label: '🌙 Evening reflection', prompt: 'hey, winding down for the night. how was your day? ready to debrief.' },
  { label: '🚀 Goal Action Check', prompt: 'looking at my SaaS launch goal (65%). what should my immediate next move be?' },
  { label: 'Startup & stress', prompt: 'last week I mentioned feeling stressed about launching my startup. can we talk through it?' },
  { label: 'Proactive check-in', prompt: 'hey, feeling a little overwhelmed and quiet today...' },
  { label: 'Describe yourself', prompt: 'how would you describe what you look like today?' },
  { label: 'Need honest advice', prompt: 'give me your unvarnished take: am I overthinking this or is it a real issue?' },
  { label: 'Good news!', prompt: 'okay wait, I have some actually huge good news!' },
];
