"""Run explicitly frozen JS screens sequentially, without tuning or promotion."""
import json, subprocess, sys
from pathlib import Path
from datetime import datetime, timezone
runs=[Path(p).resolve() for p in sys.argv[1:]]
if not runs:raise SystemExit('Provide frozen run directories')
state=runs[0]/'ablation-queue.json'
def save(status,run=None,code=None):
 value={'status':status,'runs':[str(p) for p in runs],'current':str(run) if run else None,'returncode':code,'updatedAt':datetime.now(timezone.utc).isoformat(),'confirmationLaunched':False}
 tmp=state.with_suffix('.tmp');tmp.write_text(json.dumps(value,indent=2)+'\n');tmp.replace(state)
for run in runs:
 m=json.loads((run/'manifest.json').read_text())
 if m['candidateMillis']!=100 or m['budgetMillis']!=100:raise SystemExit('Expected equal100ms budgets')
 save('running',run)
 with (run/'run.log').open('a') as log:
  code=subprocess.call(['node',str(run/'runtime/scripts/run-competitive-fairy.js'),'--resume',str(run)],stdout=log,stderr=subprocess.STDOUT)
 if code:save('failed',run,code);raise SystemExit(code)
 progress=json.loads((run/'progress.json').read_text())
 if progress['status']!='completed' or progress['completed']!=m['totalGames']:save('incomplete',run);raise SystemExit('Incomplete run')
save('completed')
