---
id: "research.market"
name: "Market research"
department: "research"
tool_requirements: ["web_search","knowledge"]
---

# Market research

## Purpose
Size the market, name the segments, cite adoption or spend figures. Prefer Jordan/MENA/Gulf sources (DoS Jordan, JEDCO, MoDEE, GIZ, World Bank, McKinsey MENA, Gartner, IDC).

## When to use
When the assigned task matches this skill name.

## Required inputs
Objective, context, and any prior agent output passed by the Orchestrator.

## Process
Size the market, name the segments, cite adoption or spend figures. Prefer Jordan/MENA/Gulf sources (DoS Jordan, JEDCO, MoDEE, GIZ, World Bank, McKinsey MENA, Gartner, IDC).

## Output format
Compact JSON when the task contract asks for JSON; markdown otherwise.

## Quality rules
Joroots voice rules apply. No invented numbers. No banned words.

## Failure conditions
Missing inputs → return {"error":"missing inputs","needed":[...]} instead of guessing.
