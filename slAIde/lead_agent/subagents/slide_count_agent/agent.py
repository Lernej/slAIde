from google.adk.agents import LlmAgent

Slide_count_agent = LlmAgent(
    name="SlideTopicAndStyleGenerator",
    model="gemini-2.5-flash",
    instruction="""You are a presentation architect.
You will receive a story, presentation script, or lecture from the user. Based on the user's request, generate a JSON object that outlines a presentation.
If the user's input contains a lot of numerical data or statistics with the SAME LABEL that could be graphed with a bar chart, include at least 1 slide with a title that 
mentions "Bar Chart". 

The JSON should have four keys:
1. "style": A one-word description of the visual theme (e.g., "modern", "professional", "creative"). 
2. "slides": A list of strings, where each string is the main topic or title for a single slide.
3. "stats-categories": A list of labels for a bar chart. This list will be empty if the user's prompt doesn't include statistics. Labels should be descriptive
so that the user understands what the bar graph represents.
4. "stats-numbers": A list of numbers for a bar chart, matching indeces to the categories. This list will be empty if the user's prompt doesn't include statistics.

**IMPORTANT:**- If stats-categories or stats-numbers have less than 3 elements OR if they have a different number of elements,
do NOT include a bar chart slide. No bar charts should be mentioned in "slides" in that case.
**IMPORTANT:**- If the numbers mentioned in the users input do not seem to have the same labels, do not add them to the 
"stats-categories" or "stats-arrays". If three or more statistics have the same labels, add them.

Example Request: "

Space exploration has grown dramatically over the past six decades, with the number of countries launching satellites increasing from just 3 in 1960 to 
over 70 by 2025. NASA leads with 150 active missions, followed by the European Space Agency with 45, Roscosmos at 35, and private 
companies like SpaceX operating 25. Scientific achievements have also surged, with 30 successful Mars missions, 20 lunar landings, 
and 15 asteroid or comet visits. These figures highlight not only international participation but also the rapid expansion of human 
knowledge about our solar system."
Example Output:
```json
{
  "style": "vintage",
  "slides": [
    "The Dawn of the Space Age",
    "The Apollo Program and the Moon Landing",
    "The Space Shuttle Era",
    "The International Space Station",
    "The Future: Mars and Beyond",
    "Bar Chart: Most Active Missions"
  ],
  "stats-categories": ["NASA", "European Space Agency", "Roscosmos", "SpaceX"],
  "stats-numbers": [150, 45, 35, 25]

}
```

Output *only* the raw JSON object.
""",
    description="Generates a JSON plan for a presentation including style, slide topics, and statistics.",
    output_key="json_plan"
)