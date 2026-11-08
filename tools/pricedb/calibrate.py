#!/usr/bin/env python3
"""Аудит и калибровка прайс-базы QazGost (ai-service/app/data/price_db.json).

Прайс-база собрана из ~400 сгенерированных файлов-источников (поле `source`), и у
многих источников ошибка масштаба: кирпич по 7 ₸, штукатурка стен по 250 ₸/м² и т.п.
Скрипт:
  1. нормализует единицы (п.м./пог.м → м.п., тонна → т, комплект → компл. ...);
  2. сверяет позиции с опорными ценами (tools/pricedb/anchors.py);
  3. для источника с систематической ошибкой (≥5 сверок, медианное отклонение ≥2.5×,
     ≥80 % сверок в одну сторону) вычисляет поправочный множитель и применяет его
     ко всему источнику; затем то же по совпадающим наименованиям с уже выверенными
     источниками;
  4. отдельные позиции, оставшиеся вне коридора, помечает qa="suspect";
  5. пишет отчёт PRICE_DB_AUDIT.md.

Повторный запуск идемпотентен: исходные цены хранятся в поле priceRaw.

    python3 tools/pricedb/calibrate.py            # пересчитать и записать
    python3 tools/pricedb/calibrate.py --dry-run  # только отчёт
"""
import argparse
import collections
import datetime
import json
import math
import os
import re
import statistics
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from anchors import MATERIAL_ANCHORS, WORK_ANCHORS, TOL  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DB_PATH = os.path.join(ROOT, 'ai-service', 'app', 'data', 'price_db.json')
REPORT_PATH = os.path.join(ROOT, 'PRICE_DB_AUDIT.md')

UNIT_MAP = {
    'п.м.': 'м.п.', 'п.м': 'м.п.', 'пог.м': 'м.п.', 'пог. м': 'м.п.', 'м.п': 'м.п.',
    'тонна': 'т', 'тн': 'т', 'комплект': 'компл.', 'комп.': 'компл.', 'компл': 'компл.',
    'упак.': 'уп.', 'упаковка': 'уп.', 'мес': 'месяц', 'шт.': 'шт', 'м2': 'м²', 'м3': 'м³',
    'кв.м': 'м²', 'куб.м': 'м³',
}
NICE = [2, 2.5, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50]
MIN_HITS = 5
MIN_DEV = 2.5
MIN_SHARE = 0.8
MIN_DUP_HITS = 6


