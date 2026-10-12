# Trivia 答题时的动画 / 表情 / 吉祥物：证据与方案

Research date: 2026-10-12. Question (from user, Chinese): what animations or facial expressions/emoticons should accompany the trivia questions to raise 8-11 year-olds' enthusiasm.
Method: primary sources only (papers, the products' own blogs, W3C, MDN). Anything I could not trace to a primary page is marked **secondary, unverified**. Written in English because the brief was English; section headings follow the existing note.

## Sources and conventions

| Tag | What | URL | How I read it |
|---|---|---|---|
| BROM | Brom, Starkova, D'Mello 2018, *Educational Research Review* meta-analysis on facial anthropomorphisms + pleasant colors | author accepted manuscript: https://artemis.ms.mff.cuni.cz/main/papers/emodesign_manuscript_1rev_180928_FINAL_norev.pdf (manuscript gives DOI 10.1016/j.edurev.2018.09.004) | Full text read (abstract, Sec. 3 moderators, Sec. 4.1) |
| MALOY | Maloy et al. 2019, *CBE-Life Sci Educ*, seductive-detail RCT (754 undergrads) | https://pmc.ncbi.nlm.nih.gov/articles/PMC6755318 | PMC page read |
| REY | Rey 2012 seductive-detail meta-analysis, DOI 10.1016/j.edurev.2012.05.003 | publisher page returned 403/redirect | **Secondary, unverified** (only via MALOY's citation: "small to medium negative effect") |
| S&A | Sundararajan & Adesope 2020, *Educ Psychol Rev*, DOI 10.1007/s10648-020-09522-4 | publisher page blocked | **Secondary, unverified** (g = -0.33, 68 effects / 58 studies, via https://www.e-teaching.org/materialien/literatur/sundararajan-adesope-2020 and a WSU press release) |
| LEPPER | Lepper, Greene, Nisbett 1973, *JPSP* 28:129-137 (preschoolers, "Good Player" certificate) | not opened | **Secondary, unverified** (search summary) |
| DECI | Deci, Koestner, Ryan 1999, *Psych Bull* 125:627-668, 128 experiments | PDF copy listed at https://depts.washington.edu/techdocs/papers/deciExtrinsicRewardsAndIntrinsicMotivation99.pdf (not opened) | **Secondary, unverified** (d = -0.40 / -0.36 / -0.28 for engagement-, completion-, performance-contingent rewards; positive feedback raised interest) |
| M&D | Mueller & Dweck 1998, *JPSP* 75:33-52, six studies, 5th graders | https://www.columbia.edu/cu/psychology/courses/3615/Readings/Mueller_Dweck.pdf | Only the search-result abstract summary; **partly secondary** |
| H&T | Hattie & Timperley 2007, *Rev Educ Res* 77:81-112 | https://www.uky.edu/~gmswan3/575/Hattie_Timperly_2007.pdf | Not read in full; levels (task / process / self-regulation / self) **secondary** |
| DUO-STREAK | Duolingo blog, how streak builds habit | https://blog.duolingo.com/how-duolingo-streak-builds-habit | Fetched (first-party) |
| DUO-RIVE | Duolingo blog, character visemes / Rive | https://blog.duolingo.com/world-character-visemes | Fetched (first-party) |
| WCAG-233 | SC 2.3.3 Animation from Interactions (AAA) | https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html | Fetched |
| WCAG-231 / 222 | SC 2.3.1 Three Flashes (A), SC 2.2.2 Pause/Stop/Hide (A) | https://www.w3.org/TR/WCAG22/#three-flashes-or-below-threshold | Fetched (first 100k chars) |
| WCAG-142 | SC 1.4.2 Audio Control (A) | https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html | Fetched |
| MDN-PRM | `prefers-reduced-motion` | https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion | Fetched. The MQ Level 5 spec section (https://www.w3.org/TR/mediaqueries-5/#prefers-reduced-motion) was beyond the fetched text; I did not read it directly |
| MDN-WAAPI | Web Animations API / `Element.animate()` | https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API/Using_the_Web_Animations_API | Fetched |
| MDN-LIVE | `aria-live` | https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-live | Fetched |

Evidence grades: **Strong** = meta-analysis or replicated, directly on point. **Mixed** = positive and null/negative results, or only indirect. **Weak** = inference, single small study, or vendor claim. "Children?" = whether it was studied in kids.

---

## 1. Core conclusions (read this first)

1. **No study I found tests this exact thing** (cartoon feedback / mascot reactions in a children's multiple-choice quiz). I searched for primary-school animated-feedback trials and for child pedagogical-agent emotion studies and found none (the nearest hits were adult samples). Everything below is extrapolated; treat the sizes as hypotheses to A/B test locally.
2. **Best direct evidence: cute faces and pleasant colors on the learning graphics help a little, and maybe more for kids.** BROM (33 samples, N = 2924, mostly lab multimedia lessons, mostly adults): retention d+ = 0.387, comprehension 0.317, transfer 0.327, intrinsic motivation 0.255, liking/enjoyment 0.109 (weak), positive affect 0.113 (marginal). Age moderated intrinsic motivation (children d+ = .855 vs college .231 / .110) but the authors call it provisional and say there is "not enough data" on primary-school children. Evidence: **mixed-to-strong overall, weak for 8-11 year-olds.**
3. **Decoration that is not the content can hurt.** Seductive-detail meta-analyses report small-to-medium *negative* effects on retention/transfer (REY, S&A: both secondary, unverified; MALOY cites REY). Those studies are mostly adults and mostly cognitive outcomes only; S&A authors themselves note emotional benefits were not measured. BROM itself names extraneous load as the risk and cites one study (Schneider et al. 2018b, via BROM) suggesting *more complex* faces did not help younger kids. Implication: **small, simple, outside the reading area; never animate while the child is reading the question or the Why box.**
4. **How you react to a wrong answer matters more than how you celebrate a right one.** Feedback research (H&T, secondary) ranks task/process feedback above praise of the person; M&D (5th graders, abstract-level) found praise for intelligence led to worse persistence and enjoyment after failure than praise for effort. So: celebrate *effort and the fact learned*, never "You're so smart!", and never a sad/shaming face on a miss.
5. **Rewards for just doing the task can erode interest.** LEPPER (preschoolers) and DECI (all ages; secondary) show expected, tangible, engagement- or completion-contingent rewards reduce free-choice interest, while positive informational feedback does not. Keep celebrations small, brief and informational; do not build a points/coins economy on top of 10 questions.
6. **Streaks: one real first-party data point, and it is about a language app for all ages.** DUO-STREAK: a streak-milestone animation raised 7-day retention of new learners by 1.7%; allowing two Streak Freezes raised daily active learners 0.38% relative; 7-day-streak learners are 3.6x more likely to finish the course (correlational). Duolingo also says fear of losing a streak can stop people from starting one. No methodology given, not a child study: **weak for our audience.**
7. **Kahoot:** I found no first-party whitepaper. Independent studies (vocational/university, small, mostly no control) are mixed on motivation and anxiety, and flag time pressure as an anxiety source. **Secondary, unverified; not children.** Takeaway used here: no timers, no leaderboard.

---

## 2. What the existing pages already do (from reading the code)

| Page | Today | Gap |
|---|---|---|
| `trivia.html` | Correct option green (`.ok`), wrong red (`.bad`) + yellow `.why` box; 10px progress bar (no transition); end screen `N / 10`, "Perfect! 🎉" (text only); done screen "Done for today ✓ ... Come back tomorrow"; no animation, no `prefers-reduced-motion` rule, no sound | Nothing to reduce yet, so every new motion must ship with its own reduced-motion rule |
| `typing.html` | `celebrateBig()` = `popIn` text (.85s) + 22 confetti `<i>` with `fly` (.9s), plus `playDing()` sound | I found no `prefers-reduced-motion` rule in the file (grep). Particles are `position:fixed` DOM nodes removed on `animationend`. Reusable pattern, needs a reduced-motion guard before copying |

---

## 3. Recommendations by moment in the flow

Legend: Effort S = under ~30 lines, M = 30-80 lines, L = needs art assets.

| # | Moment | What to do | Why / evidence | Strength | Children? | Effort |
|---|---|---|---|---|---|---|
| R1 | **Question appears** | Quick 150-200 ms fade/slide of the card content only. Mascot is *static* (or absent) while the question is read. No idle bobbing, no blinking next to the text | Seductive-detail risk is highest while reading (REY / S&A, secondary); BROM names extraneous load | Mixed | Mostly adults | S |
| R2 | **Hover / press an option** | Hover: border color + 1-2 px lift. Press (`:active`): translateY(3px) so the existing 3px bottom "shadow" visually sinks. Tiny and instant, no sound | Immediate response confirms the tap; low load. No direct child study. Duolingo-style tactile buttons are already the visual language here | Weak | No | S |
| R3 | **Correct answer** | Chosen option does a 250-350 ms "pop" (scale 1 -> 1.04 -> 1). Mascot shows a **happy, smiling face** (open smile, bright eyes), small and beside the Next button. Text: short, specific, effort-neutral ("Yes! Got it." / "Right!"). Rotate 5-6 phrases so it does not wear out. Optional tiny sparkle, not full confetti every time | Positive, informational feedback raised interest (DECI, secondary); BROM supports positive faces on materials | Mixed | Partly (BROM children subgroup) | S-M |
| R4 | **Wrong answer + Why box** | Chosen option: **no shake, no buzzer**. Just the existing red tint + a soft 200 ms fade. Correct option still goes green so the answer is visible. Mascot shows a **curious / "aha!"** face (head tilt, raised eyebrows, small smile or lightbulb). The Why box fades in (200 ms) and then **stays still**. Copy: "Not this time, here's the cool part" instead of "Wrong" | H&T (secondary): give task-level info (the Why box is exactly that). M&D: do not attach the failure to the child's ability | Mixed | M&D yes (5th grade, praise not animation) | S |
| R5 | **Progress between questions** | Animate the existing bar with `transition: width .4s`. Optionally the mascot "walks" a few px along the bar. Show "3 / 10" (already there). Never show a countdown | Visible progress is the lowest-risk motivator; no timer avoids the anxiety flagged for Kahoot-style speed play (secondary) | Weak | No | S |
| R6 | **Finish 10/10** | The one place for the big show: reuse `celebrateBig` (confetti ~1 s) + mascot **delighted/cheering** (arms up, big open smile, star eyes) + "Perfect!" Stays a *surprise*, not tied to a coin or star count | A rarer, bigger moment avoids habituation and over-justification (DECI / LEPPER, secondary: expected, contingent rewards are the problem) | Weak | Partly | M |
| R7 | **Finish with a low score (say under 5/10)** | **No** confetti and **no** sad face. Mascot: warm, encouraging smile or thumbs-up. Headline: "You learned N new things today!" (N = missed count) above the existing Review list. Keep the score number small | Frames errors as learning (H&T task/process level, secondary); M&D effort-over-ability framing | Mixed | M&D yes | S |
| R8 | **Middle scores (5-9)** | Gentle sparkle only, mascot proud/smiling. "N / 10, nice work!" | Same as above | Weak | No | S |
| R9 | **Daily completion / return tomorrow** | On the Done screen: mascot waving goodbye or sleeping with "Zzz" (static emoji or a 2-frame swap). Copy: "Next 10 unlock tomorrow!". Existing mechanic already gives a natural reason to return | Reminders are not evidence-backed here; keep it to a statement, no guilt | Weak | No | S |
| R10 | **Streaks** | If added: show "N days in a row" as a quiet counter. A small flame/sparkle animation only on milestone days (3, 7, 14...). **Never** show a "you lost your streak" screen or sad mascot; if a day is missed, just restart silently or let the counter hold. Optional later: one free "rest day" | DUO-STREAK: milestone animation +1.7% D7 retention for new learners; Duolingo itself says fear of losing a streak can deter people. For 8-11 year-olds, streak anxiety is the bigger risk and I found no child data | Weak | No | M (needs localStorage date logic) |

### Mascot expressions

| Moment | Show | Avoid | Basis |
|---|---|---|---|
| Idle / question | Neutral-friendly, eyes forward, or no mascot | Winking, bouncing, anything that pulls the eye from the question | Extraneous-load caution (BROM, REY secondary) |
| Correct | Happy smile, sparkle eyes, small nod/hop | Over-the-top screaming, "genius" captions | M&D (praise ability) |
| Wrong | Curious / thinking / "aha" (tilted head, eyebrows up, lightbulb 💡) | Crying, sweat-drop, disappointed or angry face, 😢 😞 😡, "X" buzzer, head-shake, "Wrong!" | H&T / M&D reasoning; this is design inference, not a tested finding |
| Perfect | Delighted, arms up, stars | Mocking others / comparing to other kids | Comparison raises performance goals (M&D-style reasoning, inference) |
| Low score | Warm, encouraging, thumbs-up | Any celebration that implies it was good when it wasn't (kids notice) or any pity face | Inference |
| Done / tomorrow | Wave, sleepy | Guilt ("I'll miss you!", crying) | Inference; Duolingo-style guilt copy has no child evidence |

Emoji shortlist (system emoji, zero assets): correct 😄 ✨ 👍; wrong-explained 🤔 💡; perfect 🤩 🎉 🌟; low-score 🙂 💪 🌱; done 👋 😴. Emoji look different per OS; test on Windows, iOS, Android. No emoji-in-children study found; **weak**.

---

## 4. Implementation sketches (vanilla CSS / emoji / SVG / WAAPI)

All additions go inside the existing `<style>` and `<script>` of `trivia.html`. No build step, no dependency. Rough sizes assume ~70 chars per line.

| Rec | Approach | Rough size |
|---|---|---|
| R1 | `.card > *` animation: `@keyframes in{from{opacity:0;transform:translateY(6px)}}` with `.15s`. Re-trigger by re-rendering (already `innerHTML`) | 3 CSS lines |
| R2 | `.opt:not(:disabled):hover{transform:translateY(-1px)}` `.opt:not(:disabled):active{transform:translateY(3px);box-shadow:0 0 0 var(--line)}`, `transition:transform .08s` | 3 CSS lines |
| R3 | In `answer()`, if correct: `btn.animate([{transform:"scale(1)"},{transform:"scale(1.04)"},{transform:"scale(1)"}],{duration:300})` (WAAPI per MDN-WAAPI; always give >=2 keyframes). Put mascot/emoji in `#after`: `<span class="face" aria-hidden="true">😄</span>` | ~8 JS lines |
| R4 | Add `.why{animation:in .2s}` and `<span class="face" aria-hidden="true">🤔</span>` to the `.why` HTML. Reword the label from "Why" to "Cool fact" only if the user wants (copy change, ask first) | ~3 lines |
| R5 | `.progress>span{transition:width .4s ease}`. Since `show()` re-renders `innerHTML`, the bar restarts at the new width and will not animate; fix by rendering the *previous* width first then setting the new width in `requestAnimationFrame`, or animating with WAAPI from `i-1` to `i` | ~6 JS lines |
| R6 | Copy `.big-gg`, `.particle`, `popIn`, `fly` and `celebrateBig` from `typing.html` (~25 lines), minus `playDing()` by default; call from `finish()` when `missed.length===0` | ~25 lines copied |
| R7/R8 | In `finish()` choose face and headline by score: `0-4` encouraging, `5-9` proud, `10` perfect. Pure string choice | ~8 JS lines |
| R9 | Static emoji in `showDone()`; optional CSS `@keyframes zzz` on a `Z` span | ~4 lines |
| R10 | New localStorage key `map-quiz-trivia-streak:{date,count}`; update in `finish()` when not practice. Show a counter; fire R6-style sparkle on milestone | ~25 JS lines |
| Mascot (optional, L) | Prefer inline SVG face with 3 swappable mouth/brow groups (smile, curious, cheer) and CSS to toggle `.face[data-mood]`; roughly 1-2 KB per character. Expressions then cost no extra network requests. For richer animation, Duolingo's own write-up says it chose Rive because files were compact, a state machine lets engineers drive states, and it runs on Android/iOS/Web (DUO-RIVE). That needs a runtime library, so by the "no external dependencies unless clearly worth it" rule, **not worth it** for 5 expressions | 40-80 SVG lines for one character |

### Reusing the old mascot pack (looked at, not moved or edited)

Source: `C:\Users\wizar\Others\map-quiz-focus-archive\assets\mascot`. 78 files. I opened only 3 avatars; I did not view the GIF frames. Names below describe what the filenames say.

| Asset | Size | Fit |
|---|---|---|
| `stickers/study_bunny/win_cheer.gif` | 111 KB | Best candidate for R6 (perfect). Small enough |
| `stickers/bubu_bear/win_celebrate.gif` | 169 KB | Alternate R6 |
| `stickers/study_bunny/avatar.png`, `bubu_bear/avatar.png`, `mochi_cat/avatar.png` | small PNGs | Static neutral/happy corner mascot. Bunny is smiling (viewed); bear shows Chinese text on the laptop sign ("优秀员工"), so it would need a new crop |
| `stickers/study_bunny/diag_think.gif` | 2.5 MB | Matches the "curious" face for R4 but **far too big** for a page that is otherwise 7 KB; would need re-encoding |
| `kids/kid_boy_avatar.png`, `kid_girl_avatar.png` | 28 / 33 KB | Cheap static avatar (boy: smiling, thumbs-up) |
| `kids/animations/boy_ready_wave.gif` / `.webp` | 2.5 MB / 1.2 MB | Too big. `wechat_sticker_boy_laugh.gif` 208 KB is the only kid animation that is small |
| `conan/*` | 6.7 MB total | **Do not ship.** Detective Conan is a third-party copyrighted character |

Missing from the pack: a dedicated "curious/aha" and "encouraging" expression set. Only cheer/win, think, ready, focus and combo exist. **Provenance/licence unknown** for the sticker packs (the filenames and the bear's Chinese sign suggest commercial sticker characters), so confirm rights before putting them on a public site. Inline SVG or emoji is the safe default.

---

## 5. Accessibility requirements (non-negotiable for every item above)

| Requirement | Rule | Source | How |
|---|---|---|---|
| Reduced motion | Provide a way to disable non-essential motion triggered by interaction (AAA, but cheap) | WCAG-233 (sufficient technique: `prefers-reduced-motion`); MDN-PRM | `@media (prefers-reduced-motion: reduce){ *{animation:none!important;transition:none!important} }` plus in JS: `const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;` and skip `animate()` / confetti when true. MDN guidance: replace motion with fades or color changes, don't remove feedback itself. Keep the green/red state and the emoji face |
| Flashing | Nothing flashes more than 3 times in any 1-second period (Level A) | WCAG-231 | Confetti must fall/fly, not strobe; no flickering background; no repeated blinking sparkles faster than 3 Hz |
| Auto-moving content | Moving content that starts automatically and lasts over 5 s alongside other content needs pause/stop/hide (Level A) | WCAG-222 | Keep every effect under ~1.5 s; no looping idle animation. This also protects reading focus (R1) |
| Sound | Audio that plays automatically for more than 3 s needs a stop/volume control (Level A) | WCAG-142 | Ship **silent by default**. `typing.html` already calls `playDing()`; if added to trivia, add a visible mute toggle saved to localStorage, default off, and keep sounds under 1 s, triggered only by a click |
| Not color alone | Correct/wrong already differ by color only | (standard practice; not fetched here) | Add a ✓ / ✗ or text to the chosen and correct options (also helps colorblind kids). Mark emoji `aria-hidden="true"` |
| Screen readers | Announce result without stealing focus | MDN-LIVE | An empty `<div role="status" aria-live="polite">` in the page, filled with "Correct" / "Not quite. The answer is X" after `answer()` |
| Photosensitivity/vestibular | Avoid large scaling/panning | MDN-PRM | Keep scale changes at or below 1.05 and distances small; confetti is the biggest offender, hence the reduced-motion guard |

---

## 6. Prioritized top 5 (biggest expected effect per effort)

Expected effect is my judgement from the weak-to-mixed evidence above, not a measured number.

| Rank | Item | Effort | Why this rank |
|---|---|---|---|
| 1 | **R4 + R7: supportive wrong-answer handling** (curious 🤔/💡 face, no shake/buzzer, "N new things learned" on low scores) | S | Wrong answers happen on a large share of questions; this is where kids are most likely to quit or feel bad, and the evidence on feedback framing (H&T, M&D) is the sturdiest and partly child-based. Costs only a few lines and copy |
| 2 | **R3 + R2: tactile press + small correct-answer pop with a happy face** | S | Every question uses it; supported (mixed) by BROM's positive-face effects and DECI's positive-feedback finding; tiny load |
| 3 | **R6: confetti + cheering mascot only for 10/10** (reuse `celebrateBig`, reduced-motion guarded) | M | Highest-delight moment, already half-built in `typing.html`; rare enough to avoid habituation and over-justification |
| 4 | **R5: animated progress bar (+ optional mascot walking along it)** | S | Cheap, no extra reading load, and it makes 10 questions feel like a short journey. No timer |
| 5 | **Accessibility pack (reduced-motion + silent-by-default + status region)** | S | Not a "delight" feature, but required before shipping 1-4, and it stops the animations from backfiring for sensitive kids |

Deferred (do only if the user wants them): streaks (R10) because the anxiety risk is real and child evidence is absent; Rive/Lottie mascots (library cost); the sticker GIFs (size + licence).

## 7. Open questions for the user (so I do not guess)

1. One mascot or a choice of boy/girl/bunny? (The pack has all three, licence unknown.)
2. Is any sound wanted at all? Default I'd choose: none.
3. Do you want streaks now, given the evidence is weak and anxiety is the main risk?
4. OK to rename the "Why" label to something friendlier ("Cool fact")? That is a copy change, not requested yet.
5. Should I add a simple local A/B (e.g. completion rate of 10 questions with vs without mascot)? That is the only way to get child-specific evidence for this site.

## 8. What I could not verify

- REY, S&A: publisher pages blocked; figures come from secondary summaries.
- LEPPER, DECI, M&D, H&T: abstract-level summaries only; effect sizes not confirmed against the paper text.
- Kahoot: no first-party research found.
- Rive/Lottie size claims (vendor blogs: "10-15x smaller") were not independently tested; I did not use them in a recommendation.
- Duolingo's percentages are company-reported with no method given.
- MDN-PRM: I read MDN, not the MQ Level 5 spec text itself.
- No peer-reviewed study of mascot facial expressions on wrong answers in 8-11 year-olds was found; the "curious face" advice is an inference.
