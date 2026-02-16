"""
AI Service for generating educational content using Anthropic Claude API
Uses httpx directly to avoid SDK/Pydantic version conflicts.
"""
import json
import logging
from typing import Dict, Any, List, Optional

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"


def _call_claude(prompt: str) -> str:
    """Call Claude API and return the text response."""
    response = httpx.post(
        ANTHROPIC_API_URL,
        headers={
            "x-api-key": settings.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": settings.CLAUDE_MODEL,
            "max_tokens": settings.CLAUDE_MAX_TOKENS,
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=120.0,
    )
    response.raise_for_status()
    data = response.json()
    return data["content"][0]["text"].strip()


def _extract_json(text: str) -> Dict[str, Any]:
    """Extract JSON from response, handling markdown code blocks."""
    if text.startswith("```"):
        lines = text.split("\n")
        json_lines = []
        in_json = False
        for line in lines:
            if line.startswith("```") and not in_json:
                in_json = True
                continue
            elif line.startswith("```") and in_json:
                break
            elif in_json:
                json_lines.append(line)
        text = "\n".join(json_lines)
    return json.loads(text)


def generate_syllabus(
    subject: str,
    grade_level: str,
    curriculum_standard: str,
    duration_weeks: int,
    learning_objectives: Optional[List[str]] = None,
    additional_instructions: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generate a complete syllabus using Claude AI.
    """
    objectives_text = ""
    if learning_objectives:
        objectives_text = f"\nKey learning objectives to include:\n" + "\n".join(
            f"- {obj}" for obj in learning_objectives
        )

    extra_instructions = ""
    if additional_instructions:
        extra_instructions = f"\nAdditional instructions: {additional_instructions}"

    prompt = f"""You are an expert curriculum designer. Create a detailed syllabus for the following:

Subject: {subject}
Grade Level: {grade_level}
Curriculum Standard: {curriculum_standard}
Duration: {duration_weeks} weeks
{objectives_text}
{extra_instructions}

Respond with ONLY valid JSON in this exact structure:
{{
    "name": "A descriptive name for this syllabus",
    "learning_objectives": ["objective 1", "objective 2", ...],
    "weekly_breakdown": [
        {{
            "week": 1,
            "topic": "Topic title",
            "subtopics": ["subtopic 1", "subtopic 2"],
            "learning_goals": ["goal 1", "goal 2"],
            "activities": ["activity 1", "activity 2"],
            "resources": ["resource 1"]
        }}
    ],
    "assessment_plan": [
        {{
            "week": 4,
            "type": "quiz/test/project/presentation",
            "title": "Assessment title",
            "description": "What is being assessed",
            "weight_percentage": 10
        }}
    ],
    "revision_schedule": [
        {{
            "week": 8,
            "topics_to_review": ["topic 1", "topic 2"],
            "activity": "Review activity description"
        }}
    ],
    "recommended_resources": [
        {{
            "title": "Resource name",
            "type": "textbook/website/video/tool",
            "description": "Brief description"
        }}
    ]
}}

Ensure the weekly_breakdown has exactly {duration_weeks} entries (one per week).
Make content age-appropriate for {grade_level} students.
Align with {curriculum_standard} standards."""

    response_text = _call_claude(prompt)
    return _extract_json(response_text)


def generate_lesson(
    topic: str,
    week_number: int,
    subject: str,
    grade_level: str,
    learning_goals: List[str],
    difficulty_level: str = "intermediate",
    additional_instructions: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generate a detailed lesson plan using Claude AI.
    """
    goals_text = "\n".join(f"- {g}" for g in learning_goals)

    extra = ""
    if additional_instructions:
        extra = f"\nAdditional instructions: {additional_instructions}"

    prompt = f"""You are an expert teacher creating a detailed lesson plan.

Subject: {subject}
Grade Level: {grade_level}
Week: {week_number}
Topic: {topic}
Difficulty Level: {difficulty_level}

Learning Goals:
{goals_text}
{extra}

Respond with ONLY valid JSON in this exact structure:
{{
    "topic": "{topic}",
    "explanation": "A comprehensive, engaging explanation of the topic (2-4 paragraphs, written for {grade_level} students)",
    "examples": [
        {{
            "title": "Example title",
            "content": "Detailed example with step-by-step explanation",
            "type": "worked_example/real_world/visual"
        }}
    ],
    "activities": [
        {{
            "title": "Activity title",
            "description": "Detailed activity description",
            "duration_minutes": 15,
            "type": "individual/pair/group",
            "materials_needed": ["material 1"]
        }}
    ],
    "discussion_questions": ["question 1", "question 2", "question 3"],
    "homework": "A meaningful homework assignment that reinforces the lesson",
    "prerequisites": ["prerequisite 1", "prerequisite 2"],
    "resources": [
        {{
            "title": "Resource name",
            "type": "video/article/tool/worksheet",
            "description": "Brief description"
        }}
    ]
}}

Make the content engaging and age-appropriate for {grade_level} students.
Include at least 2 examples and 2 activities.
The explanation should be thorough but accessible."""

    response_text = _call_claude(prompt)
    return _extract_json(response_text)
