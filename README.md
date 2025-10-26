# slAIde (KnightHacks VII)

Generate polished, navigable HTML slide decks (and optional PDF summaries) from a single text prompt using a small fleet of agents.

This repo contains three Python agents:

- Host Agent (router + HTTP API) — port 8000
- Presentation Agent (HTML slide deck) — port 8001
- Summary Agent (LaTeX → PDF) — port 8002

The presentation HTML supports keyboard/arrow navigation, emoji bullets that match the chosen style, and robust bar charts parsed from fenced code blocks. The host exposes simple endpoints to generate and save the latest deck.

---

## Quick start

Prerequisites

- macOS, Linux, or WSL
- Python 3.12+
- A Google Generative AI key (or Vertex AI access)
- Recommended: VS Code (tasks provided)
- Recommended: uv (fast Python package manager)

Install uv (recommended)

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
# restart your shell so `uv` is on PATH
```

Clone and run

```bash
git clone <your-fork-or-repo-url>.git
cd knighthacksVII/slidAid/slAIde

# Copy env template and set your key
cp .env.example .env 2>/dev/null || true
# Then edit .env and set GOOGLE_API_KEY=<your-key>

# Start the three agents (in three terminals)
uv run python -m hostagent            # http://localhost:8000
uv run python -m presentation_agent   # http://localhost:8001
uv run python -m summaryagent         # http://localhost:8002
```

Generate a presentation via the Host

```bash
curl -sS -X POST http://localhost:8000/render-html \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Create a 6-slide deck on the history of AI with one bar chart of major research milestones by decade."}'

# On success this writes the latest deck to:
#   slidAid/slAIde/mine.html
open slidAid/slAIde/mine.html  # macOS; use xdg-open on Linux
```

---

## Running with VS Code tasks

Open the workspace root in VS Code, then run:

- Agents: Run Host
- Agents: Run Presentation
- Agents: Run Summary
- Agents: Render HTML via Host (prompts for the text prompt)
- Agents: Open Generated HTML
- Agents: Kill Ports (cleans up 8000/8001/8002 if stuck)

Tasks live in the workspace configuration and use `uv run` under `slidAid/slAIde`.

---

## Environment

Create `slidAid/slAIde/.env` with one of these setups:

Using API key (recommended for local):

```dotenv
GOOGLE_API_KEY=your_api_key_here
# Optional: change listen addresses/ports
HOSTAGENT_HOST=0.0.0.0
HOSTAGENT_PORT=8000
PRESENTATION_AGENT_HOST=0.0.0.0
PRESENTATION_AGENT_PORT=8001
SUMMARY_AGENT_HOST=0.0.0.0
SUMMARY_AGENT_PORT=8002
```

Using Vertex AI instead of an API key:

```dotenv
GOOGLE_GENAI_USE_VERTEXAI=TRUE
# Ensure your local gcloud auth and project are configured
```

Notes

- If `GOOGLE_GENAI_USE_VERTEXAI` is not TRUE and `GOOGLE_API_KEY` is missing, agents will refuse to start.
- The Presentation/Summary agents load `.env` from `slidAid/slAIde/` explicitly.

---

## How it works

High level flow

1. You POST a natural-language prompt to the Host `/render-html`.
2. The Host classifies the request and routes to the Presentation or Summary agent.
3. Presentation agent pipeline:
   - Planner: builds a JSON slide plan (+ optional stats for bar charts)
   - Writer: expands each slide into markdown (5 bullet points per slide; bar chart slides use fenced ```bar blocks)
   - Renderer: converts that markdown into a full, self-contained HTML deck with keyboard/arrow navigation and accessible bar charts.
4. Host validates the response contains a full HTML document and saves it to `slidAid/slAIde/mine.html`.

Endpoints (Host, http://localhost:8000)

- POST /render-html { "prompt": "..." } → writes latest HTML to `mine.html` on success
- POST /save-latest-html { "html": "<!DOCTYPE html>..." } → directly save HTML you provide

Output

- Latest deck path: `slidAid/slAIde/mine.html`
- Summary runs (PDF): response returns the generated PDF path (see Summary agent logs)

---

## Project layout (partial)

```
knighthacksVII/
  slidAid/
    slAIde/
      mine.html               # latest generated deck
      pyproject.toml          # uv workspace root for agents
      hostagent/              # router + HTTP API (8000)
      presentation_agent/     # full HTML generator (8001)
      summaryagent/           # LaTeX/PDF summary (8002)
  fullapp2/                   # optional Next.js app (not required to run agents)
```

---

## Troubleshooting

- Missing GOOGLE_API_KEY: Set it in `slidAid/slAIde/.env` or use Vertex AI.
- Port already in use: Use the VS Code task “Agents: Kill Ports”.
- No HTML returned (422): Your prompt didn’t produce a full document; try a clearer presentation prompt or check agent logs.
- SSL or network errors: Ensure you’re calling `localhost` and the agents are running.

---

## Development notes

- Python 3.12 is required (see `slidAid/slAIde/pyproject.toml`).
- `uv run` will create and reuse a virtualenv per project automatically; no manual venv needed.
- Each agent also has a `requirements.txt` if you prefer classic `pip`.

Alternative (pip) quick start

```bash
cd knighthacksVII/slidAid/slAIde
python3 -m venv .venv && source .venv/bin/activate
pip install -r hostagent/requirements.txt \
            -r presentation_agent/requirements.txt \
            -r summaryagent/requirements.txt
python -m hostagent
python -m presentation_agent
python -m summaryagent
```

---

## License

See LICENSE files included in subfolders where applicable.
