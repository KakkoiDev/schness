//! Typed, reversible native search. JSON is confined to the process boundary.
use crate::rules::*;
use crate::search::evaluate_chess;
use serde_json::{json, Value};
use std::collections::{HashMap, VecDeque};
use std::time::{Duration, Instant};
struct Context {
    nodes: u64,
    max: u64,
    deadline: Option<Instant>,
    q: usize,
    e: usize,
    checks: bool,
    competitive: bool,
    lmr: bool,
    drops: bool,
    eval_cache: Option<HashMap<String, f64>>,
    eval_fifo: VecDeque<String>,
    capacity: usize,
    evaluations: u64,
    evaluation_hits: u64,
}
impl Context {
    // Only static values are cached; terminal/repetition adjudication must run first.
    fn evaluate(&mut self, p: &Position, who: usize, count: usize) -> f64 {
        let key = self.eval_cache.as_ref().map(|_| p.key());
        if let Some(v) = key
            .as_ref()
            .and_then(|k| self.eval_cache.as_ref().unwrap().get(k))
        {
            self.evaluation_hits += 1;
            return *v;
        }
        self.evaluations += 1;
        let value = evaluate_chess(p, who, self.competitive, count);
        if let Some(k) = key {
            let table = self.eval_cache.as_mut().unwrap();
            if table.len() >= self.capacity {
                if let Some(old) = self.eval_fifo.pop_front() {
                    table.remove(&old);
                }
            }
            self.eval_fifo.push_back(k.clone());
            table.insert(k, value);
        }
        value
    }
    fn enter(&mut self) -> Result<(), ()> {
        if self.nodes >= self.max || self.deadline.map(|t| Instant::now() >= t).unwrap_or(false) {
            return Err(());
        }
        self.nodes += 1;
        Ok(())
    }
}
fn terminal(p: &Position, who: usize, d: usize, aa: &[Action]) -> Option<f64> {
    if p.phase == "setup" {
        return if aa.is_empty() { Some(0.0) } else { None };
    }
    if p.phase != "play" {
        return None;
    }
    if p.repetitions.get(&p.key()).copied().unwrap_or(0) >= 3 {
        return Some(0.0);
    }
    if !aa.is_empty() {
        return None;
    }
    Some(if p.check(p.turn) {
        (1000000 + d) as f64 * if p.turn == who { -1.0 } else { 1.0 }
    } else {
        0.0
    })
}
fn ordered(p: &Position, mut aa: Vec<Action>, competitive: bool) -> Vec<Action> {
    let values = [0, 0, 500, 320, 300];
    aa.sort_by_cached_key(|&a| {
        let victim = p.board[a.to];
        let capture = if a.kind == 0 && victim != 0 {
            if competitive {
                10000 + values[kind(victim) as usize] * 10 - values[kind(p.board[a.from]) as usize]
            } else {
                100 + values[kind(victim) as usize]
            }
        } else {
            0
        };
        let rank = if competitive {
            capture
                + if board_check(&board_after(p, a), 1 - p.turn) {
                    2000
                } else {
                    0
                }
                + if a.to % 4 == 1 || a.to % 4 == 2 { 8 } else { 0 }
                + if a.to / 4 == 1 || a.to / 4 == 2 { 8 } else { 0 }
        } else if capture > 0 {
            capture
        } else if a.kind == 0 {
            20
        } else if a.kind == 1 {
            10 + values[a.piece as usize] / 100
        } else {
            0
        };
        -rank
    });
    aa
}
fn visit(
    p: &mut Position,
    d: usize,
    q: usize,
    e: usize,
    mut alpha: f64,
    mut beta: f64,
    who: usize,
    c: &mut Context,
) -> Result<(f64, Vec<Action>), ()> {
    c.enter()?;
    let aa = p.actions();
    if let Some(v) = terminal(p, who, d, &aa) {
        return Ok((v, vec![]));
    }
    let maxing = p.turn == who;
    let danger = p.check(p.turn);
    let mut best = if maxing {
        f64::NEG_INFINITY
    } else {
        f64::INFINITY
    };
    let mut line = vec![];
    let selected = if d == 0 {
        let stand = c.evaluate(p, who, aa.len());
        if q == 0 && !(danger && e > 0) {
            return Ok((stand, line));
        }
        if !danger {
            best = stand;
            if maxing {
                alpha = alpha.max(stand)
            } else {
                beta = beta.min(stand)
            }
            if beta <= alpha {
                return Ok((best, line));
            }
        }
        aa.into_iter()
            .filter(|&a| {
                danger
                    || (a.kind == 0 && p.board[a.to] != 0)
                    || c.checks && board_check(&board_after(p, a), 1 - p.turn)
            })
            .collect()
    } else {
        aa
    };
    for (i, a) in ordered(p, selected, c.competitive).into_iter().enumerate() {
        let reducible = c.lmr
            && d >= 3
            && i >= 3
            && !danger
            && (a.kind == 0 && p.board[a.to] == 0 || a.kind == 1 && c.drops);
        let undo = p.push_search(a);
        let result = (|| {
            let nq = if d == 0 { q.saturating_sub(1) } else { c.q };
            let ne = if d == 0 && q == 0 {
                e.saturating_sub(1)
            } else if d > 0 {
                c.e
            } else {
                e
            };
            if reducible && !p.check(p.turn) {
                let r = visit(p, d - 2, nq, ne, alpha, beta, who, c)?;
                if maxing && r.0 <= alpha || !maxing && r.0 >= beta {
                    return Ok(r);
                }
            }
            visit(p, d.saturating_sub(1), nq, ne, alpha, beta, who, c)
        })();
        p.pop_search(undo);
        let (v, pv) = result?;
        if if maxing { v > best } else { v < best } {
            best = v;
            line = vec![a];
            line.extend(pv)
        }
        if maxing {
            alpha = alpha.max(best)
        } else {
            beta = beta.min(best)
        }
        if beta <= alpha {
            break;
        }
    }
    Ok((best, line))
}
pub fn choose(
    mut p: Position,
    o: &Value,
    depth: usize,
    q: usize,
    e: usize,
    max: u64,
    time: Option<f64>,
    competitive: bool,
) -> Result<Value, String> {
    if !o["cacheEvaluation"].is_null() && !o["cacheEvaluation"].is_boolean() {
        return Err("Invalid cacheEvaluation".into());
    }
    let capacity = o["maxTableEntries"].as_u64().unwrap_or(50000) as usize;
    if capacity == 0 || (!o["maxTableEntries"].is_null() && o["maxTableEntries"].as_u64().is_none())
    {
        return Err("Invalid table capacity".into());
    }
    let mut c = Context {
        nodes: 0,
        max,
        deadline: time.map(|t| Instant::now() + Duration::from_secs_f64(t / 1000.0)),
        q,
        e,
        checks: o["quiescenceChecks"].as_bool().unwrap_or(competitive),
        competitive,
        lmr: o["lateMoveReduction"].as_bool().unwrap_or(competitive),
        drops: o["reduceQuietDrops"] == true,
        eval_cache: if o["cacheEvaluation"] == true {
            Some(HashMap::new())
        } else {
            None
        },
        eval_fifo: VecDeque::new(),
        capacity,
        evaluations: 0,
        evaluation_hits: 0,
    };
    let who = p.turn;
    if !o["rootOrdering"].is_null() && !o["rootOrdering"].is_boolean() {
        return Err("Invalid rootOrdering".into());
    }
    let mut aa = ordered(&p, p.actions(), competitive);
    if let Some(v) = terminal(&p, who, depth, &aa) {
        return Ok(
            json!({"action":null,"score":v,"requestedDepth":depth,"completedDepth":0,"nodes":0,"stopped":false,"pv":[],"variations":[]}),
        );
    }
    if aa.is_empty() {
        return Err("Nonterminal state without legal actions".into());
    }
    let mut out = json!({"action":aa[0].json(),"score":null,"requestedDepth":depth,"completedDepth":0,"nodes":0,"stopped":false,"pv":[],"variations":[]});
    if depth == 0 {
        return Ok(out);
    }
    let multi = o["multiPv"].as_u64().unwrap_or(1) as usize;
    if multi == 0 || multi > 10 {
        return Err("Invalid multiPv".into());
    }
    let depths = if o["iterativeDeepening"] == false {
        vec![depth]
    } else {
        (1..=depth).collect()
    };
    for d in depths {
        if c.enter().is_err() {
            out["stopped"] = json!(true);
            break;
        }
        let mut lines = vec![];
        let mut ranked_actions = vec![];
        let mut alpha = f64::NEG_INFINITY;
        let mut stopped = false;
        for &a in &aa {
            let undo = p.push_search(a);
            let result = visit(
                &mut p,
                d - 1,
                q,
                e,
                if multi == 1 { alpha } else { f64::NEG_INFINITY },
                f64::INFINITY,
                who,
                &mut c,
            );
            p.pop_search(undo);
            match result {
                Ok((v, pv)) => {
                    let mut line = vec![a.json()];
                    line.extend(pv.into_iter().map(Action::json));
                    ranked_actions.push((a, v));
                    lines.push(json!({"action":a.json(),"score":v,"pv":line}));
                    alpha = alpha.max(v)
                }
                Err(_) => {
                    stopped = true;
                    break;
                }
            }
        }
        if stopped {
            out["stopped"] = json!(true);
            break;
        }
        lines.sort_by(|a, b| {
            b["score"]
                .as_f64()
                .unwrap()
                .total_cmp(&a["score"].as_f64().unwrap())
        });
        // Reorder only after an entire iteration completes. Multi-PV truncation
        // must never remove root actions from the next iteration's search.
        if o["rootOrdering"] != false {
            ranked_actions.sort_by(|a, b| b.1.total_cmp(&a.1));
            aa = ranked_actions.into_iter().map(|(a, _)| a).collect();
        }
        lines.truncate(multi);
        out["action"] = lines[0]["action"].clone();
        out["score"] = lines[0]["score"].clone();
        out["pv"] = lines[0]["pv"].clone();
        out["variations"] = json!(lines);
        out["completedDepth"] = json!(d);
        if !c.lmr && o["stopOnProvenWin"] == true && out["score"].as_f64().unwrap() >= 1000000.0 {
            break;
        }
    }
    out["nodes"] = json!(c.nodes);
    out["stats"] = json!({"evaluations":c.evaluations,"evaluationCacheHits":c.evaluation_hits,
        "evaluationTableEntries":c.eval_cache.as_ref().map_or(0, HashMap::len)});
    Ok(out)
}

