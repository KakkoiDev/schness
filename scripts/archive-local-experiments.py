"""Preserve completed research replays and exact runtime in small Git-friendly parts."""
import argparse, hashlib, json, tarfile
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('run');p.add_argument('destination');a=p.parse_args()
root=Path(a.run); dest=Path(a.destination);dest.mkdir(parents=True,exist_ok=True)
progress=json.loads((root/'progress.json').read_text())
if progress['status']!='completed' or progress['completed']!=progress['total']:raise SystemExit('Archive only a completed run')
archive=dest/(root.name+'.tar.gz')
with tarfile.open(archive,'w:gz',compresslevel=9) as t:
 for name in ['manifest.json','progress.json','runtime','bundles','report.md','rates.json']:
  if (root/name).exists():t.add(root/name,arcname=root.name+'/'+name)
files=[]
with archive.open('rb') as f:
 i=1
 while b:=f.read(1024*1024):
  part=dest/(archive.name+f'.part{i:03}');part.write_bytes(b);files.append({'path':part.name,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()});i+=1
meta={'run':root.name,'sourceFingerprint':json.loads((root/'manifest.json').read_text())['sourceFingerprint'],'games':progress['total'],'archiveBytes':archive.stat().st_size,'archiveSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'parts':files,'restore':f'cat {archive.name}.part* > {archive.name}; tar -xzf {archive.name}'}
(dest/'archive.json').write_text(json.dumps(meta,indent=2)+'\n');archive.unlink();print(json.dumps(meta,indent=2))
