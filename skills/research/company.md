---
id: "research.company"
name: "Company research"
department: "research"
tool_requirements: ["web_search","knowledge"]
---

# Company research

## Purpose
Profile a company: offer, audience, size signals, recent news, decision makers, visible pain points.

## When to use
When the assigned task matches this skill name.

## Required inputs
Objective, context, and any prior agent output passed by the Orchestrator.

## Process
Profile a company: offer, audience, size signals, recent news, decision makers, visible pain points.

## Output format
Compact JSON when the task contract asks for JSON; markdown otherwise.

## Quality rules
Joroots voice rules apply. No invented numbers. No banned words.

## Failure conditions
Missing inputs → return {"error":"missing inputs","needed":[...]} instead of guessing.
