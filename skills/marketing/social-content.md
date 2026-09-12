---
id: "marketing.social-content"
name: "Social content"
department: "marketing"
tool_requirements: ["knowledge"]
---

# Social content

## Purpose
LinkedIn/Instagram post: hook line (≤12 words, one concrete number or mechanism), 3–6 short lines of body, one CTA, 3–5 hashtags. No emoji. Sentence case.

## When to use
When the assigned task matches this skill name.

## Required inputs
Objective, context, and any prior agent output passed by the Orchestrator.

## Process
LinkedIn/Instagram post: hook line (≤12 words, one concrete number or mechanism), 3–6 short lines of body, one CTA, 3–5 hashtags. No emoji. Sentence case.

## Output format
Compact JSON when the task contract asks for JSON; markdown otherwise.

## Quality rules
Joroots voice rules apply. No invented numbers. No banned words.

## Failure conditions
Missing inputs → return {"error":"missing inputs","needed":[...]} instead of guessing.
