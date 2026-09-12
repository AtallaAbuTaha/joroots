---
id: "ops.project-memory"
name: "Project memory"
department: "operations"
tool_requirements: ["knowledge"]
---

# Project memory

## Purpose
Before planning, scan the project library summaries for related work. Reuse verified research and approved angles. Note what was already published to avoid repeating it.

## When to use
When the assigned task matches this skill name.

## Required inputs
Objective, context, and any prior agent output passed by the Orchestrator.

## Process
Before planning, scan the project library summaries for related work. Reuse verified research and approved angles. Note what was already published to avoid repeating it.

## Output format
Compact JSON when the task contract asks for JSON; markdown otherwise.

## Quality rules
Joroots voice rules apply. No invented numbers. No banned words.

## Failure conditions
Missing inputs → return {"error":"missing inputs","needed":[...]} instead of guessing.
