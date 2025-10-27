from fastapi import FastAPI, Request
from pydantic import BaseModel
import asyncio
from lead_agent import root_agent
from google.adk.runners import InMemoryRunner

app = FastAPI()
runner = InMemoryRunner(agent=root_agent)

class PromptRequest(BaseModel):
    prompt: str

@app.post("/run")
async def run_agent(request: PromptRequest):
    response = runner.invoke(request.prompt)
    return {"output": response.output_text}
