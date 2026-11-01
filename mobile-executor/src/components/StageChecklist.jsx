import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { STAGE_CONFIG, defaultStages } from '../api/executorApi';

// The 7 work stages are a real sequence, so they are numbered.
export default function StageChecklist({ order, onToggleStage, withNotes = false, compact = false }) {
  const stages = order.stages && order.stages.length ? order.stages : defaultStages();
  const [notes, setNotes] = useState({});
  const nextIdx = stages.findIndex(s => !s.done);

  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
      {stages.map((st, i) => {
        const desc = STAGE_CONFIG.find(c => c.id === st.id)?.desc;
        const isNext = i === nextIdx;
        return (
          <li key={st.id}>
            <button
              type="button"
              onClick={() => onToggleStage(order.id, st.id, !st.done, notes[st.id] || '')}
              aria-pressed={!!st.done}
              aria-label={`${i + 1}. ${st.title}: ${st.done ? 'выполнен, нажмите чтобы отменить' : 'отметить выполненным'}`}
              style={{
                width: '100%',
                minHeight: 56,
                display: 'grid',
                gridTemplateColumns: '32px minmax(0, 1fr) auto',
                alignItems: 'center',
                gap: 12,
                padding: '8px 12px',
                borderRadius: 'var(--r-md)',
                border: `1px solid ${isNext ? 'var(--accent-line)' : 'var(--line)'}`,
                background: st.done ? 'rgba(52, 211, 153, 0.07)' : 'var(--surface)',
                color: 'var(--text)',
                textAlign: 'left'
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 700,
                  fontSize: 'var(--fs-sm)',
                  fontVariantNumeric: 'tabular-nums',
                  background: st.done ? 'var(--ok)' : (isNext ? 'var(--accent-soft)' : 'var(--surface-3)'),
                  color: st.done ? '#052e1f' : (isNext ? 'var(--accent)' : 'var(--text-2)')
                }}
              >
                {st.done ? <Check size={18} strokeWidth={3} /> : i + 1}
              </span>
              <span style={{ minWidth: 0 }}>
                <span className="qz-h3" style={{ display: 'block', color: st.done ? 'var(--text-2)' : 'var(--text)' }}>{st.title}</span>
                <span className="qz-xs qz-faint" style={{ display: 'block' }}>
                  {st.done ? `Сделано${st.time ? ` в ${st.time}` : ''}${st.note ? `, ${st.note}` : ''}` : (compact && !isNext ? '' : (desc || ''))}
                </span>
              </span>
              <span className="qz-xs" style={{ color: st.done ? 'var(--ok)' : (isNext ? 'var(--accent)' : 'var(--text-3)'), fontWeight: 650 }}>
                {st.done ? 'Готово' : (isNext ? 'Следующий' : '')}
              </span>
            </button>
            {withNotes && isNext && (
              <input
                className="qz-input"
                style={{ marginTop: 6, minHeight: 44 }}
                value={notes[st.id] || ''}
                onChange={(e) => setNotes(prev => ({ ...prev, [st.id]: e.target.value }))}
                placeholder="Комментарий к этапу (необязательно)"
                aria-label={`Комментарий к этапу ${st.title}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
