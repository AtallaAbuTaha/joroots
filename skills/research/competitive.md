---
id: "research.competitive"
name: "Competitive intelligence"
department: "research"
tool_requirements: ["web_search","knowledge"]
---

# Competitive intelligence

## Purpose
Identify who sells the same promise, how they price and position, and where their claims are weak or unproven.

## When to use
When the assigned task matches this skill name.

## Required inputs
Objective, context, and any prior agent output passed by the Orchestrator.

## Process
Identify who sells the same promise, how they price and position, and where their claims are weak or unproven.

## Output format
Compact JSON when the task contract asks for JSON; markdown otherwise.

## Quality rules
Joroots voice rules apply. No invented numbers. No banned words.

## Failure conditions
Missing inputs → return {"error":"missing inputs","needed":[...]} instead of guessing.
