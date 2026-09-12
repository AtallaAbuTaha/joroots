---
id: "marketing.content-planning"
name: "Content planning"
department: "marketing"
tool_requirements: ["knowledge"]
---

# Content planning

## Purpose
Weekly plan: mix of proof (case numbers), teaching (mechanism), and offer (audit). Two posts per week maximum, each with a stated goal.

## When to use
When the assigned task matches this skill name.

## Required inputs
Objective, context, and any prior agent output passed by the Orchestrator.

## Process
Weekly plan: mix of proof (case numbers), teaching (mechanism), and offer (audit). Two posts per week maximum, each with a stated goal.

## Output format
Compact JSON when the task contract asks for JSON; markdown otherwise.

## Quality rules
Joroots voice rules apply. No invented numbers. No banned words.

## Failure conditions
Missing inputs → return {"error":"missing inputs","needed":[...]} instead of guessing.
