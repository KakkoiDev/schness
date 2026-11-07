use crate::rules::*;
use serde_json::{json, Value};
use std::time::{Duration, Instant};
#[derive(Clone)]
pub enum State {
    Chess(Position),
    Graph { nodes: Value, node: String },
}
impl State {
    fn turn(&self) -> usize {
        match self {
            Self::Chess(p) => p.turn,
            Self::Graph { nodes, node } => {
                if nodes[node]["turn"] == "A" {
                    0
                } else {
                    1
                }
            }
        }
    }
    fn actions(&self) -> Vec<Value> {
        match self {
            Self::Chess(p) => p.actions().iter().map(|a| a.json()).collect(),
            Self::Graph { nodes, node } => nodes[node]["next"]
                .as_object()
                .map(|o| o.keys().map(|s| json!(s)).collect())
                .unwrap_or_default(),
        }
    }
    fn next(&self, a: &Value) -> Self {
        match self {
            Self::Chess(p) => {
                let mut n = p.clone();
                n.advance(Action::parse(a).unwrap(), true);
                Self::Chess(n)
            }
            Self::Graph { nodes, node } => Self::Graph {
                nodes: nodes.clone(),
                node: nodes[node]["next"][a.as_str().unwrap()]
                    .as_str()
                    .unwrap()
                    .into(),
            },
        }
    }
    fn terminal(&self, who: usize, depth: usize, actions: &[Value]) -> Option<f64> {
        match self {
            Self::Graph { nodes, node } => nodes[node]["terminal"]
                .as_f64()
                .map(|v| v * if who == 0 { 1.0 } else { -1.0 }),
            Self::Chess(p) => {
                let aa: Vec<_> = actions.iter().map(|a| Action::parse(a).unwrap()).collect();
                let r = p.result(&aa);
                if r.is_null() {
                    None
                } else if r["type"] == "draw" {
                    Some(0.0)
                } else {
                    Some(
                        (1000000 + depth) as f64
                            * if r["winner"] == player(who) {
                                1.0
                            } else {
                                -1.0
                            },
                    )
                }
            }
        }
    }
    fn danger(&self) -> bool {
        match self {
            Self::Chess(p) => p.check(p.turn),
            Self::Graph { nodes, node } => nodes[node]["danger"] == true,
        }
    }
    fn noisy(&self, a: &Value, checks: bool) -> bool {
        match self {
            Self::Chess(p) => {
                let x = Action::parse(a).unwrap();
                x.kind == 0 && p.board[x.to] != 0
                    || checks && board_check(&board_after(p, x), 1 - p.turn)
            }
            Self::Graph { nodes, node } => nodes[node]["noisy"]
                .as_array()
                .map(|v| v.contains(a))
                .unwrap_or(false),
        }
    }
    fn eval(&self, who: usize, competitive: bool, actions: &[Value]) -> f64 {
        match self {
            Self::Graph { nodes, node } => {
                nodes[node]["value"].as_f64().unwrap_or(0.0) * if who == 0 { 1.0 } else { -1.0 }
            }
            Self::Chess(p) => evaluate_chess(p, who, competitive, actions.len()),
        }
    }
    fn ordered(&self, mut a: Vec<Value>, competitive: bool) -> Vec<Value> {
        if let Self::Chess(p) = self {
            a.sort_by_cached_key(|v| {
                let a = Action::parse(v).unwrap();
                let values = [0, 0, 500, 320, 300];
                let capture = if a.kind == 0 && p.board[a.to] != 0 {
                    if competitive {
                        10000 + values[kind(p.board[a.to]) as usize] * 10
                            - values[kind(p.board[a.from]) as usize]
                    } else {
                        100 + values[kind(p.board[a.to]) as usize]
                    }
                } else {
                    0
                };
                let rank = if competitive {
                    let b = board_after(p, a);
                    capture
                        + if board_check(&b, 1 - p.turn) { 2000 } else { 0 }
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
        }
        a
    }
}
struct Context {
    nodes: u64,
    max: u64,
    deadline: Option<Instant>,
    q: usize,
    evasion: usize,
    checks: bool,
    competitive: bool,
    lmr: bool,
    quiet_drops: bool,
}
impl Context {
    fn enter(&mut self) -> Result<(), ()> {
        if self.nodes >= self.max || self.deadline.map(|d| Instant::now() >= d).unwrap_or(false) {
            return Err(());
        }
        self.nodes += 1;
        Ok(())
    }
}
fn visit(
    p: &State,
    d: usize,
    q: usize,
    e: usize,
    mut alpha: f64,
    mut beta: f64,
    who: usize,
    c: &mut Context,
) -> Result<(f64, Vec<Value>), ()> {
    c.enter()?;
    let actions = p.actions();
    if let Some(v) = p.terminal(who, d, &actions) {
        return Ok((v, vec![]));
    }
    let maximizing = p.turn() == who;
    let danger = p.danger();
    let mut best = if maximizing {
        f64::NEG_INFINITY
    } else {
        f64::INFINITY
    };
    let mut line = vec![];
    let selected = if d == 0 {
        let stand = p.eval(who, c.competitive, &actions);
        if q == 0 && !(danger && e > 0) {
            return Ok((stand, line));
        }
        if !danger {
            best = stand;
            if maximizing {
                alpha = alpha.max(stand)
            } else {
                beta = beta.min(stand)
            }
            if beta <= alpha {
                return Ok((best, line));
            }
        }
        actions
            .into_iter()
            .filter(|a| danger || p.noisy(a, c.checks))
            .collect()
    } else {
        actions
    };
    for (i, a) in p.ordered(selected, c.competitive).iter().enumerate() {
        let n = p.next(a);
        let nq = if d == 0 { q.saturating_sub(1) } else { c.q };
        let ne = if d == 0 && q == 0 {
            e.saturating_sub(1)
        } else if d > 0 {
            c.evasion
        } else {
            e
        };
        let mut r = None;
        if c.lmr && d >= 3 && i >= 3 && !danger && !n.danger() {
            if let State::Chess(s) = p {
                let aa = Action::parse(a).unwrap();
                if aa.kind == 0 && s.board[aa.to] == 0 || aa.kind == 1 && c.quiet_drops {
                    let reduced = visit(&n, d - 2, nq, ne, alpha, beta, who, c)?;
                    if maximizing && reduced.0 <= alpha || !maximizing && reduced.0 >= beta {
                        r = Some(reduced)
                    }
                }
            }
        }
        let (v, pv) = match r {
            Some(x) => x,
            None => visit(&n, d.saturating_sub(1), nq, ne, alpha, beta, who, c)?,
        };
        if if maximizing { v > best } else { v < best } {
            best = v;
            line = vec![a.clone()];
            line.extend(pv)
        }
        if maximizing {
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
pub fn choose(p: State, o: &Value) -> Result<Value, String> {
    for k in [
        "depth",
        "strength",
        "quiescenceDepth",
        "quiescenceEvasionDepth",
        "maxNodes",
        "multiPv",
    ] {
        if let Some(v) = o.get(k) {
            if !v.is_u64() {
                return Err(format!("Invalid {k}"));
            }
        }
    }
    if o["strength"].as_u64().unwrap_or(0) > 100 {
        return Err("Invalid strength".into());
    }
    for k in [
        "quiescenceChecks",
        "lateMoveReduction",
        "reduceQuietDrops",
        "iterativeDeepening",
        "stopOnProvenWin",
    ] {
        if let Some(v) = o.get(k) {
            if !v.is_boolean() {
                return Err(format!("Invalid {k}"));
            }
        }
    }
    if let Some(v) = o.get("maxMillis") {
        if !v.is_number() {
            return Err("Invalid time budget".into());
        }
    }
    if let Some(v) = o.get("profile") {
        if v != "reference" && v != "competitive" {
            return Err("Unknown profile".into());
        }
    }
    let competitive = o["profile"] == "competitive";
    let depth = o["depth"]
        .as_u64()
        .or(o["strength"].as_u64())
        .unwrap_or(if competitive { 20 } else { 4 }) as usize;
    if depth > 100 {
        return Err("Invalid depth".into());
    }
    let q = o["quiescenceDepth"]
        .as_u64()
        .unwrap_or(if competitive { 6 } else { 0 }) as usize;
    let evasion = o["quiescenceEvasionDepth"].as_u64().unwrap_or(0) as usize;
    if q > 8 || evasion > 8 {
        return Err("Invalid quiescence depth".into());
    }
    let max = o["maxNodes"].as_u64().unwrap_or(u64::MAX);
    let time = o["maxMillis"].as_f64();
    if max == 0 || time.map(|x| !x.is_finite() || x <= 0.0).unwrap_or(false) {
        return Err("Invalid budget".into());
    }
    if let State::Chess(position) = p {
        return crate::native_search::choose(
            position,
            o,
            depth,
            q,
            evasion,
            max,
            time,
            competitive,
        );
    }
    let mut c = Context {
        nodes: 0,
        max,
        deadline: time.map(|ms| Instant::now() + Duration::from_secs_f64(ms / 1000.0)),
        q,
        evasion,
        checks: o["quiescenceChecks"].as_bool().unwrap_or(competitive),
        competitive,
        lmr: o["lateMoveReduction"].as_bool().unwrap_or(competitive),
        quiet_drops: o["reduceQuietDrops"] == true,
    };
    let actions = p.ordered(p.actions(), competitive);
    let who = p.turn();
    if let Some(v) = p.terminal(who, depth, &actions) {
        return Ok(
            json!({"action":null,"score":v,"requestedDepth":depth,"completedDepth":0,"nodes":0,"stopped":false,"pv":[],"variations":[]}),
        );
    }
    if actions.is_empty() {
        return Err("Nonterminal position without actions".into());
    }
    let mut output = json!({"action":actions[0],"score":null,"requestedDepth":depth,"completedDepth":0,"nodes":0,"stopped":false,"pv":[],"variations":[]});
    if depth == 0 {
        return Ok(output);
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
            output["stopped"] = json!(true);
            break;
        }
        let mut lines = vec![];
        let mut alpha = f64::NEG_INFINITY;
        let mut stopped = false;
        for a in &actions {
            let n = p.next(a);
            match visit(
                &n,
                d - 1,
                q,
                evasion,
                if multi == 1 { alpha } else { f64::NEG_INFINITY },
                f64::INFINITY,
                who,
                &mut c,
            ) {
                Ok((v, pv)) => {
                    let mut line = vec![a.clone()];
                    line.extend(pv);
                    lines.push(json!({"action":a,"score":v,"pv":line}));
                    alpha = alpha.max(v)
                }
                Err(_) => {
                    stopped = true;
                    break;
                }
            }
        }
        if stopped {
            output["stopped"] = json!(true);
            break;
        }
        lines.sort_by(|a, b| {
            b["score"]
                .as_f64()
                .unwrap()
                .total_cmp(&a["score"].as_f64().unwrap())
        });
        lines.truncate(multi);
        output["action"] = lines[0]["action"].clone();
        output["score"] = lines[0]["score"].clone();
        output["pv"] = lines[0]["pv"].clone();
        output["variations"] = json!(lines);
        output["completedDepth"] = json!(d);
        if !c.lmr && o["stopOnProvenWin"] == true && output["score"].as_f64().unwrap() >= 1000000.0
        {
            break;
        }
    }
    output["nodes"] = json!(c.nodes);
    Ok(output)
}

pub fn evaluate_chess(p: &Position, who: usize, competitive: bool, action_count: usize) -> f64 {
    let values = [0, 0, 500, 320, 300];
    let mut v = 0i32;
    for &o in &p.board {
        if o != 0 {
            v += if owner(o) == 0 { 1 } else { -1 }
                * (values[kind(o) as usize] + if kind(o) == 1 { 0 } else { 20 })
        }
    }
    if ["capture-bank", "permanent-loss"].contains(&p.experiment()) {
        for c in 0..2 {
            for &k in &p.banks[c] {
                v += if c == 0 { 1 } else { -1 } * values[k as usize]
            }
        }
    }
    if competitive {
        for sq in 0..16 {
            let o = p.board[sq];
            if o == 0 {
                continue;
            }
            let c = owner(o);
            let sign = if c == 0 { 1 } else { -1 };
            let k = kind(o);
            if k == 1 {
                let mut safe = 0;
                let mut pressure = 0;
                for to in targets(&[0; 16], sq, 1) {
                    if attacked(&p.board, to, 1 - c) {
                        pressure += 1
                    } else if p.board[to] == 0 || owner(p.board[to]) != c {
                        safe += 1
                    }
                }
                v += sign * (safe * 14 - pressure * 20);
            } else {
                let defended = attacked(&p.board, sq, c);
                let central = if sq % 4 == 1 || sq % 4 == 2 { 6 } else { 0 }
                    + if sq / 4 == 1 || sq / 4 == 2 { 6 } else { 0 };
                v += sign * (central + if defended { 12 } else { 0 });
                if attacked(&p.board, sq, 1 - c) {
                    v -= sign
                        * (values[k as usize] as f64 * if defended { 0.12 } else { 0.45 }).round()
                            as i32;
                }
            }
        }
    }
    let mobility = action_count as i32 - p.mobility_for(1 - p.turn) as i32;
    v += mobility * 2 * if p.turn == 0 { 1 } else { -1 };
    if p.check(1) {
        v += 30
    }
    if p.check(0) {
        v -= 30
    }
    v as f64 * if who == 0 { 1.0 } else { -1.0 }
}
