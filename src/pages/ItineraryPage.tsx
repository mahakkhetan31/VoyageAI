import { useState, type FormEvent } from "react";
import { itineraryApi, type ItineraryResponse } from "../api/itinerary";
import { useToast } from "../context/ToastContext";

const INTEREST_OPTIONS = [
  "Culture", "Food", "Nature", "Adventure", "History",
  "Shopping", "Nightlife", "Art", "Photography", "Relaxation",
];

function ItineraryPage() {
  const [destination, setDestination] = useState("");
  const [budget, setBudget] = useState("");
  const [days, setDays] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [result, setResult] = useState<ItineraryResponse | null>(null);
  const { showToast } = useToast();

  function toggleInterest(interest: string) {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!destination || !budget || !days || selectedInterests.length === 0) {
      showToast("Please fill all fields and select at least one interest", "error");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await itineraryApi.generate({
        destination,
        budget: Number(budget),
        days: Number(days),
        interests: selectedInterests,
      });
      setResult(res.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail || "Failed to generate itinerary";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPdf() {
    if (!result) return;
    console.log("[Frontend PDF] 1. Initiating PDF download request for:", result.destination);
    setPdfLoading(true);
    try {
      const response = await itineraryApi.exportPdf(result);
      console.log("[Frontend PDF] 2. Received Blob response from backend:", response);

      const blobData = response.data as Blob;

      // Check if backend returned JSON error inside blob response
      if (blobData.type === "application/json") {
        const text = await blobData.text();
        const json = JSON.parse(text);
        throw new Error(json.detail || "Failed to export PDF");
      }

      const blob = new Blob([blobData], { type: "application/pdf" });
      console.log("[Frontend PDF] 3. Created Blob object, size:", blob.size, "bytes");

      const url = window.URL.createObjectURL(blob);
      console.log("[Frontend PDF] 4. Created object URL:", url);

      const safeDest = result.destination.replace(/[^a-zA-Z0-9]/g, "_");
      const a = document.createElement("a");
      a.href = url;
      a.download = `Itinerary_${safeDest}.pdf`;
      document.body.appendChild(a);

      console.log("[Frontend PDF] 5. Triggering anchor click for file download");
      a.click();

      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      console.log("[Frontend PDF] 6. Cleaned up object URL and temporary DOM elements");

      showToast("Itinerary PDF downloaded successfully!", "success");
    } catch (err: unknown) {
      console.error("[Frontend PDF ERROR] Failed to download PDF:", err);
      let errorMsg = "Failed to download PDF itinerary";

      const axiosErr = err as { response?: { data?: unknown }; message?: string };
      if (axiosErr.response?.data instanceof Blob) {
        try {
          const text = await axiosErr.response.data.text();
          const json = JSON.parse(text);
          if (json.detail) errorMsg = json.detail;
        } catch {
          // Use default error message if blob parsing fails
        }
      } else if (axiosErr.message) {
        errorMsg = axiosErr.message;
      }

      showToast(errorMsg, "error");
    } finally {
      setPdfLoading(false);
    }
  }


  return (
    <div className="itin-page">
      <div className="itin-container">
        {/* Header */}
        <header className="itin-header">
          <h1 className="itin-header__title">🗺️ Itinerary Planner</h1>
          <p className="itin-header__subtitle">AI-powered day-by-day travel plans</p>
        </header>

        {/* Input Form */}
        <form className="itin-form" onSubmit={handleSubmit}>
          <div className="itin-form__row">
            <div className="form-group">
              <label htmlFor="itin-dest">Destination</label>
              <input
                id="itin-dest"
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Tokyo, Japan"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="itin-budget">Budget (INR - ₹)</label>
              <input
                id="itin-budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 100000"
                min="1000"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label htmlFor="itin-days">Days</label>
              <input
                id="itin-days"
                type="number"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                placeholder="e.g. 5"
                min="1"
                max="30"
                disabled={loading}
              />
            </div>
          </div>

          <div className="itin-form__interests">
            <label>Interests</label>
            <div className="itin-form__chips">
              {INTEREST_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  className={`itin-chip ${selectedInterests.includes(interest) ? "itin-chip--active" : ""}`}
                  onClick={() => toggleInterest(interest)}
                  disabled={loading}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="itin-form__submit" disabled={loading}>
            {loading ? (
              <>
                <span className="itin-form__spinner" />
                Generating itinerary...
              </>
            ) : (
              "✨ Generate Itinerary"
            )}
          </button>
        </form>

        {/* Results */}
        {result && (
          <div className="itin-results">
            {/* Header & Download PDF Button */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h2 className="itin-section__title" style={{ margin: 0 }}>
                  📅 {result.days}-Day Itinerary for {result.destination}
                </h2>
                {result.exchange_rate_info && (
                  <div style={{
                    display: "inline-block",
                    background: "rgba(14, 165, 233, 0.1)",
                    border: "1px solid rgba(14, 165, 233, 0.3)",
                    color: "#0284c7",
                    padding: "0.35rem 0.8rem",
                    borderRadius: "20px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginTop: "0.5rem"
                  }}>
                    💱 Exchange Rate: <strong>{result.exchange_rate_info}</strong>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
                className="itin-form__submit"
                style={{ width: "auto", padding: "0.6rem 1.2rem", fontSize: "0.95rem", marginTop: 0 }}
              >
                {pdfLoading ? "⏳ Generating PDF..." : "📥 Download PDF Itinerary"}
              </button>
            </div>

            {/* Day-wise Itinerary */}
            <section className="itin-section">
              <div className="itin-timeline">
                {result.itinerary.map((day) => (
                  <div key={day.day} className="itin-day">
                    <div className="itin-day__marker">
                      <span className="itin-day__number">{day.day}</span>
                    </div>
                    <div className="itin-day__content">
                      <h3 className="itin-day__title">{day.title}</h3>
                      <ul className="itin-day__activities">
                        {day.activities.map((activity, i) => (
                          <li key={i}>{activity}</li>
                        ))}
                      </ul>
                      <span className="itin-day__cost">
                        ~₹{(day.estimated_cost_inr || 0).toLocaleString("en-IN")}
                        {result.currency_code && result.currency_code !== "INR" && day.estimated_cost_local && day.estimated_cost_local > 0 ? (
                          <span style={{ fontSize: "0.85em", opacity: 0.85, marginLeft: "0.35rem" }}>
                            ({result.currency_symbol || ""}{day.estimated_cost_local.toLocaleString("en-US", { maximumFractionDigits: 0 })} {result.currency_code})
                          </span>
                        ) : null}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Budget Breakdown */}
            <section className="itin-section">
              <h2 className="itin-section__title">💰 Budget Breakdown</h2>
              <div className="itin-budget">
                {Object.entries(result.budget_breakdown)
                  .filter(([key]) => key !== "total")
                  .map(([key, value]) => (
                    <div key={key} className="itin-budget__row">
                      <span className="itin-budget__label">{key}</span>
                      <div className="itin-budget__bar-track">
                        <div
                          className="itin-budget__bar-fill"
                          style={{
                            width: `${Math.min((value / result.budget_breakdown.total) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="itin-budget__value" style={{ textAlign: "right" }}>
                        <span>₹{value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                        {result.exchange_rate_to_inr && result.currency_code && result.currency_code !== "INR" ? (
                          <span style={{ fontSize: "0.8em", opacity: 0.75, display: "block" }}>
                            {result.currency_symbol || ""}{(value / result.exchange_rate_to_inr).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                <div className="itin-budget__total">
                  <span>Total</span>
                  <div style={{ textAlign: "right" }}>
                    <span>₹{result.budget_breakdown.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</span>
                    {result.exchange_rate_to_inr && result.currency_code && result.currency_code !== "INR" ? (
                      <span style={{ fontSize: "0.8em", opacity: 0.8, display: "block", color: "#64748b" }}>
                        {result.currency_symbol || ""}{(result.budget_breakdown.total / result.exchange_rate_to_inr).toLocaleString("en-US", { maximumFractionDigits: 0 })} {result.currency_code}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>


            {/* Packing List & Tips */}
            <div className="itin-columns">
              <section className="itin-section">
                <h2 className="itin-section__title">🎒 Packing List</h2>
                <ul className="itin-list">
                  {result.packing_list.map((item, i) => (
                    <li key={i} className="itin-list__item">
                      <span className="itin-list__check">☐</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="itin-section">
                <h2 className="itin-section__title">💡 Travel Tips</h2>
                <ul className="itin-list itin-list--tips">
                  {result.travel_tips.map((tip, i) => (
                    <li key={i} className="itin-list__item">
                      <span className="itin-list__bullet">→</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


export default ItineraryPage;
