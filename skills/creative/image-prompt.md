---
id: "creative.image-prompt"
name: "Image prompt engineering"
department: "creative"
tool_requirements: ["knowledge","higgsfield?"]
---

# Image prompt engineering

## Purpose
Prompt structure: [subject] in [setting], [materials/texture], [light], [lens/angle], [composition with negative space for headline], [style: editorial documentary photography or graphic diagram], [palette cues]. Add negative cues: no text, no logos, no people faces, no robots, no glowing effects.

## When to use
When the assigned task matches this skill name.

## Required inputs
Objective, context, and any prior agent output passed by the Orchestrator.

## Process
Prompt structure: [subject] in [setting], [materials/texture], [light], [lens/angle], [composition with negative space for headline], [style: editorial documentary photography or graphic diagram], [palette cues]. Add negative cues: no text, no logos, no people faces, no robots, no glowing effects.

## Output format
Compact JSON when the task contract asks for JSON; markdown otherwise.

## Quality rules
Joroots voice rules apply. No invented numbers. No banned words.

## Failure conditions
Missing inputs → return {"error":"missing inputs","needed":[...]} instead of guessing.
