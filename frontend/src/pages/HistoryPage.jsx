import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function HistoryPage() {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/history").then(({ data }) => setItems(data));
  }, []);

  return (
    <section className="panel">
      <h2>Interview History</h2>
      {items.length === 0 && <p>No interviews yet.</p>}
      <div className="list">
        {items.map((x) => (
          <article key={x.id} className="card">
            <h3>{x.candidate_name} - {x.job_role}</h3>
            <p>Score: {x.score}/10</p>
            <p>Difficulty: {x.difficulty}</p>
            <div className="row">
              <button onClick={() => navigate(`/report/${x.id}`)}>Open Report</button>
              <button
                className="ghost"
                onClick={async () => {
                  const { data } = await api.post(`/interviews/${x.id}/retry`);
                  navigate(`/interview/${data.id}`);
                }}
              >
                Retry
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
