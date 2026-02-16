"""
AI Service for generating educational content.
Supports multiple providers with automatic fallback:
  1. Anthropic Claude
  2. OpenAI GPT
  3. xAI Grok
  4. Google Gemini
  5. DeepSeek
"""
import json
import logging
import re
from typing import Dict, Any, List, Optional, Tuple

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


def _get_providers() -> List[Tuple[str, str, str, str]]:
    """Return list of (name, api_url, api_key, model) for configured providers."""
    providers = []

    if settings.ANTHROPIC_API_KEY:
        providers.append((
            "Claude",
            "https://api.anthropic.com/v1/messages",
            settings.ANTHROPIC_API_KEY,
            settings.CLAUDE_MODEL,
        ))

    if settings.OPENAI_API_KEY:
        providers.append((
            "OpenAI",
            "https://api.openai.com/v1/chat/completions",
            settings.OPENAI_API_KEY,
            settings.OPENAI_MODEL,
        ))

    if settings.XAI_API_KEY:
        providers.append((
            "xAI",
            "https://api.x.ai/v1/chat/completions",
            settings.XAI_API_KEY,
            settings.XAI_MODEL,
        ))

    if settings.GEMINI_API_KEY:
        providers.append((
            "Gemini",
            "https://generativelanguage.googleapis.com/v1beta",
            settings.GEMINI_API_KEY,
            settings.GEMINI_MODEL,
        ))

    if settings.DEEPSEEK_API_KEY:
        providers.append((
            "DeepSeek",
            "https://api.deepseek.com/v1/chat/completions",
            settings.DEEPSEEK_API_KEY,
            settings.DEEPSEEK_MODEL,
        ))

    return providers


def _call_anthropic(api_key: str, model: str, prompt: str) -> str:
    """Call Anthropic Claude API."""
    response = httpx.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": model,
            "max_tokens": settings.AI_MAX_TOKENS,
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=120.0,
    )
    response.raise_for_status()
    data = response.json()
    return data["content"][0]["text"].strip()


def _call_openai(api_key: str, model: str, prompt: str) -> str:
    """Call OpenAI GPT API."""
    response = httpx.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "max_tokens": settings.AI_MAX_TOKENS,
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=120.0,
    )
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"].strip()


def _call_xai(api_key: str, model: str, prompt: str) -> str:
    """Call xAI Grok API (OpenAI-compatible)."""
    response = httpx.post(
        "https://api.x.ai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "max_tokens": settings.AI_MAX_TOKENS,
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=120.0,
    )
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"].strip()


