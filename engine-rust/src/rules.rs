use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
pub const NAMES: [&str; 5] = ["", "king", "rook", "bishop", "knight"];
pub fn side(s: &str) -> usize {
    if s == "white" {
        0
    } else {
        1
    }
}
pub fn player(c: usize) -> &'static str {
    if c == 0 {
        "white"
    } else {
        "black"
    }
}
pub fn piece(s: &str) -> u8 {
    NAMES.iter().position(|x| *x == s).unwrap_or(0) as u8
}
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub struct Action {
    pub kind: u8,
    pub from: usize,
    pub to: usize,
    pub piece: u8,
}
impl Action {
    pub fn json(self) -> Value {
        match self.kind {
            0 => json!({"type":"move","from":self.from,"to":self.to}),
            1 => json!({"type":"drop","piece":NAMES[self.piece as usize],"to":self.to}),
            _ => json!({"type":"place-king","to":self.to}),
        }
    }
    pub fn parse(v: &Value) -> Result<Self, String> {
        let to = v["to"].as_u64().ok_or("Missing square")? as usize;
        if to >= 16 || v["type"] == "move" && v["from"].as_u64().map(|x| x >= 16).unwrap_or(true) {
            return Err("Invalid square".into());
        }
        let k = v["type"].as_str().unwrap_or("");
        Ok(Self {
            kind: match k {
                "move" => 0,
                "drop" => 1,
                "place-king" => 2,
                _ => return Err("Invalid action".into()),
            },
            from: v["from"].as_u64().unwrap_or(0) as usize,
            to,
            piece: if k == "place-king" {
                1
            } else {
                piece(v["piece"].as_str().unwrap_or(""))
            },
        })
    }
    pub fn key(self) -> String {
        match self.kind {
            0 => format!("move:{}:{}", self.from, self.to),
            1 => format!("drop:{}:{}", NAMES[self.piece as usize], self.to),
            _ => format!("place-king:{}", self.to),
        }
    }
}
#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Research {
    pub turns: Value,
    pub deployed: Value,
    #[serde(default = "checks")]
    pub checking_drops: Value,
    #[serde(default = "last")]
    pub last_checking_drop: Value,
}
fn checks() -> Value {
    json!({"white":0,"black":0})
}
fn last() -> Value {
    json!({"white":false,"black":false})
}
#[derive(Clone)]
pub struct Position {
    pub board: [u8; 16],
    pub banks: [Vec<u8>; 2],
    pub turn: usize,
    pub phase: String,
    pub repetitions: HashMap<String, u32>,
    rules: Value,
    // Immutable configuration is serialized once rather than per search node.
    key_rules: String,
    pub research: Research,
}
impl Position {
    pub fn parse(v: &Value) -> Result<Self, String> {
        if !["white", "black"].contains(&v["turn"].as_str().unwrap_or("")) {
            return Err("Invalid player turn".into());
        }
        if !["place-white-king", "place-black-king", "setup", "play"]
            .contains(&v["phase"].as_str().unwrap_or(""))
        {
            return Err("Invalid phase".into());
        }
        if v.get("rules").is_some() && !v["rules"]["allowCheckingDrops"].is_boolean() {
            return Err("Invalid rules".into());
        }
        let experiment = v["rules"]["experiment"].as_str().unwrap_or("");
        if ![
            "",
            "protected-recurring",
            "protected-opening",
            "grace",
            "quiet-return",
            "setup",
            "first-turn-quiet",
            "protected-first-turn",
            "mutual-one",
            "mutual-two",
            "limited-check",
            "cooldown",
            "no-drop-mate",
            "home-half-check",
            "distant-check",
            "supported-check",
            "countercheck-only",
            "knight-check",
            "bishop-check",
            "rook-check",
            "capture-bank",
            "permanent-loss",
        ]
        .contains(&experiment)
        {
            return Err("Unknown experiment".into());
        }
        if experiment == "capture-bank"
            && !(3..=6).contains(&v["rules"]["bankCapacity"].as_u64().unwrap_or(0))
        {
            return Err("Invalid bank capacity".into());
        }
        let a = v["board"].as_array().ok_or("Missing board")?;
        if a.len() != 16 {
            return Err("Invalid board size".into());
        }
        let mut board = [0; 16];
        for (i, o) in a.iter().enumerate() {
            if !o.is_null() {
                if !["white", "black"].contains(&o["owner"].as_str().unwrap_or("")) {
                    return Err("Invalid occupant owner".into());
                }
                let p = piece(o["piece"].as_str().unwrap_or(""));
                if p == 0 {
                    return Err("Invalid occupant".into());
                }
                board[i] = p + (side(o["owner"].as_str().unwrap_or("")) as u8) * 4;
            }
        }
        let mut banks = [vec![], vec![]];
        for c in 0..2 {
            for x in v["banks"][player(c)].as_array().ok_or("Missing bank")? {
                let p = piece(x.as_str().unwrap_or(""));
                if p < 2 {
                    return Err("Invalid bank piece".into());
                }
                banks[c].push(p)
            }
        }
        if experiment == "capture-bank"
            && banks
                .iter()
                .any(|b| b.len() > v["rules"]["bankCapacity"].as_u64().unwrap() as usize)
        {
            return Err("Bank overflow".into());
        }
        let r = v
            .get("research")
            .cloned()
            .unwrap_or(json!({"turns":{"white":0,"black":0},"deployed":{"white":[],"black":[]}}));
        let rules = v
            .get("rules")
            .cloned()
            .unwrap_or(json!({"allowCheckingDrops":false}));
        let key_rules = rules.to_string();
        Ok(Self {
            board,
            banks,
            turn: side(v["turn"].as_str().unwrap_or("white")),
            phase: v["phase"].as_str().unwrap_or("play").into(),
            repetitions: serde_json::from_value(v.get("repetitions").cloned().unwrap_or(json!({})))
                .map_err(|e| e.to_string())?,
            rules,
            key_rules,
            research: serde_json::from_value(r).map_err(|e| e.to_string())?,
        })
    }
    pub fn json(&self) -> Value {
        let board: Vec<_> = self
            .board
            .iter()
            .map(|&o| {
                if o == 0 {
                    Value::Null
                } else {
                    json!({"owner":player(owner(o)),"piece":NAMES[kind(o)as usize]})
                }
            })
            .collect();
        let bank = |c: usize| {
            self.banks[c]
                .iter()
                .map(|&p| NAMES[p as usize])
                .collect::<Vec<_>>()
        };
        json!({"board":board,"banks":{"white":bank(0),"black":bank(1)},"turn":player(self.turn),"phase":self.phase,"repetitions":self.repetitions,"rules":self.rules,"research":self.research})
    }
    pub fn mobility_for(&self, c: usize) -> usize {
        let other = Self {
            board: self.board,
            banks: self.banks.clone(),
            turn: c,
            phase: self.phase.clone(),
            repetitions: HashMap::new(),
            rules: self.rules.clone(),
            key_rules: self.key_rules.clone(),
            research: self.research.clone(),
        };
        other.actions().len()
    }
    pub fn experiment(&self) -> &str {
        self.rules["experiment"].as_str().unwrap_or("")
    }
    pub fn key(&self) -> String {
        let mut board = String::with_capacity(32);
        for &o in &self.board {
            if o == 0 {
                board.push_str("--")
            } else {
                board.push(if owner(o) == 0 { 'w' } else { 'b' });
                board.push(['-', 'K', 'R', 'B', 'N'][kind(o) as usize])
            }
        }
        let bank = |c: usize| {
            let mut counts = [0usize; 5];
            for &x in &self.banks[c] {
                counts[x as usize] += 1;
            }
            let mut out = String::with_capacity(self.banks[c].len());
            for x in [3, 4, 2] {
                for _ in 0..counts[x] {
                    out.push(['-', 'K', 'R', 'B', 'N'][x]);
                }
            }
            out
        };
        let e = self.experiment();
        let r = &self.research;
        let rights = match e {
            "protected-opening" => json!([
                r.deployed["white"].as_array().unwrap().len() > 0,
                r.deployed["black"].as_array().unwrap().len() > 0
            ]),
            "grace" | "first-turn-quiet" | "protected-first-turn" => r.turns.clone(),
            "mutual-one" | "mutual-two" => r.deployed.clone(),
            "limited-check" => r.checking_drops.clone(),
            "cooldown" => r.last_checking_drop.clone(),
            "quiet-return" => json!({"turns":r.turns,"deployed":r.deployed}),
            _ => Value::Null,
        };
        let extra = if e.is_empty() {
            String::new()
        } else {
            format!("|{}|{}", self.key_rules, rights)
        };
        format!(
            "{}{}|{}|{}|{}|{}|{}",
            if self.rules["allowCheckingDrops"] == true {
                "checking-drops"
            } else {
                "quiet-drops"
            },
            extra,
            self.phase,
            player(self.turn),
            board,
            bank(0),
            bank(1)
        )
    }
    pub fn check(&self, c: usize) -> bool {
        self.board
            .iter()
            .position(|&o| o == 1 + c as u8 * 4)
            .map(|k| attacked(&self.board, k, 1 - c))
            .unwrap_or(false)
    }
    pub fn actions(&self) -> Vec<Action> {
        if self.phase.starts_with("place-") {
            let row = if self.phase == "place-white-king" {
                12
            } else {
                0
            };
            return (row..row + 4)
                .filter(|&to| self.board[to] == 0)
                .map(|to| Action {
                    kind: 2,
                    from: 0,
                    to,
                    piece: 1,
                })
                .collect();
        }
        let mut out = Vec::new();
        if self.phase != "setup" {
            for from in 0..16 {
                let o = self.board[from];
                if o == 0 || owner(o) != self.turn {
                    continue;
                }
                for to in targets(&self.board, from, kind(o)) {
                    let victim = self.board[to];
                    if victim != 0 && (owner(victim) == self.turn || kind(victim) == 1) {
                        continue;
                    }
                    let a = Action {
                        kind: 0,
                        from,
                        to,
                        piece: 0,
                    };
                    if self.safe(a) {
                        out.push(a)
                    }
                }
            }
        }
        let mut seen = 0u8;
        for &p in &self.banks[self.turn] {
            if seen & (1 << p) != 0 {
                continue;
            }
            seen |= 1 << p;
            for to in 0..16 {
                if self.board[to] != 0 {
                    continue;
                }
                if self.phase == "setup"
                    && self.rules["hiddenSetup"] == true
                    && (if self.turn == 0 { to < 12 } else { to >= 4 })
                {
                    continue;
                }
                let a = Action {
                    kind: 1,
                    from: 0,
                    to,
                    piece: p,
                };
                if self.safe(a) {
                    out.push(a)
                }
            }
        }
        out
    }
    fn safe(&self, a: Action) -> bool {
        let mut b = self.board;
        if a.kind == 0 {
            b[a.to] = b[a.from];
            b[a.from] = 0
        } else {
            b[a.to] = a.piece + self.turn as u8 * 4
        }
        if board_check(&b, self.turn) {
            return false;
        }
        if a.kind == 1 && board_check(&b, 1 - self.turn) {
            if !self.drop_check(a, &b) {
                return false;
            }
            if self.experiment() == "no-drop-mate" {
                let mut n = self.clone();
                n.advance(a, false);
                if n.actions().is_empty() {
                    return false;
                }
            }
        }
        true
    }
    fn drop_check(&self, a: Action, n: &[u8; 16]) -> bool {
        if self.rules["allowCheckingDrops"] != true || self.phase == "setup" {
            return false;
        }
        let p = player(self.turn);
        let e = player(1 - self.turn);
        let r = &self.research;
        match self.experiment() {
            "home-half-check" => {
                if self.turn == 0 {
                    a.to >= 8
                } else {
                    a.to < 8
                }
            }
            "distant-check" => {
                let k = self
                    .board
                    .iter()
                    .position(|&o| o == 1 + (1 - self.turn) as u8 * 4)
                    .unwrap_or(0);
                (a.to / 4).abs_diff(k / 4).max((a.to % 4).abs_diff(k % 4)) >= 2
            }
            "supported-check" => attacked(n, a.to, self.turn),
            "countercheck-only" => self.check(self.turn),
            "knight-check" => a.piece == 4,
            "bishop-check" => a.piece == 3,
            "rook-check" => a.piece == 2,
            "first-turn-quiet" | "protected-first-turn" if r.turns[p] == 0 => false,
            "mutual-one" | "mutual-two" => {
                r.deployed["white"]
                    .as_array()
                    .unwrap()
                    .len()
                    .min(r.deployed["black"].as_array().unwrap().len())
                    >= if self.experiment() == "mutual-one" {
                        1
                    } else {
                        2
                    }
            }
            "limited-check" => r.checking_drops[p].as_u64().unwrap_or(0) < 1,
            "cooldown" => r.last_checking_drop[p] != true,
            "protected-recurring" | "protected-first-turn" => self
                .board
                .iter()
                .any(|&o| o != 0 && owner(o) == 1 - self.turn && kind(o) != 1),
            "protected-opening" => !r.deployed[e].as_array().unwrap().is_empty(),
            "grace" | "quiet-return" => {
                r.turns["white"]
                    .as_u64()
                    .unwrap_or(0)
                    .min(r.turns["black"].as_u64().unwrap_or(0))
                    >= 3
                    && (self.experiment() != "quiet-return"
                        || !r.deployed[p]
                            .as_array()
                            .unwrap()
                            .iter()
                            .any(|x| x == NAMES[a.piece as usize]))
            }
            _ => true,
        }
    }
    pub fn advance(&mut self, a: Action, count: bool) {
        let c = self.turn;
        let old_phase = self.phase.clone();
        let e = self.experiment().to_string();
        match a.kind {
            2 => {
                self.board[a.to] = 1 + c as u8 * 4;
                if self.phase == "place-white-king" {
                    self.phase = "place-black-king".into();
                    self.turn = 1
                } else {
                    self.phase = if self.rules["setup"] == true {
                        "setup"
                    } else {
                        "play"
                    }
                    .into();
                    self.turn = 0
                }
            }
            0 => {
                let victim = self.board[a.to];
                self.board[a.to] = self.board[a.from];
                self.board[a.from] = 0;
                if victim != 0 && e != "permanent-loss" {
                    let recipient = if e == "capture-bank"
                        && self.banks[c].len()
                            < (self.rules["bankCapacity"].as_u64().unwrap_or(6) as usize)
                    {
                        c
                    } else {
                        owner(victim)
                    };
                    self.banks[recipient].push(kind(victim))
                }
                self.turn = 1 - c
            }
            _ => {
                if let Some(i) = self.banks[c].iter().position(|&p| p == a.piece) {
                    self.banks[c].remove(i);
                }
                self.board[a.to] = a.piece + c as u8 * 4;
                self.turn = 1 - c
            }
        }
        if !e.is_empty() && a.kind != 2 {
            let checking = a.kind == 1 && self.check(1 - c);
            let p = player(c);
            self.research.checking_drops[p] = json!((self.research.checking_drops[p]
                .as_u64()
                .unwrap_or(0)
                + checking as u64)
                .min(1));
            self.research.last_checking_drop[p] = json!(checking);
            self.research.turns[p] =
                json!((self.research.turns[p].as_u64().unwrap_or(0) + 1).min(3));
            if a.kind == 1 {
                let d = self.research.deployed[p].as_array_mut().unwrap();
                if !d.iter().any(|x| x == NAMES[a.piece as usize]) {
                    d.push(json!(NAMES[a.piece as usize]));
                    d.sort_by(|a, b| a.as_str().cmp(&b.as_str()));
                }
            }
            if old_phase == "setup" && self.banks.iter().all(|b| b.is_empty()) {
                self.phase = "play".into();
                self.turn = side(self.rules["firstPlayer"].as_str().unwrap_or("white"));
            }
        }
        if count && self.phase == "play" {
            let k = self.key();
            *self.repetitions.entry(k).or_default() += 1;
        }
    }
    pub fn result(&self, actions: &[Action]) -> Value {
        if self.phase == "setup" {
            return if actions.is_empty() {
                json!({"type":"draw","reason":"setup-blocked"})
            } else {
                Value::Null
            };
        }
        if self.phase != "play" {
            return Value::Null;
        }
        if self.repetitions.get(&self.key()).copied().unwrap_or(0) >= 3 {
            return json!({"type":"draw","reason":"threefold-repetition"});
        }
        if !actions.is_empty() {
            return Value::Null;
        }
        if self.check(self.turn) {
            json!({"type":"win","winner":player(1-self.turn),"reason":"checkmate"})
        } else {
            json!({"type":"draw","reason":"stalemate"})
        }
    }
}
pub fn owner(o: u8) -> usize {
    ((o - 1) / 4) as usize
}
pub fn kind(o: u8) -> u8 {
    (o - 1) % 4 + 1
}
pub fn attacked(board: &[u8; 16], to: usize, c: usize) -> bool {
    for from in 0..16 {
        let o = board[from];
        if o == 0 || owner(o) != c {
            continue;
        }
        let dy = to as i32 / 4 - from as i32 / 4;
        let dx = to as i32 % 4 - from as i32 % 4;
        let ay = dy.abs();
        let ax = dx.abs();
        if ay == 0 && ax == 0 {
            continue;
        }
        match kind(o) {
            1 => {
                if ay <= 1 && ax <= 1 {
                    return true;
                }
            }
            4 => {
                if ay * ax == 2 {
                    return true;
                }
            }
            k => {
                if !(k == 2 && (dy == 0 || dx == 0) || k == 3 && ay == ax) {
                    continue;
                }
                let step = dy.signum() * 4 + dx.signum();
                let mut sq = from as i32 + step;
                while sq != to as i32 && board[sq as usize] == 0 {
                    sq += step
                }
                if sq == to as i32 {
                    return true;
                }
            }
        }
    }
    false
}
pub fn board_after(p: &Position, a: Action) -> [u8; 16] {
    let mut b = p.board;
    if a.kind == 0 {
        b[a.to] = b[a.from];
        b[a.from] = 0
    } else {
        b[a.to] = a.piece + p.turn as u8 * 4
    }
    b
}
pub fn targets(board: &[u8; 16], from: usize, p: u8) -> Vec<usize> {
    let orth = [(-1, 0), (1, 0), (0, -1), (0, 1)];
    let diag = [(-1, -1), (-1, 1), (1, -1), (1, 1)];
    let king = [
        (-1, 0),
        (1, 0),
        (0, -1),
        (0, 1),
        (-1, -1),
        (-1, 1),
        (1, -1),
        (1, 1),
    ];
    let knight = [
        (-2, -1),
        (-2, 1),
        (-1, -2),
        (-1, 2),
        (1, -2),
        (1, 2),
        (2, -1),
        (2, 1),
    ];
    let dirs: &[(i32, i32)] = match p {
        1 => &king,
        2 => &orth,
        3 => &diag,
        _ => &knight,
    };
    let mut out = vec![];
    for &(dy, dx) in dirs {
        for d in 1..=if p == 2 || p == 3 { 3 } else { 1 } {
            let y = from as i32 / 4 + dy * d;
            let x = from as i32 % 4 + dx * d;
            if !(0..4).contains(&y) || !(0..4).contains(&x) {
                break;
            }
            let to = (y * 4 + x) as usize;
            out.push(to);
            if board[to] != 0 {
                break;
            }
        }
    }
    out
}

