---
name: gemini-cli
description: "Google Gemini CLI (v0.34.0) and Gemini API tools for all agents. Provides deep analysis, research synthesis, code review, content summarization, and format transformation via Gemini 2.5 Flash. Available as both SDK-based tools in the agent executor and the globally installed gemini CLI binary. Use when agents need Gemini AI capabilities, deep reasoning, large context analysis, or multimodal processing."
---

# Google Gemini CLI & API Integration

## Installation Status
- **CLI Version**: 0.34.0 (installed globally via `npm install -g @google/gemini-cli@latest`)
- **CLI Path**: `/home/runner/workspace/.config/npm/node_global/bin/gemini`
- **SDK**: `@google/genai` (integrated in `gemini-provider.ts`)
- **Model**: Gemini 2.5 Flash (default)
- **API Key**: `GOOGLE_GEMINI_API_KEY` environment variable

## Available Gemini Agent Tools

All agents in the Allio Network have access to these Gemini-powered tools via the agent executor:

### 1. `gemini_deep_analysis`
Deep reasoning and analysis using Gemini's large context window.
- **Parameters**: `prompt` (required), `context` (optional)
- **Use for**: Complex reasoning, scientific analysis, multimodal processing

### 2. `gemini_summarize`
Summarize text content in multiple formats.
- **Parameters**: `text` (required), `style` (optional: 'brief', 'detailed', 'bullet-points')
- **Use for**: Document summaries, research abstracts, meeting notes

### 3. `gemini_research`
Deep research synthesis on any topic.
- **Parameters**: `topic` (required), `depth` (optional: 'overview', 'comprehensive')
- **Use for**: Scientific research, medical topics, healthcare analysis

### 4. `gemini_code_review`
Code review with bug detection and improvement suggestions.
- **Parameters**: `code` (required), `language` (optional, default: 'typescript')
- **Use for**: Code quality, security audits, performance optimization

### 5. `gemini_transform`
Transform content between formats.
- **Parameters**: `content` (required), `target_format` (required)
- **Use for**: Format conversion, document restructuring, data transformation

## Available NotebookLM Agent Tools

Source-grounded analysis tools powered by Gemini, replicating Google NotebookLM capabilities. These tools automatically gather sources from the FFPMA knowledge base, Google Drive, and research APIs.

### 6. `notebook_source_query`
Ask a question grounded in FFPMA sources. Returns source-cited answers.
- **Parameters**: `question` (required), `topic` (optional), `source_types` (optional: ['knowledge', 'drive', 'research'])
- **Use for**: Evidence-based Q&A, fact verification, source-grounded answers

### 7. `notebook_study_guide`
Generate comprehensive study guides with key concepts, facts, clinical applications, and review questions.
- **Parameters**: `topic` (required), `source_types` (optional)
- **Use for**: Training content, educational materials, exam preparation

### 8. `notebook_briefing_doc`
Create professional briefing documents with executive summary, findings, analysis, and recommendations.
- **Parameters**: `topic` (required), `audience` (optional, default: 'Trustee'), `source_types` (optional)
- **Use for**: Executive briefings, decision support, stakeholder reports

### 9. `notebook_multi_doc_synthesis`
Synthesize multiple documents to find patterns, connections, and contradictions.
- **Parameters**: `documents` (required: string array), `synthesis_goal` (required)
- **Use for**: Cross-document analysis, literature reviews, comparative analysis

### 10. `notebook_audio_script`
Generate podcast-style audio overview scripts grounded in FFPMA sources.
- **Parameters**: `topic` (required), `duration` (optional: 'short'|'medium'|'long'), `source_types` (optional)
- **Use for**: Audio content creation, podcast scripts, educational audio overviews

## Architecture

```
gemini-provider.ts
├── analyzeWithGemini()        — Core analysis function
├── geminiDeepAnalysis()       — Advanced analysis with model/token options
├── geminiSummarize()          — Text summarization
├── geminiResearch()           — Topic research synthesis
├── geminiCodeReview()         — Code review and analysis
├── geminiTransform()          — Content format transformation
├── handleGeminiToolCall()     — Tool call dispatcher for agent executor
├── GEMINI_TOOLS_DEFINITIONS   — OpenAI-format tool definitions
├── isGeminiAvailable()        — Check if Gemini is configured
├── getGeminiCliPath()         — Get CLI binary path
└── getGeminiCliVersion()      — Get CLI version

notebooklm-provider.ts
├── notebookSourceQuery()      — Source-grounded Q&A
├── notebookStudyGuide()       — Study guide generation
├── notebookBriefingDoc()      — Briefing document creation
├── notebookMultiDocSynthesis()— Multi-document synthesis
├── notebookAudioScript()      — Audio overview script generation
├── handleNotebookLMToolCall() — Tool call dispatcher
├── NOTEBOOKLM_TOOLS_DEFINITIONS — OpenAI-format tool definitions
├── isNotebookLMAvailable()    — Check if NotebookLM is configured
└── gatherSources()            — Automatic multi-source gathering
```

## Source Gathering

NotebookLM tools automatically gather sources from three systems:
1. **Knowledge Base** — Internal FFPMA knowledge base files, compound data, training content
2. **Google Drive** — Documents in the ALLIO Drive structure
3. **Research APIs** — PubMed, OpenAlex, Semantic Scholar academic papers

Agents can specify which source types to use via the `source_types` parameter.

## Division Access

All divisions have access to both Gemini and NotebookLM tools:
- **Executive**: Strategic analysis, briefing docs, multi-doc synthesis
- **Engineering**: Code review, architecture analysis, technical research
- **Science**: Research synthesis, literature analysis, study guides
- **Legal**: Document analysis, compliance review, source-grounded Q&A
- **Marketing**: Content transformation, creative analysis, audio scripts
- **Financial**: Data analysis, report generation, briefing documents
- **Support**: Knowledge synthesis, response generation, study guides

## Files
- `artifacts/api-server/src/services/gemini-provider.ts` — Core Gemini service
- `artifacts/api-server/src/services/notebooklm-provider.ts` — NotebookLM service
- `artifacts/api-server/src/services/agent-executor.ts` — Agent tool integration
- `artifacts/api-server/src/services/ai-fallback.ts` — Fallback chain (includes Gemini)
