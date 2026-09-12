---
id: "creative.direction"
name: "Creative direction"
department: "creative"
tool_requirements: ["knowledge","higgsfield?"]
---

# Creative direction

## Purpose
One idea per visual. Concept in one sentence. Visual metaphor tied to 'what runs underneath': roots, foundations, cross-sections, blueprints, grids, infrastructure.

## When to use
When the assigned task matches this skill name.

## Required inputs
Objective, context, and any prior agent output passed by the Orchestrator.

## Process
One idea per visual. Concept in one sentence. Visual metaphor tied to 'what runs underneath': roots, foundations, cross-sections, blueprints, grids, infrastructure.

## Output format
Compact JSON when the task contract asks for JSON; markdown otherwise.

## Quality rules
Joroots voice rules apply. No invented numbers. No banned words.

## Failure conditions
Missing inputs → return {"error":"missing inputs","needed":[...]} instead of guessing.
