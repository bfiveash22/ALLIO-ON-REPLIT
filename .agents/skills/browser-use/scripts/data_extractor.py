#!/usr/bin/env python3
"""Structured data extraction from web pages using browser-use with Playwright.

This script combines direct Playwright page access with browser-use Agent
for intelligent extraction. It can extract tables, lists, and structured
data and output clean JSON/CSV.

Usage:
    python data_extractor.py --url "https://example.com/table" --extract tables
    python data_extractor.py --url "https://example.com" --extract links --output results.json
    python data_extractor.py --url "https://example.com" --extract custom --query "all email addresses"
"""
import argparse
import asyncio
import csv
import io
import json
import os
import sys

from browser_use import Agent, Browser
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
from playwright.async_api import async_playwright


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


async def extract_tables(url: str):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(url, wait_until="networkidle")

        tables = await page.evaluate("""() => {
            const tables = document.querySelectorAll('table');
            return Array.from(tables).map((table, idx) => {
                const rows = Array.from(table.querySelectorAll('tr'));
                const data = rows.map(row => {
                    const cells = Array.from(row.querySelectorAll('th, td'));
                    return cells.map(cell => cell.textContent.trim());
                });
                return { table_index: idx, headers: data[0] || [], rows: data.slice(1) };
            });
        }""")

        await browser.close()
        return tables


async def extract_links(url: str):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(url, wait_until="networkidle")

        links = await page.evaluate("""() => {
            return Array.from(document.querySelectorAll('a[href]')).map(a => ({
                text: a.textContent.trim(),
                href: a.href,
            })).filter(l => l.text && l.href);
        }""")

        await browser.close()
        return links


async def extract_custom(url: str, query: str, provider: str, model: str | None):
    llm = get_llm(provider, model)
    browser = Browser(headless=True)

    agent = Agent(
        task=f"Go to {url} and extract: {query}. Return the results as a JSON array.",
        llm=llm,
        browser=browser,
    )

    try:
        result = await agent.run()
        return parse_agent_result(result)
    finally:
        await browser.close()


def main():
    parser = argparse.ArgumentParser(description="Structured data extractor")
    parser.add_argument("--url", required=True, help="URL to extract data from")
    parser.add_argument("--extract", required=True, choices=["tables", "links", "custom"], help="What to extract")
    parser.add_argument("--query", default=None, help="Custom extraction query (required for --extract custom)")
    parser.add_argument("--provider", default="anthropic", choices=["anthropic", "openai", "openrouter", "inference"])
    parser.add_argument("--model", default=None, help="Model name for custom extraction")
    parser.add_argument("--output", default=None, help="Output file path (JSON)")
    parser.add_argument("--format", default="json", choices=["json", "csv"], help="Output format")
    args = parser.parse_args()

    if args.extract == "custom" and not args.query:
        print("ERROR: --query is required when using --extract custom", file=sys.stderr)
        sys.exit(1)

    if args.extract == "tables":
        result = asyncio.run(extract_tables(args.url))
    elif args.extract == "links":
        result = asyncio.run(extract_links(args.url))
    elif args.extract == "custom":
        result = asyncio.run(extract_custom(args.url, args.query, args.provider, args.model))

    if args.format == "csv" and args.extract == "tables" and isinstance(result, list):
        output = io.StringIO()
        for table in result:
            writer = csv.writer(output)
            if table.get("headers"):
                writer.writerow(table["headers"])
            for row in table.get("rows", []):
                writer.writerow(row)
        formatted = output.getvalue()
    else:
        formatted = json.dumps(result, indent=2, ensure_ascii=False, default=str)

    if args.output:
        with open(args.output, "w") as f:
            f.write(formatted)
        print(f"Results saved to {args.output}")
    else:
        print(formatted)


if __name__ == "__main__":
    main()
