import os
import json
import re
from huggingface_hub import InferenceClient
from dotenv import load_dotenv

load_dotenv()


def _extract_json(text: str) -> dict:
    """Robustly extract JSON from model output that may contain extra text."""
    text = text.strip()
    text = re.sub(r"```json\s*", "", text)
    text = re.sub(r"```\s*", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
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
        resume_snippet = resume_text[:3000] if len(resume_text) > 3000 else resume_text

        prompt = f"""You are an expert technical recruiter. Analyze the candidate's resume against the job requirements.

Job Description: {job_description[:500]}

Job Requirements: {requirements_str}

Candidate Resume:
{resume_snippet}

IMPORTANT: Respond ONLY with a valid JSON object. No explanation, no markdown.
Score the candidate STRICTLY based on how well they match. Be honest and differentiated:
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

            score = int(result.get("match_score", 50))
            result["match_score"] = max(0, min(100, score))

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
        focus_text = ", ".join(focus_areas) if focus_areas else "technical skills and role-specific experience"
        custom_text = custom_instructions or ""

        # Count how many questions have been asked
        asked_count = sum(1 for m in history if m.get("role") == "assistant")

        # Determine question type based on position in interview
        if asked_count == 0:
            q_guidance = "Start with a warm, open-ended question like 'Tell me about yourself' or 'Walk me through your background'."
        elif asked_count == 1:
            q_guidance = "Ask a technical question DIRECTLY related to the job's core skills and technologies."
        elif asked_count == 2:
            q_guidance = "Ask a behavioral question using the STAR format (e.g., 'Tell me about a time when...')."
        elif asked_count == 3:
            q_guidance = "Ask a role-specific scenario or problem-solving question about a real challenge they might face in this job."
        else:
            q_guidance = "Ask a follow-up question based on their previous answers, or ask about their career goals and why they want this role."

        system_prompt = (
            f"You are a professional interviewer conducting a structured {difficulty}-difficulty job interview.\n\n"
            f"POSITION: {job_title}\n"
            f"JOB CONTEXT: {job_desc[:400]}\n"
            f"CANDIDATE BACKGROUND: {resume_summary[:300]}\n"
            f"FOCUS AREAS: {focus_text}\n"
            f"{'EXTRA INSTRUCTIONS: ' + custom_text if custom_text else ''}\n\n"
            f"CRITICAL RULES:\n"
            f"- ONLY ask questions directly relevant to the '{job_title}' position\n"
            f"- Do NOT ask questions about unrelated fields or academic disciplines\n"
            f"- Do NOT repeat any question already asked in the conversation\n"
            f"- Ask EXACTLY ONE question per turn\n"
            f"- Be conversational, professional, and encouraging\n"
            f"- Keep the question concise (1-2 sentences max)\n"
            f"- QUESTION GUIDANCE FOR THIS TURN: {q_guidance}"
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
            "content": "Now ask your next interview question. Remember: ONE question only, directly relevant to this specific job role."
        })

        try:
            response = self.client.chat_completion(
                messages=messages,
                max_tokens=200,
                temperature=0.6
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"[InterviewAI Question Error] {e}")
            role_fallbacks = [
                f"Tell me about yourself and what draws you to the {job_title} role.",
                f"Can you walk me through a recent project most relevant to {job_title}?",
                "Describe a challenging problem you solved at work and how you approached it.",
                "What are your strongest technical skills for this position?",
                "Where do you see yourself growing professionally in the next 2 years?",
            ]
            return role_fallbacks[len(history) % len(role_fallbacks)]

    async def evaluate_response(self, question: str, answer: str) -> str:
        """Evaluates a single interview response — used for inline feedback."""
        messages = [
            {"role": "system", "content": "You are an interviewer giving brief, constructive feedback on a candidate's answer. Be encouraging but honest. One sentence only."},
            {"role": "user", "content": f"Question: {question}\nAnswer: {answer}\nGive a one-sentence evaluation of this answer quality."}
        ]
        try:
            response = self.client.chat_completion(messages=messages, max_tokens=80, temperature=0.3)
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"[InterviewAI Evaluate Error] {e}")
            return "Thank you for your response, let's continue."

    async def generate_final_report(self, history: list) -> str:
        """Generates a structured final interview report with balanced, constructive feedback."""
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
                    "You are a senior hiring manager generating a balanced, professional interview assessment. "
                    "Be fair and constructive — not every short answer means a bad candidate. "
                    "Consider that this is an asynchronous AI interview and candidates may be nervous. "
                    "Focus on what was actually said. Give credit where it's due. "
                    "If answers were brief, note 'limited data' rather than judging harshly. "
                    "Never use the word 'weak' repeatedly. Always end with actionable recruiter notes."
                )
            },
            {
                "role": "user",
                "content": f"""Review this complete interview transcript and generate a professional assessment report.

INTERVIEW TRANSCRIPT:
{transcript[:4000]}

Total responses given: {qa_count}

Generate the report in this EXACT format (fill in all sections):

OVERALL SCORE: [X/100]

PERFORMANCE SUMMARY:
[2-3 balanced sentences about overall performance, noting what was shown and any gaps]

STRENGTHS:
• [Strength observed — if limited data, note "Demonstrated willingness to engage"]
• [Strength or positive trait observed]
• [Strength or positive trait observed]

AREAS FOR IMPROVEMENT:
• [Specific constructive suggestion]
• [Specific constructive suggestion]

COMMUNICATION SKILLS: [Excellent / Good / Average / Needs Development]
TECHNICAL KNOWLEDGE: [Excellent / Good / Average / Needs Development]
PROBLEM SOLVING: [Excellent / Good / Average / Needs Development]

HIRING RECOMMENDATION: [Strongly Recommend / Recommend / Consider for Further Interview / Not Recommended at This Time]

NOTES FOR RECRUITER:
[1-2 constructive sentences. If interview had limited responses, recommend a follow-up call rather than immediate rejection.]

SCORING GUIDE:
- 80-100: Strong answers, clear expertise and communication
- 65-79: Good answers with minor gaps, worth pursuing
- 50-64: Mixed responses, recommend follow-up interview
- 35-49: Limited answers, needs further assessment before decision
- Below 35: Very limited engagement, consider follow-up call first"""
            }
        ]

        try:
            response = self.client.chat_completion(
                messages=messages,
                max_tokens=700,
                temperature=0.4
            )
            report = response.choices[0].message.content.strip()
            if report and len(report) > 50:
                return report
            raise ValueError("Report too short")
        except Exception as e:
            print(f"[InterviewAI Report Error] {e}")
            base_score = min(50 + (qa_count * 5), 70)
            return (
                f"OVERALL SCORE: {base_score}/100\n\n"
                f"PERFORMANCE SUMMARY:\n"
                f"Candidate completed {qa_count} interview question(s). "
                f"Full AI scoring unavailable — manual review recommended.\n\n"
                f"STRENGTHS:\n"
                f"• Completed the AI interview process\n"
                f"• Showed availability and interest in the role\n\n"
                f"AREAS FOR IMPROVEMENT:\n"
                f"• More detailed responses would strengthen evaluation\n\n"
                f"COMMUNICATION SKILLS: Average\n"
                f"TECHNICAL KNOWLEDGE: Needs Assessment\n"
                f"PROBLEM SOLVING: Needs Assessment\n\n"
                f"HIRING RECOMMENDATION: Consider for Further Interview\n\n"
                f"NOTES FOR RECRUITER:\n"
                f"AI scoring service was temporarily unavailable. "
                f"A follow-up phone screen is recommended to properly assess this candidate."
            )
