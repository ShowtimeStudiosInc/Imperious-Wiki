"""Post the wiki's update log to Discord after a deploy.

Reads the push event, keeps only lines in the update log format
("<Content> was updated at [<Place>](<link>)"), and sends them to the
Discord webhook in DISCORD_WEBHOOK_URL. Does nothing if the secret is
missing or no line matches.
"""
import json
import os
import re
import sys
import urllib.request

LINE = re.compile(r"^.+ (?:was|were) updated at \[[^\]]+\]\(https?://[^)\s]+\)\s*$")

url = os.environ.get("DISCORD_WEBHOOK_URL", "").strip()
if not url:
    print("No DISCORD_WEBHOOK_URL secret set, skipping.")
    sys.exit(0)

with open(os.environ["GITHUB_EVENT_PATH"], encoding="utf-8") as f:
    event = json.load(f)

lines = []
for commit in event.get("commits", []):
    for raw in commit.get("message", "").splitlines():
        text = raw.strip().lstrip("-* ").strip()
        if LINE.match(text) and text not in lines:
            lines.append(text)

if not lines:
    print("No update log lines in this push.")
    sys.exit(0)

# Discord caps a message at 2000 characters, so send in chunks.
chunks, current = [], ""
for text in ("- " + l for l in lines):
    if current and len(current) + len(text) + 1 > 1900:
        chunks.append(current)
        current = ""
    current = f"{current}\n{text}" if current else text
chunks.append(current)

for i, body in enumerate(chunks):
    content = ("**Wiki updated**\n" if i == 0 else "") + body
    payload = json.dumps({
        "username": "Imperious Wiki",
        "content": content,
        "allowed_mentions": {"parse": []},
        "flags": 4,  # no link preview cards
    }).encode()
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json", "User-Agent": "imperious-wiki"})
    urllib.request.urlopen(req).read()
print(f"Posted {len(lines)} update line(s).")
