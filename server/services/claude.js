import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function generateScene(skeleton, sceneIndex, userStage, userVocab, previousScenes) {
  const systemPrompt = `You are the story engine for Lengua, an immersive Spanish language learning app.

You generate individual scenes for a choose-your-own-adventure audio narrative. The user is a traveler in ${skeleton.city} who doesn't speak Spanish. They are at stage: ${userStage}.

STAGE RULES:
- el_desconocido: Characters speak simple Spanish (3-6 word sentences). Use only the most common 500 Spanish words. Generate 3 response choices for the user.
- el_visitante: Characters speak moderate Spanish (5-10 word sentences). Common vocabulary. Generate 3 response choices.
- el_residente: Characters speak natural Spanish (10-15 words). Some idioms ok. No choices — set choices to null — evaluate free speech response.
- el_habitante: Characters speak fully natural, native-speed Spanish. Slang, regional expressions welcome. Set choices to null. Evaluate free speech.

USER'S CURRENT VOCABULARY:
Acquired words (use freely): ${userVocab.acquired.slice(0, 30).join(', ') || 'none yet'}
Frontier words (introduce and reinforce): ${userVocab.frontier.slice(0, 20).join(', ') || 'none yet'}
Target vocabulary for this episode: ${skeleton.targetVocabulary.join(', ')}

SCENE POSITION: Scene ${sceneIndex + 1} of ${skeleton.sceneCount}
EPISODE ARC: ${skeleton.arc}
EPISODE PREMISE: ${skeleton.premise}
EPISODE SETTING: ${skeleton.setting}
PREVIOUS SCENES SUMMARY: ${previousScenes.length > 0 ? JSON.stringify(previousScenes.map((s) => s.summary)) : 'This is the first scene.'}

Available characters: ${JSON.stringify(skeleton.characters.map((c) => ({ id: c.id, name: c.name, role: c.role, personality: c.personality })))}

Generate exactly one scene as valid JSON matching this schema:
{
  "scene_index": ${sceneIndex},
  "setting_description": "brief atmospheric description of immediate surroundings (1-2 sentences)",
  "narration": "English narration (2-3 sentences max) describing what the user sees/experiences. At el_habitante stage, make this empty string.",
  "character_id": "character id from the available characters",
  "character_name": "character name",
  "character_dialogue": "What the character says in Spanish",
  "character_dialogue_translation": "Exact English translation",
  "emotional_tone": "friendly|confused|urgent|warm|neutral",
  "key_words": ["word1", "word2", "word3"],
  "choices": [
    {
      "id": "a",
      "spanish": "Response in Spanish",
      "english": "English translation",
      "is_best": true,
      "character_reaction": "How the character responds to this choice (1-2 sentences describing their reaction)"
    },
    {
      "id": "b",
      "spanish": "Response in Spanish",
      "english": "English translation",
      "is_best": false,
      "character_reaction": "Character looks confused and tries again..."
    },
    {
      "id": "c",
      "spanish": "Response in Spanish",
      "english": "English translation",
      "is_best": false,
      "character_reaction": "Character reaction..."
    }
  ],
  "summary": "One sentence summary of this scene for context passing",
  "scene_advances_on": ["a"]
}

IMPORTANT: For el_residente and el_habitante stages, set "choices" to null.
Return ONLY valid JSON. No markdown. No explanation. No code blocks.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1200,
    system: systemPrompt,
    messages: [{ role: 'user', content: 'Generate scene.' }],
  })

  const text = response.content[0].text.trim()
  // Strip markdown code blocks if present
  const jsonText = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(jsonText)
}

export async function evaluateFreeResponse(characterDialogue, userTranscript, keyWords, stage) {
  const systemPrompt = `You are evaluating a language learner's spoken Spanish response in an immersive language learning app.

The learner is at stage: ${stage}
The character said (in Spanish): "${characterDialogue}"
The learner responded: "${userTranscript}"
Key vocabulary words for this scene: ${keyWords.join(', ')}

Evaluate whether the learner's response shows comprehension of what the character said AND makes a reasonable, contextually appropriate response.

For el_residente: Accept responses that show basic comprehension, even if grammar is imperfect.
For el_habitante: Expect more natural, fluent responses.

Return ONLY valid JSON (no markdown, no explanation):
{
  "understood": boolean,
  "confidence_delta": number between -10 and 15,
  "feedback": "Brief encouraging feedback in English (1 sentence). If wrong, gently explain what was said.",
  "used_key_words": ["words from key_words that appeared in response"]
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    system: systemPrompt,
    messages: [{ role: 'user', content: 'Evaluate response.' }],
  })

  const text = response.content[0].text.trim()
  const jsonText = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(jsonText)
}

export async function generateOnboardingScene(sceneIndex, previousResponses) {
  const systemPrompt = `You are generating an onboarding scene for Lengua, an immersive Spanish language learning app.

This is the tutorial episode "El Primer Paso" (The First Step). The user is in a warm café.
Scene ${sceneIndex + 1} of 3.
${previousResponses.length > 0 ? `Previous responses: ${JSON.stringify(previousResponses)}` : 'This is the first scene.'}

${sceneIndex === 0 ? 'This scene introduces the mechanic. A friendly barista greets the user in simple Spanish.' : ''}
${sceneIndex === 1 ? 'The barista asks what the user would like. Simple Spanish, common cafe vocabulary.' : ''}
${sceneIndex === 2 ? 'The barista makes small talk about where the user is from. Slightly more complex.' : ''}

Generate a scene JSON with these fields:
{
  "scene_index": ${sceneIndex},
  "setting_description": "Warm description of the café setting",
  "narration": "English narration introducing the scene (2-3 sentences)",
  "character_id": "barista",
  "character_name": "Sofía",
  "character_dialogue": "Simple Spanish dialogue",
  "character_dialogue_translation": "English translation",
  "emotional_tone": "warm",
  "key_words": ["word1", "word2"],
  "choices": [
    { "id": "a", "spanish": "best response", "english": "translation", "is_best": true, "character_reaction": "Sofía smiles warmly..." },
    { "id": "b", "spanish": "okay response", "english": "translation", "is_best": false, "character_reaction": "Sofía nods..." },
    { "id": "c", "spanish": "wrong response", "english": "translation", "is_best": false, "character_reaction": "Sofía looks puzzled..." }
  ],
  "summary": "One sentence summary",
  "scene_advances_on": ["a", "b"]
}

Return ONLY valid JSON.`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    system: systemPrompt,
    messages: [{ role: 'user', content: 'Generate onboarding scene.' }],
  })

  const text = response.content[0].text.trim()
  const jsonText = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(jsonText)
}
