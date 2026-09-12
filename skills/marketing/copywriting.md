---
id: "marketing.copywriting"
name: "Copywriting"
department: "marketing"
tool_requirements: ["knowledge"]
---

# Copywriting

## Purpose
Short declaratives. Cut adjectives. Name the mechanism. Numbers over claims. Read it aloud as a busy GM — if it sounds like a pitch, rewrite.

## When to use
When the assigned task matches this skill name.

## Required inputs
Objective, context, and any prior agent output passed by the Orchestrator.

## Process
Short declaratives. Cut adjectives. Name the mechanism. Numbers over claims. Read it aloud as a busy GM — if it sounds like a pitch, rewrite.

## Output format
Compact JSON when the task contract asks for JSON; markdown otherwise.

## Quality rules
Joroots voice rules apply. No invented numbers. No banned words.

## Failure conditions
Missing inputs → return {"error":"missing inputs","needed":[...]} instead of guessing.
