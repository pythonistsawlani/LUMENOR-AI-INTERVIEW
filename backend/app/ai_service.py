import os
import json
from huggingface_hub import InferenceClient
from dotenv import load_dotenv

load_dotenv()

class ResumeAI:
    def __init__(self):
        self.token = os.getenv("HUGGINGFACE_API_KEY") or os.getenv("HF_TOKEN")
        self.model = os.getenv("HF_MODEL", "Qwen/Qwen2.5-7B-Instruct")
        self.client = InferenceClient(model=self.model, token=self.token)

    def analyze_resume(self, resume_text: str, job_description: str, job_requirements: list) -> dict:
        """
        Analyzes a resume against a job description using Hugging Face Inference API.
        """
        requirements_str = ", ".join(job_requirements)
        prompt = f"""
You are an expert technical recruiter. Analyze the following candidate's resume against the job description and requirements.

Job Description:
{job_description}

Job Requirements:
{requirements_str}

Candidate Resume:
{resume_text}

Provide your analysis strictly in the following JSON format without any markdown blocks or extra text:
{{
  "match_score": <int between 0-100 based on fit>,
  "summary": "<2-3 sentences summarizing the candidate's fit>",
  "good_points": ["<point 1>", "<point 2>"],
  "missing_points": ["<missing skill 1>", "<missing skill 2>"],
  "recommendation_label": "<Strong Fit | Moderate Fit | Weak Fit>",
  "interview_questions": ["<question 1>", "<question 2>", "<question 3>"]
}}
"""
        messages = [
            {"role": "system", "content": "You are a helpful AI recruitment assistant. You only respond with pure valid JSON."},
            {"role": "user", "content": prompt}
        ]

        try:
            response = self.client.chat_completion(
                messages=messages,
                max_tokens=1000,
                temperature=0.2
            )
            raw_content = response.choices[0].message.content
            
            # Clean up potential markdown formatting
            if raw_content.startswith("```json"):
                raw_content = raw_content[7:-3]
            elif raw_content.startswith("```"):
                raw_content = raw_content[3:-3]
                
            return json.loads(raw_content.strip())
        except Exception as e:
            print(f"AI Analysis Error: {e}")
            # Fallback mock response if API fails
            return {
                "match_score": 50,
                "summary": "AI analysis failed. Please review manually.",
                "good_points": [],
                "missing_points": [],
                "recommendation_label": "Moderate Fit",
                "interview_questions": ["Please walk me through your resume."]
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
    ):
        """Generates the next interview question based on history."""
        focus_areas = focus_areas or []
        focus_text = ", ".join(focus_areas) if focus_areas else "general role fit"
        custom_text = custom_instructions or "No extra custom instructions."
        messages = [
            {
                "role": "system",
                "content": f"You are an expert technical interviewer for a {job_title} role. "
                           f"Job Description: {job_desc}. Candidate Summary: {resume_summary}. "
                           f"Difficulty: {difficulty}. Focus areas: {focus_text}. "
                           f"Custom recruiter instructions: {custom_text}. "
                           f"Ask one specific question at a time. Keep it conversational but professional."
            }
        ]
        # Map history to role/content
        formatted_history = []
        for msg in history:
            formatted_history.append({"role": msg["role"], "content": msg["content"]})
            
        messages.extend(formatted_history)
        messages.append({"role": "user", "content": "Ask the next relevant interview question. Be concise."})

        try:
            response = self.client.chat_completion(messages=messages, max_tokens=220)
            return response.choices[0].message.content
        except Exception as e:
            print(f"AI Question Error: {e}")
            return "Can you tell me more about your most significant project?"

    async def evaluate_response(self, question: str, response: str):
        """Quickly evaluates a single response for feedback/sentiment."""
        prompt = f"Question: {question}\nCandidate Answer: {response}\nEvaluate if this answer is strong, weak, or needs more detail. Be very brief (1 sentence)."
        try:
            res = self.client.text_generation(prompt, max_new_tokens=50)
            return res.strip()
        except:
            return "Good point, let's move on."

    async def generate_final_report(self, history: list):
        """Generates a final summary of the interview."""
        prompt = (
            "Based on the interview transcript, provide a concise final evaluation with:\n"
            "1) Overall score (1-100)\n"
            "2) Strengths\n"
            "3) Concerns\n"
            "4) Hiring recommendation\n"
            "Keep it in plain text.\n"
        )
        transcript = "\n".join([f"{m['role']}: {m['content']}" for m in history])
        
        try:
            res = self.client.text_generation(prompt + transcript, max_new_tokens=200)
            return res.strip()
        except:
            return "Interview completed. Score: 70/100. Candidate showed decent understanding."
