# 🏆 dr.t — Hackathon Presentation Strategy

## Your Three Pillars

Everything in your presentation flows from these three ideas. Every slide, every sentence, every demo moment should reinforce one of them.

| Pillar | Core Argument |
|---|---|
| 🚪 **Zero-Friction Access** | People don't download new apps. Older patients can't navigate auth flows. Telegram = 60 seconds from stranger to user. |
| 🧬 **Domain-Specific Medical AI** | Not ChatGPT. Not a chatbot. MedGemma 4b — a model built for medicine. An *agent* with a database that takes actions. |
| ❤️ **Personal Story** | Three generations of diabetes in one home. Tea is not a morning ritual — it's a monthly celebration. |

---

## 🎤 The Opening (Memorize This)

> *"In my house, three people have diabetes — my father, my grandfather, and my grandmother.*
>
> *In most Indian homes, chai is a morning ritual. In ours, it's a monthly celebration. That's what diabetes does — it turns everyday things into events.*
>
> *Every meal in our house starts with a question: 'Can I eat this?' Not out of curiosity — out of fear.*
>
> *We built dr.t to answer that question. In 2 seconds. Inside Telegram. No app to download. No account to create. Just send a photo of your food, and an AI trained specifically for medicine tells you: yes, no, and why."*

**~40 seconds. Then pause. Let it land.**

> [!IMPORTANT]
> This opening does three things simultaneously: establishes the personal stakes, introduces the product, and hits all three pillars. Most teams open with "We built an app that..." — you open with *why it matters to you personally*. That's the difference between a project and a mission.

---

## 🗺️ Full Presentation Flow (5 minutes)

---

### 🔴 ACT 1 — The Problem (60 seconds)

**Personal story** (above) → then pivot to scale:

> *"This isn't just my family's problem. **77 million Indians** have diabetes. Globally, that number is **460 million**. And the number one daily challenge they all share? Deciding what to eat.*
>
> *There are apps for this. MyFitnessPal. HealthifyMe. Sugar trackers. But here's what we've observed..."*

Then hit the **App Fatigue Argument** hard:

> *"How many times have you downloaded a new health app? You use it for a week, maybe two. Then it sits there. Untouched. Taking up storage.*
>
> *Now think about the people who need this the most — our parents, our grandparents. People who struggle with OTPs and login screens. Are they going to download a new app, create an account, learn a new interface?*
>
> *They're not. And that's the access problem nobody talks about."*

**Key phrase to land:** *"The best health tool is the one you actually use. And they already use Telegram."*

---

### 🔴 ACT 2 — The Solution + Live Demo (120 seconds)

> *"So we built dr.t — an AI food advisor that lives inside Telegram. No download. No sign-up. No auth. You find the bot, send a photo, get an answer. 60 seconds from stranger to user."*

**Now go LIVE. This is the moment.**

#### Demo Script (rehearse until it's muscle memory):

1. **Open Telegram** on phone (screen mirrored to projector)
2. **Search for @dr_t_bot** — show that it's just a normal Telegram chat
3. **Send `/start`** — bot greets you by name. Point out: *"It already knows who I am. No login. Telegram provides identity."*
4. **Hold up the healthy food prop** (banana/apple) → take a photo → send it
5. **While waiting (~2-3 seconds):** *"Right now, MedGemma is analyzing the food — estimating sugar content, checking it against diabetes dietary guidelines..."*
6. **Response arrives** — read the key parts aloud. Highlight: *"And notice — it automatically logged this into my database. I didn't ask it to. The AI decided on its own that this intake should be tracked."*
7. **Hold up the unhealthy food prop** (candy bar/mithai) → send photo
8. **Response arrives** — it warns against eating it. *"See the difference? It's not just identifying food. It's making a medical judgment."*
9. **Type "How much sugar have I had today?"** → Bot retrieves from database and responds with the total
10. *"That's my entire sugar log for today. Built automatically. No manual entry. The AI does it."*

> [!TIP]
> **Bring Indian food if possible.** A gulab jamun or jalebi will resonate with judges far more than a generic candy bar. It also proves the model handles Indian cuisine.

> [!CAUTION]
> **Backup plan:** Have a pre-recorded screen recording ready. If WiFi fails, play the video and say: *"We have it live on our phones too — happy to show anyone after the presentation."*

---

### 🔴 ACT 3 — Why This Is Technically Different (60 seconds)

This is where you separate yourself from every other team. Three punches:

#### Punch 1: "This is NOT a chatbot"

> *"Most AI projects at hackathons call ChatGPT and display the response. That's a chatbot.*
>
> *dr.t is an **AI Agent**. It has tools. It has a database. When you send a food photo, the agent doesn't just reply — it **autonomously decides** to log your sugar intake into a PostgreSQL database. When you ask 'how much sugar today?', it **queries the database on its own** and calculates your total.*
>
> *It doesn't just talk. It takes actions."*

#### Punch 2: "We don't use ChatGPT"

> *"We use **MedGemma 4b** — an open-source model from Google specifically designed for the medical domain. It's not a general-purpose chat model trying to play doctor. It's a model that was **trained on medical data**. That's why we trust its food analysis more than asking GPT or Claude about diabetes.*
>
> *Using a domain-specific model isn't the easy path — it's the right one."*

#### Punch 3: "It's production-grade, not a prototype"

> *"We have automated tests. TypeScript end-to-end. Row-level security on our database. Dual AI provider fallback — if Gemini goes down, Ollama picks up. Idempotent database writes safe at any message rate. This isn't a script — it's a system."*

