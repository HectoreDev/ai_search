import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { fetchServerSentEvents, useChat } from "@tanstack/ai-react";

const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const api = (path: string) => `${API_URL}${path}`;

type Filters = {
  query?: string;
  name?: string;
  storiesMin?: number;
  storiesMax?: number;
  sqftMin?: number;
  sqftMax?: number;
  bedsMin?: number;
  bedsMax?: number;
  bathsMin?: number;
  bathsMax?: number;
  garagesMin?: number;
  garagesMax?: number;
  states?: string[];
};

type Plan = {
  uid: string;
  name: string;
  bedrooms_min: number;
  bedrooms_max: number;
  bathrooms_min: number;
  bathroom_max: number;
  garage_min: number;
  garage_max: number;
  level_min: number;
  level_max: number;
  sqft_min: number;
  sqft_max: number;
  price: number;
  img_src: string | null;
  states: string[];
  statuses: string[];
  communities: string[];
};

type SearchResponse = {
  items: Plan[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const emptyResults: SearchResponse = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 12,
  totalPages: 1,
};
const stateOptions = [
  { code: "AZ", name: "Arizona" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "FL", name: "Florida" },
  { code: "ID", name: "Idaho" },
  { code: "NV", name: "Nevada" },
  { code: "NC", name: "North Carolina" },
  { code: "TX", name: "Texas" },
  { code: "WA", name: "Washington" },
];

function numericValue(value: string) {
  return value === "" ? undefined : Number(value);
}

export default function App() {
  const [filters, setFilters] = useState<Filters>({});
  const [results, setResults] = useState<SearchResponse>(emptyResults);
  const [chat, setChat] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [searchJson, setSearchJson] = useState<unknown>(null);
  const {
    messages,
    sendMessage,
    isLoading: isChatLoading,
    error: chatError,
  } = useChat({
    connection: fetchServerSentEvents(api("/api/chat")),
    onFinish: (message) => {
      for (const part of message.parts) {
        if (
          part.type !== "tool-call" ||
          part.name !== "search_floor_plans" ||
          !part.output
        )
          continue;
        const output = part.output as {
          filters: Filters;
          results: SearchResponse;
        };
        setFilters(output.filters);
        setResults(output.results);
        setSearchJson({
          source: "search_floor_plans",
          receivedAt: new Date().toISOString(),
          ...output,
        });
      }
    },
  });

  async function search(next = filters, page = 1) {
    setLoading(true);
    setNotice("");
    const params = new URLSearchParams({ page: String(page), pageSize: "12" });
    Object.entries(next).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== "" &&
        (!Array.isArray(value) || value.length)
      ) {
        params.set(key, Array.isArray(value) ? value.join(",") : String(value));
      }
    });
    try {
      const response = await fetch(api(`/api/plans?${params}`));
      if (!response.ok) throw new Error("Unable to search floor plans");
      const data = (await response.json()) as SearchResponse;
      setResults(data);
      setSearchJson({
        source: "GET /api/plans",
        receivedAt: new Date().toISOString(),
        filters: next,
        response: data,
      });
    } catch (error) {
      setNotice(String(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void search({});
  }, []);

  async function submitChat(event: FormEvent) {
    event.preventDefault();
    if (!chat.trim()) return;
    const message = chat.trim();
    setChat("");
    setNotice("");
    await sendMessage(message);
  }

  function update(key: keyof Filters, value: string | string[]) {
    setFilters((current) => ({
      ...current,
      [key]: Array.isArray(value)
        ? value
        : numericKeys.has(key)
          ? numericValue(value)
          : value || undefined,
    }));
  }

  const activeCount = useMemo(
    () =>
      Object.values(filters).filter(
        (value) =>
          value !== undefined &&
          value !== "" &&
          (!Array.isArray(value) || value.length),
      ).length,
    [filters],
  );
  const assistantText = useMemo(() => {
    const assistant = [...messages]
      .reverse()
      .find((message) => message.role === "assistant");
    return (
      assistant?.parts
        .filter((part) => part.type === "text")
        .map((part) => part.content)
        .join("") ?? ""
    );
  }, [messages]);

  return (
    <div className="app-shell">
      <header>
        <a className="brand" href="#">
          <img src="/kblogo.svg" alt="KB Home" />
        </a>
      </header>

      <main className="search-page">
          <section className="hero">
            <form className="chat-box" onSubmit={submitChat}>
              <div className="spark">✦</div>
              <textarea
                value={chat}
                onChange={(event) => setChat(event.target.value)}
                aria-label="Describe the floor plan you are looking for"
                placeholder="Ask AI: I want plan 2015 with 3 beds, 2 baths, 2500 sqft and 2 stories in Nevada and Washington..."
              />
              <button disabled={loading || isChatLoading} aria-label="Search">
                Search
              </button>
            </form>
            <button
              type="button"
              className="search-example"
              onClick={() =>
                setChat(
                  "I want plan 1765 with 3 bedrooms, 2 bathrooms, 2500 sqft and 2 stories in Nevada and Washington",
                )
              }
            >
              <span>Try:</span> I want plan 2015 with 3 bedrooms, 2 bathrooms,
              2500 sqft and 2 stories in Nevada and Washington
            </button>
            {(isChatLoading || assistantText || notice || chatError) && (
              <div className="notice chat-response">
                {isChatLoading && !assistantText
                  ? "Understanding your search…"
                  : assistantText || notice || chatError?.message}
                {isChatLoading && assistantText && <span className="cursor" />}
              </div>
            )}
          </section>

          <section className="workspace">
            <aside className="filters">
              <div className="filter-heading">
                <h2>Filter plans</h2>
                {activeCount > 0 && <span>{activeCount}</span>}
              </div>
              <label>
                Floor plan
                <input
                  placeholder="Search Floor Plan..."
                  value={filters.name ?? ""}
                  onChange={(e) => update("name", e.target.value)}
                />
              </label>
              <Range
                label="Stories"
                min={filters.storiesMin}
                max={filters.storiesMax}
                onMin={(v) => update("storiesMin", v)}
                onMax={(v) => update("storiesMax", v)}
              />
              <Range
                label="Square feet"
                min={filters.sqftMin}
                max={filters.sqftMax}
                onMin={(v) => update("sqftMin", v)}
                onMax={(v) => update("sqftMax", v)}
              />
              <Range
                label="Bedrooms"
                min={filters.bedsMin}
                max={filters.bedsMax}
                onMin={(v) => update("bedsMin", v)}
                onMax={(v) => update("bedsMax", v)}
              />
              <Range
                label="Bathrooms"
                min={filters.bathsMin}
                max={filters.bathsMax}
                onMin={(v) => update("bathsMin", v)}
                onMax={(v) => update("bathsMax", v)}
              />
              <Range
                label="Garages"
                min={filters.garagesMin}
                max={filters.garagesMax}
                onMin={(v) => update("garagesMin", v)}
                onMax={(v) => update("garagesMax", v)}
              />
              <StateMultiSelect
                value={filters.states ?? []}
                onChange={(states) => update("states", states)}
              />
              <button className="apply" onClick={() => void search()}>
                Apply filters
              </button>
              <button
                className="clear"
                onClick={() => {
                  setFilters({});
                  void search({});
                }}
              >
                Clear filters
              </button>
            </aside>

            <div className="results">
              <div className="results-heading">
                <div>
                  <span>Floor plans</span>
                  <h2>{results.total.toLocaleString()} plans found</h2>
                </div>
              </div>
              <JsonViewer data={searchJson} />
              {loading ? (
                <div className="empty">Buscando los mejores planos…</div>
              ) : results.items.length ? (
                <div className="grid">
                  {results.items.map((plan) => (
                    <PlanCard key={plan.uid} plan={plan} />
                  ))}
                </div>
              ) : (
                <div className="empty">
                  <b>No encontramos coincidencias.</b>
                  <span>Prueba ampliando uno de los rangos.</span>
                </div>
              )}
              <div className="pagination">
                <button
                  aria-label="Previous page"
                  disabled={results.page <= 1}
                  onClick={() => void search(filters, results.page - 1)}
                >
                  ‹
                </button>
                <span>
                  Page {results.page} of {results.totalPages} ({results.total.toLocaleString()} results)
                </span>
                <button
                  aria-label="Next page"
                  disabled={results.page >= results.totalPages}
                  onClick={() => void search(filters, results.page + 1)}
                >
                  ›
                </button>
              </div>
            </div>
          </section>
      </main>
    </div>
  );
}

