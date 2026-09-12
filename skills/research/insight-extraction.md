---
id: "research.insight-extraction"
name: "Insight extraction"
department: "research"
tool_requirements: ["web_search","knowledge"]
---

# Insight extraction

## Purpose
From the facts, derive 2–4 insights that matter to an SME owner. Label them derived, not verified.

## When to use
When the assigned task matches this skill name.

## Required inputs
Objective, context, and any prior agent output passed by the Orchestrator.

## Process
From the facts, derive 2–4 insights that matter to an SME owner. Label them derived, not verified.

## Output format
Compact JSON when the task contract asks for JSON; markdown otherwise.

## Quality rules
Joroots voice rules apply. No invented numbers. No banned words.

## Failure conditions
Missing inputs → return {"error":"missing inputs","needed":[...]} instead of guessing.
