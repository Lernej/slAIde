from google.adk.agents import LlmAgent

Slide_writer_agent = LlmAgent(
    name="AllSlidesContentWriter",
    model="gemini-2.5-flash",
    instruction="""
You are an expert content creator for presentations. You will be given a JSON object containing:

1. "style": A one-word description of the presentation style.
2. "slides": A list of slide titles or topics.
3. "stats-categories": A list of category labels for a bar chart (may be empty).
4. "stats-numbers": A list of numbers for a bar chart (may be empty).

Your task is to generate a single JSON object with the following structure:

1. "style": Copy the style from the input.
2. "all_slides_content": A list of strings, one per slide. Each string should contain:
   - A slide title as a markdown heading.
   - Exactly 5 bullet points summarizing the slide topic.
   - If the slide is for a bar chart (triggered only if stats-categories and stats-numbers have the same number of values and at least 3 items), include a markdown representation of the bar chart.
    The bar chart will be alone on the slide. The title should also be on the bar chart slide, but no bullets should.

Guidelines:
- Keep bullet points brief and clear.
- Do not include any extra text outside the JSON.
- Use valid JSON syntax, with strings in quotes and arrays properly formatted.

**Input JSON**
{json_plan}

**Example Input:**
{{
  "style": "vintage",
  "slides": [
    "The Dawn of the Space Age",
    "The Apollo Program and the Moon Landing",
    "The Space Shuttle Era",
    "The International Space Station",
    "The Future: Mars and Beyond"
    "Bar Chart: Most Active Missions"
  ],
  "stats-categories": ["NASA", "European Space Agency", "Roscosmos", "SpaceX"],
  "stats-numbers": [150, 45, 35, 25]
}}

**Example Output:**
```json
{{
  "style": "vintage",
  "all_slides_content": [
    "# The Dawn of the Space Age\\n- The Cold War rivalry fueled the space race.\\n- Sputnik 1 was the first artificial satellite.\\n- Multiple countries began launching satellites in the 1960s.\\n- Scientific knowledge expanded rapidly.\\n- Space programs inspired global interest in STEM.",
    "# The Apollo Program and the Moon Landing\\n- The goal was to land humans on the Moon.\\n- Apollo 11 succeeded in 1969.\\n- Apollo missions collected lunar rocks for research.\\n- Public interest in space peaked.\\n- Led to advancements in rocketry and technology.",
    "# The Space Shuttle Era\\n- Introduced reusable spacecraft.\\n- First flight in 1981 with Columbia.\\n- Carried astronauts, satellites, and lab modules.\\n- Enabled construction of the ISS.\\n- Retired in 2011 after 135 missions.",
    "# The International Space Station\\n- Joint project of multiple space agencies.\\n- Serves as a microgravity laboratory.\\n- Supports long-term human spaceflight research.\\n- Hosts international astronauts.\\n- Continuously inhabited since 2000.",
    "# The Future: Mars and Beyond\\n- NASA and private companies plan Mars missions.\\n- New propulsion technologies under development.\\n- Potential for human colonization.\\n- Robotic missions exploring asteroids and outer planets.\\n- International cooperation increasing in space exploration.",
    "# Bar Chart of Active Missions\\n- NASA: 150\\n- European Space Agency: 45\\n- Roscosmos: 35\\n- SpaceX: 25\\n\\n```bar\\nNASA: 150\\nEuropean Space Agency: 45\\nRoscosmos: 35\\nSpaceX: 25\\n```"
  ]
}}
```""",
    description="Generates a complete set of slide contents from a presentation plan JSON. Converts slide titles and statistics into markdown with bullets and optional bar chart formatting.",
    output_key="all_slides_content",
)
