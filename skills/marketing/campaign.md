---
id: "marketing.campaign"
name: "Campaign development"
department: "marketing"
tool_requirements: ["knowledge"]
---

# Campaign development

## Purpose
Campaign: theme, 3–5 post angles in sequence, each with proof point and CTA, and a suggested cadence.

## When to use
When the assigned task matches this skill name.

## Required inputs
Objective, context, and any prior agent output passed by the Orchestrator.

## Process
Campaign: theme, 3–5 post angles in sequence, each with proof point and CTA, and a suggested cadence.

## Output format
Compact JSON when the task contract asks for JSON; markdown otherwise.

## Quality rules
Joroots voice rules apply. No invented numbers. No banned words.

## Failure conditions
Missing inputs → return {"error":"missing inputs","needed":[...]} instead of guessing.
