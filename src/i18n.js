const STORAGE_KEY = 'schness-language';
const SUPPORTED = new Set(['en', 'ja']);

const JA = new Map(Object.entries({
  'Schness': 'Schness', 'Dark': 'ダーク', 'Light': 'ライト', 'Rules': 'ルール', 'Sound': 'サウンド', 'Install': 'インストール',
  'Game · Schness': '対局 · Schness', 'Bot arena · Schness': 'ボットアリーナ · Schness', 'Game library · Schness': '棋譜ライブラリ · Schness', 'Checkmate puzzles · Schness': '詰みパズル · Schness',
  'Schness home': 'Schness ホーム', 'Switch to dark mode': 'ダークモードに切り替える', 'Switch to light mode': 'ライトモードに切り替える',
  'Play Schness': 'Schnessで遊ぶ', 'Compact chess · 4 × 4': '小さな盤、大きな一手',
  'Training': 'トレーニング', 'Forced-mate hints (1–4 moves)': '詰みのヒント（1〜4手）', 'White / Black advantage': '白と黒の形勢',
  'Show estimated advantage': '推定形勢を表示',
  'Move a piece, or deploy one from your reserve. Every capture comes back.': '駒を動かすか、持ち駒を配置。取られた駒はまた戻ってきます。',
  'Bot arena': 'ボットアリーナ', 'Play, watch, take over, or edit a position': '対戦・観戦・途中参加・局面編集',
  'Create an online game': 'オンライン対局を作る', 'Get a link to send a friend': '友だちに送るリンクを作成',
  'Browse recorded games': '棋譜ライブラリ', 'Study 1,099 unique AI games': '1,099局のAI対戦を研究',
  'Checkmate puzzles': '詰みパズル', 'Mate in one, two, three, or four': '1手詰めから4手詰めまで',
  'Settings': '設定', 'Clock': '持ち時間', 'Untimed': '時間無制限', 'Replay interactive tutorial': 'チュートリアルをもう一度',
  'Place the kings': 'キングを配置', 'White sets their king anywhere on the home row, then Black does the same.': '白、黒の順に、自陣の一段目へキングを配置します。',
  'Try it →': '試してみる →', 'Move or deploy': '移動または配置',
  'Each turn: move a piece by normal chess rules, or drop one from your reserve onto an empty square.': '手番では、盤上の駒を動かすか、持ち駒を空いているマスへ配置します。',
  'Nothing is lost': '駒はなくならない', 'A captured piece joins its owner’s reserve, so the board keeps refilling until checkmate.': '取られた駒は元の持ち主の手元へ戻り、チェックメイトまで何度でも使えます。',
  'Playable rule': 'プレイできるルール', 'Close': '閉じる', 'Your turn.': 'あなたの手番です。', 'Restart this rule': 'やり直す',
  'Continue in Bot Arena →': 'ボットアリーナで続ける →', 'Read the full rules': 'ルールをすべて読む',
  'How to play': '遊び方', 'Schness in four rules': '4つでわかるSchness', 'Got it': 'わかった',
  'The board is 4 × 4': '盤は4×4', 'Files a–d, ranks 1–4. White moves up the board, Black moves down.': '筋はa〜d、段は1〜4。白は上へ、黒は下へ進みます。',
  'Kings go down first': '最初にキングを置く', 'White places their king anywhere on rank 1, then Black places theirs on rank 4. Play begins with White.': '白は1段目、黒は4段目の好きなマスへキングを置きます。その後、白から始めます。',
  'On your turn, either move a piece on the board by normal chess rules, or take a piece from your reserve and place it on any empty square.': '手番では、チェスと同じ動きで盤上の駒を動かすか、持ち駒を空いているマスへ配置します。',
  'Captures come back': '取られた駒は戻る', 'Capturing does not remove a piece. It goes to the reserve of the player who owned it, ready to be deployed again, so material never leaves the game. Win by checkmate.': '取られた駒は消えず、元の持ち主の手元へ戻り、再び配置できます。チェックメイトで勝利です。',
  'Two things that trip people up': '間違えやすい2つの点', 'A deployed piece may not put the enemy king in check on the turn it lands. And a piece dropped on the far row is not promoted; there are no pawns.': '配置したその手で相手のキングをチェックすることはできません。敵陣に配置しても成りません。ポーンはありません。',
  'White’s bishop was captured earlier, so it came back to White’s own reserve. The dashed ring is c2, one of the empty squares it can drop onto.': '白のビショップは取られたため、白の持ち駒に戻っています。点線のc2は配置できる空きマスの一つです。',
  'Home': 'ホーム', 'New game': '新しい対局', 'Play Black': '黒で対戦', 'Play White': '白で対戦', 'Waiting for opponent': '対戦相手を待っています', 'Send this link': 'このリンクを送る',
  'The match starts the moment they open it. You’ll play White.': '相手が開くと対局開始です。あなたは白です。', 'Copy': 'コピー', 'Cancel': 'キャンセル',
  'Play the bot instead': 'ボットと対戦', 'Reconnecting': '再接続中', 'Opponent lost connection': '相手との接続が切れました',
  'The board is saved. If they don’t return within the countdown, the match is yours.': '盤面は保存されています。時間内に戻らなければ、あなたの勝ちです。',
  'Waiting': '待機中', 'Claim the win': '勝利を確定', 'Keep waiting': '待ち続ける', 'Link expired': 'リンクは期限切れです',
  'This game is no longer open': 'この対局には参加できません', 'New online game': '新しいオンライン対局', 'Play the bot': 'ボットと対戦',
  'Back home': 'ホームへ戻る', 'Your turn': 'あなたの手番', 'CHECK — defend your king': '王手！キングを守ってください', 'Deselect': '選択解除', 'Reviewing': '棋譜を確認中',
  'A reviewed board is not the live one. Nothing you do here counts.': '確認中の盤面は現在の局面ではありません。ここでの操作は対局に反映されません。',
  'Back to live': '現在の局面へ', 'Moves': '棋譜', 'Copy game': '棋譜をコピー', 'Undo': '待った', 'Resign': '投了',
  'At the table': '対局チャット', 'Peer-to-peer · not saved': 'P2P通信・保存されません', 'Hide chat': 'チャットを隠す',
  'Audio off': '音声オフ', 'Video off': 'ビデオオフ', 'Hear audio': '相手の音声を聞く', 'No messages yet.': 'まだメッセージはありません。',
  'Good move': 'いい手ですね', 'One sec': 'ちょっと待って', 'Offer draw': '引き分けを提案', 'Message your opponent': '相手にメッセージ', 'Send': '送信',
  'Feedback': 'フィードバック', 'Sound and haptics': 'サウンドと振動', 'All off until you ask for them. Reduced motion is about motion, so it does not decide this.': '初期設定ではすべてオフです。必要なものだけ有効にできます。',
  'Move': '移動', 'A soft wooden knock.': '木の駒を置く柔らかな音。', 'Capture': '駒を取る', 'Sharper click, as the piece lands in a reserve.': '取った駒が手元へ戻る、はっきりした音。',
  'Deploy': '配置', 'Distinct from a move, so you hear a drop coming.': '移動と区別できる配置音。', 'Check': 'チェック', 'A low tone, played once.': '低い音を一度鳴らします。',
  'Haptics': '振動', 'A light tap when a piece lands, on phones that support it.': '対応端末で駒を置いたときに軽く振動します。',
  'Keyboard': 'キーボード', 'Playing without a mouse': 'マウスを使わずに遊ぶ',
  'Play · watch · experiment': '対戦・観戦・実験', 'Black': '黒', 'White': '白', 'You': 'あなた', 'Learning': '初級', 'Steady': '中級', 'Sharp': '上級',
  'White to move': '白の手番', 'Previous': '戻る', 'Next': '次へ', 'Pause AIs': 'AIを一時停止', 'Live position': '現在の局面',
  'Continue from here': 'ここから続ける', 'Edit position': '局面を編集', 'Position editor': '局面エディター', 'Set the board': '盤面を設定',
  'Choose a piece, then a square. Each missing rook, bishop, or knight goes to its owner’s reserve.': '駒を選んでからマスを選択します。盤上にないルーク、ビショップ、ナイトは持ち駒になります。',
  'Pieces': '駒', 'Erase': '消す', 'Side to move': '手番', 'Clear board': '盤面をクリア', 'Start here': 'ここから開始',
  'AI archive': 'AIアーカイブ', 'Game library': '棋譜ライブラリ', 'Loading games…': '棋譜を読み込み中…', 'Library statistics': 'ライブラリ統計',
  'Filter games': '棋譜を絞り込む', 'Any AI': 'すべてのAI', 'Result': '結果', 'Any result': 'すべての結果', 'White won': '白の勝ち', 'Black won': '黒の勝ち',
  'Threefold draw': '同一局面3回による引き分け', 'Ply-limit draw': '手数上限による引き分け', 'Stalemate': 'ステイルメイト', 'Any version': 'すべてのバージョン',
  'Show more': 'もっと見る', 'Recorded game': '記録された対局', 'Game': '対局', 'Start': '最初へ', 'Auto · 1s': '自動・1秒', 'Play from here': 'ここから対戦',
  'Move transcript': '棋譜', 'Experiment provenance': '実験データ', 'Tactics': 'タクティクス', 'Find the checkmate': 'チェックメイトを見つけよう',
  'Puzzle mix': '問題の組み合わせ', 'Include': '出題する問題', 'Mate 1': '1手詰め', 'Mate 2': '2手詰め', 'Mate 3': '3手詰め', 'Mate 4': '4手詰め',
  'Hide mate depth': '詰み手数を隠す', 'Auto-next when solved': '正解後に自動で次へ', 'Loading verified puzzles…': '検証済みパズルを読み込み中…',
  'Find the forced checkmate.': '必至のチェックメイトを見つけてください。', 'Solution': '答え', 'Played line': '進行', 'Source positions': '出典局面',
  'Copied': 'コピーしました', 'Copy failed': 'コピーできませんでした', 'Select link': 'リンクを選択', 'Unavailable while offline': 'オフラインでは利用できません',
  'Pause': '一時停止', 'Resume AIs': 'AIを再開', 'Starting position': '開始局面', 'Ask to undo': '待ったをお願い', 'Review moves': '棋譜を見る', 'See that move': 'その手を見る',
  'Message your opponent…': '相手にメッセージ…', 'Voice connected.': '音声がつながりました。', 'Audio is on.': '音声はオンです。', 'Audio is off.': '音声はオフです。',
  'Video is on.': 'ビデオはオンです。', 'Video is off.': 'ビデオはオフです。', 'Requesting microphone access…': 'マイクへのアクセスを確認中…', 'Requesting camera access…': 'カメラへのアクセスを確認中…',
  'Tap “Hear audio” to listen.': '「相手の音声を聞く」を押してください。', 'Peer-to-peer · not saved': 'P2P通信・保存されません',
  'Opponent left': '相手が退出しました', 'The board is yours. Start a new game when you are ready.': '盤面はそのままです。準備ができたら新しい対局を始めてください。',
  'Draw': '引き分け', 'You and your opponent agreed to a draw.': '両者の合意で引き分けになりました。', 'Checkmate': 'チェックメイト',
  'You win.': 'あなたの勝ちです。', 'Your opponent wins.': '相手の勝ちです。', 'Stalemate — no legal move, and no check.': 'ステイルメイトです。合法手がなく、チェックもされていません。',
  'The same position came up three times.': '同じ局面が3回現れました。', 'Bot is placing its king': 'ボットがキングを配置中', 'Bot is thinking': 'ボットが考えています',
  'It is choosing from the same moves and deployments you have.': 'あなたと同じ移動と配置の選択肢から考えています。', 'Opponent’s turn': '相手の手番', 'Waiting for their move.': '相手の一手を待っています。',
  'Place your king': 'キングを配置してください', 'Pick any marked square on your home row. White places first, then Black.': '自陣一段目の印があるマスを選んでください。白、黒の順に配置します。',
  'Draw agreed': '引き分け成立', 'Threefold repetition': '同一局面3回', 'The same position came up three times, so the game is drawn.': '同じ局面が3回現れたため、引き分けです。',
  'You win': 'あなたの勝ち', 'Stalemate': 'ステイルメイト', 'Your seat': 'あなた', 'Defense': '守る側',
  'Choose at least one puzzle type': '問題を1種類以上選んでください', 'At least one mate depth must stay selected.': '詰み手数を1つ以上選択してください。',
  'That does not force checkmate. Try another move.': 'その手では必ずチェックメイトできません。別の手を試してください。',
  'Correct. The opponent replies…': '正解です。相手が応手します…', 'The defense moved. Keep calculating.': '相手が応手しました。読みを続けてください。',
  'Solution shown. Try the next puzzle when ready.': '答えを表示しました。準備ができたら次の問題へ。', 'Keep at least one mate depth selected.': '詰み手数を1つ以上選択してください。',
  'Place your king on the highlighted row.': '光っている段にキングを配置してください。', 'Your turn — tap or drag a piece.': 'あなたの手番です。駒をタップまたはドラッグしてください。',
  'Legal move. The machine is replying…': '合法手です。マシンが応手します…', 'The machine moved. Your turn.': 'マシンが指しました。あなたの手番です。',
  'Puzzles are still being generated': 'パズルを準備中です', 'Start of the game': '対局開始',
  'Game stopped': '対局を停止しました', 'Bot error': 'ボットエラー', 'The bot hit an error. Start a new game to try again.': 'ボットでエラーが発生しました。新しい対局でやり直してください。',
  '← Home': '← ホーム', 'Black reserve': '黒の持ち駒', 'White reserve': '白の持ち駒', 'Your reserve': 'あなたの持ち駒',
  'Listening for a second player': '対戦相手を待っています', 'No relay is answering, so the link cannot reach anyone yet. It will connect on its own if the network comes back.': '中継サーバーから応答がなく、現在リンクを届けられません。ネットワークが戻ると自動で接続します。',
  'Still nobody. The link is live and the network is fine, so either they haven’t opened it yet — or they have, and the two networks can’t reach each other directly. Some mobile and office networks block that. Trying another network usually fixes it.': 'まだ相手がいません。リンクと通信は正常です。相手がまだ開いていないか、両者のネットワーク間で直接接続できない可能性があります。モバイル回線や社内ネットワークでは遮断される場合があるため、別の回線をお試しください。',
  'The invite was already used or has gone stale. Start a fresh one, or play the bot while you wait.': '招待リンクは使用済みか期限切れです。新しい対局を作るか、ボットと対戦してください。',
  'Opponent': '対戦相手', 'Bot · Black': 'ボット・黒', 'No moves yet': 'まだ棋譜はありません', '↑ / ↓ to review': '↑ / ↓ で棋譜を確認', '@ marks a deployment from reserve': '@ は持ち駒の配置',
  'Move the cursor one square. It wraps at the edges.': 'カーソルを1マス動かします。端では反対側へ移動します。', 'Enter': 'Enter', 'Pick up the piece under the cursor, or play the move.': 'カーソル上の駒を選ぶ、または着手します。',
  'Esc': 'Esc', 'Put the piece back down.': '選択中の駒を戻します。', 'Pick a reserve piece, then Enter on an empty square to deploy it.': '持ち駒を選び、空きマスでEnterを押して配置します。',
  'a – d then 1 – 4': 'a〜d、続けて1〜4', 'Type a square name to go straight there.': 'マス名を入力すると直接移動します。', 'Show this list.': 'この一覧を表示します。',
  'Arrow keys move the cursor, Enter picks up or plays, Escape puts the piece back down, 1 to 3 pick a reserve piece, a square name jumps there, and question mark lists the shortcuts.': '矢印キーでカーソルを移動、Enterで選択・着手、Escapeで選択解除。1〜3で持ち駒を選び、マス名で直接移動、?でショートカット一覧を表示します。',
  'unique games': '固有の棋譜', 'original records': '元の対局数', 'decisive': '勝敗あり', 'average plies': '平均プライ',
  'Bot': 'ボット', 'Online player': 'オンラインプレイヤー', 'Audio': '音声', 'Video': 'ビデオ',
  'Your browser is still blocking incoming audio.': 'ブラウザが相手の音声の再生をブロックしています。',
  'Offline · moves will send when you’re back': 'オフライン・再接続後に着手を送信します',
  'Your connection is unstable': '接続が不安定です', 'Retrying': '再試行中', 'You are back online.': 'オンラインに戻りました。',
  'You are offline. Moves will send when you are back.': 'オフラインです。再接続後に着手を送信します。',
  'Your opponent lost connection.': '相手との接続が切れました。', 'Not connected to the matchmaking network': 'マッチング用ネットワークに接続できません',
  'Microphone permission was not granted.': 'マイクの使用が許可されませんでした。', 'Could not start the microphone.': 'マイクを開始できませんでした。',
  'Camera permission was not granted.': 'カメラの使用が許可されませんでした。', 'Could not start the camera.': 'カメラを開始できませんでした。',
  'You asked to take back your move': '待ったをお願いしました', 'You offered a draw': '引き分けを提案しました',
  'The match is a draw by agreement.': '両者の合意で引き分けになりました。', 'Accept': '承諾', 'Decline': '辞退', 'Allow': '許可',
  'Invite for a rematch': '再戦に招待', 'Play again': 'もう一度対局', 'Rematch': '再戦',
  'The demo ended in a draw.': 'デモは引き分けになりました。',
  'Place your king on one of the highlighted home-row squares.': '光っている自陣のマスにキングを配置してください。',
  'Move your rook to one of the highlighted squares.': 'ルークを光っているマスのいずれかへ動かしてください。',
  'Deploy your bishop from the reserve to the highlighted square.': '持ち駒のビショップを光っているマスへ配置してください。',
}));

