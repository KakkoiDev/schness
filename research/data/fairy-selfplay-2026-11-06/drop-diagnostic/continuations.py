"""Compare the archived PVs at the first strict reversal, without engine calls."""
import collections, json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
groups = collections.defaultdict(list)
for path in sorted((root/'analysis').glob('fairy__*.json')):
    bench = json.loads(path.read_text())['rows']
    deep = json.loads((root/'deep-analysis'/path.name).read_text())['rows']
    for b,d in zip(bench,deep,strict=True):
        if b['same'] or b['type'] != 'drop': continue
        h = d['horizons']
        i = next((i for i,x in enumerate(h) if x['depth']==b['js']['completedDepth']),None)
        if i is None or i==len(h)-1 or h[i]['fairyScore'] >= h[i]['benchScore']: continue
        flip = h[-1]['fairyScore'] > h[-1]['benchScore']
        j = next(k for k in range(i+1,len(h)) if h[k]['fairyScore']>h[k]['benchScore']) if flip else len(h)-1
        def pv(k, move):
            matches = [q['pv'] for q in d['events'] if q['kind']=='finish' and q['depth']==h[k]['depth'] and q['action']==move]
            assert len(matches)==1
            return matches[0]
        def prefix(a,b):
            return next((n for n,(x,y) in enumerate(zip(a,b)) if x!=y),min(len(a),len(b)))
        fair = [pv(k,b['fairyMove']) for k in (i,j)]
        own = [pv(k,b['js']['action']) for k in (i,j)]
        groups['reversal' if flip else 'no-final-reversal'].append(dict(game=path.stem,ply=b['ply'],before=h[i],after=h[j],fairy=fair,schness=own,fairyShared=prefix(*fair),schnessShared=prefix(*own),fairyReplyChanged=len(fair[0])>1 and len(fair[1])>1 and fair[0][1]!=fair[1][1],schnessReplyChanged=len(own[0])>1 and len(own[1])>1 and own[0][1]!=own[1][1]))
assert len(groups['reversal'])==27 and len(groups['no-final-reversal'])==39
print(json.dumps(groups,indent=2))
