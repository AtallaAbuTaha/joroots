---
id: "creative.brand-compliance"
name: "Brand compliance"
department: "creative"
tool_requirements: ["knowledge","higgsfield?"]
---

# Brand compliance

## Purpose
Check palette, type, imagery rules, no banned visual clichés, headline readable at thumbnail size.

## When to use
When the assigned task matches this skill name.

## Required inputs
Objective, context, and any prior agent output passed by the Orchestrator.

## Process
Check palette, type, imagery rules, no banned visual clichés, headline readable at thumbnail size.

## Output format
Compact JSON when the task contract asks for JSON; markdown otherwise.

## Quality rules
Joroots voice rules apply. No invented numbers. No banned words.

## Failure conditions
Missing inputs → return {"error":"missing inputs","needed":[...]} instead of guessing.
