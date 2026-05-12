import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import api from "../api";

export default function ReportPage() {
  const { sessionId } = useParams();
  const [report, setReport] = useState(null);

  useEffect(() => {
    api.get(`/interviews/${sessionId}/report`).then(({ data }) => setReport(data));
  }, [sessionId]);

  const chartData = useMemo(() => {
    if (!report) return [];
    const scores = report.questions.map((q, idx) => ({
      skill: `Q${idx + 1}`,
      score: q.evaluation.relevance_score || 0,
    }));
    return scores;
  }, [report]);

  if (!report) return <section className="panel">Loading report...</section>;

  return (
    <section className="panel">
      <h2>Overall Score: {report.overall_score}/10</h2>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart data={chartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="skill" />
            <PolarRadiusAxis domain={[0, 10]} />
            <Radar dataKey="score" fill="#0ea5e9" fillOpacity={0.5} stroke="#0284c7" />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      {report.questions.map((q) => (
        <details key={q.id} className="qa">
          <summary>Q{q.order_index}: {q.question_text}</summary>
          <p><strong>Your answer:</strong> {q.user_answer}</p>
          <p><strong>Score:</strong> {q.evaluation.relevance_score}/10</p>
          <p><strong>Good points:</strong> {q.evaluation.good_points}</p>
          <p><strong>Missing points:</strong> {q.evaluation.missing_points}</p>
          <p><strong>Ideal answer:</strong> {q.evaluation.ideal_answer}</p>
          <p><strong>Confidence:</strong> {q.evaluation.confidence_analysis}</p>
        </details>
      ))}
    </section>
  );
}
