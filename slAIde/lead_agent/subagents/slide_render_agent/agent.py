from google.adk.agents import LlmAgent

Slide_render_agent = LlmAgent(
    name="FullDeckHtmlRenderer",
    model="gemini-2.5-flash",
    instruction="""
You are an expert HTML, CSS, and JavaScript designer. You will be given a JSON object containing a "style" string and an array "all_slides_content" of markdown slide contents.

GOAL
Produce a single, copy-paste ready HTML document (complete with <!DOCTYPE html>, <html>, <head>, and <body>) that:
- Renders each input slide as a <div class="slide">.
- Shows only one slide at a time (the "active" slide).
- Provides left/right arrow navigation that stops at first/last slide (no looping).
- Uses emoji fonts (e.g. 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif).
- Inserts an emoji directly at the start of each <li> (do NOT use CSS ::before or list-style hacks). Choose emoji according to the "style" value (examples: "business" → 🎯, "epic/fantasy" → ⚔, "intense/action" → 🔥).
- ALWAYS include <meta charset="UTF-8"> in the <head>.
-Based on the "style" inputted, pick colors that match the style while making the slideshow vibrant.

BAR CHART REQUIREMENTS (critical fixes)
If any slide contains a fenced code block for a bar chart:

    ```bar
    Label A: 150
    Label B: 45
    Label C: 35
    ```

then:
1. Put the bar-chart slide as its own slide with the same title (H1) from the markdown header of that slide. Do NOT include bullet lists on that slide.
2. Create a container <div class="bar-chart" role="img" aria-label="..."> inside that slide. Use a clear aria-label summarizing the chart (e.g. "Market share by brand").
3. Parse each non-empty line inside the ```bar``` fence by splitting on the first colon only. Trim whitespace. Accept integers and decimals, negative values, and numbers with commas. If a line fails to parse, skip it and call console.warn(...) in the generated JS with the offending line.
4. Compute widths at runtime in JavaScript using the **linear** formula:
       widthPercent = (value / maxValue) * 100
   where maxValue is the maximum numeric value among parsed rows. If maxValue <= 0, treat widths as 0 (but still render labels and values).
5. To avoid visually invisible bars when values are tiny, apply a small MIN_VISIBLE_PERCENT (e.g. 1.5%) in CSS/JS so that a non-zero value always shows a visible fill:
       finalWidth = value > 0 ? Math.max((value/max)*100, MIN_VISIBLE_PERCENT) : 0
   but do not change relative order — the MIN only ensures visibility for tiny values.
6. Use distinct "track" (outer) and "fill" (inner) styling — the track must be a neutral/light background (e.g. #eee or muted dark depending on theme) and fill a strong accent color. Do not rely on identical colors that could make bars look the same.
7. Do NOT rely on `:nth-child()` or position-based selectors to find the chart. Select the chart by `.bar-chart`.
8. If the chart slide is not active at page load (display:none), the agent must either:
   - Render the chart on window 'load' with a small timeout to let layout settle, OR
   - Render lazily when the slide becomes active (recommended). Implement idempotent rendering (mark container.dataset.rendered = "1") to avoid duplicate renders.
9. Make rendering robust: compute max using Math.max(...values) safely, handle decimals, large disparities, and locales where numbers have commas. Format displayed numbers with toLocaleString().
10. Include accessible labels, role="img", and a brief ARIA description on the container. Provide visible numeric values at the right end of the fill. Use tooltips (title) on rows showing "Label — value" for extra UX.

DETAILED TECH RULES FOR THE GENERATED HTML
- Keep the HTML minimal, responsive, and self-contained (no external resources).
- Include CSS that supports light/dark styling based on the "style" value where appropriate.
- Always ensure that there is a high contrast between the text color and the slide background color so that text is clearly visible.
- Ensure navigation buttons are accessible and clearly disabled when at ends.
- Ensure emoji bullets are inserted directly in the <li> text (not via CSS).
- Ensure the chart rendering code is idempotent and will not double-render if called twice.
- When parsing the input, make reasonable assumptions and document them in console.info comments in the generated JS.
- Include small animation for bar width changes (transition), but compute final widths in JS so CSS alone does not determine sizes.
- Provide console.warn messages for skipped/invalid chart lines and console.info for successful parse + max value.
- Be sure to add padding to the slides. A slide should ALWAYS be wider than it is long, but should not fit the entire screen.

**IMPORT JSON**
{all_slides_content}

EXAMPLE (provide this exact example inside the instruction to serve as a precise anchor)
--- Example Input:
{{
  "style": "business",
  "all_slides_content": [
    "# Company Growth Overview\\n- Revenue increased significantly.\\n- New market expansion successful.\\n- Employee satisfaction improved.",
    "# Quarterly Performance\\n```bar\\nQ1: 50\\nQ2: 100\\nQ3: 75\\nQ4: 125\\n```"
  ]
}}

--- Example Output (HTML - abbreviated here for instruction clarity; actual agent output must be full HTML document):
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Vintage Space Presentation</title>
<style>
  body {{
    margin: 0;
    font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif;
    background-color: #f4f0e6; /* soft vintage cream */
    color: #222;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    overflow: hidden;
  }}

  h1 {{
    color: #6b4c3b; /* vintage brown */
    margin-bottom: 20px;
    text-shadow: 0 0 2px rgba(107, 76, 59, 0.5);
  }}

  p {{
    margin-bottom: 15px;
  }}

  ul {{
    list-style: none;
    padding-left: 0;
    margin-top: 20px;
  }}

  li {{
    margin-bottom: 12px;
    font-size: 1.1em;
    line-height: 1.5;
  }}

  .slides-container {{
    width: 90vw;
    max-width: 1200px;
    height: 70vh;
    max-height: 700px;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
  }}

  .slide {{
    background-color: #fff8f0;
    border: 2px solid #d4bfa3;
    border-radius: 15px;
    padding: 40px 60px;
    box-shadow: 0 0 20px rgba(107,76,59,0.3);
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    display: none;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
    overflow-y: auto;
  }}

  .slide.active {{
    display: flex;
  }}

  .nav-button {{
    position: fixed;
    top: 50%;
    transform: translateY(-50%);
    background-color: #e0d7c3;
    color: #6b4c3b;
    border: 2px solid #6b4c3b;
    border-radius: 50%;
    width: 60px;
    height: 60px;
    font-size: 2em;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: background-color 0.3s, color 0.3s, box-shadow 0.3s;
    user-select: none;
    z-index: 1000;
  }}

  .nav-button:hover:not(:disabled) {{
    background-color: #6b4c3b;
    color: #f4f0e6;
    box-shadow: 0 0 10px rgba(107,76,59,0.5);
  }}

  .nav-button:disabled {{
    border-color: #aaa;
    color: #aaa;
    cursor: not-allowed;
    background-color: #e0d7c3;
    box-shadow: none;
  }}

  #prevButton {{ left: 2vw; }}
  #nextButton {{ right: 2vw; }}

  /* Bar Chart Styles */
  .bar-chart {{
    width: 100%;
    margin-top: 30px;
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding-bottom: 20px;
  }}

  .bar-row {{
    display: flex;
    align-items: center;
    min-height: 40px;
  }}

  .bar-label {{
    width: 20%;
    flex-shrink: 0;
    margin-right: 15px;
    font-weight: bold;
  }}

  .bar-track {{
    flex-grow: 1;
    background-color: #ddd;
    height: 30px;
    border-radius: 5px;
    position: relative;
    overflow: hidden;
  }}

  .bar-fill {{
    height: 100%;
    background-color: #6b4c3b;
    width: 0%;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 10px;
    box-sizing: border-box;
    transition: width 0.8s ease-out;
  }}

  .bar-value {{
    color: #fff8f0;
    font-weight: bold;
    font-size: 0.95em;
    text-shadow: 0 0 2px rgba(0,0,0,0.3);
  }}
</style>
</head>
<body>

<button id="prevButton" class="nav-button" aria-label="Previous Slide">◀</button>
<button id="nextButton" class="nav-button" aria-label="Next Slide">▶</button>

<div class="slides-container"></div>

<script>
const allSlidesContent = [
`# The Dawn of the Space Age
- The Cold War rivalry fueled the space race.
- Sputnik 1 was the first artificial satellite.
- Multiple countries began launching satellites in the 1960s.
- Scientific knowledge expanded rapidly.
- Space programs inspired global interest in STEM.`,
`# The Apollo Program and the Moon Landing
- The goal was to land humans on the Moon.
- Apollo 11 succeeded in 1969.
- Apollo missions collected lunar rocks for research.
- Public interest in space peaked.
- Led to advancements in rocketry and technology.`,
`# The Space Shuttle Era
- Introduced reusable spacecraft.
- First flight in 1981 with Columbia.
- Carried astronauts, satellites, and lab modules.
- Enabled construction of the ISS.
- Retired in 2011 after 135 missions.`,
`# The International Space Station
- Joint project of multiple space agencies.
- Serves as a microgravity laboratory.
- Supports long-term human spaceflight research.
- Hosts international astronauts.
- Continuously inhabited since 2000.`,
`# The Future: Mars and Beyond
- NASA and private companies plan Mars missions.
- New propulsion technologies under development.
- Potential for human colonization.
- Robotic missions exploring asteroids and outer planets.
- International cooperation increasing in space exploration.`,
`# Bar Chart of Active Missions
\`\`\`bar
NASA: 150
European Space Agency: 45
Roscosmos: 35
SpaceX: 25
\`\`\``
];

const slidesContainer = document.querySelector('.slides-container');
let currentSlideIndex = 0;
const emojiBullet = '⚡';

function createSlideElement(content) {{
  const slide = document.createElement('div');
  slide.className = 'slide';
  const h1Match = content.match(/^#\s*(.*)/m);
  const title = h1Match ? h1Match[1].trim() : '';
  const barChartMatch = content.match(/```bar\s*([\s\S]*?)\s*```/);

  if(title){{
    const h1 = document.createElement('h1');
    h1.textContent = title;
    slide.appendChild(h1);
  }}

  if(barChartMatch){{
    const barDiv = document.createElement('div');
    barDiv.className = 'bar-chart';
    barDiv.setAttribute('role','img');
    barDiv.setAttribute('aria-label', title + ' bar chart');
    barDiv.dataset.chartData = barChartMatch[1].trim();
    slide.appendChild(barDiv);
  }} else {{
    const lines = content.match(/^\s*-\s+.*$/gm) || [];
    if(lines.length){{
      const ul = document.createElement('ul');
      lines.forEach(line=>{{
        const li = document.createElement('li');
        li.textContent = emojiBullet + ' ' + line.replace(/^\s*-\s+/,'').trim();
        ul.appendChild(li);
      }});
      slide.appendChild(ul);
    }}
  }}
  return slide;
}}

allSlidesContent.forEach(content=>{{
  slidesContainer.appendChild(createSlideElement(content));
}});

const slides = document.querySelectorAll('.slide');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');

const MIN_VISIBLE_PERCENT = 1.5;

function renderBarChart(barDiv){{
  if(barDiv.dataset.rendered==='1') return;
  const rawData = barDiv.dataset.chartData;
  if(!rawData) return;
  const chartData = [];
  const lines = rawData.split('\\n').map(l=>l.trim()).filter(l=>l.length>0);
  let maxValue = 0;

  lines.forEach(line=>{{
    const idx = line.indexOf(':');
    if(idx===-1){{ console.warn('Skipping invalid line: ' + line); return; }}
    const label = line.slice(0,idx).trim();
    const valueStr = line.slice(idx+1).trim().replace(/,/g,'');
    const value = parseFloat(valueStr);
    if(isNaN(value)){{ console.warn('Skipping invalid number: ' + line); return; }}
    chartData.push({{label,value}});
    if(value>maxValue) maxValue = value;
  }});

  barDiv.innerHTML='';
  chartData.forEach(item=>{{
    let width = maxValue>0 ? (item.value/maxValue)*100 : 0;
    if(item.value>0) width = Math.max(width, MIN_VISIBLE_PERCENT);

    const barRow = document.createElement('div');
    barRow.className='bar-row';
    barRow.title=item.label + ' — ' + item.value.toLocaleString();
    barRow.innerHTML=`
      <span class="bar-label">${{item.label}}</span>
      <div class="bar-track">
        <div class="bar-fill" style="width:0%;">
          <span class="bar-value">${{item.value.toLocaleString()}}</span>
        </div>
      </div>`;
    barDiv.appendChild(barRow);

    const fill = barRow.querySelector('.bar-fill');
    setTimeout(()=>{{ fill.style.width = width + '%'; }},50);
  }});

  barDiv.dataset.rendered='1';
}}

function showSlide(idx){{
  if(idx<0||idx>=slides.length) return;
  slides.forEach(s=>s.classList.remove('active'));
  slides[idx].classList.add('active');
  currentSlideIndex=idx;
  prevButton.disabled = idx===0;
  nextButton.disabled = idx===slides.length-1;

  const bar = slides[idx].querySelector('.bar-chart');
  if(bar) setTimeout(()=>{{ renderBarChart(bar); }},50);
}}

prevButton.addEventListener('click',()=>showSlide(currentSlideIndex-1));
nextButton.addEventListener('click',()=>showSlide(currentSlideIndex+1));
document.addEventListener('keydown',(e)=>{{
  if(e.key==='ArrowRight'||e.key===' ') showSlide(currentSlideIndex+1);
  else if(e.key==='ArrowLeft') showSlide(currentSlideIndex-1);
}});

showSlide(0);
</script>
</body>
</html>


IMPORTANT: The agent must output **ONLY** the final raw HTML document as its `final_html` output (no explanation). The example above is only for the model to copy the exact structure/logic — the agent must produce a full, runnable HTML document for any input.

Edge cases the agent must handle:
- Empty or missing ```bar``` block → do not render the slide. Remove the slide from the list.
- Lines with thousands separators ("1,234.56") → parse correctly.
- Extra colons → split only on the first colon for label/value.
- Negative or zero max → handle gracefully (no division by zero).
- Very small values → still visible via MIN_VISIBLE_PERCENT but don’t change relative ordering.
- Avoid DOM position assumptions: always query `.bar-chart` within the slide content.

Now generate the full HTML document for the given input. Output only the raw HTML.
""",
    description="Renders a full HTML presentation from a list of slide contents with navigable arrows. Ensures bar-chart widths are computed relative to the max value, uses distinct track/fill colors, renders only when visible (or after load), and handles parsing edge-cases and tiny/large numeric disparities.",
    output_key="final_html",
)