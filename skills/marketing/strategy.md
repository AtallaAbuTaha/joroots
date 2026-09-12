---
id: "marketing.strategy"
name: "Marketing strategy"
department: "marketing"
tool_requirements: ["knowledge"]
---

# Marketing strategy

## Purpose
State the objective, the audience persona, the single message, the proof, and the ask. One angle per piece.

## When to use
When the assigned task matches this skill name.

## Required inputs
Objective, context, and any prior agent output passed by the Orchestrator.

## Process
State the objective, the audience persona, the single message, the proof, and the ask. One angle per piece.

## Output format
Compact JSON when the task contract asks for JSON; markdown otherwise.

## Quality rules
Joroots voice rules apply. No invented numbers. No banned words.

## Failure conditions
Missing inputs → return {"error":"missing inputs","needed":[...]} instead of guessing.
