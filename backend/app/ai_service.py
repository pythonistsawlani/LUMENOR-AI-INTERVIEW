import os
import json
import re
from huggingface_hub import InferenceClient
from dotenv import load_dotenv

load_dotenv()


def _extract_json(text: str) -> dict:
    """Robustly extract JSON from model output that may contain extra text."""
    text = text.strip()
    # Remove markdown code fences
    text = re.sub(r"```json\s*", "", text)
    text = re.sub(r"```\s*", "", text)
    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Try to find first {...} block
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    raise ValueError(f"No valid JSON found in output: {text[:200]}")


class ResumeAI:
    def __init__(self):
        self.token = os.getenv("HUGGINGFACE_API_KEY") or os.getenv("HF_TOKEN")
        self.model = os.getenv("HF_MODEL", "Qwen/Qwen2.5-7B-Instruct")
        self.client = InferenceClient(model=self.model, token=self.token)

    def analyze_resume(self, resume_text: str, job_description: str, job_requirements: list) -> dict:
        """Analyzes a resume against a job description using Hugging Face Inference API."""
        requirements_str = ", ".join(job_requirements) if job_requirements else "Not specified"

        # Truncate resume to avoid token overflow
        resume_snippet = resume_text[:3000] if len(resume_text) > 3000 else resume_text

        prompt = f"""You are an expert technical recruiter. Analyze the candidate's resume against the job requirements.

Job Description: {job_description[:500]}

Job Requirements: {requirements_str}

Candidate Resume:
{resume_snippet}

IMPORTANT: Respond ONLY with a valid JSON object. No explanation, no markdown.
Score the candidate STRICTLY based on how well they match. Be honest:
- 85-100: Exceptional match, all requirements met
- 70-84: Strong match, most requirements met
- 55-69: Moderate match, some gaps
- 40-54: Weak match, significant gaps
- 0-39: Poor match, most requirements missing

{{
  "match_score": <int 0-100>,
  "summary": "<2-3 sentences about candidate fit>",
  "good_points": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "missing_points": ["<gap 1>", "<gap 2>"],
  "recommendation_label": "<Strong Fit | Moderate Fit | Weak Fit>",
  "interview_questions": ["<tailored question 1>", "<tailored question 2>", "<tailored question 3>"]
}}"""

        messages = [
            {"role": "system", "content": "You are a strict technical recruiter AI. You only output valid JSON. Never give everyone the same score — be objective and differentiated."},
            {"role": "user", "content": prompt}
        ]

        try:
            response = self.client.chat_completion(
                messages=messages,
                max_tokens=1200,
                temperature=0.3
            )
            raw = response.choices[0].message.content
            result = _extract_json(raw)

            # Validate and clamp score
            score = int(result.get("match_score", 50))
            result["match_score"] = max(0, min(100, score))

            # Validate recommendation label
            if result["match_score"] >= 75:
                result["recommendation_label"] = "Strong Fit"
            elif result["match_score"] >= 55:
                result["recommendation_label"] = "Moderate Fit"
            else:
                result["recommendation_label"] = "Weak Fit"

            return result

        except Exception as e:
            print(f"[ResumeAI Error] {e}")
            return {
                "match_score": 45,
                "summary": "AI analysis encountered an error. Manual review recommended.",
                "good_points": ["Resume submitted successfully"],
                "missing_points": ["Unable to analyze — review manually"],
                "recommendation_label": "Moderate Fit",
                "interview_questions": ["Walk me through your most relevant experience for this role."]
            }


