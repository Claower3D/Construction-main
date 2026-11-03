import React from 'react';
import { Camera, ScanSearch, Hammer, HardHat, Package, Truck, ShieldCheck, FileText, MapPin, ChevronRight, Sparkles } from 'lucide-react';
import { SERVICES } from '../data/services';
import { Ticket, formatMoney } from './ui/kit';

const POPULAR = ['otdelka-sten', 'poly-i-plitka', 'elektrika', 'santehnika', 'krovlya', 'fundament', 'okna-i-dveri', 'otoplenie'];

export default function HomeScreen({ user, city, orders, onEstimate, onDefects, onOrder, onOpenService, onMarket, onOpenOrders, onOpenOrder }) {
  const firstName = (user?.name || '').split(' ')[0];
  const popular = POPULAR.map((slug) => SERVICES.find((s) => s.slug === slug)).filter(Boolean);
  const active = orders.filter((o) => !/заверш|отмен/i.test(o.status)).slice(0, 2);

  return (
    <div className="qz-page cl-home">
      <section className="cl-hero">
        <img className="cl-hero-img" src="img/hero.webp" alt="" />
        <div className="cl-hero-body">
          <p className="cl-pill"><Sparkles size={13} aria-hidden="true" /> AI-оценка по нормам РК</p>
          <h2 className="cl-hero-title">{firstName ? `${firstName}, что строим?` : 'Ремонт и стройка без переплат'}</h2>
          <p className="cl-hero-text">Сфотографируйте объект — получите смету и бригаду в городе {city}.</p>
          <button type="button" className="qz-btn is-primary cl-hero-btn" onClick={onEstimate}>
            <Camera size={20} aria-hidden="true" /> Смета по фото
          </button>
        </div>
      </section>

      <div className="cl-actions">
        <button type="button" className="cl-action" onClick={onDefects}>
          <span className="cl-action-icon is-violet"><ScanSearch size={22} /></span>
          <strong>Проверить дефекты</strong><span>Трещины на фото</span>
        </button>
        <button type="button" className="cl-action" onClick={() => onOrder(null)}>
          <span className="cl-action-icon"><Hammer size={22} /></span>
          <strong>Заказать работу</strong><span>Бригада придёт</span>
        </button>
        <button type="button" className="cl-action" onClick={() => onMarket('contractors')}>
          <span className="cl-action-icon is-violet"><HardHat size={22} /></span>
          <strong>Бригады</strong><span>С телефонами</span>
        </button>
        <button type="button" className="cl-action" onClick={() => onMarket('materials')}>
          <span className="cl-action-icon"><Package size={22} /></span>
          <strong>Материалы</strong><span>Цены по регионам</span>
        </button>
        <button type="button" className="cl-action is-wide" onClick={() => onMarket('equipment')}>
          <span className="cl-action-icon is-violet"><Truck size={22} /></span>
          <span className="qz-grow"><strong>Аренда спецтехники</strong><span>Экскаваторы, краны, самосвалы — посменно</span></span>
          <ChevronRight size={18} className="qz-faint" aria-hidden="true" />
        </button>
      </div>

      {active.length > 0 && (
        <>
          <div className="qz-section-head">
            <h3 className="qz-h3">Мои заказы</h3>
            <button type="button" className="cl-link" onClick={onOpenOrders}>Все</button>
          </div>
          <div className="qz-stack">
            {active.map((o) => (
              <Ticket
                key={o.id}
                status={o.status}
                title={o.title}
                number={String(o.id).startsWith('local') ? null : o.id}
                meta={[{ icon: <MapPin size={14} />, text: o.location }]}
                amount={o.totalSum ? formatMoney(o.totalSum) : null}
                date={o.deadline}
                tag={o._pending ? <span className="qz-tag is-warn">Не отправлен</span> : null}
                onOpen={() => onOpenOrder(o)}
              />
            ))}
          </div>
        </>
      )}

      <div className="qz-section-head">
        <h3 className="qz-h3">Популярные услуги</h3>
        <span className="qz-xs qz-faint">цены 2026</span>
      </div>
      <div className="cl-hscroll">
        {popular.map((s) => (
          <button key={s.slug} type="button" className="cl-svc-card" onClick={() => onOpenService(s)}>
            <img src={s.image} alt="" loading="lazy" />
            <span className="cl-svc-name">{s.name}</span>
            <span className="cl-svc-price">{s.priceRange}</span>
          </button>
        ))}
      </div>

      <div className="cl-trust">
        <div><ShieldCheck size={20} aria-hidden="true" /><span><strong>Эскроу</strong>деньги бригаде — после приёмки</span></div>
        <div><FileText size={20} aria-hidden="true" /><span><strong>23 864 расценки</strong>база ГЭСН РК</span></div>
      </div>
    </div>
  );
}
