import requests
BASE = 'http://localhost:8001'
P = F = 0

def t(name, fn):
    global P, F
    try:
        ok, d = fn()
        if ok: P += 1
        else: F += 1
        print(f'  {"PASS" if ok else "FAIL"}  {name} -- {d}')
    except Exception as e:
        F += 1
        print(f'  FAIL  {name} -- {e}')

print('== Core ==')
t('Root', lambda: (True, requests.get(f'{BASE}/', timeout=3).json().get('name','')))
t('Health', lambda: (True, requests.get(f'{BASE}/api/v1/health', timeout=3).json().get('status','')))
t('Docs', lambda: ('swagger' in requests.get(f'{BASE}/docs', timeout=3).text.lower(), 'ok'))

print('== Engineering ==')
t('Sewage', lambda: (requests.post(f'{BASE}/api/v1/engineering/sewage', json={'area_m2':100,'city':'almaty','length_m':50}, timeout=5).status_code==200, 'ok'))
t('Water', lambda: (requests.post(f'{BASE}/api/v1/engineering/water', json={'area_m2':80,'city':'astana','hot_water':True,'length_m':40,'points_count':5,'pipe_length_m':30}, timeout=5).status_code==200, 'ok'))
t('Electrical', lambda: (requests.post(f'{BASE}/api/v1/engineering/electrical', json={'area_m2':120,'city':'almaty','sockets':20,'switches':10}, timeout=5).status_code==200, 'ok'))

r = requests.post(f'{BASE}/api/v1/engineering/full', json={'area_m2':150,'city':'almaty','systems':['sewage','water_supply','electrical'],'hot_water':True,'sockets':25,'switches':12}, timeout=5)
d = r.json()
t('Full Estimate', lambda: (r.status_code==200, f'grand_total={d.get("grand_total",0):,.0f} tenge'))

print('== Reports ==')
rp = requests.post(f'{BASE}/api/v1/engineering/report/pdf', json={'area_m2':100,'city':'almaty','systems':['sewage'],'hot_water':False,'sockets':0,'switches':0}, timeout=10)
t('PDF Report', lambda: (rp.content[:5]==b'%PDF-', f'{len(rp.content):,} bytes'))

rx = requests.post(f'{BASE}/api/v1/engineering/report/excel', json={'area_m2':100,'city':'almaty','systems':['sewage'],'hot_water':False,'sockets':0,'switches':0}, timeout=10)
t('Excel Report', lambda: (rx.content[:2]==b'PK', f'{len(rx.content):,} bytes'))

print('== Prices ==')
ps = requests.get(f'{BASE}/api/v1/prices/search', params={'q':'beton'}, timeout=5)
t('Price Search', lambda: (ps.status_code==200, f'keys={list(ps.json().keys())[:3]}'))

pst = requests.get(f'{BASE}/api/v1/prices/stats', timeout=3)
t('Price Stats', lambda: (pst.status_code==200, f'keys={list(pst.json().keys())[:3]}'))

print('== Metrics ==')
t('Prometheus', lambda: (requests.get(f'{BASE}/metrics', timeout=3).status_code==200, 'ok'))

print('== Edge Cases ==')
t('Zero Area', lambda: (requests.post(f'{BASE}/api/v1/engineering/sewage', json={'area_m2':0,'city':'almaty','length_m':0}, timeout=3).status_code in [200,422], 'no crash'))
t('Huge Area', lambda: (requests.post(f'{BASE}/api/v1/engineering/full', json={'area_m2':999999,'city':'almaty','systems':['sewage'],'hot_water':False,'sockets':0,'switches':0}, timeout=5).status_code==200, 'no crash'))
t('Bad City', lambda: (requests.post(f'{BASE}/api/v1/engineering/sewage', json={'area_m2':50,'city':'fakeXYZ','length_m':20}, timeout=3).status_code in [200,422], 'no crash'))
# /analyze requires JWT auth - 401 is correct behavior, not a bug
t('Auth Guard /analyze', lambda: (requests.post(f'{BASE}/api/v1/analyze', timeout=3).status_code==401, 'JWT required (correct)'))

print(f'\n{"="*50}')
print(f'RESULTS: {P}/{P+F} passed ({P*100//(P+F) if P+F else 0}%)')
if F == 0: print('ALL TESTS PASSED!')
else: print(f'{F} test(s) FAILED')