const numericKeys = new Set<keyof Filters>([
  "storiesMin",
  "storiesMax",
  "sqftMin",
  "sqftMax",
  "bedsMin",
  "bedsMax",
  "bathsMin",
  "bathsMax",
  "garagesMin",
  "garagesMax",
]);

function Range({
  label,
  min,
  max,
  onMin,
  onMax,
}: {
  label: string;
  min?: number;
  max?: number;
  onMin: (v: string) => void;
  onMax: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend>{label}</legend>
      <div className="range">
        <input
          type="number"
          placeholder="Min"
          value={min ?? ""}
          onChange={(e) => onMin(e.target.value)}
        />
        <input
          type="number"
          placeholder="Max"
          value={max ?? ""}
          onChange={(e) => onMax(e.target.value)}
        />
      </div>
    </fieldset>
  );
}

function StateMultiSelect({ value, onChange }: { value: string[]; onChange: (states: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function toggle(code: string) {
    onChange(value.includes(code) ? value.filter((state) => state !== code) : [...value, code]);
  }

  return (
    <fieldset className={`state-select ${open ? "open" : ""}`}>
      <legend>State</legend>
      <div ref={rootRef} className="state-select-root">
        <div className="state-control" onClick={() => setOpen((current) => !current)}>
          <div className="state-chips">
            {value.length ? value.map((code) => (
              <button key={code} type="button" className="state-chip" onClick={(event) => { event.stopPropagation(); toggle(code); }}>
                {stateOptions.find((state) => state.code === code)?.name ?? code}<span>×</span>
              </button>
            )) : <span className="state-placeholder">All states</span>}
          </div>
          {value.length > 0 && <button type="button" className="clear-states" aria-label="Clear selected states" onClick={(event) => { event.stopPropagation(); onChange([]); }}>×</button>}
          <span className="state-chevron">{open ? "▴" : "▾"}</span>
        </div>
        {open && <div className="state-menu">
          {stateOptions.map((state) => <button type="button" className={value.includes(state.code) ? "selected" : ""} key={state.code} onClick={() => toggle(state.code)}>{state.name}</button>)}
        </div>}
      </div>
    </fieldset>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <article className="plan-card">
      <div className="plan-card-head">
        <div>
          <h3>{plan.name}</h3>
          <p>{plan.communities[0] || "KB Home"} · {plan.states.join(", ") || "Available"}</p>
          <span>⌂ {plan.communities.length || 1} community</span>
        </div>
        <i className="active-pill">{plan.statuses[0] || "Active"}</i>
      </div>
      <div
        className="plan-image"
        style={
          plan.img_src ? { backgroundImage: `url(${plan.img_src})` } : undefined
        }
      >
        {!plan.img_src && <span>{plan.name.slice(0, 1)}</span>}
        <button className="image-next" aria-label="Next image">›</button>
      </div>
      <div className="plan-body">
        <p className="price">From <strong>{plan.price > 0 ? `$${plan.price.toLocaleString()}` : "Contact us"}</strong></p>
        <dl>
          <div>
            <dd>{formatRange(plan.bedrooms_min, plan.bedrooms_max)}</dd>
            <dt>BED</dt>
          </div>
          <div>
            <dd>{formatRange(plan.bathrooms_min, plan.bathroom_max)}</dd>
            <dt>BATH</dt>
          </div>
          <div>
            <dd>{formatRange(plan.sqft_min, plan.sqft_max)}</dd>
            <dt>SQFT</dt>
          </div>
          <div>
            <dd>{formatRange(plan.level_min, plan.level_max)}</dd>
            <dt>STORY</dt>
          </div>
          <div>
            <dd>{formatRange(plan.garage_min, plan.garage_max)}</dd>
            <dt>GARAGE</dt>
          </div>
        </dl>
      </div>
      <div className="plan-actions"><button>☷ &nbsp; Compare</button><button>♡ &nbsp; Show plan details</button></div>
    </article>
  );
}

function formatRange(min: number, max: number) {
  return min === max
    ? min.toLocaleString()
    : `${min.toLocaleString()}–${max.toLocaleString()}`;
}

function JsonViewer({ data }: { data: unknown }) {
  const [copied, setCopied] = useState(false);
  if (!data) return null;
  const json = JSON.stringify(data, null, 2);

  async function copy() {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <details className="json-viewer">
      <summary>
        <span><b>{"{ }"}</b> Search JSON response</span>
        <small>View data</small>
      </summary>
      <div className="json-toolbar">
        <span>Response received from the backend</span>
        <button type="button" onClick={() => void copy()}>
          {copied ? "Copied" : "Copy JSON"}
        </button>
      </div>
      <pre><code>{json}</code></pre>
    </details>
  );
}

function Admin({ onSaved }: { onSaved: () => void }) {
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = {
      uid: form.get("uid"),
      floorPlanUid: form.get("floorPlanUid") || null,
      communityUid: form.get("communityUid"),
      name: form.get("name"),
      bedroomsMin: form.get("bedroomsMin"),
      bedroomsMax: form.get("bedroomsMax"),
      bathroomsMin: form.get("bathroomsMin"),
      bathroomsMax: form.get("bathroomsMax"),
      sqftMin: form.get("sqftMin"),
      sqftMax: form.get("sqftMax"),
      levelMin: form.get("levelMin"),
      levelMax: form.get("levelMax"),
      garageMin: form.get("garageMin") || 0,
      garageMax: form.get("garageMax") || 0,
      price: form.get("price") || 0,
      imgSrc: form.get("imgSrc") || null,
      basegroupUrl: form.get("basegroupUrl") || null,
    };
    const response = await fetch(api("/api/plans"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (response.ok) {
      setMessage("Floor plan saved successfully.");
      event.currentTarget.reset();
      setTimeout(onSaved, 700);
    } else setMessage("Review the form values and try again.");
  }
  return (
    <main className="admin-page">
      <section>
        <span className="kicker">Administration</span>
        <h1>Add a floor plan</h1>
        <p>
          Save the plan to the shared <code>vu-ai</code> D1 database and connect
          it to an existing community.
        </p>
        <form className="admin-form" onSubmit={submit}>
          <label>
            Name*
            <input name="name" required placeholder="2015" />
          </label>
          <label>
            Plan UID*
            <input name="uid" required placeholder="zxgTv9RL4Nr8Ueez978c" />
          </label>
          <label>
            Floor plan UID
            <input name="floorPlanUid" />
          </label>
          <label>
            Community UID*
            <input name="communityUid" required />
          </label>
          <label>
            Minimum bedrooms*
            <input name="bedroomsMin" type="number" step="0.5" required />
          </label>
          <label>
            Maximum bedrooms*
            <input name="bedroomsMax" type="number" step="0.5" required />
          </label>
          <label>
            Minimum bathrooms*
            <input name="bathroomsMin" type="number" step="0.5" required />
          </label>
          <label>
            Maximum bathrooms*
            <input name="bathroomsMax" type="number" step="0.5" required />
          </label>
          <label>
            Minimum sqft*
            <input name="sqftMin" type="number" required />
          </label>
          <label>
            Maximum sqft*
            <input name="sqftMax" type="number" required />
          </label>
          <label>
            Minimum stories*
            <input name="levelMin" type="number" step="0.5" required />
          </label>
          <label>
            Maximum stories*
            <input name="levelMax" type="number" step="0.5" required />
          </label>
          <label>
            Minimum garages
            <input name="garageMin" type="number" step="0.5" />
          </label>
          <label>
            Maximum garages
            <input name="garageMax" type="number" step="0.5" />
          </label>
          <label>
            Price
            <input name="price" type="number" />
          </label>
          <label>
            URL basegroup
            <input name="basegroupUrl" type="url" />
          </label>
          <label className="wide">
            Image URL
            <input name="imgSrc" type="url" placeholder="https://…" />
          </label>
          <button className="apply wide">Save floor plan</button>
          {message && <div className="notice wide">{message}</div>}
        </form>
      </section>
    </main>
  );
}
