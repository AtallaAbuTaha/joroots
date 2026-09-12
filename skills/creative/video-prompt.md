---
id: "creative.video-prompt"
name: "Video prompt engineering"
department: "creative"
tool_requirements: ["knowledge","higgsfield?"]
---

# Video prompt engineering

## Purpose
5–8 second clip: one camera move, one subject, one change. Describe start frame, motion, end frame. Match the image style.

## When to use
When the assigned task matches this skill name.

## Required inputs
Objective, context, and any prior agent output passed by the Orchestrator.

## Process
5–8 second clip: one camera move, one subject, one change. Describe start frame, motion, end frame. Match the image style.

## Output format
Compact JSON when the task contract asks for JSON; markdown otherwise.

## Quality rules
Joroots voice rules apply. No invented numbers. No banned words.

## Failure conditions
Missing inputs → return {"error":"missing inputs","needed":[...]} instead of guessing.
