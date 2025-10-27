from google.adk.agents import SequentialAgent, LlmAgent

from lead_agent.subagents.slide_count_agent.agent import Slide_count_agent
from lead_agent.subagents.slide_render_agent.agent import Slide_render_agent
from lead_agent.subagents.slide_writer_agent.agent import Slide_writer_agent

root_agent = SequentialAgent(
    name="PresentationPipelineAgent",
    sub_agents=[
        Slide_count_agent,
        Slide_writer_agent,
        Slide_render_agent
    ],
    description="Generates a complete presentation by running a planner, a writer, and a renderer in sequence.",
)