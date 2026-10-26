"""Run only the already prepared Fairy match after both authorized depth benches."""
import json,subprocess,time
from pathlib import Path
root=Path(__file__).resolve().parents[1]
runs=[root/f'output/local-experiments/sharp-v7-d{d}-v2-full-v1-2026-10-26' for d in (5,6)]
fairy=root/'output/local-experiments/sharp-v7-fairy-equal-time-v1-2026-10-26'
def save(status,**extra):
 p=fairy/'queue.json';tmp=p.with_suffix('.tmp');tmp.write_text(json.dumps({'status':status,'waitingFor':[str(p) for p in runs],**extra},indent=2)+'\n');tmp.replace(p)
try:
 save('waiting')
 while True:
  states=[json.loads((p/'progress.json').read_text()) for p in runs]
  for p,s in zip(runs,states):
   if s['status'] in ('failed','stopped'):raise RuntimeError(f"Prerequisite run {p.name}: {s['status']}: {s.get('failure')}")
  if all(s['status']=='completed' and s['completed']==s['total'] for s in states):break
  time.sleep(30)
 save('verifying-prerequisites')
 for p in runs:subprocess.run(['node',str(p/'runtime/scripts/run-engine-regression.js'),'--resume',str(p)],cwd=root,check=True)
 save('running')
 subprocess.run(['node',str(fairy/'runtime/scripts/run-fairy-match.js'),'--resume',str(fairy)],cwd=root,check=True)
 subprocess.run(['node',str(root/'research/fairy-match-v1/report.js'),str(fairy)],cwd=root,check=True)
 save('completed')
except Exception as e:
 save('failed',failure=str(e))
 raise
