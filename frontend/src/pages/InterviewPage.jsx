import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

const QUESTION_TIME = 60;

export default function InterviewPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/interviews/${sessionId}`).then(({ data }) => setSession(data));
  }, [sessionId]);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((x) => Math.max(0, x - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) handleSubmit();
  }, [timeLeft]);

  const question = useMemo(() => session?.questions?.[index], [session, index]);
  const progress = session ? ((index + 1) / session.questions.length) * 100 : 0;

  const handleSubmit = async () => {
    if (!question || saving) return;
    setSaving(true);
    await api.post(`/interviews/${sessionId}/answer`, {
      question_id: question.id,
      answer: answer.trim() || "Skipped by candidate.",
    });

    const isLast = index >= session.questions.length - 1;
    if (isLast) {
      navigate(`/report/${sessionId}`);
      return;
    }
    setIndex((i) => i + 1);
    setAnswer("");
    setTimeLeft(QUESTION_TIME);
    setSaving(false);
  };

  const handleSkip = async () => {
    if (saving) return;
    setAnswer("Skipped by candidate.");
    await api.post(`/interviews/${sessionId}/answer`, {
      question_id: question.id,
      answer: "Skipped by candidate.",
    });
    const isLast = index >= session.questions.length - 1;
    if (isLast) {
      navigate(`/report/${sessionId}`);
      return;
    }
    setIndex((i) => i + 1);
    setAnswer("");
    setTimeLeft(QUESTION_TIME);
  };

  if (!session || !question) return <section className="panel">Loading interview...</section>;

  return (
    <section className="panel">
      <div className="progress-track"><div style={{ width: `${progress}%` }} /></div>
      <p>Question {index + 1}/{session.questions.length} | Time: {timeLeft}s</p>
      <h2>{question.question_text}</h2>
      <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={8} placeholder="Type your answer..." />
      <p>{answer.trim() ? answer.trim().split(/\s+/).length : 0} words</p>
      <div className="row">
        <button onClick={handleSubmit} disabled={saving}>{saving ? "Submitting..." : "Submit Answer"}</button>
        <button className="ghost" onClick={handleSkip} disabled={saving}>Skip</button>
      </div>
    </section>
  );
}
