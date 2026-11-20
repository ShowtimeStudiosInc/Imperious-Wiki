"""Post the wiki's update log to Discord after a deploy.

Reads the push event, keeps only lines in the update log format
("<Content> was updated at [<Place>](<link>)"), and sends them to the
Discord webhook in DISCORD_WEBHOOK_URL. Lines that link anywhere other than
the live site (like the repo) are skipped. Does nothing if the secret is
missing or no line matches.
"""
import json
import os
import re
import sys
import urllib.request

LINE = re.compile(r"^.+ (?:was|were) (?:updated|added) at \[[^\]]+\]\((https?://[^)\s]+)\)\s*$")

url = os.environ.get("DISCORD_WEBHOOK_URL", "").strip()
if not url:
    print("No DISCORD_WEBHOOK_URL secret set, skipping.")
    sys.exit(0)

owner, _, name = os.environ.get("GITHUB_REPOSITORY", "ShowtimeStudiosInc/Imperious-Wiki").partition("/")
SITE = f"https://{owner.lower()}.github.io/{name}/".lower()

TEST = os.environ.get("DISCORD_TEST") == "1"
STYLE = (os.environ.get("DISCORD_STYLE") or "embed").strip().lower()

def log_lines(messages):
    found = []
    for message in messages:
        for raw in message.splitlines():
            text = raw.strip().lstrip("-* ").strip()
            m = LINE.match(text)
            # Only lines that point at a page on the live site get posted.
            if m and m.group(1).lower().startswith(SITE) and text not in found:
                found.append(text)
    return found

if TEST:
    # Test run: take the newest few update lines from the git history.
    import subprocess
    log = subprocess.run(["git", "log", "-n", "40", "--format=%B%x00"], capture_output=True, text=True).stdout
    lines = log_lines(log.split("\x00"))[:3]
else:
    with open(os.environ["GITHUB_EVENT_PATH"], encoding="utf-8") as f:
        event = json.load(f)
    lines = log_lines(c.get("message", "") for c in event.get("commits", []))

if not lines:
    print("No update log lines in this push.")
    sys.exit(0)

def send(payload):
    payload.update({"username": "Imperious Wiki", "allowed_mentions": {"parse": []}})
    req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json", "User-Agent": "imperious-wiki"})
    urllib.request.urlopen(req).read()

def chunks(limit):
    # Discord caps a message at 2000 characters and an embed at 4096, so send in chunks.
    out, current = [], ""
    for text in ("- " + l for l in lines):
        if current and len(current) + len(text) + 1 > limit:
            out.append(current)
            current = ""
        current = f"{current}\n{text}" if current else text
    out.append(current)
    return out

def post_plain(heading):
    for i, body in enumerate(chunks(1900)):
        send({"content": (heading + "\n" if i == 0 else "") + body, "flags": 4})  # 4 = no link preview cards

def post_embed(title):
    for i, body in enumerate(chunks(3900)):
        send({"embeds": [{"title": title if i == 0 else None, "description": body, "color": 0x9D86E9,
                          "url": SITE if i == 0 else None}]})

if TEST:
    post_plain("**Wiki updated** (test post, plain style)")
    post_embed("Wiki updated (test post, card style)")
elif STYLE == "embed":
    post_embed("Wiki updated")
else:
    post_plain("**Wiki updated**")
print(f"Posted {len(lines)} update line(s).")