def _call_gemini(api_key: str, model: str, prompt: str) -> str:
    """Call Google Gemini API."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    response = httpx.post(
        url,
        headers={"Content-Type": "application/json"},
        json={
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "maxOutputTokens": settings.AI_MAX_TOKENS,
            },
        },
        timeout=120.0,
    )
    response.raise_for_status()
    data = response.json()
    return data["candidates"][0]["content"]["parts"][0]["text"].strip()


def _call_deepseek(api_key: str, model: str, prompt: str) -> str:
    """Call DeepSeek API (OpenAI-compatible)."""
    response = httpx.post(
        "https://api.deepseek.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "max_tokens": settings.AI_MAX_TOKENS,
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=120.0,
    )
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"].strip()


def _call_ai(prompt: str) -> str:
    """
    Try each configured AI provider in order.
    Returns the first successful response.
    Raises RuntimeError if all providers fail.
    """
    providers = _get_providers()

    if not providers:
        raise RuntimeError("No AI providers configured. Set at least one API key in .env")

    errors = []
    for name, url, api_key, model in providers:
        try:
            logger.info(f"Trying AI provider: {name} ({model})")
            if name == "Claude":
                return _call_anthropic(api_key, model, prompt)
            elif name == "OpenAI":
                return _call_openai(api_key, model, prompt)
            elif name == "xAI":
                return _call_xai(api_key, model, prompt)
            elif name == "Gemini":
                return _call_gemini(api_key, model, prompt)
            elif name == "DeepSeek":
                return _call_deepseek(api_key, model, prompt)
        except Exception as e:
            logger.warning(f"{name} failed: {type(e).__name__}: {e}")
            errors.append(f"{name}: {type(e).__name__}: {e}")
            continue

    raise RuntimeError(
        f"All AI providers failed:\n" + "\n".join(f"  - {err}" for err in errors)
    )


def _extract_json(text: str) -> Dict[str, Any]:
    """Extract JSON from AI response, handling markdown blocks and common issues."""
    # Strip markdown code blocks
    code_block = re.search(r"```(?:json)?\s*\n(.*?)```", text, re.DOTALL)
    if code_block:
        text = code_block.group(1)

    # If no code block, try to find the outermost { ... }
    if "{" in text:
        start = text.index("{")
        # Find matching closing brace
        depth = 0
        end = start
        for i in range(start, len(text)):
            if text[i] == "{":
                depth += 1
            elif text[i] == "}":
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break
        text = text[start:end]

    # Fix common JSON issues from AI responses
    # Remove trailing commas before } or ]
    text = re.sub(r",\s*([}\]])", r"\1", text)
    # Remove control characters that break JSON
    text = re.sub(r"[\x00-\x1f\x7f]", lambda m: " " if m.group() in ("\n", "\r", "\t") else "", text)

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Last resort: try to fix unescaped quotes in string values
        text = re.sub(r'(?<=: ")(.*?)(?="[,\s}])', lambda m: m.group().replace('"', '\\"'), text)
        return json.loads(text)


def generate_syllabus(
    subject: str,
    grade_level: str,
    curriculum_standard: str,
    duration_weeks: int,
    learning_objectives: Optional[List[str]] = None,
    additional_instructions: Optional[str] = None,
) -> Dict[str, Any]:
    """Generate a complete syllabus using AI."""
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

    response_text = _call_ai(prompt)
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
    """Generate a detailed lesson plan using AI."""
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

    response_text = _call_ai(prompt)
    return _extract_json(response_text)


def generate_detailed_assessment_plan(
    subject: str,
    grade_level: str,
    curriculum_standard: str,
    duration_weeks: int,
    learning_objectives: List[str],
    weekly_breakdown: List[Dict[str, Any]],
    existing_assessment_plan: Optional[List[Dict[str, Any]]] = None,
    additional_instructions: Optional[str] = None,
) -> Dict[str, Any]:
    """Generate a detailed assessment plan with questions, rubrics, and marking criteria."""
    objectives_text = "\n".join(f"- {obj}" for obj in learning_objectives)

    topics_text = "\n".join(
        f"  Week {w.get('week', i+1)}: {w.get('topic', 'N/A')}"
        for i, w in enumerate(weekly_breakdown[:30])
    )

    existing_text = ""
    if existing_assessment_plan:
        existing_text = "\nExisting assessment schedule to expand upon:\n" + json.dumps(
            existing_assessment_plan[:10], indent=2
        )

    extra = ""
    if additional_instructions:
        extra = f"\nAdditional instructions: {additional_instructions}"

    prompt = f"""You are an expert educational assessment designer. Create a comprehensive, detailed assessment plan for a course.

Subject: {subject}
Grade Level: {grade_level}
Curriculum Standard: {curriculum_standard}
Duration: {duration_weeks} weeks

Learning Objectives:
{objectives_text}

Topics Covered:
{topics_text}
{existing_text}
{extra}

Respond with ONLY valid JSON in this exact structure:
{{
    "assessments": [
        {{
            "week": 4,
            "type": "quiz",
            "title": "Assessment title",
            "description": "What is being assessed",
            "weight_percentage": 10,
            "duration_minutes": 60,
            "topics_covered": ["topic 1", "topic 2"],
            "questions": [
                {{
                    "question_number": 1,
                    "question_text": "Full question text",
                    "question_type": "multiple_choice",
                    "marks": 5,
                    "options": ["A) option", "B) option", "C) option", "D) option"],
                    "expected_answer": "Correct answer with explanation",
                    "marking_criteria": "How to award marks"
                }},
                {{
                    "question_number": 2,
                    "question_text": "Full question text",
                    "question_type": "short_answer",
                    "marks": 10,
                    "expected_answer": "Model answer or key points",
                    "marking_criteria": "How to award marks"
                }}
            ],
            "rubric": {{
                "criteria": [
                    {{
                        "criterion": "Understanding of concepts",
                        "excellent": "Full marks description",
                        "good": "Good marks description",
                        "satisfactory": "Passing description",
                        "needs_improvement": "Below passing description"
                    }}
                ],
                "total_marks": 100
            }},
            "instructions_for_students": "Clear instructions for students",
            "allowed_materials": ["calculator", "formula sheet"]
        }}
    ],
    "grading_policy": {{
        "grade_boundaries": {{"A": 90, "B": 80, "C": 70, "D": 60, "F": 0}},
        "total_weight": 100
    }}
}}