class InterviewAI:
    def __init__(self):
        self.token = os.getenv("HUGGINGFACE_API_KEY") or os.getenv("HF_TOKEN")
        self.model = os.getenv("HF_MODEL", "Qwen/Qwen2.5-7B-Instruct")
        self.client = InferenceClient(model=self.model, token=self.token)

    async def generate_next_question(
        self,
        job_title: str,
        job_desc: str,
        resume_summary: str,
        history: list,
        difficulty: str = "medium",
        focus_areas: list | None = None,
        custom_instructions: str | None = None
    ) -> str:
        """Generates the next interview question based on conversation history."""
        focus_areas = focus_areas or []
        focus_text = ", ".join(focus_areas) if focus_areas else "general role fit and technical skills"
        custom_text = custom_instructions or ""

        system_prompt = (
            f"You are a professional interviewer conducting a {difficulty}-difficulty interview for a {job_title} role.\n"
            f"Job: {job_desc[:300]}\n"
            f"Candidate background: {resume_summary}\n"
            f"Focus areas: {focus_text}\n"
            f"{'Extra instructions: ' + custom_text if custom_text else ''}\n"
            f"Rules: Ask ONE specific question at a time. Do not repeat questions already asked. "
            f"Be conversational but professional. Vary between technical and behavioral questions."
        )

        messages = [{"role": "system", "content": system_prompt}]

        # Add conversation history
        for msg in history:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})

        messages.append({
            "role": "user",
            "content": "Ask the next interview question. Ask only ONE question. Be concise and specific."
        })

        try:
            response = self.client.chat_completion(
                messages=messages,
                max_tokens=250,
                temperature=0.7
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"[InterviewAI Question Error] {e}")
            fallbacks = [
                "Can you describe a challenging technical problem you solved recently?",
                "How do you approach debugging a complex issue in production?",
                "Walk me through your experience with the core technologies in this role.",
                "Tell me about a time you had to learn something quickly under pressure.",
            ]
            # Pick based on history length to avoid repeating
            return fallbacks[len(history) % len(fallbacks)]

    async def evaluate_response(self, question: str, answer: str) -> str:
        """Evaluates a single interview response — used for inline feedback."""
        messages = [
            {"role": "system", "content": "You are an interviewer giving brief, honest feedback on a candidate's answer. One sentence only."},
            {"role": "user", "content": f"Question: {question}\nAnswer: {answer}\nGive a one-sentence evaluation of this answer quality."}
        ]
        try:
            response = self.client.chat_completion(messages=messages, max_tokens=80, temperature=0.3)
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"[InterviewAI Evaluate Error] {e}")
            return "Response noted, moving on."

    async def generate_final_report(self, history: list) -> str:
        """Generates a structured final interview report with actual scoring."""
        if not history:
            return "No interview data available."

        # Build clean transcript
        transcript_parts = []
        for msg in history:
            role = msg.get("role", "")
            content = msg.get("content", "")
            if role == "assistant":
                transcript_parts.append(f"Interviewer: {content}")
            elif role == "user":
                transcript_parts.append(f"Candidate: {content}")

        transcript = "\n".join(transcript_parts)
        qa_count = sum(1 for m in history if m.get("role") == "user")

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a senior hiring manager generating a detailed interview assessment report. "
                    "Be objective and honest. Score based on actual answer quality shown in the transcript. "
                    "Different candidates should get different scores. Do not always give 70/100."
                )
            },
            {
                "role": "user",
                "content": f"""Review this complete interview transcript and generate a detailed assessment.

TRANSCRIPT:
{transcript[:3500]}

Total questions answered: {qa_count}

Generate a structured report in this EXACT format:

OVERALL SCORE: [X/100]

PERFORMANCE SUMMARY:
[2-3 sentences about overall performance]

STRENGTHS:
• [Specific strength observed]
• [Specific strength observed]
• [Specific strength observed]

AREAS FOR IMPROVEMENT:
• [Specific gap or weakness]
• [Specific gap or weakness]

COMMUNICATION SKILLS: [Excellent/Good/Average/Poor]
TECHNICAL KNOWLEDGE: [Excellent/Good/Average/Poor]
PROBLEM SOLVING: [Excellent/Good/Average/Poor]

HIRING RECOMMENDATION: [Strongly Recommend / Recommend / Consider / Do Not Recommend]

NOTES FOR RECRUITER:
[1-2 sentences with specific observations the recruiter should know]

Score guidelines:
- 85-100: Exceptional answers, deep expertise shown
- 70-84: Good answers with minor gaps
- 55-69: Adequate answers, some weak responses
- 40-54: Several weak answers, significant gaps
- Below 40: Poor performance, major concerns"""
            }
        ]

        try:
            response = self.client.chat_completion(
                messages=messages,
                max_tokens=600,
                temperature=0.4
            )
            report = response.choices[0].message.content.strip()
            if report and len(report) > 50:
                return report
            raise ValueError("Report too short")
        except Exception as e:
            print(f"[InterviewAI Report Error] {e}")
            # Dynamic fallback based on actual answer count
            base_score = min(50 + (qa_count * 3), 75)
            return (
                f"OVERALL SCORE: {base_score}/100\n\n"
                f"PERFORMANCE SUMMARY:\n"
                f"Candidate completed {qa_count} interview questions. "
                f"Full AI analysis unavailable — manual review recommended.\n\n"
                f"HIRING RECOMMENDATION: Consider\n\n"
                f"NOTES FOR RECRUITER:\n"
                f"AI scoring service was unavailable. Please review the transcript manually."
            )
