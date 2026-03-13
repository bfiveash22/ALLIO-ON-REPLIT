#!/usr/bin/env python3
"""AI-powered web scraping using browser-use Agent with configurable LLM backends.

Usage:
    python ai_scraper.py --url "https://example.com" --task "Extract all product names and prices"
    python ai_scraper.py --url "https://example.com" --task "Get headlines" --provider openai
    python ai_scraper.py --url "https://example.com" --task "Summarize page" --provider anthropic --model claude-sonnet-4-6
"""
import argparse
import asyncio
import json
import os
import sys

from browser_use import Agent, Browser
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI


def get_llm(provider: str, model: str | None = None):
    if provider == "anthropic":
        return ChatAnthropic(
            model_name=model or "claude-sonnet-4-6",
            api_key=os.environ.get("AI_INTEGRATIONS_ANTHROPIC_API_KEY", os.environ.get("ANTHROPIC_API_KEY", "")),
            base_url=os.environ.get("AI_INTEGRATIONS_ANTHROPIC_BASE_URL"),
        )
    elif provider == "openai":
        return ChatOpenAI(
            model=model or "gpt-4o",
            api_key=os.environ.get("AI_INTEGRATIONS_OPENAI_API_KEY", os.environ.get("OPENAI_API_KEY", "")),
            base_url=os.environ.get("AI_INTEGRATIONS_OPENAI_BASE_URL"),
        )
    elif provider == "openrouter":
        return ChatOpenAI(
            model=model or "anthropic/claude-sonnet-4-6",
            api_key=os.environ.get("AI_INTEGRATIONS_OPENROUTER_API_KEY", os.environ.get("OPENROUTER_API_KEY", "")),
            base_url=os.environ.get("AI_INTEGRATIONS_OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
        )
    elif provider == "inference":
        return ChatOpenAI(
            model=model or "anthropic/claude-sonnet-4-6",
            api_key=os.environ.get("INFERENCE_API_KEY", ""),
            base_url="https://api.inference.sh/v1",
        )
    else:
        raise ValueError(f"Unknown provider: {provider}")


def parse_agent_result(result):
    text = str(result)
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        pass
    for start_char, end_char in [("{", "}"), ("[", "]")]:
        start = text.find(start_char)
        end = text.rfind(end_char)
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start : end + 1])
            except json.JSONDecodeError:
                continue
    return {"raw_output": text}


async def scrape(url: str, task: str, provider: str, model: str | None, headless: bool = True):
    llm = get_llm(provider, model)
    browser = Browser(headless=headless)

    agent = Agent(
        task=f"Go to {url} and {task}. Return the extracted data as structured JSON.",
        llm=llm,
        browser=browser,
    )

    try:
        result = await agent.run()
        return parse_agent_result(result)
    finally:
        await browser.close()


def main():
    parser = argparse.ArgumentParser(description="AI-powered web scraper using browser-use")
    parser.add_argument("--url", required=True, help="URL to scrape")
    parser.add_argument("--task", required=True, help="What to extract from the page")
    parser.add_argument("--provider", default="anthropic", choices=["anthropic", "openai", "openrouter", "inference"])
    parser.add_argument("--model", default=None, help="Model name (uses provider default if not specified)")
    parser.add_argument("--headed", action="store_true", help="Show browser window")
    args = parser.parse_args()

    result = asyncio.run(scrape(args.url, args.task, args.provider, args.model, headless=not args.headed))
    print(json.dumps(result, indent=2, ensure_ascii=False, default=str))


if __name__ == "__main__":
    main()
