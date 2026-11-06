"""Reproduce the interrupted-pass lead from archived traces; no engine calls."""
import collections, json, math, pathlib
here = pathlib.Path(__file__).resolve().parent
rows = {(p.stem, b['ply']): b for p in (here.parent/'analysis').glob('fairy__*.json') for b in json.loads(p.read_text())['rows']}
output = {}
for group, cases in json.loads((here/'continuations.json').read_text()).items():
    details = []
    for case in cases:
        b = rows[case['game'], case['ply']]
        target = b['js']['completedDepth'] + 1
        found = {}
        pass_number = 0
        for e in b['events']:
            if e['depth'] != target:
                continue
            if e['kind'] == 'pass':
                pass_number += 1
                found = {}
            elif e['kind'] == 'finish':
                for name, action in [('fairy', b['fairyMove']), ('schness', b['js']['action'])]:
                    if e['action'] == action:
                        found[name] = e
        verdict = 'missing-pair'
        if len(found) == 2:
            def interval(e):
                v = e['score']
                assert e['bound'] in ('upper', 'lower', 'inside-window')
                return (-math.inf if e['bound']=='upper' else v, math.inf if e['bound']=='lower' else v)
            low, high = interval(found['fairy'])
            own_low, own_high = interval(found['schness'])
            verdict = 'fairy' if low > own_high else 'schness' if own_low > high else 'overlap'
        details.append(dict(game=case['game'],ply=case['ply'],depth=target,passNumber=pass_number,verdict=verdict,branches=found))
    output[group] = dict(counts=dict(collections.Counter(x['verdict'] for x in details)), details=details)
assert output['reversal']['counts']['fairy'] == 12
assert output['no-final-reversal']['counts']['fairy'] == 1
print(json.dumps(output, indent=2))