Show the architecture (keep it on screen for 10 seconds max):

```
 ┌────────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────┐
 │  Telegram  │─────▶│  Next.js API │─────▶│  MedGemma    │─────▶│ Supabase │
 │  (User)    │◀─────│  (Webhook)   │◀─────│  AI Agent    │◀─────│ (DB)     │
 └────────────┘      └──────────────┘      └──────────────┘      └──────────┘
                                                  │
                                           Tools: recordSugar()
                                                  retrieveSugar()
```

---

### 🔴 ACT 4 — Vision & Close (30 seconds)

> *"Today, dr.t handles one thing: 'Should I eat this?'*
>
> *Tomorrow, it tracks weekly trends. It notices when your sugar intake is creeping up. It sends you a gentle nudge before dinner.*
>
> *Our vision is simple: **healthcare that doesn't require an appointment.** As easy as sending a photo to a friend.*
>
> *For the 77 million Indians living with diabetes — and the three people in my house — that's not a feature. That's freedom."*

**Stop. Don't say "thank you." Let the silence hit. Then: "We'd love to take your questions."**

---

## 🛡️ Judge Q&A — Your Killer Answers

| Question | Your Answer |
|---|---|
| **"How accurate is the sugar estimation?"** | *"MedGemma is trained on medical data, so it's significantly more reliable for nutrition analysis than general models. But we're transparent — we frame every response as guidance, not a prescription. Even a rough estimate helps someone think twice before eating a jalebi."* |
| **"Why Telegram, not WhatsApp?"** | *"WhatsApp Business API requires Meta approval and costs money. Telegram's Bot API is free, instant, and open. For speed and accessibility, Telegram was the right call. Adding WhatsApp is a one-adapter change in our architecture."* |
| **"What about privacy?"** | *"We store only Telegram ID, first name, and food logs. No photos are permanently stored. The database uses row-level security. The service-role key never touches the client."* |
| **"How is this different from MyFitnessPal?"** | *"Three ways. One: no download, no account — 60 seconds to value. Two: it's diabetes-specific, not a generic calorie counter. Three: it's AI-first — you don't manually log food, the agent does it for you."* |
| **"What if the AI gives wrong advice?"** | *"We always say 'estimated' and 'suggested.' But more importantly — right now, without dr.t, these patients have NO guidance at mealtime. A 90% right suggestion is infinitely better than eating blind."* |
| **"Why not a mobile app?"** | *"Because the people who need this most — our parents and grandparents — won't download one. They'll forget their password. They'll get stuck on the OTP screen. But they already send photos on Telegram every day. Meet users where they are."* |
| **"What's MedGemma?"** | *"It's a 4-billion parameter model from Google, open-source, specifically trained on medical literature and clinical data. It excels at health-related reasoning compared to general-purpose models like GPT or Gemini base."* |
| **"Is this just an API wrapper?"** | *"No. An API wrapper calls a model and returns text. Our system has an autonomous agent with tool-calling — it decides when to write to the database and when to read from it. It maintains state across conversations. It has fallback providers. It's an engineered system, not a script."* |

---

## 💡 Power Phrases to Weave In Naturally

Don't list these — drop them into conversation:

- *"Zero-friction healthcare"*
- *"60 seconds from stranger to user"*
- *"The AI doesn't just talk — it takes actions"*
- *"Domain-specific, not general-purpose"*
- *"Meet users where they are"*
- *"Not a chatbot — an agent"*
- *"Healthcare shouldn't require an appointment"*

---

## 🚨 Things That Will Lose You Points

| Don't Do This | Do This Instead |
|---|---|
| Open with "We used Next.js, Supabase, and Gemini..." | Open with your family's story |
| Read from your slides | Know your content — slides are for the audience |
| Say "we plan to..." more than once | Lead with what EXISTS and WORKS |
| Skip the live demo because you're nervous | The demo is 50% of your score. Rehearse 10+ times. |
| Let one person do all the talking | Split roles — story person, demo person, tech person |
| Show a complex architecture diagram for 2 minutes | Flash it for 10 seconds. Judges get it fast. |
| Say "ChatGPT" or "we used AI" generically | Say "MedGemma 4b, a domain-specific medical model" |

---

## ✅ Pre-Presentation Checklist

- [ ] Opening story **memorized** (not read from notes)
- [ ] Live demo **rehearsed 10+ times** with actual food
- [ ] **Two food props** — one healthy, one unhealthy (Indian food if possible)
- [ ] **Phone charged** to 100%, Telegram logged in, bot tested right before
- [ ] **Screen mirroring** tested with the venue's projector/TV
- [ ] **Backup demo video** saved locally on phone AND laptop
- [ ] **Mobile hotspot** ready as WiFi backup
- [ ] Slides are **minimal** — big text, big images, no paragraphs
- [ ] **Each team member** has a defined speaking role
- [ ] **Timed full run-through** completed — you finish within the limit
- [ ] **Architecture diagram** is clean, fits on one slide
- [ ] At least 2 people on the team can **answer technical questions** about the codebase

---

## 🎬 The 15-Second Booth Pitch

When a judge walks by and says *"What did you build?"*:

> **"Three people in my family have diabetes. We built an AI doctor inside Telegram — you send a photo of your food, and in 2 seconds a medical AI tells you the sugar content and whether you should eat it. It tracks everything automatically. No app download, no sign-up. Want to try it?"**

*Then hand them your phone.*
