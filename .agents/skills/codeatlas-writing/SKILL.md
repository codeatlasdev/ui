---
name: codeatlas-writing
description: Use when writing UI text, error messages, documentation, comments, tooltips, or any user-facing copy.
alwaysApply: false
---

# Writing for humans

Text that reads like a developer wrote it. Not a language model.

## Smell test

Read it out loud. Does it sound like something you'd say in a Slack message or code review? Good. Does it sound like a product landing page? Rewrite it.

## What to do

1. Start in the middle. No throat-clearing. First sentence is the first point.
2. One idea per sentence. Break long compound sentences into two.
3. Vary sentence length. Short ones land harder. Longer ones carry more nuance when you need it.
4. Say what something is, not what it "enables" or "allows users to."
5. Name sources or delete vague attributions ("experts say," "studies show").
6. Stop when you're done. No signposted endings.

## What not to do

### Em dashes

Ban them. Entirely.

Every em dash in this list is an AI tell with a cleaner alternative:

| AI em dash use | Fix |
|---|---|
| `X — Y` appositive aside | Use commas: `X, Y,` |
| `X — Y` pivot/contrast | Two sentences: `X. Y.` |
| `X — no Y, no Z` trailing list | Period then cut the list, or one word: `X. No Y.` |
| `Heading — description` label | Colon: `Heading: description` |
| `X — it's actually Y` reveal | Direct sentence: `X is Y.` |

GPT-4o writes one em dash per 47 words. Human writers average one per 215 words. If you wrote an em dash, there's almost always a better option.

**Exception:** `**Term** — definition` in structured reference tables or definition lists is conventional technical documentation. That stays. The rule targets prose, not tables.

### Banned words

Words that are empirically overrepresented in AI output (measured, not guessed):

```
delve (25x over), meticulous (35x over), showcasing (9x over), underscores (9x over),
tapestry, landscape (metaphorical), realm, leverage (verb), utilize,
robust (non-technical), streamline, harness, pivotal, seamless,
groundbreaking, transformative, comprehensive, multifaceted, nuanced,
bolster, foster, resonate, embark, embrace, elevate, enhance,
unleash, empower, spearhead, encapsulate, illuminate, navigate (metaphorical),
innovative, cutting-edge, unprecedented, dynamic, holistic,
paradigm, synergy, ecosystem (non-biological), catalyst, cornerstone,
bedrock, testament, beacon, journey (metaphorical), symphony, mosaic, nexus,
furthermore, moreover, additionally, notably, crucially, undeniably,
inherently, ultimately, essentially, fundamentally (as filler),
remarkably, serves as, stands as, rather than (4.3x over), ensuring (4.3x over),
plays a role in, plays a crucial role in
```

### Formatting tells

| Pattern | Problem | Fix |
|---|---|---|
| **BoldKeyword:** description | Single top AI formatting tell | Plain text or `### Header` |
| Every bullet starts bold | Uniform = AI | Mix structure |
| `It's not X. It's Y.` binary | Top structural tell | Direct statement |
| `X — no Y, no Z` trailing list | Tricolon padding | One word or cut |
| `Let's dive in`, `Let's unpack` | Chatbot residue | Cut, start the content |
| `In conclusion,` / `To summarize,` | AI always announces endings | Just stop |
| `Great question!`, `Absolutely!` | Sycophant opener | Delete entirely |
| `In today's fast-paced world` | Generic opener | Start with your point |
| Three-item parallel lists everywhere | Rule-of-three padding | One item if one idea |

---

## UI text

### Error messages

Say what happened and what to do.

```
bad:  Something went wrong.
good: Could not save changes. Check your connection and try again.

bad:  Invalid input.
good: Email address is required.
```

### Empty states

Say why it's empty and how to fill it.

```
bad:  No data found.
good: No users yet. Invite your first team member to get started.
```

### Button labels

Verb + noun. No ambiguity.

```
bad:  Submit / OK / Yes
good: Save changes / Delete project / Confirm cancellation
```

### Tooltips

One short label or sentence. No period if it's a label.

```
bad:  This button allows you to export all data in CSV format.
good: Export as CSV
```

### Loading states

Present tense, lowercase after the first word.

```
bad:  Loading... / Please wait while we process your request.
good: Loading users... / Saving...
```

---

## Code comments

Comment the why, not the what.

```ts
// bad: just describes the code
// Loop through users and set active to false
users.forEach(u => u.active = false);

// good: explains the decision
// Deactivate all before reassigning: avoids a window where a user
// temporarily holds both old and new permissions.
users.forEach(u => u.active = false);
```

Skip comments on self-explanatory code.

```ts
// bad
const count = users.length; // Get the number of users

// good
const count = users.length;
```
