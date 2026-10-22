# Project notes for Claude

## Gemini gateway: use only `gemini-3.8-flash`

When a task needs Gemini (writing or checking quiz questions, riddles, explanations, filtering content), call the
local gateway at `http://127.0.0.1:8045/v1/chat/completions` with the model **`gemini-3.8-flash` only**, every time.

- Do not switch to other models (`gemini-3.1-pro-*`, `*-flash-lite`, `gemini-3.5-*`, `gemini-3.7-*`, etc.), and do not add fallback models. If a call fails or is rate limited (HTTP 429), wait and retry the same model, or lower the parallelism.
- Go slowly: at most 2 requests in parallel and a few seconds between requests. The gateway has warned about requests sent too fast and then rate-limited every account for days.
- The API key is not stored in this repo. Ask the user for it if it is needed; never write it into a file.
- Do not write Python scripts to call Gemini; use `curl` or short Node scripts kept outside the repo.

## Quiz content rules (trivia, riddles, explanations)

Every question written for kids must pass all of these:

- **A typical 10-year-old can understand it** with no background: plain words, short sentences, concrete things, people, places, animals, body parts and events. No abstract ideas (rights, laws, economics, systems) and no jargon.
- **Not obscure.** It must be something a child would find interesting and could tell a friend; skip niche trivia nobody would care about (for example the name of a 1915 cloth doll). Prefer well-known, surprising or fun facts.
- **History asks what happened**: big events and famous people (who did what, where, when, what changed).
- One clearly correct answer, factually accurate, child-safe, 4 distinct options, no trick wording, no "which of the following".
- Explanation: one short sentence, at most 10 words, warm and playful, 5th-grade vocabulary.
- Never repeat the same fact in two questions; a given answer should not appear more than about 4 times in a category.

## French tab (data/trivia/fr.json)

- All text is in French, for a child with 5 years of French immersion (about grade 5 reading level), focused on reading and writing: vocabulary, fill in the blank, spelling, short reading passages, verbs and grammar.
- Neutral standard French (fine in Canada and in France), perfect accents, no English, no "lequel des suivants".
- Explanation: one French sentence, at most 10 words (the child types it after a wrong answer; typing e for é is accepted).
- Vocabulary ideas come from the French frequency list in hermitdave/FrequencyWords (CC BY-SA 4.0), credited on the page.
