"""One preregistered grouped ridge solve; no engine or opponent queries."""
import json,math,statistics,hashlib,pathlib,gzip
root=pathlib.Path('research/competitive-engine-v1'); source=pathlib.Path('research/data/js-evaluation-calibration-2026-10-28/analysis.json.gz');raw=source.read_bytes();data=json.loads(gzip.decompress(raw));rows=data['rows'];keys=['material','mobility','check','positional'];train=[r for r in rows if r['group']==0 and r['teacherWhiteCp'] is not None];valid=[r for r in rows if r['group']==1 and r['teacherWhiteCp'] is not None];assert len(train)==22 and len(valid)==23 and len(rows)==64
x=[[r['staticTerms'][k]/500 for k in keys] for r in train];y=[r['teacherWhiteCp']/500 for r in train];n=len(x);a=[[sum(v[i]*v[j] for v in x)/n+(0.1 if i==j else 0) for j in range(4)] for i in range(4)];b=[sum(v[i]*t for v,t in zip(x,y))/n+0.1 for i in range(4)]
def solve(a,b):
 m=[r[:]+[v] for r,v in zip(a,b)];n=len(b)
 for k in range(n):
  p=max(range(k,n),key=lambda i:abs(m[i][k]));m[k],m[p]=m[p],m[k];assert abs(m[k][k])>1e-15
  q=m[k][k];m[k]=[v/q for v in m[k]]
  for i in range(n):
   if i!=k:
    q=m[i][k];m[i]=[v-q*w for v,w in zip(m[i],m[k])]
 return [r[-1] for r in m]
assert solve([[1.,0],[0,2.]],[3.,8.])==[3.,4.]
w=solve(a,b);residual=max(abs(sum(v*z for v,z in zip(row,w))-t) for row,t in zip(a,b))
for r in rows:r['ridgePredictionWhiteCp']=sum(r['staticTerms'][k]*v for k,v in zip(keys,w))
def metrics(rs,pred):
 err=[abs(r[pred]-r['teacherWhiteCp']) for r in rs];return {'n':len(rs),'mae':statistics.mean(err),'medianAbsolute':statistics.median(err),'rmse':math.sqrt(statistics.mean(v*v for v in err))}
for r in rows:r['baselinePredictionWhiteCp']=r['staticTerms']['white']
metricsByGroup={name:{'baseline':metrics(rs,'baselinePredictionWhiteCp'),'ridge':metrics(rs,'ridgePredictionWhiteCp')} for name,rs in [('training',train),('validation',valid)]};startRows=[]
for index in sorted({int(r['gameId'].split('__')[-1]) for r in valid}):
 rs=[r for r in valid if int(r['gameId'].split('__')[-1])==index];old=metrics(rs,'baselinePredictionWhiteCp');new=metrics(rs,'ridgePredictionWhiteCp');startRows.append({'index':index,'n':len(rs),'baselineMAE':old['mae'],'ridgeMAE':new['mae'],'improves':new['mae']<old['mae']})
checks={'multipliersWithinBounds':all(math.isfinite(v) and 0<=v<=4 for v in w),'numericalResidual':residual<=1e-8,'trainingMAEImproves':metricsByGroup['training']['ridge']['mae']<metricsByGroup['training']['baseline']['mae'],'validationMAEImproves10Percent':metricsByGroup['validation']['ridge']['mae']<=.9*metricsByGroup['validation']['baseline']['mae'],'halfValidationStartsImprove':sum(s['improves'] for s in startRows)*2>=len(startRows)};passed=all(checks.values());out={'purpose':'Exactly one preregistered four-term ridge solve. Existing teacher cp labels are not truth; odd-group descriptive summaries were observed, not untouched holdout. All19mate records categorical. No source coefficient changes, query, game or strength claim. Failure stops this fit family without retuning.','preregistrationCommit':'ca2782150a522eb5d3dc3866ae85a53adcfc97aa','inputSha256':hashlib.sha256(raw).hexdigest(),'planSha256':hashlib.sha256((root/'evaluation-ridge-plan-2026-10-28.md').read_bytes()).hexdigest(),'script':pathlib.Path(__file__).read_text(),'features':keys,'ridgeLambda':.1,'unitsCp':500,'matrix':a,'rightHandSide':b,'multipliers':w,'maxLinearSystemResidual':residual,'metrics':metricsByGroup,'validationStarts':startRows,'checks':checks,'passed':passed,'rows':rows};p=root/'evaluation-ridge-result.json';p.write_text(json.dumps(out,indent=2)+'\n');print(json.dumps({k:out[k] for k in ['multipliers','maxLinearSystemResidual','metrics','checks','passed']}))