pub fn board_check(b: &[u8; 16], c: usize) -> bool {
    b.iter()
        .position(|&o| o == 1 + c as u8 * 4)
        .map(|sq| attacked(b, sq, 1 - c))
        .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn frozen_rule_snapshots_cover_all_presets() {
        let corpus: Value = serde_json::from_str(include_str!(
            "../../test/fixtures/engine-contract/rules.json"
        ))
        .unwrap();
        let cases = corpus["cases"].as_array().unwrap();
        assert_eq!(cases.len(), 142);
        for case in cases {
            let mut p = Position::parse(&case["state"]).unwrap();
            let legal = p.actions();
            let mut keys: Vec<_> = legal.iter().map(|a| a.key()).collect();
            keys.sort();
            assert_eq!(
                json!(keys),
                case["expected"]["legalActionKeys"],
                "{}",
                case["id"]
            );
            assert_eq!(
                p.result(&legal),
                case["expected"]["result"],
                "{}",
                case["id"]
            );
            if !case["action"].is_null() {
                let a = Action::parse(&case["action"]).unwrap();
                assert!(legal.contains(&a));
                p.advance(a, true);
                assert_eq!(p.json(), case["expected"]["nextState"], "{}", case["id"]);
            }
        }
    }
    #[test]
    fn direct_attack_test_matches_ray_targets_on_dense_generated_boards() {
        let mut seed = 271027u32;
        for _ in 0..1000 {
            let mut b = [0; 16];
            for o in &mut b {
                seed = seed.wrapping_mul(1664525).wrapping_add(1013904223);
                *o = (seed % 9) as u8;
            }
            for c in 0..2 {
                for to in 0..16 {
                    let slow = (0..16).any(|from| {
                        b[from] != 0
                            && owner(b[from]) == c
                            && targets(&b, from, kind(b[from])).contains(&to)
                    });
                    assert_eq!(attacked(&b, to, c), slow);
                }
            }
        }
    }
}

