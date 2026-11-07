mod native_search;
mod rules;
mod search;
use serde_json::{json, Value};
use std::io::{self, BufRead, Write};
fn execute(r: &Value) -> Result<Value, String> {
    if r["schemaVersion"] != 1 {
        return Err("Unsupported contract schema".into());
    }
    let id = r.get("id").cloned().unwrap_or(Value::Null);
    let mut out = match r["game"].as_str().unwrap_or("") {
        "schness-rules-v1" => {
            let mut p = rules::Position::parse(&r["state"])?;
            let aa = p.actions();
            let mut keys: Vec<_> = aa.iter().map(|a| a.key()).collect();
            keys.sort();
            let result = p.result(&aa);
            let next = if r["action"].is_null() {
                Value::Null
            } else {
                let a = rules::Action::parse(&r["action"])?;
                if !aa.contains(&a) {
                    return Err("Illegal action".into());
                }
                p.advance(a, true);
                p.json()
            };
            json!({"legalActionKeys":keys,"result":result,"nextState":next})
        }
        "schness-v1" => search::choose(
            search::State::Chess(rules::Position::parse(&r["state"])?),
            &r["options"],
        )?,
        "graph-v1" => search::choose(
            search::State::Graph {
                nodes: r["state"]["nodes"].clone(),
                node: r["state"]["root"]
                    .as_str()
                    .ok_or("Missing graph root")?
                    .into(),
            },
            &r["options"],
        )?,
        _ => return Err("Unsupported game".into()),
    };
    out["id"] = id;
    Ok(out)
}
fn main() {
    let stdin = io::stdin();
    let mut out = io::BufWriter::new(io::stdout());
    for line in stdin.lock().lines() {
        let line = match line {
            Ok(x) => x,
            Err(_) => break,
        };
        if line.trim().is_empty() {
            continue;
        }
        let parsed = serde_json::from_str::<Value>(&line);
        let answer = match parsed {
            Ok(r) => execute(&r).unwrap_or_else(
                |e| json!({"id":r.get("id").cloned().unwrap_or(Value::Null),"error":{"message":e}}),
            ),
            Err(e) => json!({"id":null,"error":{"message":e.to_string()}}),
        };
        writeln!(out, "{}", answer).unwrap();
        out.flush().unwrap();
    }
}
