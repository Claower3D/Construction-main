import React from 'react';
import './DemoNotice.css';

/**
 * Честная пометка на разделах, где показаны примеры, а не данные пользователя.
 * Раньше образцы (заявки, объекты на сотни миллионов тенге, «пользователи», акты) выглядели
 * как настоящие записи — владелец и новые пользователи принимали их за свои данные.
 */
export default function DemoNotice({ title = 'Здесь показаны примеры', children }) {
  return (
    <div className="qg-demo-notice" role="note" data-testid="demo-notice">
      <span className="qg-demo-notice-tag" aria-hidden="true">Пример</span>
      <p>
        <strong>{title}.</strong>{' '}
        {children || 'Заявки, объекты и суммы на этой странице — образец, чтобы было видно, как устроен раздел. Это не ваши данные; свои записи хранятся только в этом браузере.'}
      </p>
    </div>
  );
}