const PATTERNS = [
  [/^(\d+) puzzles left in this shuffle$/, '$1問残っています'],
  [/^(White|Black) to move · mate in (\d+)$/, (_, side, n) => `${side === 'White' ? '白' : '黒'}の手番・${n}手詰め`],
  [/^(White|Black) to move · find the fastest mate$/, (_, side) => `${side === 'White' ? '白' : '黒'}の手番・最短の詰みを探してください`],
  [/^(Your|Their) reserve · (\d+)$/, (_, who, n) => `${who === 'Your' ? 'あなた' : '相手'}の持ち駒・${n}`],
  [/^(White|Black) reserve · (\d+)$/, (_, side, n) => `${side === 'White' ? '白' : '黒'}の持ち駒・${n}`],
  [/^(\d+) unique games?$/, '$1局'], [/^(\d+) plies · (\d+) moves/, '$1プライ・$2手'],
  [/^Game #(\d+)$/, '対局 #$1'], [/^Ply (\d+) of (\d+) · (.*)$/, '$2手中 $1手目・$3'],
  [/^Game #(\d+), after ply (\d+)$/, '対局 #$1・$2プライ後'],
  [/^Checkmate — mate in (\d+) solved\.( Next puzzle coming…)?$/, (_, n, next) => `チェックメイト。${n}手詰め正解です。${next ? ' 次の問題へ進みます…' : ''}`],
  [/^The defense moved\. Continue the mate in (\d+)\.$/, '相手が応手しました。$1手詰めを続けてください。'],
  [/^Reviewing · before the first move$/, '確認中・初手前'], [/^Reviewing · move (\d+) of (\d+)$/, '$2手中 $1手目を確認中'],
  [/^The match ended on move (\d+)\. You can still walk back through it\.$/, '対局は$1手目で終了しました。棋譜をさかのぼって確認できます。'],
  [/^(.*) ran out of time$/, '$1の時間切れ'], [/^(.*) resigned$/, '$1が投了しました'],
  [/^(White|Black) wins by checkmate$/, (_, side) => `${side === 'White' ? '白' : '黒'}のチェックメイト勝ち`],
  [/^Draw by threefold repetition$/, '同一局面3回による引き分け'], [/^Draw by stalemate$/, 'ステイルメイトによる引き分け'],
  [/^(White|Black) · (.*)$/, (_, side, name) => `${side === 'White' ? '白' : '黒'}・${translateText(name, 'ja')}`],
  [/^(White|Black) reserve · tap to deploy$/, (_, side) => `${side === 'White' ? '白' : '黒'}の持ち駒・タップして配置`],
  [/^Your reserve · tap to deploy$/, 'あなたの持ち駒・タップして配置'], [/^Your reserve · empty$/, 'あなたの持ち駒・なし'],
  [/^Last: (.*)$/, '直前：$1'], [/^(Audio|Video) (on|off)$/, (_, media, state) => `${media === 'Audio' ? '音声' : 'ビデオ'}${state === 'on' ? 'オン' : 'オフ'}`],
  [/^Reviewing ply (\d+) of (\d+)$/, '$2手中 $1手目を確認中'],
  [/^(White|Black): place your king on the home row$/, (_, side) => `${side === 'White' ? '白' : '黒'}：自陣の一段目にキングを置いてください`],
  [/^(White|Black) to move · (.*)$/, (_, side, seat) => `${side === 'White' ? '白' : '黒'}の手番・${translateText(seat)}`],
  [/^(White|Black) (.*) is thinking…$/, (_, side, bot) => `${side === 'White' ? '白' : '黒'}の${translateText(bot)}が考えています…`],
  [/^Paused before (White|Black) moves$/, (_, side) => `${side === 'White' ? '白' : '黒'}の手番前で一時停止`],
  [/^(\d+):(\d{2}) left$/, '$1:$2 残り'],
  [/^(King|Rook|Bishop|Knight) on ([a-d][1-4]) is selected\. (.*)$/, (_, piece, square, rest) => `${pieceJa(piece)}（${square}）を選択中。${translateText(rest, 'ja')}`],
  [/^Your king is in check(?: from .*?)?\. Move, capture, or deploy a reserve piece to block it\.$/, 'キングがチェックされています。移動、駒を取る、または持ち駒を配置して防いでください。'],
  [/^Empty (rook|bishop|knight) reserve slot$/, (_, piece) => `空の${pieceJa(piece)}持ち駒枠`],
  [/^(white|black) (rook|bishop|knight) in reserve$/, (_, side, piece) => `${side === 'white' ? '白' : '黒'}の持ち駒の${pieceJa(piece)}`],
  [/^(\d+) matching records$/, '$1件の棋譜'], [/^Run (\d+) · (\d+) source records$/, '実験$1・元データ$2局'],
  [/^Your king ran out of squares(?: on [a-d][1-4])?\..*$/, 'キングの逃げ場がなくなりました。棋譜を戻って防ぎ方を確認できます。'],
  [/^(White|Black) has no legal move and is not in check\..*$/, '合法手がなく、チェックもされていないためステイルメイトです。'],
  [/^Neither side pressed on.*$/, 'どちらも勝ち切れず、手数上限で引き分けになりました。'],
  [/^(White|Black) deployed a (king|rook|bishop|knight) on ([a-d][1-4])$/, (_, side, piece, square) => `${side === 'White' ? '白' : '黒'}が${pieceJa(piece)}を${square}に配置`],
  [/^(White|Black) moved a (king|rook|bishop|knight) from ([a-d][1-4]) to ([a-d][1-4])$/, (_, side, piece, from, to) => `${side === 'White' ? '白' : '黒'}の${pieceJa(piece)}が${from}から${to}へ移動`],
  [/^(White|Black) captured a (king|rook|bishop|knight) on ([a-d][1-4]) with a (king|rook|bishop|knight) from ([a-d][1-4])$/, (_, side, captured, to, piece, from) => `${side === 'White' ? '白' : '黒'}の${pieceJa(piece)}が${from}から${to}へ進み${pieceJa(captured)}を取る`],
];

function pieceJa(piece) {
  return ({ king: 'キング', rook: 'ルーク', bishop: 'ビショップ', knight: 'ナイト' })[String(piece).toLowerCase()] ?? piece;
}

export function language(storage = localStorage, navigatorLanguage = navigator.language) {
  try { const saved = storage.getItem(STORAGE_KEY); if (SUPPORTED.has(saved)) return saved; } catch {}
  return String(navigatorLanguage).toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

export function translateText(text, locale = language()) {
  if (locale !== 'ja' || !text) return text;
  if (JA.has(text)) return JA.get(text);
  for (const [pattern, replacement] of PATTERNS) if (pattern.test(text)) return text.replace(pattern, replacement);
  return text;
}

export function initI18n() {
  const locale = language();
  document.documentElement.lang = locale;
  translateTree(document, locale);
  // Prefer the action group explicitly. A selector list containing `header`
  // returns the ancestor first in document order, even when `.header-actions`
  // appears first in the selector text. Inserting before a nested theme button
  // on that ancestor throws and prevents the rest of the page from starting.
  const header = document.querySelector('header .header-actions')
    ?? document.querySelector('header nav')
    ?? document.querySelector('header');
  if (header && !document.querySelector('[data-language-toggle]')) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'text-button language-button';
    button.dataset.languageToggle = '';
    button.textContent = locale === 'ja' ? 'EN' : '日本';
    button.setAttribute('aria-label', locale === 'ja' ? '英語に切り替える' : 'Switch to Japanese');
    const theme = header.querySelector('[data-theme-toggle]');
    header.insertBefore(button, theme ?? header.firstChild);
    button.addEventListener('click', () => {
      try { localStorage.setItem(STORAGE_KEY, locale === 'ja' ? 'en' : 'ja'); } catch {}
      location.reload();
    });
  }
  if (locale === 'ja') new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'characterData') translateNode(record.target, locale);
      if (record.type === 'attributes') {
        const value = record.target.getAttribute(record.attributeName);
        const translated = translateText(value, locale);
        if (value && translated !== value) record.target.setAttribute(record.attributeName, translated);
      }
      for (const node of record.addedNodes) translateTree(node, locale);
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true,
    attributeFilter: ['aria-label', 'placeholder', 'title'] });
  return locale;
}

function translateTree(root, locale) {
  if (root.nodeType === Node.TEXT_NODE) return translateNode(root, locale);
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
  if (root.nodeType === Node.ELEMENT_NODE) for (const attr of ['aria-label', 'placeholder', 'title']) {
    const value = root.getAttribute(attr); const translated = translateText(value, locale);
    if (value && translated !== value) root.setAttribute(attr, translated);
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let node; while ((node = walker.nextNode())) {
    if (node.nodeType === Node.TEXT_NODE) translateNode(node, locale);
    else for (const attr of ['aria-label', 'placeholder', 'title']) {
      const value = node.getAttribute(attr); const translated = translateText(value, locale);
      if (value && translated !== value) node.setAttribute(attr, translated);
    }
  }
}

function translateNode(node, locale) {
  if (node.parentElement?.matches('script,style')) return;
  const raw = node.nodeValue; const trimmed = raw.trim(); if (!trimmed) return;
  const normalized = trimmed.replace(/\s+/g, ' ');
  const translated = translateText(normalized, locale);
  if (translated !== normalized) node.nodeValue = `${raw.match(/^\s*/)[0]}${translated}${raw.match(/\s*$/)[0]}`;
}
