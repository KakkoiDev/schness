//! Typed, reversible native search. JSON is confined to the process boundary.
use crate::rules::*;
use crate::search::evaluate_chess;
use serde_json::{json, Value};
use std::collections::{HashMap, VecDeque};
use std::time::{Duration, Instant};
#[derive(Clone)]
struct Bound {
    value: f64,
    line: Vec<Action>,
    kind: u8,
}
type SearchKey = (String, Vec<(String, u32)>, usize);
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
    table: Option<HashMap<SearchKey, Bound>>,
    table_fifo: VecDeque<SearchKey>,
    hints: HashMap<String, Action>,
    hint_fifo: VecDeque<String>,
    root_counts: HashMap<String, u32>,
    killers: HashMap<usize, Vec<Action>>,
    history: HashMap<(usize, Action), u64>,
    use_history: bool,
    pvs: bool,
    cache_hits: u64,
    cutoffs: u64,
    pvs_researches: u64,
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
    fn search_key(&self, p: &Position, d: usize) -> SearchKey {
        // Root history is constant during a search. Include all added counts;
        // equal boards with different repetition rights never share bounds.
        let mut counts: Vec<_> = p
            .repetitions
            .iter()
            .filter_map(|(k, n)| {
                let old = self.root_counts.get(k).copied().unwrap_or(0);
                if *n > old {
                    Some((k.clone(), *n - old))
                } else {
                    None
                }
            })
            .collect();
        counts.sort_unstable();
        (p.key(), counts, d)
    }
    fn store(&mut self, key: SearchKey, bound: Bound) {
        if let Some(table) = self.table.as_mut() {
            if !table.contains_key(&key) {
                if table.len() >= self.capacity {
                    if let Some(old) = self.table_fifo.pop_front() {
                        table.remove(&old);
                    }
                }
                self.table_fifo.push_back(key.clone());
            }
            table.insert(key, bound);
        }
    }
    fn order(&self, p: &Position, aa: Vec<Action>, d: usize) -> Vec<Action> {
        let mut aa = ordered(p, aa, self.competitive);
        let hint = self.hints.get(&p.key());
        let killers = self.killers.get(&d);
        aa.sort_by_cached_key(|a| {
            let tactical = a.kind == 0 && p.board[a.to] != 0;
            let killer = killers
                .and_then(|ks| ks.iter().position(|x| x == a))
                .map_or(0, |i| 2 - i);
            let history = self.history.get(&(p.turn, *a)).copied().unwrap_or(0);
            std::cmp::Reverse((hint == Some(a), tactical, killer, history))
        });
        aa
    }
    fn cutoff(&mut self, p: &Position, a: Action, d: usize) {
        self.cutoffs += 1;
        if !self.use_history || a.kind == 0 && p.board[a.to] != 0 {
            return;
        }
        if self.history.len() >= self.capacity && !self.history.contains_key(&(p.turn, a)) {
            self.history.clear();
        }
        let h = self.history.entry((p.turn, a)).or_default();
        *h = (*h + (d * d) as u64).min(1000000);
        let ks = self.killers.entry(d).or_default();
        ks.retain(|x| *x != a);
        ks.insert(0, a);
        ks.truncate(2);
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
                - {
                    let k = if a.kind == 0 {
                        kind(p.board[a.from])
                    } else {
                        a.piece
                    };
                    if k != 1 && attacked(&board_after(p, a), a.to, 1 - p.turn) {
                        values[k as usize] / 2
                    } else {
                        0
                    }
                }
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
    let start_alpha = alpha;
    let start_beta = beta;
    let key = if d > 0 && c.table.is_some() {
        Some(c.search_key(p, d))
    } else {
        None
    };
    if let Some(bound) = key
        .as_ref()
        .and_then(|k| c.table.as_ref().unwrap().get(k))
        .cloned()
    {
        c.cache_hits += 1;
        if bound.kind == 0 {
            return Ok((bound.value, bound.line));
        }
        if bound.kind == 1 {
            alpha = alpha.max(bound.value)
        } else {
            beta = beta.min(bound.value)
        }
        if beta <= alpha {
            return Ok((bound.value, bound.line));
        }
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
    let selected = if d > 0 {
        c.order(p, selected, d)
    } else {
        ordered(p, selected, c.competitive)
    };
    for (i, a) in selected.into_iter().enumerate() {
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
            if d == 0 || !c.pvs || !best.is_finite() {
                return visit(p, d.saturating_sub(1), nq, ne, alpha, beta, who, c);
            }
            let mut result = if maxing {
                visit(p, d - 1, nq, ne, alpha, beta.min(alpha + 1.0), who, c)?
            } else {
                visit(p, d - 1, nq, ne, alpha.max(beta - 1.0), beta, who, c)?
            };
            if result.0 > alpha && result.0 < beta {
                c.pvs_researches += 1;
                result = visit(p, d - 1, nq, ne, alpha, beta, who, c)?;
            }
            Ok(result)
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
            if d > 0 {
                c.cutoff(p, a, d);
            }
            break;
        }
    }
    if let Some(key) = key {
        c.store(
            key,
            Bound {
                value: best,
                line: line.clone(),
                kind: if best <= start_alpha {
                    2
                } else if best >= start_beta {
                    1
                } else {
                    0
                },
            },
        );
        if let Some(a) = line.first() {
            let k = p.key();
            if !c.hints.contains_key(&k) {
                if c.hints.len() >= c.capacity {
                    if let Some(old) = c.hint_fifo.pop_front() {
                        c.hints.remove(&old);
                    }
                }
                c.hint_fifo.push_back(k.clone());
            }
            c.hints.insert(k, *a);
        }
    }
    Ok((best, line))
}
type RootLine = (Action, f64, Vec<Action>, u32);
fn root_iteration(
    p: &mut Position,
    aa: &[Action],
    d: usize,
    q: usize,
    e: usize,
    multi: usize,
    lower: f64,
    upper: f64,
    rep_aversion: bool,
    c: &mut Context,
) -> Result<Vec<RootLine>, ()> {
    let who = p.turn;
    let mut lines = vec![];
    let mut best = f64::NEG_INFINITY;
    let mut repetitions = u32::MAX;
    for &a in aa {
        let undo = p.push_search(a);
        let rep = if rep_aversion {
            p.repetitions.get(&p.key()).copied().unwrap_or(0)
        } else {
            0
        };
        let alpha = if multi == 1 {
            lower.max(best)
        } else {
            f64::NEG_INFINITY
        };
        let result = (|| {
            let mut r = visit(p, d - 1, q, e, alpha, upper, who, c)?;
            // Equality at alpha can be only an upper bound. Resolve before
            // preferring a less-repeated move with an apparently tied score.
            if best.is_finite() && alpha.is_finite() && r.0 == best && rep < repetitions {
                r = visit(p, d - 1, q, e, f64::NEG_INFINITY, f64::INFINITY, who, c)?;
            }
            Ok(r)
        })();
        p.pop_search(undo);
        let (v, pv) = result?;
        let mut line = vec![a];
        line.extend(pv);
        lines.push((a, v, line, rep));
        if v > best || v == best && rep < repetitions {
            best = v;
            repetitions = rep;
        }
        if best >= upper {
            break;
        }
    }
    lines.sort_by(|a, b| b.1.total_cmp(&a.1).then(a.3.cmp(&b.3)));
    Ok(lines)
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
    for name in [
        "useCache",
        "useHistory",
        "principalVariation",
        "repetitionAversion",
        "aspiration",
    ] {
        if !o[name].is_null() && !o[name].is_boolean() {
            return Err(format!("Invalid {}", name));
        }
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
        table: if o["useCache"] == false {
            None
        } else {
            Some(HashMap::new())
        },
        table_fifo: VecDeque::new(),
        hints: HashMap::new(),
        hint_fifo: VecDeque::new(),
        root_counts: p.repetitions.clone(),
        killers: HashMap::new(),
        history: HashMap::new(),
        use_history: o["useHistory"] != false,
        pvs: o["principalVariation"] != false,
        cache_hits: 0,
        cutoffs: 0,
        pvs_researches: 0,
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
    let iterative = o["iterativeDeepening"].as_bool().unwrap_or(competitive)
        || max != u64::MAX
        || time.is_some();
    let depths = if !iterative {
        vec![depth]
    } else {
        (1..=depth).collect()
    };
    for d in depths {
        if c.enter().is_err() {
            out["stopped"] = json!(true);
            break;
        }
        let previous = out["score"].as_f64();
        let aspiration = o["aspiration"] != false && multi == 1 && previous.is_some();
        let mut window = o["aspirationWindow"].as_f64().unwrap_or(50.0);
        if !window.is_finite() || window <= 0.0 {
            return Err("Invalid aspiration window".into());
        }
        let mut lower = if aspiration {
            previous.unwrap() - window
        } else {
            f64::NEG_INFINITY
        };
        let mut upper = if aspiration {
            previous.unwrap() + window
        } else {
            f64::INFINITY
        };
        let mut retries = 0;
        let result = loop {
            match root_iteration(
                &mut p,
                &aa,
                d,
                q,
                e,
                multi,
                lower,
                upper,
                o["repetitionAversion"].as_bool().unwrap_or(competitive),
                &mut c,
            ) {
                Err(()) => break Err(()),
                Ok(lines) => {
                    let score = lines[0].1;
                    if score <= lower || score >= upper {
                        retries += 1;
                        window *= 4.0;
                        lower = if retries < 3 {
                            previous.unwrap() - window
                        } else {
                            f64::NEG_INFINITY
                        };
                        upper = if retries < 3 {
                            previous.unwrap() + window
                        } else {
                            f64::INFINITY
                        };
                    } else {
                        break Ok(lines);
                    }
                }
            }
        };
        let ranked = match result {
            Ok(r) => r,
            Err(()) => {
                out["stopped"] = json!(true);
                break;
            }
        };
        // Only a completed full-window result can publish or reorder roots.
        if o["rootOrdering"] != false {
            aa = ranked.iter().map(|x| x.0).collect();
        }
        let lines:Vec<_>=ranked.iter().take(multi).map(|(a,v,pv,_)|
            json!({"action":a.json(),"score":v,"pv":pv.iter().copied().map(Action::json).collect::<Vec<_>>()})).collect();
        out["action"] = lines[0]["action"].clone();
        out["score"] = lines[0]["score"].clone();
        out["pv"] = lines[0]["pv"].clone();
        out["variations"] = json!(lines);
        out["completedDepth"] = json!(d);
        if !c.lmr
            && o["stopOnProvenWin"].as_bool().unwrap_or(competitive)
            && out["score"].as_f64().unwrap() >= 1000000.0
        {
            break;
        }
    }
    out["nodes"] = json!(c.nodes);
    out["stats"] = json!({"evaluations":c.evaluations,"evaluationCacheHits":c.evaluation_hits,
        "evaluationTableEntries":c.eval_cache.as_ref().map_or(0, HashMap::len),
        "cacheHits":c.cache_hits,"tableEntries":c.table.as_ref().map_or(0,HashMap::len),"cutoffs":c.cutoffs,"pvsResearches":c.pvs_researches});
    Ok(out)
}

#[cfg(test)]
mod cache_tests {
    use super::*;
    pub(super) fn context() -> Context {
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
            table: None,
            table_fifo: VecDeque::new(),
            hints: HashMap::new(),
            hint_fifo: VecDeque::new(),
            root_counts: HashMap::new(),
            killers: HashMap::new(),
            history: HashMap::new(),
            use_history: false,
            pvs: false,
            cache_hits: 0,
            cutoffs: 0,
            pvs_researches: 0,
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
                &json!({"iterativeDeepening":false,"lateMoveReduction":false,"useCache":false,"useHistory":false}),
                3,
                0,
                0,
                u64::MAX,
                None,
                false,
            )
            .unwrap();
            let cached=choose(p.clone(),&json!({"iterativeDeepening":false,"lateMoveReduction":false,"useCache":false,"useHistory":false,"cacheEvaluation":true,"useCache":false,"useHistory":false,"maxTableEntries":8}),3,0,0,u64::MAX,None,false).unwrap();
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

#[cfg(test)]
mod parity_tests {
    use super::*;
    #[test]
    fn bounds_history_pvs_and_aspiration_match_unrestricted_search() {
        let corpus: Value = serde_json::from_str(include_str!(
            "../../test/fixtures/engine-contract/rules.json"
        ))
        .unwrap();
        for case in corpus["cases"].as_array().unwrap().iter().step_by(6) {
            let p = Position::parse(&case["state"]).unwrap();
            let base=choose(p.clone(),&json!({"useCache":false,"useHistory":false,"principalVariation":false,"aspiration":false,"stopOnProvenWin":false,"lateMoveReduction":false,"iterativeDeepening":false}),3,1,1,u64::MAX,None,true).unwrap();
            for cap in [1, 128] {
                let fast=choose(p.clone(),&json!({"maxTableEntries":cap,"cacheEvaluation":true,"lateMoveReduction":false,"aspirationWindow":1,"stopOnProvenWin":false}),3,1,1,u64::MAX,None,true).unwrap();
                assert_eq!(base["score"], fast["score"], "{}", case["id"]);
                assert_eq!(base["completedDepth"], fast["completedDepth"]);
                if let Some(n) = fast["stats"]["tableEntries"].as_u64() {
                    assert!(n <= cap);
                }
                let mut replay = p.clone();
                for value in fast["pv"].as_array().unwrap() {
                    let a = replay
                        .actions()
                        .into_iter()
                        .find(|a| a.json() == *value)
                        .expect("illegal PV");
                    replay.advance(a, true);
                }
            }
        }
    }
    #[test]
    fn transposition_keys_separate_depth_and_repetition_rights() {
        let corpus: Value = serde_json::from_str(include_str!(
            "../../test/fixtures/engine-contract/rules.json"
        ))
        .unwrap();
        let p = Position::parse(&corpus["cases"][0]["state"]).unwrap();
        let c = super::cache_tests::context();
        let a = c.search_key(&p, 2);
        assert_ne!(a, c.search_key(&p, 3));
        let mut other = p.clone();
        other.repetitions.insert(p.key(), 2);
        assert_ne!(a, c.search_key(&other, 2));
    }
}
