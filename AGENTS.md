<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Task Completion Requirements

- All of  `bun lint`, `bun fmt`, `bun typecheck` and `bun test` must pass before considering tasks completed. After Push you can verify the deployment by `bun logs:deployment`.

## Project Snapshot
dr.t is a Ai based smart food advisor for diabities patient(via Telegram). User sends a food picture, and our app stores users daily sugar input and also give suggestion whether user should eat it or not.The idea is ivolving. It is for a Inter-school level hackathon for 12th students.

This repository is a VERY EARLY WIP. Proposing sweeping changes that improve long-term maintainability is encouraged.
You must refer Readme.md for great start to understand this project.
## Core Priorities

1. Performance first.
2. Reliability first.
3. Keep behavior predictable under load and during failures.

If a tradeoff is required, choose correctness and robustness over short-term convenience.

## Maintainability

Long term maintainability is a core priority. If you add new functionality, first check if there are shared logic that can be extracted to a separate module. Duplicate logic across mulitple files is a code smell and should be avoided. Don't be afraid to change existing code. Don't take shortcuts by just adding local logic to solve a problem.

For every New code you add, It is must to add new unit test or update old as per need.
Keep updating the Readme.md && .env.example as you code.

## Refrences
 [Ai-Sdk](".agents\skills\ai-sdk\SKILL.md")
 [Chat-Sdk](".agents\skills\chat-sdk\SKILL.md")