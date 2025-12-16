---
description: Project Rules – Design System MCP Server
---

## Project Purpose

This project aims to expose one or more Design Systems through a **Model Context Protocol (MCP) server**.

The MCP server allows LLM-based tools to:

- Understand what Design System registries are available
- Know when and why to use a given registry
- Discover available UI components
- Retrieve usage documentation (Markdown)
- Retrieve implementation examples (Storybook stories)
- Provide installation and usage guidance

The Design System knowledge source is **not inferred**, it is strictly based on:

- Internal Markdown documentation
- Storybook stories as the source of truth for code usage

---

## Core Concepts

### Registry

A **registry** represents a Design System implementation.

A registry must describe:

- What the Design System is
- When it should be used
- How to install it
- What components it exposes

Think of a registry as:

> "A documented, installable, and explorable Design System package"

---

### Component

A **component** belongs to a registry.

Each component must be documented using:

1. **Markdown documentation**
   - Purpose
   - Usage guidelines
   - Do & Don't
   - Accessibility or design considerations (if available)

2. **Storybook stories**
   - Code examples
   - Props usage
   - Variants
   - Best practices

Storybook is the **authoritative source for code usage**.

---

## MCP Server Responsibilities

The MCP server must expose tools that allow:

1. Listing available registries
2. Getting registry details
   - Description
   - Intended usage
   - Installation instructions
3. Listing components of a registry
4. Retrieving component documentation (Markdown)
5. Retrieving component code examples (Storybook stories)

The MCP server **must not invent APIs or components**.
All responses must be grounded in:

- Markdown documentation
- Storybook stories

---

## Technical Stack

### Backend Framework

- **NestJS** is used to structure the server:
  - Modules
  - Controllers
  - Services
  - Dependency Injection

Documentation:
https://docs.nestjs.com/

Follow NestJS best practices:

- Thin controllers
- Business logic in services
- Clear module boundaries

---

### MCP Integration

- The server implements MCP using the official TypeScript SDK:
  https://github.com/modelcontextprotocol/typescript-sdk

Rules:

- MCP tools should be explicit and deterministic
- Tool names must clearly describe their purpose
- Tool inputs and outputs must be strongly typed
- Avoid ambiguous or inferred data

---

## Reasoning Rules for Continue

When working in this repository, Continue should:

1. **Never guess Design System behavior**
   - If documentation or stories are missing, say so

2. **Prefer documentation over assumptions**
   - Markdown > comments
   - Storybook > inferred code patterns

3. **Respect the separation of concerns**
   - Registry ≠ Component
   - Documentation ≠ Code examples

4. **Optimize for LLM consumption**
   - Clear, structured outputs
   - Concise but explicit descriptions
   - Avoid unnecessary verbosity

---

## File System Expectations

Common patterns you may encounter:

- `/registries/*`
  - Registry definitions
  - Metadata (name, description, install instructions)

- `/mcp/**`
  - MCP server logic
  - Tool definitions

---

## What Success Looks Like

A successful implementation allows an LLM to answer questions like:

- "Which Design System should I use?"
- "How do I install this Design System?"
- "What components are available?"
- "How do I use this component in code?"
- "Show me examples from Storybook"

All answers must be traceable to:

- Markdown documentation
- Storybook stories

---

## Out of Scope

- Design decisions not documented
- UI generation
- Modifying Storybook or documentation content
- Inferring best practices not explicitly stated