def norm_name(s):
    s = s.lower().replace('ё', 'е')
    s = re.sub(r'[«»"()\.,]', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def nice_factor(f):
    inv = f < 1
    x = 1 / f if inv else f
    best = min(NICE, key=lambda n: abs(math.log(n) - math.log(x)))
    return 1 / best if inv else best


def round_price(p):
    if p >= 10000:
        return float(round(p / 100) * 100)
    if p >= 1000:
        return float(round(p / 10) * 10)
    if p >= 100:
        return float(round(p))
    return round(p, 1)


def reference(name, unit, anchors):
    n = name.lower().replace('ё', 'е')
    for rx, units, typ in anchors:
        if unit not in units:
            continue
        m = re.search(rx, n)
        if not m:
            continue
        ref = typ(n, m) if callable(typ) else typ
        if ref:
            return ref
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--db', default=DB_PATH)
    args = ap.parse_args()

    with open(args.db, encoding='utf-8') as fh:
        db = json.load(fh)

    rows = []
    unit_changes = collections.Counter()
    for sec, anchors in (('works', WORK_ANCHORS), ('materials', MATERIAL_ANCHORS), ('equipment', [])):
        for code, it in db[sec].items():
            raw = float(it.get('priceRaw', it['price']))
            unit = it.get('unitRaw', it['unit']).strip()
            nu = UNIT_MAP.get(unit, unit)
            if nu != unit:
                unit_changes[f'{unit} → {nu}'] += 1
                it['unitRaw'] = unit
            else:
                it.pop('unitRaw', None)
            rows.append({'sec': sec, 'code': code, 'it': it, 'raw': raw, 'unit': nu,
                         'src': it.get('source', ''), 'n': norm_name(it['name']),
                         'ref': reference(it['name'], nu, anchors)})

    def anchor_stats(price_of):
        c = collections.Counter()
        for r in rows:
            if r['ref']:
                p = price_of(r)
                c['low' if p < r['ref'] / TOL else 'high' if p > r['ref'] * TOL else 'ok'] += 1
        return c

    before = anchor_stats(lambda r: r['raw'])

    # --- pass 1: per-source factor from anchors ---
    by_src = collections.defaultdict(list)
    for r in rows:
        if r['ref']:
            by_src[(r['sec'], r['src'])].append(r['ref'] / r['raw'])
    factors, why = {}, {}

    def decide(key, ratios, how, min_hits=MIN_HITS):
        if len(ratios) < min_hits:
            return
        med = statistics.median(ratios)
        if med >= MIN_DEV:
            share = sum(1 for x in ratios if x >= 1.8) / len(ratios)
        elif med <= 1 / MIN_DEV:
            share = sum(1 for x in ratios if x <= 1 / 1.8) / len(ratios)
        else:
            return
        if share >= MIN_SHARE:
            factors[key] = nice_factor(med)
            why[key] = f'{how}: n={len(ratios)}, медиана ×{med:.1f}, согласованность {share:.0%}'

    for key, ratios in by_src.items():
        decide(key, ratios, 'опорные цены')

    # --- pass 2: cross-source duplicates against trusted prices ---
    def eff(r):
        return r['raw'] * factors.get((r['sec'], r['src']), 1)

    trusted = collections.defaultdict(list)
    for r in rows:
        key = (r['sec'], r['src'])
        ok_src = key in factors or (len(by_src.get(key, [])) >= MIN_HITS and key not in factors)
        if ok_src:
            trusted[(r['sec'], r['n'], r['unit'])].append(eff(r))
    dup = collections.defaultdict(list)
    for r in rows:
        key = (r['sec'], r['src'])
        if key in factors or len(by_src.get(key, [])) >= MIN_HITS:
            continue
        t = trusted.get((r['sec'], r['n'], r['unit']))
        if t:
            dup[key].append(statistics.median(t) / r['raw'])
    for key, ratios in dup.items():
        decide(key, ratios, 'совпадения с выверенными источниками', MIN_DUP_HITS)

    # --- apply ---
    qa_counter = collections.Counter()
    suspects = []
    for r in rows:
        it = r['it']
        f = factors.get((r['sec'], r['src']), 1)
        price = round_price(r['raw'] * f) if f != 1 else r['raw']
        it['unit'] = r['unit']
        if f != 1:
            it['priceRaw'] = int(r['raw']) if r['raw'].is_integer() else r['raw']
            it['priceFactor'] = f
        else:
            it.pop('priceRaw', None)
            it.pop('priceFactor', None)
        it['price'] = int(price) if float(price).is_integer() else price
        qa = 'corrected' if f != 1 else 'ok'
        if r['ref'] and not (r['ref'] / TOL <= price <= r['ref'] * TOL):
            qa = 'suspect'
            suspects.append((r['sec'], r['code'], it['name'], r['unit'], price, round(r['ref']), r['src']))
        if qa == 'ok':
            it.pop('qa', None)
        else:
            it['qa'] = qa
        qa_counter[qa] += 1
        r['final'] = price

    after = anchor_stats(lambda r: r['final'])

    covered = sum(1 for r in rows if (r['sec'], r['src']) in factors)
    db.setdefault('stats', {})['audit'] = {
        'date': datetime.date.today().isoformat(),
        'tool': 'tools/pricedb/calibrate.py',
        'sourcesCorrected': len(factors),
        'itemsCorrected': covered,
        'itemsSuspect': qa_counter['suspect'],
        'anchorCheckBefore': dict(before),
        'anchorCheckAfter': dict(after),
    }
    db['regional_coefficients'] = db.get('regional_coefficients', {})

    # --- report ---
    def pct(c):
        tot = sum(c.values()) or 1
        return f"{c['ok']}/{tot} в коридоре ({c['ok'] / tot:.0%}), занижено {c['low']}, завышено {c['high']}"

    L = ['# Аудит прайс-базы QazGost', '',
         f'Дата: {datetime.date.today():%d.%m.%Y}. Файл: `ai-service/app/data/price_db.json`. '
         f'Скрипт: `python3 tools/pricedb/calibrate.py` (повторный запуск безопасен).', '',
         '## Итог', '',
         f'- Позиций всего: {len(rows)}',
         f'- Сверка с опорными ценами **до**: {pct(before)}',
         f'- Сверка с опорными ценами **после**: {pct(after)}',
         f'- Источников с поправочным множителем: {len(factors)}, позиций пересчитано: {covered}',
         f'- Позиций под вопросом (`qa: "suspect"`, скрываются из маркетплейса): {qa_counter["suspect"]}',
         f'- Нормализовано единиц: {sum(unit_changes.values())}', '',
         'Исходная цена каждой пересчитанной позиции сохранена в `priceRaw`, множитель — в `priceFactor`.', '',
         '## Поправки по источникам', '', '| Раздел | Источник | Множитель | Основание |', '|---|---|---|---|']
    for (sec, src), f in sorted(factors.items(), key=lambda x: (-x[1], x[0])):
        L.append(f'| {sec} | `{src}` | ×{f:g} | {why[(sec, src)]} |')
    L += ['', '## Нормализация единиц', '']
    for k, v in unit_changes.most_common():
        L.append(f'- {k}: {v}')
    L += ['', f'## Позиции под вопросом ({len(suspects)})', '',
          'Цена вне коридора опорной (×2.5 в обе стороны) и источник целиком не выправлен. '
          'Нужна ручная проверка по прайсу поставщика.', '',
          '| Раздел | Код | Наименование | Ед. | Цена | Опорная | Источник |', '|---|---|---|---|---|---|---|']
    for s in sorted(suspects, key=lambda x: (x[0], x[6], x[2]))[:400]:
        L.append('| ' + ' | '.join(str(x) for x in s) + ' |')
    if len(suspects) > 400:
        L.append(f'| … | ещё {len(suspects) - 400} | | | | | |')

    print('\n'.join(L[:16]))
    if args.dry_run:
        return
    with open(args.db, 'w', encoding='utf-8') as fh:
        json.dump(db, fh, ensure_ascii=False, indent=2)
    with open(REPORT_PATH, 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(L) + '\n')
    print(f'\nЗаписано: {args.db}\nОтчёт: {REPORT_PATH}')


if __name__ == '__main__':
    main()
