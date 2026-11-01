import React from 'react';
import { Pickaxe, Compass, Gauge, Hammer, CircleDot, FlaskConical, ArrowRight } from 'lucide-react';
import { navigateTo } from '../utils/navigate';
import { LightTrails, Sparkles } from './LuxFx';

/*
 * Изыскания и геотехника: фото техники слева, шесть услуг с ключевым
 * параметром справа. Заявка оформляется в разделе инжиниринга.
 */
const SERVICES = [
  { icon: Pickaxe, title: 'Инженерно-геологические изыскания', param: 'бурение до 35 м' },
  { icon: Compass, title: 'Геодезия и топосъёмка', param: 'масштаб 1:500' },
  { icon: Gauge, title: 'Статическое зондирование (CPT)', param: 'усилие 200 кН' },
  { icon: Hammer, title: 'Испытания свай', param: 'нагрузка до 500 т' },
  { icon: CircleDot, title: 'Штамповые испытания', param: 'модуль деформации E' },
  { icon: FlaskConical, title: 'Лаборатория грунтов', param: 'аккредитованные стенды' },
];

export default function EngineeringServicesSection() {
  return (
    <section className="lux-section lux-geo" id="engineering" aria-labelledby="lux-geo-title">
      <div className="lux-geo-photo" aria-hidden="true" />
      <LightTrails variant="low" className="fx-trails--geo" />
      <Sparkles count={16} seed={41} />
      <div className="qg-container lux-geo-grid">
        <div className="lux-geo-body">
          <header className="lux-head">
            <h2 id="lux-geo-title">Изыскания и геотехника</h2>
            <p>Полевые и лабораторные испытания с официальным заключением по СНиП РК и СП РК — для проекта, экспертизы и банка.</p>
          </header>
          <ul className="lux-geo-list">
            {SERVICES.map(({ icon: Icon, title, param }) => (
              <li key={title}>
                <span className="lux-icon lux-icon--sm"><Icon size={18} aria-hidden="true" /></span>
                <span>
                  <strong>{title}</strong>
                  <span className="qg-num">{param}</span>
                </span>
              </li>
            ))}
          </ul>
          <button type="button" className="qg-btn qg-btn--ghost" onClick={() => navigateTo('/engineering')}>
            Заказать изыскания <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