pub struct Undo {
    board: [u8; 16],
    banks: [Vec<u8>; 2],
    turn: usize,
    phase: String,
    research: Option<Research>,
    key: Option<String>,
    count: Option<u32>,
}
impl Position {
    /// Search state is private. Common material policies have no history-dependent
    /// deployment rights, so their unused research counters need not be updated.
    pub fn push_search(&mut self, a: Action) -> Undo {
        let common = self.phase == "play"
            && ["", "capture-bank", "permanent-loss"].contains(&self.experiment());
        let mut undo = Undo {
            board: self.board,
            banks: self.banks.clone(),
            turn: self.turn,
            phase: self.phase.clone(),
            research: if common {
                None
            } else {
                Some(self.research.clone())
            },
            key: None,
            count: None,
        };
        if common {
            let c = self.turn;
            if a.kind == 0 {
                let victim = self.board[a.to];
                self.board[a.to] = self.board[a.from];
                self.board[a.from] = 0;
                if victim != 0 && self.experiment() != "permanent-loss" {
                    let recipient = if self.experiment() == "capture-bank"
                        && self.banks[c].len()
                            < self.rules["bankCapacity"].as_u64().unwrap_or(6) as usize
                    {
                        c
                    } else {
                        owner(victim)
                    };
                    self.banks[recipient].push(kind(victim));
                }
            } else {
                let i = self.banks[c].iter().position(|&k| k == a.piece).unwrap();
                self.banks[c].remove(i);
                self.board[a.to] = a.piece + c as u8 * 4;
            }
            self.turn = 1 - c;
        } else {
            self.advance(a, false);
        }
        if self.phase == "play" {
            let key = self.key();
            undo.count = self.repetitions.get(&key).copied();
            self.repetitions
                .insert(key.clone(), undo.count.unwrap_or(0) + 1);
            undo.key = Some(key);
        }
        undo
    }
    pub fn pop_search(&mut self, u: Undo) {
        self.board = u.board;
        self.banks = u.banks;
        self.turn = u.turn;
        self.phase = u.phase;
        if let Some(r) = u.research {
            self.research = r
        }
        if let Some(k) = u.key {
            if let Some(n) = u.count {
                self.repetitions.insert(k, n);
            } else {
                self.repetitions.remove(&k);
            }
        }
    }
}

#[cfg(test)]
mod undo_tests {
    use super::*;
    #[test]
    fn every_fixture_legal_action_restores_exact_private_state() {
        let corpus: Value = serde_json::from_str(include_str!(
            "../../test/fixtures/engine-contract/rules.json"
        ))
        .unwrap();
        let mut transitions = 0;
        for case in corpus["cases"].as_array().unwrap() {
            let p = Position::parse(&case["state"]).unwrap();
            for a in p.actions() {
                let mut actual = p.clone();
                let original = actual.json();
                let mut expected = p.clone();
                expected.advance(a, true);
                let u = actual.push_search(a);
                assert_eq!(actual.key(), expected.key());
                assert_eq!(actual.board, expected.board);
                assert_eq!(actual.banks, expected.banks);
                assert_eq!(actual.repetitions, expected.repetitions);
                assert_eq!(actual.actions(), expected.actions());
                actual.pop_search(u);
                assert_eq!(actual.json(), original);
                transitions += 1;
            }
        }
        assert!(transitions > 1000);
    }
}
