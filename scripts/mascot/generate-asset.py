#!/usr/bin/env python3
"""
Generates one image via the Gemini API (gemini-2.5-flash-image), then
optionally keys out its flat chroma background into real alpha
transparency via key_and_crop. Reads GEMINI_API_KEY from the environment
(.env.local) — never hardcode the key here.

Usage:
  generate-asset.py <prompt-file> <output.png> [--no-key] [--padding N]
"""

import base64
import json
import os
import sys
import urllib.request

sys.path.insert(0, os.path.dirname(__file__))
from key_and_crop import key_and_crop  # noqa: E402


def load_api_key():
    key = os.environ.get("GEMINI_API_KEY")
    if key:
        return key
    env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env.local")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith("GEMINI_API_KEY="):
                    return line.strip().split("=", 1)[1]
    raise RuntimeError("GEMINI_API_KEY not found in env or .env.local")


def generate(prompt: str, api_key: str) -> bytes:
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.5-flash-image:generateContent?key={api_key}"
    )
    payload = json.dumps({"contents": [{"parts": [{"text": prompt}]}]}).encode()
    req = urllib.request.Request(
        url, data=payload, headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())

    if "error" in data:
        raise RuntimeError(f"Gemini API error: {data['error']}")

    candidate = data["candidates"][0]
    for part in candidate["content"]["parts"]:
        if "inlineData" in part:
            return base64.b64decode(part["inlineData"]["data"])
    raise RuntimeError(f"no image part in response; finishReason={candidate.get('finishReason')}")


def main():
    args = sys.argv[1:]
    do_key = "--no-key" not in args
    args = [a for a in args if a != "--no-key"]
    padding = 12
    if "--padding" in args:
        i = args.index("--padding")
        padding = int(args[i + 1])
        args = args[:i] + args[i + 2:]

    if len(args) < 2:
        print("usage: generate-asset.py <prompt-file> <output.png> [--no-key] [--padding N]")
        sys.exit(1)

    prompt_file, output_path = args[0], args[1]
    with open(prompt_file) as f:
        prompt = f.read()

    api_key = load_api_key()
    print(f"requesting generation for {output_path} ...")
    raw = generate(prompt, api_key)

    raw_path = output_path + ".raw.png"
    with open(raw_path, "wb") as f:
        f.write(raw)
    print(f"raw saved: {raw_path} ({len(raw)} bytes)")

    if do_key:
        key_and_crop(raw_path, output_path, padding)
    else:
        os.replace(raw_path, output_path)
        print(f"saved (no keying): {output_path}")


if __name__ == "__main__":
    main()
