"""Compare archived scores only; no engine invocation or cross-engine score comparison."""
import collections, json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
counts = collections.defaultdict(collections.Counter)
def relation(a, b):
    return 'fairy' if a > b else 'schness' if a < b else 'tie'
for path in sorted((root/'analysis').glob('fairy__*.json')):
    bench = json.loads(path.read_text())['rows']
    deep = json.loads((root/'deep-analysis'/path.name).read_text())['rows']
    assert len(bench) == len(deep)
    for b,d in zip(bench,deep):
        assert (b['ply'],b['positionKey'],b['fairyMove'],b['js']['action']) == (d['ply'],d['positionKey'],d['fairyMove'],d['benchMove'])
        if b['same']: continue
        final = d['horizons'][-1]
        final_rel = relation(final['fairyScore'],final['benchScore'])
        matched = next((h for h in d['horizons'] if h['depth'] == b['js']['completedDepth']), None)
        ranking = b.get('ranking')
        for group in ('all', b['type'], b['type']+' → '+b['jsMoveType']):
            c = counts[group]
            c['disagreements'] += 1
            c['final:'+final_rel] += 1
            c['final-fairy-top3'] += final['fairyRank'] <= 3
            if ranking:
                c['exact-same-depth:'+relation(ranking['fairyScore'],ranking['normalChoiceScore'])] += 1
            if matched:
                c['full-root-same-depth:'+relation(matched['fairyScore'],matched['benchScore'])] += 1
                if final['depth'] > matched['depth']:
                    c['transition:'+relation(matched['fairyScore'],matched['benchScore'])+'→'+final_rel] += 1
assert counts['all']['disagreements'] == 321
print(json.dumps(counts, indent=2, sort_keys=True, ensure_ascii=False))
