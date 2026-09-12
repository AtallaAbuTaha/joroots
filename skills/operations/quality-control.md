---
id: "ops.quality-control"
name: "Quality control"
department: "operations"
tool_requirements: ["knowledge"]
---

# Quality control

## Purpose
Check: banned words; every number has a source (knowledge layer or research); no invented client results; machine-plain tone; CTA is concrete; format matches the request. List issues precisely.

## When to use
When the assigned task matches this skill name.

## Required inputs
Objective, context, and any prior agent output passed by the Orchestrator.

## Process
Check: banned words; every number has a source (knowledge layer or research); no invented client results; machine-plain tone; CTA is concrete; format matches the request. List issues precisely.

## Output format
Compact JSON when the task contract asks for JSON; markdown otherwise.

## Quality rules
Joroots voice rules apply. No invented numbers. No banned words.

## Failure conditions
Missing inputs → return {"error":"missing inputs","needed":[...]} instead of guessing.
