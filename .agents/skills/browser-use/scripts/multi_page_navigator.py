#!/usr/bin/env python3
"""Multi-page navigation and data collection using browser-use Agent.

Usage:
    python multi_page_navigator.py \
        --start-url "https://news.ycombinator.com" \
        --task "Visit the top 3 stories, extract title and first paragraph from each" \
        --provider anthropic

    python multi_page_navigator.py \
        --start-url "https://example.com/products" \
        --task "Navigate through the first 3 pages of products and collect all product names" \
        --provider openai --model gpt-4o
"""
import argparse
import asyncio
import json
import os

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


async def navigate_and_collect(start_url: str, task: str, provider: str, model: str | None, headless: bool = True, max_steps: int = 50):
    llm = get_llm(provider, model)
    browser = Browser(headless=headless)

    agent = Agent(
        task=f"Starting from {start_url}, {task}. Collect all data into a structured JSON format. Navigate between pages as needed.",
        llm=llm,
        browser=browser,
        max_actions_per_step=5,
    )

    try:
        result = await agent.run(max_steps=max_steps)
        return result
    finally:
        await browser.close()


def main():
    parser = argparse.ArgumentParser(description="Multi-page navigator using browser-use")
    parser.add_argument("--start-url", required=True, help="Starting URL")
    parser.add_argument("--task", required=True, help="Navigation and collection task")
    parser.add_argument("--provider", default="anthropic", choices=["anthropic", "openai", "openrouter", "inference"])
    parser.add_argument("--model", default=None, help="Model name")
    parser.add_argument("--max-steps", type=int, default=50, help="Maximum agent steps")
    parser.add_argument("--headed", action="store_true", help="Show browser window")
    args = parser.parse_args()

    result = asyncio.run(navigate_and_collect(
        args.start_url, args.task, args.provider, args.model,
        headless=not args.headed, max_steps=args.max_steps
    ))
    print(json.dumps({"result": str(result)}, indent=2, default=str))


if __name__ == "__main__":
    main()
