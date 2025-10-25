import asyncio
import os
from google.adk.agents import LlmAgent, SequentialAgent
from google.genai import types
from google.adk.runners import InMemoryRunner
from google.adk.agents.invocation_context import InvocationContext
from google.adk.tools.tool_context import ToolContext
from typing import AsyncGenerator, Optional
from google.adk.events import Event, EventActions
from google.adk.agents.llm_agent import Agent
from pydantic import BaseModel, Field
# Part of agent.py --> Follow https://google.github.io/adk-docs/get-started/quickstart/ to learn the setup

# --- 1. Define Sub-Agents for Each Pipeline Stage ---

# STEP 1: The Planner
# This agent creates the high-level plan for the presentation.
Slide_count_agent = LlmAgent(
    name="SlideTopicAndStyleGenerator",
    model="gemini-2.5-flash",
    instruction="""You are a presentation architect.
Based on the user's request, generate a JSON object that outlines a presentation.
The JSON should have two keys:
1. "style": A one-word description of the visual theme (e.g., "modern", "professional", "creative").
2. "slides": A list of strings, where each string is the main topic or title for a single slide.

Example Request: "Make a presentation about the history of space exploration."
Example Output:
```json
{
  "style": "vintage",
  "slides": [
    "The Dawn of the Space Age",
    "The Apollo Program and the Moon Landing",
    "The Space Shuttle Era",
    "The International Space Station",
    "The Future: Mars and Beyond"
  ]
}
```

Output *only* the raw JSON object.
""",
    description="Generates a JSON plan for a presentation including style and slide topics.",
    output_key="json_plan"
)

# STEP 2: The Content Writer
# This agent takes the JSON plan, writes the markdown for ALL slides, and passes the style along.
Slide_writer_agent = LlmAgent(
    name="AllSlidesContentWriter",
    model="gemini-2.5-flash",
    instruction="""You are a content creator. You will be given a JSON object containing a presentation style and a list of slide topics.
Your task is to do two things:
1. Extract the "style" value.
2. Generate the markdown content for EVERY slide topic in the list. For each slide, include a title and a few bullet points.

Your output must be a single JSON object with two keys:
1. "style": The style extracted from the input.
2. "all_slides_content": A JSON array of strings, where each string is the complete markdown for one slide.

**Input JSON Plan:**
{json_plan}

---
Example Input:
{{
  "style": "vintage",
  "slides": ["The Dawn of the Space Age", "The Apollo Program"]
}}

Example Output:
```json
{{
  "style": "vintage",
  "all_slides_content": [
    "# The Dawn of the Space Age\\n- The Cold War rivalry fueled the space race.\\n- Sputnik 1 was the first artificial satellite.",
    "# The Apollo Program\\n- The goal was to land a man on the Moon.\\n- Apollo 11 achieved this in 1969."
  ]
}}
```
---

Now, generate the JSON object containing both the style and the slide content. Output *only* the raw JSON object.
""",
    description="Generates markdown for all slides and passes the style along.",
    output_key="writer_output"
)

# STEP 3: The HTML Renderer
# This agent takes the output from the writer and renders the final HTML.
slide_render_agent = LlmAgent(
    name="FullDeckHtmlRenderer",
    model="gemini-2.5-flash",
    instruction="""You are an expert HTML and CSS designer. You will be given a JSON object containing a visual style and an array of markdown strings.

Your task is to create a SINGLE HTML document that contains ALL of the slides.
- Each slide should be a `<div>` with the class "slide".
- The final HTML should be a complete document, including `<html>`, `<head>`, and `<body>` tags.
- The visual styling of the slides should reflect the provided theme.

**Input JSON:**
{writer_output}

---
Example Input:
{{
  "style": "modern",
  "all_slides_content": [
    "# Welcome\\n- Point 1",
    "# Conclusion\\n- Point 2"
  ]
}}

Example Output:
<!DOCTYPE html>
<html>
<head>
<title>Presentation</title>
<style>
  body {{ font-family: sans-serif; background-color: #f0f0f0; }}
  .slide {{ background-color: white; border: 1px solid #ddd; margin: 20px; padding: 20px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
  .modern h1 {{ color: #0056b3; }}
</style>
</head>
<body class="modern">
  <div class="slide"><h1>Welcome</h1><ul><li>Point 1</li></ul></div>
  <div class="slide"><h1>Conclusion</h1><ul><li>Point 2</li></ul></div>
</body>
</html>
---

Now, generate the complete HTML document. Output *only* the raw HTML.
""",
    description="Renders a full HTML presentation from a list of slide contents.",
    output_key="final_html",
)

# --- 2. Create the SequentialAgent ---
# This agent orchestrates the pipeline by running the three agents in order.
# The output of one becomes the input for the next.
root_agent = SequentialAgent(
    name="PresentationPipelineAgent",
    sub_agents=[
        Slide_count_agent,
        Slide_writer_agent,
        slide_render_agent
    ],
    description="Generates a complete presentation by running a planner, a writer, and a renderer in sequence.",
)