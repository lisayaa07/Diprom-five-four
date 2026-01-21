import { useEffect, useState, type JSX } from "react";

type Workspace = {
  gid: string;
  name: string;
  resource_type?: string;
};

type MeResponse = {
  gid: string;
  email?: string;
  name?: string;
  photo?: unknown;
  resource_type?: string;
  workspaces?: Workspace[];
};

type State =
  | { status: "loading"; data: null; error: null }
  | { status: "success"; data: MeResponse; error: null }
  | { status: "error"; data: null; error: string };

export default function App(): JSX.Element {
  const [state, setState] = useState<State>({ status: "loading", data: null, error: null });

  useEffect(() => {
    const run = async () => {
      try {
        const base = "https://fmbqdx48-8080.asse.devtunnels.ms";
        const url = `${base}/users/me`;

        const res = await fetch(url, {
          headers: {
            Accept: "application/json",
            "X-Tunnel-Skip-AntiPhishing-Page": "True",
          },
        });

        const text = await res.text();

        let json: unknown;
        try {
          json = JSON.parse(text);
        } catch {
          throw new Error(`Non-JSON response (HTTP ${res.status}):\n${text.slice(0, 800)}`);
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}\n${JSON.stringify(json, null, 2)}`);

        setState({ status: "success", data: json as MeResponse, error: null });
      } catch (e) {
        setState({
          status: "error",
          data: null,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    };

    run();
  }, []);

  

  if (state.status === "loading") {
    return (
      <div style={{ padding: 16, fontFamily: "system-ui" }}>
        <h3>me</h3>
        <div>Loading...</div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div style={{ padding: 16, fontFamily: "system-ui" }}>
        <h3>me</h3>
        <pre style={{ whiteSpace: "pre-wrap", background: "#ffecec", padding: 12 }}>
          {state.error}
        </pre>
      </div>
    );
  }

  const me = state.data;

  return (
    <>
    
    <div style={{ padding: 16, fontFamily: "system-ui" }}>
      <h3>ข้อมูลผู้ใช้ /me</h3>

      <div style={{ lineHeight: 1.8 }}>
        <div><b>GID:</b> {me.gid}</div>
        <div><b>ชื่อ:</b> {me.name || "-"}</div>
        <div><b>อีเมล:</b> {me.email || "-"}</div>
        <div><b>ประเภท:</b> {me.resource_type || "-"}</div>
        <div><b>รูป:</b> {me.photo ? "มีข้อมูลรูป" : "-"}</div>
      </div>

      <hr style={{ margin: "16px 0" }} />

      <h4>Workspaces</h4>
      {me.workspaces && me.workspaces.length > 0 ? (
        <ul>
          {me.workspaces.map((w) => (
            <li key={w.gid}>
              <b>{w.name}</b> (gid: {w.gid}) {w.resource_type ? `- ${w.resource_type}` : ""}
            </li>
          ))}
        </ul>
      ) : (
        <div>- ไม่มี workspaces -</div>
      )}
    </div>
    <div>
      
    </div>
    </>
  );
}


