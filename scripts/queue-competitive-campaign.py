"""Run frozen research schedules serially; preserve failures and never tune live runs."""
import argparse,json,os,subprocess,time
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('first');p.add_argument('screen');p.add_argument('confirmation');a=p.parse_args()
first,screen,confirmation=map(lambda s:Path(s).resolve(),[a.first,a.screen,a.confirmation])
root=Path(__file__).resolve().parent.parent
state_path=screen/'queue.json'
def read(p):return json.loads(p.read_text())
def state(status,**extra):
 value={'status':status,'pid':os.getpid(),'updatedAt':time.time(),'first':str(first),'screen':str(screen),'confirmation':str(confirmation),**extra}
 tmp=state_path.with_suffix('.tmp');tmp.write_text(json.dumps(value,indent=2)+'\n');tmp.replace(state_path)
def active(run):
 lock=run/'run.lock'
 if not lock.exists():return False
 try:os.kill(int(lock.read_text()),0);return True
 except ProcessLookupError:return False
def report(run):subprocess.run(['node',str(root/'research/competitive-engine-v1/report.js'),str(run)],check=True)
def execute(run):
 if active(run):raise RuntimeError('Runner already active: '+str(run))
 with (run/'run.log').open('a') as log:subprocess.run(['node',str(run/'runtime/scripts/run-competitive-fairy.js'),'--resume',str(run)],stdout=log,stderr=subprocess.STDOUT,check=True)
 report(run)
try:
 state('waiting-for-first-screen')
 while True:
  progress=read(first/'progress.json')
  if progress['status']=='failed':raise RuntimeError('First screen failed: '+str(progress['failure']))
  if progress['status']=='completed' and not active(first):break
  time.sleep(20)
 report(first)
 state('running-r3-screen')
 execute(screen)
 rates=read(screen/'rates.json')
 if not rates['targetReached']:
  state('needs-engine-analysis',rates=rates)
 else:
  state('preparing-confirmation')
  if confirmation.exists():raise RuntimeError('Confirmation directory already exists; inspect before continuing')
  manifest=read(screen/'manifest.json');candidate=manifest['candidate']
  command=['node',str(screen/'runtime/scripts/run-competitive-fairy.js'),'--output',str(confirmation),'--seeds','6','--starts','16','--depth',str(candidate['depthRequest']),'--quiescence',str(candidate['quiescenceDepth']),'--port','4193','--seed-base','20261901','--name',candidate['name']]
  if manifest['candidateMillis'] is not None:command+=['--candidate-millis',str(manifest['candidateMillis'])]
  subprocess.run(command,check=True)
  assert read(confirmation/'manifest.json')['sourceFingerprint']==manifest['sourceFingerprint']
  state('running-confirmation')
  execute(confirmation)
  result=read(confirmation/'rates.json');state('confirmation-target-reached' if result['targetReached'] else 'needs-engine-analysis',rates=result)
except Exception as e:
 state('failed',failure=repr(e));raise
