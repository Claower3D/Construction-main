import React from 'react';
import { Camera, ClipboardList, Package, Truck, Users, ListChecks, Calculator, Building2, ArrowRight } from 'lucide-react';
import { startFlow, navigateTo } from '../utils/navigate';

// Все сервисы платформы: что делает, что получаете, куда перейти.
const SERVICES = [
  { icon: Camera, title: 'Смета по фото', what: 'Расчёт работ и стоимости по фото объекта', result: 'Готовая смета', go: () => startFlow('register') },
  { icon: ClipboardList, title: 'Акт дефектов', what: 'Трещины на фото, норматив и цена ремонта', result: 'Акт с рекомендациями', go: () => startFlow('register') },
  { icon: Package, title: 'Стройматериалы', what: '10 425 позиций с ценами по регионам РК', result: 'Заказ и доставка', go: () => navigateTo('/materials') },
  { icon: Truck, title: 'Спецтехника', what: 'Экскаваторы, краны и самосвалы посменно', result: 'Бронь с эскроу', go: () => navigateTo('/equipment') },
  { icon: Users, title: 'Каталог подрядчиков', what: 'Бригады с бригадиром, составом и телефоном', result: 'Прямой контакт', go: () => navigateTo('/catalog') },
  { icon: ListChecks, title: 'Лента заказов', what: 'Заявки по городу, этапы и сдача объекта', result: 'Заказы для бригад', go: () => startFlow('login') },
  { icon: Calculator, title: 'Инженерный калькулятор', what: 'Кабель, отопление, водоснабжение, канализация', result: 'Расчёт по СНиП', go: () => navigateTo('/calc') },
  { icon: Building2, title: 'Инжиниринг и ПСД', what: 'Проект, инженерные сети, технадзор', result: 'Пакет документов', go: () => navigateTo('/engineering') },
];

export default function PlatformServicesSection() {
  return (
    <section className="lux-section" id="services" aria-labelledby="lux-services-title">
      <div className="qg-container">
        <header className="lux-head">
          <h2 id="lux-services-title">Все сервисы платформы</h2>
          <p>Один аккаунт для заказчика, бригады и инженера.</p>
        </header>
        <div className="lux-glass lux-services">
          <table className="lux-table lux-table--services">
            <thead>
              <tr>
                <th scope="col">Сервис</th>
                <th scope="col">Назначение</th>
                <th scope="col">Результат</th>
                <th scope="col"><span className="qg-visually-hidden">Перейти</span></th>
              </tr>
            </thead>
            <tbody>
              {SERVICES.map(({ icon: Icon, title, what, result, go }) => (
                <tr key={title}>
                  <th scope="row"><span className="lux-svc-name"><Icon size={18} aria-hidden="true" />{title}</span></th>
                  <td>{what}</td>
                  <td className="lux-svc-result">{result}</td>
                  <td className="num">
                    <button type="button" className="lux-open" onClick={go} aria-label={`Открыть: ${title}`}>
                      Открыть <ArrowRight size={15} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
