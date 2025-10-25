from google.adk.agents import LlmAgent
from google.adk.agents.agent import Agent
from google.adk.tools.base_tool import BaseTool as Tool
from google.adk.agents.a2a import remote_agent_call
import json

# --- 1. Define Sub-Agents for Each Pipeline Stage ---

# This agent takes the user's topic and creates a structured plan in JSON format.
Slide_count_agent = LlmAgent(
    name="SlideTopicAndStyleGenerator",
    model="gemini-1.5-flash",
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

# This agent takes a single slide's topic and writes the content for it.
Slide_writer_agent = LlmAgent(
    name="SlideContentWriter",
    model="gemini-1.5-flash",
    instruction="""You are a content writer for a presentation.
Based on the provided slide topic and overall presentation context, write the content for a single slide.
The output should be in markdown format. Include a title and a few bullet points.

**Presentation Context:** {presentation_context}
**Slide Topic:** {slide_topic}

Output *only* the markdown content for the slide.
""",
    description="Writes the text content for a single slide based on a topic.",
    output_key="slide_content",
)

# This agent takes markdown content and a style, and renders it as a single HTML slide.
slide_render_agent = LlmAgent(
    name="SlideHtmlRenderer",
    model="gemini-1.5-flash",
    instruction="""You are an HTML and CSS designer.
Convert the given markdown content into a single, self-contained HTML slide.
The slide should be visually appealing and styled according to the provided theme.
Use inline CSS or a `<style>` block. The entire output must be a single HTML structure, like a `<div>`.

**Theme:** {style}
**Markdown Content:**
{slide_content}

Output *only* the HTML for the slide.
""",
    description="Renders markdown content into a styled HTML slide.",
    output_key="slide_html",
)


# --- 2. Create a Tool to Orchestrate the Process ---

class BuildDeckTool(Tool):
    """A tool to build a presentation slide by slide."""

    async def call(self, presentation_context: str) -> dict[str, str]:
        """
        Generates a full presentation deck in HTML.

        Args:
            presentation_context: The user's initial request for the presentation topic.

        Returns:
            A dictionary containing the final 'html_deck'.
        """
        print(f"Orchestrator: Starting deck generation for topic: '{presentation_context}'")

        # 1. Call the first agent to get the plan
        print("Orchestrator: Calling SlideTopicAndStyleGenerator...")
        plan_response = await remote_agent_call(
            agent=Slide_count_agent,
            prompt={"presentation_context": presentation_context},
        )
        plan_json = json.loads(plan_response["json_plan"])
        style = plan_json["style"]
        slide_topics = plan_json["slides"]
        print(f"Orchestrator: Plan received. Style: '{style}', Slides: {len(slide_topics)}")

        all_slides_html = []

        # 2. Loop through each slide topic
        for i, topic in enumerate(slide_topics):
            print(f"Orchestrator: Generating slide {i+1}/{len(slide_topics)} - Topic: '{topic}'")

            # 3. Call the writer agent for the current slide
            print(f"  -> Calling SlideContentWriter for topic: '{topic}'")
            writer_response = await remote_agent_call(
                agent=Slide_writer_agent,
                prompt={
                    "presentation_context": presentation_context,
                    "slide_topic": topic,
                },
            )
            slide_content = writer_response["slide_content"]

            # 4. Call the render agent for the current slide
            print(f"  -> Calling SlideHtmlRenderer for style: '{style}'")
            render_response = await remote_agent_call(
                agent=slide_render_agent,
                prompt={"style": style, "slide_content": slide_content},
            )
            all_slides_html.append(render_response["slide_html"])
            print(f"Orchestrator: Slide {i+1} finished.")

        # 5. Combine all HTML slides into a final document
        final_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>{presentation_context}</title>
            <style>
                body {{ font-family: sans-serif; }}
                .slide {{ border: 1px solid #ccc; margin-bottom: 20px; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }}
            </style>
        </head>
        <body>
            {''.join(all_slides_html)}
        </body>
        </html>
        """
        print("Orchestrator: Deck generation complete.")
        return {"html_deck": final_html}


# --- 3. Create the Root Agent ---
# This agent has the BuildDeckTool and can execute the entire workflow.
root_agent = Agent(
    name="PresentationGeneratorAgent",
    description="An agent that can generate a complete slide deck from a topic.",
    tools=[BuildDeckTool()],
)