Requirements:
- Create 4-6 assessments spread across the {duration_weeks} weeks
- Include a mix of types: quiz, test, project, presentation, midterm, final exam
- Each assessment should have 3-6 questions with a mix of types (multiple_choice, short_answer, essay, problem_solving)
- Include options array ONLY for multiple_choice questions
- Weight percentages must sum to 100
- Make content appropriate for {grade_level} students
- Align with {curriculum_standard} standards
- Include clear rubrics with grading criteria"""

    response_text = _call_ai(prompt)
    return _extract_json(response_text)


def generate_exam_preparation(
    subject: str,
    grade_level: str,
    curriculum_standard: str,
    duration_weeks: int,
    learning_objectives: List[str],
    weekly_breakdown: List[Dict[str, Any]],
    additional_instructions: Optional[str] = None,
) -> Dict[str, Any]:
    """Generate exam preparation materials: study guide, practice questions, revision plan."""
    objectives_text = "\n".join(f"- {obj}" for obj in learning_objectives)

    topics_text = "\n".join(
        f"  Week {w.get('week', i+1)}: {w.get('topic', 'N/A')} - {', '.join(w.get('subtopics', []))}"
        for i, w in enumerate(weekly_breakdown[:30])
    )

    extra = ""
    if additional_instructions:
        extra = f"\nAdditional instructions: {additional_instructions}"

    prompt = f"""You are an expert teacher helping students prepare for their final exam.

Subject: {subject}
Grade Level: {grade_level}
Curriculum Standard: {curriculum_standard}
Duration: {duration_weeks} weeks

Learning Objectives:
{objectives_text}

Topics Covered:
{topics_text}
{extra}

Respond with ONLY valid JSON in this exact structure:
{{
    "study_guide": {{
        "overview": "General exam preparation overview and strategy (2-3 sentences)",
        "key_topics": [
            {{
                "topic": "Topic name",
                "importance": "high",
                "summary": "Concise summary of what students need to know",
                "key_concepts": ["concept 1", "concept 2"],
                "common_mistakes": ["mistake 1", "mistake 2"]
            }}
        ],
        "key_formulas_and_definitions": [
            {{
                "term": "Term or formula name",
                "definition": "The definition or formula",
                "when_to_use": "Context for when to apply this"
            }}
        ]
    }},
    "practice_questions": [
        {{
            "question_number": 1,
            "topic": "Related topic",
            "difficulty": "easy",
            "question": "Full question text",
            "question_type": "multiple_choice",
            "options": ["A) option", "B) option", "C) option", "D) option"],
            "answer": "Correct answer with detailed explanation",
            "marks": 5
        }},
        {{
            "question_number": 2,
            "topic": "Related topic",
            "difficulty": "medium",
            "question": "Full question text",
            "question_type": "short_answer",
            "answer": "Model answer with explanation",
            "marks": 10
        }}
    ],
    "revision_plan": {{
        "total_days": 14,
        "daily_schedule": [
            {{
                "day": 1,
                "focus_topics": ["topic 1", "topic 2"],
                "activities": ["Review notes on topic 1", "Practice 5 questions on topic 2"],
                "duration_hours": 2
            }}
        ]
    }},
    "exam_tips": [
        "Time management: allocate time per section based on marks",
        "Read all questions before starting",
        "Show your working for calculation questions"
    ]
}}

Requirements:
- Include 8-12 key topics in the study guide, ordered by importance (high/medium/low)
- Include 10-15 practice questions with a mix of difficulties (easy/medium/hard) and types
- Include options array ONLY for multiple_choice questions
- Create a 10-14 day revision plan with realistic daily schedules
- Include 5-8 practical exam tips specific to {subject}
- Include at least 5 key formulas/definitions relevant to the course
- Make all content appropriate for {grade_level} students
- Align with {curriculum_standard} exam expectations"""

    response_text = _call_ai(prompt)
    return _extract_json(response_text)
