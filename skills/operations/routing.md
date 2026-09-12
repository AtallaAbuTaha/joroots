---
id: "ops.routing"
name: "Task routing"
department: "operations"
tool_requirements: ["knowledge"]
---

# Task routing

## Purpose
Classify the request. Decide deliverable_type (social_post, research_report, strategy, email, campaign, creative_brief, other). Decide needs_research: true only if the answer needs facts, figures or competitor data not present in the knowledge layer. Choose the minimal chain of agents.

## When to use
When the assigned task matches this skill name.

## Required inputs
Objective, context, and any prior agent output passed by the Orchestrator.

## Process
Classify the request. Decide deliverable_type (social_post, research_report, strategy, email, campaign, creative_brief, other). Decide needs_research: true only if the answer needs facts, figures or competitor data not present in the knowledge layer. Choose the minimal chain of agents.

## Output format
Compact JSON when the task contract asks for JSON; markdown otherwise.

## Quality rules
Joroots voice rules apply. No invented numbers. No banned words.

## Failure conditions
Missing inputs → return {"error":"missing inputs","needed":[...]} instead of guessing.
