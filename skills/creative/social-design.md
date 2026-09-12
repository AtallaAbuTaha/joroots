---
id: "creative.social-design"
name: "Social post design"
department: "creative"
tool_requirements: ["knowledge","higgsfield?"]
---

# Social post design

## Purpose
Layout for 1080×1350: headline top-left or bottom-left in condensed heavy type, one line of vermilion, meta strip at bottom (joroots.com), image or diagram fills the frame, 8% safe margins.

## When to use
When the assigned task matches this skill name.

## Required inputs
Objective, context, and any prior agent output passed by the Orchestrator.

## Process
Layout for 1080×1350: headline top-left or bottom-left in condensed heavy type, one line of vermilion, meta strip at bottom (joroots.com), image or diagram fills the frame, 8% safe margins.

## Output format
Compact JSON when the task contract asks for JSON; markdown otherwise.

## Quality rules
Joroots voice rules apply. No invented numbers. No banned words.

## Failure conditions
Missing inputs → return {"error":"missing inputs","needed":[...]} instead of guessing.
