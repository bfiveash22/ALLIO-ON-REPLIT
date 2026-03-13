#!/usr/bin/env python3
"""AI-powered form automation using browser-use Agent.

Usage:
    python form_filler.py --url "https://example.com/form" \
        --task "Fill out the contact form with name 'John Doe', email 'john@example.com'" \
        --provider anthropic
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


async def fill_form(url: str, task: str, provider: str, model: str | None, headless: bool = True, submit: bool = False):
    llm = get_llm(provider, model)
    browser = Browser(headless=headless)

    submit_instruction = " Then submit the form." if submit else " Do NOT submit the form yet."
    agent = Agent(
        task=f"Go to {url} and {task}.{submit_instruction} Report what fields were filled.",
        llm=llm,
        browser=browser,
    )

    try:
        result = await agent.run()
        return result
    finally:
        await browser.close()


def main():
    parser = argparse.ArgumentParser(description="AI-powered form filler using browser-use")
    parser.add_argument("--url", required=True, help="URL with the form")
    parser.add_argument("--task", required=True, help="Instructions for filling the form")
    parser.add_argument("--provider", default="anthropic", choices=["anthropic", "openai", "openrouter", "inference"])
    parser.add_argument("--model", default=None, help="Model name")
    parser.add_argument("--submit", action="store_true", help="Submit the form after filling")
    parser.add_argument("--headed", action="store_true", help="Show browser window")
    args = parser.parse_args()

    result = asyncio.run(fill_form(args.url, args.task, args.provider, args.model, headless=not args.headed, submit=args.submit))
    print(json.dumps({"result": str(result)}, indent=2, default=str))


if __name__ == "__main__":
    main()