#[cfg(test)]
mod cache_tests {
    use super::*;
    fn context() -> Context {
        Context {
            nodes: 0,
            max: u64::MAX,
            deadline: None,
            q: 0,
            e: 0,
            checks: false,
            competitive: false,
            lmr: false,
            drops: false,
            eval_cache: Some(HashMap::new()),
            eval_fifo: VecDeque::new(),
            capacity: 1,
            evaluations: 0,
            evaluation_hits: 0,
        }
    }
    #[test]
    fn static_cache_is_bounded_and_never_bypasses_repetition_terminal() {
        let corpus: Value = serde_json::from_str(include_str!(
            "../../test/fixtures/engine-contract/rules.json"
        ))
        .unwrap();
        let mut p = corpus["cases"]
            .as_array()
            .unwrap()
            .iter()
            .map(|c| Position::parse(&c["state"]).unwrap())
            .find(|p| p.phase == "play" && !p.actions().is_empty())
            .unwrap();
        let mut c = context();
        let n = p.actions().len();
        let v = c.evaluate(&p, p.turn, n);
        assert_eq!(c.evaluate(&p, p.turn, n), v);
        assert_eq!(c.evaluation_hits, 1);
        let u = p.push_search(p.actions()[0]);
        c.evaluate(&p, p.turn, n);
        assert_eq!(c.eval_cache.as_ref().unwrap().len(), 1);
        assert_eq!(c.eval_fifo.len(), 1);
        p.pop_search(u);
        c.evaluate(&p, p.turn, n);
        assert_eq!(c.evaluations, 3);
        p.repetitions.insert(p.key(), 3);
        let before = c.evaluations;
        let who = p.turn;
        assert_eq!(
            visit(
                &mut p,
                0,
                0,
                0,
                f64::NEG_INFINITY,
                f64::INFINITY,
                who,
                &mut c
            )
            .unwrap()
            .0,
            0.0
        );
        assert_eq!(c.evaluations, before);
    }
    #[test]
    fn cached_search_matches_uncached_and_cancellation_keeps_legal_fallback() {
        let corpus: Value = serde_json::from_str(include_str!(
            "../../test/fixtures/engine-contract/rules.json"
        ))
        .unwrap();
        for case in corpus["cases"].as_array().unwrap().iter().step_by(7) {
            let p = Position::parse(&case["state"]).unwrap();
            let plain = choose(
                p.clone(),
                &json!({"iterativeDeepening":false,"lateMoveReduction":false}),
                3,
                0,
                0,
                u64::MAX,
                None,
                false,
            )
            .unwrap();
            let cached=choose(p.clone(),&json!({"iterativeDeepening":false,"lateMoveReduction":false,"cacheEvaluation":true,"maxTableEntries":8}),3,0,0,u64::MAX,None,false).unwrap();
            assert_eq!(plain["score"], cached["score"]);
            assert_eq!(plain["nodes"], cached["nodes"]);
            assert_eq!(plain["action"], cached["action"]);
            let stopped = choose(
                p,
                &json!({"cacheEvaluation":true}),
                20,
                0,
                0,
                1,
                None,
                false,
            )
            .unwrap();
            assert_eq!(stopped["completedDepth"], 0);
        }
    }
}

