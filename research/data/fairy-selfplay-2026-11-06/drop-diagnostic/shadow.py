"""Apply the frozen shadow rule to all archived decisions, without engine calls."""
import collections,json,pathlib
root=pathlib.Path(__file__).resolve().parent.parent
mate=1_000_000
total=0
changes=[]
for path in sorted((root/'analysis').glob('fairy__*.json')):
    bench=json.loads(path.read_text())['rows']
    deep=json.loads((root/'deep-analysis'/path.name).read_text())['rows']
    for b,d in zip(bench,deep,strict=True):
        total+=1
        old=b['js']['action']
        assert (b['ply'],b['positionKey'],old)==(d['ply'],d['positionKey'],d['benchMove'])
        target=b['js']['completedDepth']+1
        last=[]
        for e in b['events']:
            if e['depth']!=target:continue
            if e['kind']=='pass':last=[]
            elif e['kind']=='finish':last.append(e)
        incumbent=next((e for e in last if e['action']==old and e['bound'] in ('upper','inside-window') and abs(e['score'])<mate),None)
        if incumbent is None:continue
        eligible=[e for e in last if e['action']!=old and e['bound']=='inside-window' and abs(e['score'])<mate and e['score']>incumbent['score']]
        if not eligible:continue
        challenger=max(eligible,key=lambda e:e['score'])
        horizon=d['horizons'][-1]
        deep_score=[e['score'] for e in d['events'] if e['depth']==horizon['depth'] and e['kind']=='finish' and e['action']==challenger['action']]
        assert len(deep_score)==1
        changes.append(dict(game=path.stem,ply=b['ply'],target=target,incumbent=incumbent,challenger=challenger,oldMatch=b['same'],newMatch=challenger['action']==b['fairyMove'],deepScore=deep_score[0],deepIncumbentScore=horizon['benchScore']))
assert total==964
gained=sum(x['newMatch'] for x in changes)
lost=sum(x['oldMatch'] for x in changes)
games=len({x['game'] for x in changes})
pref=collections.Counter('challenger' if x['deepScore']>x['deepIncumbentScore'] else 'incumbent' if x['deepScore']<x['deepIncumbentScore'] else 'tie' for x in changes)
print(json.dumps(dict(total=total,unchanged=total-len(changes),games=games,gained=gained,lost=lost,deepPreferences=pref,passed=len(changes)>=16 and games>=8 and gained>=2*lost,changes=changes),indent=2))
