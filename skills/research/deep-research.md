---
id: "research.deep-research"
name: "Deep research"
department: "research"
tool_requirements: ["web_search","knowledge"]
---

# Deep research

## Purpose
Run 2–4 targeted searches. Read for numbers, dates, named organisations. Cross-check any figure that will be quoted.

## When to use
When the assigned task matches this skill name.

## Required inputs
Objective, context, and any prior agent output passed by the Orchestrator.

## Process
Run 2–4 targeted searches. Read for numbers, dates, named organisations. Cross-check any figure that will be quoted.

## Output format
Compact JSON when the task contract asks for JSON; markdown otherwise.

## Quality rules
Joroots voice rules apply. No invented numbers. No banned words.

## Failure conditions
Missing inputs → return {"error":"missing inputs","needed":[...]} instead of guessing.
