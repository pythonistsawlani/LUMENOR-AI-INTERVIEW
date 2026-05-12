import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const roles = ["Frontend Developer", "Backend Developer", "Python Developer", "Data Analyst", "ML Engineer"];

export default function SetupPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    candidate_name: "",
    job_role: "Python Developer",
    experience_level: "Fresher",
    interview_type: "Technical",
    difficulty: "Medium",
    total_questions: 5,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/interviews/start", form);
      navigate(`/interview/${data.id}`);
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to start interview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <h2>Interview Setup</h2>
      <form className="grid" onSubmit={onSubmit}>
        <input placeholder="Your Name" value={form.candidate_name} onChange={(e) => onChange("candidate_name", e.target.value)} required />
        <select value={form.job_role} onChange={(e) => onChange("job_role", e.target.value)}>
          {roles.map((r) => <option key={r}>{r}</option>)}
        </select>
        <select value={form.experience_level} onChange={(e) => onChange("experience_level", e.target.value)}>
          <option>Fresher</option><option>1-3 Years</option><option>3-5 Years</option><option>5+ Years</option>
        </select>
        <select value={form.interview_type} onChange={(e) => onChange("interview_type", e.target.value)}>
          <option>Technical</option><option>Behavioral</option><option>Mixed</option>
        </select>
        <select value={form.difficulty} onChange={(e) => onChange("difficulty", e.target.value)}>
          <option>Easy</option><option>Medium</option><option>Hard</option>
        </select>
        <input type="number" min={3} max={20} value={form.total_questions} onChange={(e) => onChange("total_questions", Number(e.target.value))} />
        <button disabled={loading}>{loading ? "Generating..." : "Start Interview"}</button>
      </form>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
