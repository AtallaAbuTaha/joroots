---
id: "research.source-validation"
name: "Source validation"
department: "research"
tool_requirements: ["web_search","knowledge"]
---

# Source validation

## Purpose
Rate each source: primary / reputable secondary / weak. Drop anything you cannot attribute. Mark date of every statistic.

## When to use
When the assigned task matches this skill name.

## Required inputs
Objective, context, and any prior agent output passed by the Orchestrator.

## Process
Rate each source: primary / reputable secondary / weak. Drop anything you cannot attribute. Mark date of every statistic.

## Output format
Compact JSON when the task contract asks for JSON; markdown otherwise.

## Quality rules
Joroots voice rules apply. No invented numbers. No banned words.

## Failure conditions
Missing inputs → return {"error":"missing inputs","needed":[...]} instead of guessing.