#[cfg(test)]
mod root_tests {
    use super::*;
    #[test]
    fn completed_root_order_preserves_exact_scores_and_full_search_set() {
        let corpus: Value = serde_json::from_str(include_str!(
            "../../test/fixtures/engine-contract/rules.json"
        ))
        .unwrap();
        for case in corpus["cases"].as_array().unwrap().iter().step_by(5) {
            let p = Position::parse(&case["state"]).unwrap();
            for multi in [1, 3] {
                let options = |enabled| json!({"rootOrdering":enabled,"lateMoveReduction":false,"multiPv":multi});
                let a = choose(p.clone(), &options(false), 3, 0, 0, u64::MAX, None, false).unwrap();
                let b = choose(p.clone(), &options(true), 3, 0, 0, u64::MAX, None, false).unwrap();
                assert_eq!(a["score"], b["score"]);
                assert_eq!(a["completedDepth"], b["completedDepth"]);
                if multi > 1 {
                    assert_eq!(
                        a["variations"]
                            .as_array()
                            .unwrap()
                            .iter()
                            .map(|x| x["score"].clone())
                            .collect::<Vec<_>>(),
                        b["variations"]
                            .as_array()
                            .unwrap()
                            .iter()
                            .map(|x| x["score"].clone())
                            .collect::<Vec<_>>()
                    );
                }
            }
        }
    }
}
