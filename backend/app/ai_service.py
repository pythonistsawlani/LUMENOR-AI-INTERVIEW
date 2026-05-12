import os
import json
from huggingface_hub import InferenceClient
from dotenv import load_dotenv

load_dotenv()

class ResumeAI:
    def __init__(self):
        self.token = os.getenv("HUGGINGFACE_API_KEY")
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
