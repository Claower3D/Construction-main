import React, { useEffect, useRef, useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { ANDROID_APK_FILE, ANDROID_APK_SIZE_MB, ANDROID_APK_URL, ANDROID_APP_VERSION, isAndroidBrowser } from '../utils/androidApp';
import './AndroidAppPrompt.css';

/*
 * Окно при открытии сайта на Android: остаться на сайте или скачать приложение.
 * Появляется при каждом открытии сайта — выбор не запоминается, так задумано:
 * приложения нет в магазинах, и о нём иначе не узнать. Внутри самого приложения,
 * на iPhone и на компьютере окно не показывается.
 */
export default function AndroidAppPrompt() {
  const [open, setOpen] = useState(() => {
    try { return isAndroidBrowser(navigator.userAgent, window); } catch (e) { return false; }
  });
  const cardRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    // страница под окном не прокручивается, Esc закрывает окно
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); return; }
      if (e.key !== 'Tab' || !cardRef.current) return;
      // Tab ходит только по кнопкам окна
      const items = cardRef.current.querySelectorAll('a[href], button');
      if (!items.length) return;
      const first = items[0]; const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    if (cardRef.current) cardRef.current.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  if (!open) return null;
  const close = () => setOpen(false);

  return (
    <div className="aap-backdrop" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="aap-card" role="dialog" aria-modal="true" aria-labelledby="aap-title" aria-describedby="aap-text" tabIndex={-1} ref={cardRef}>
        <div className="aap-icon" aria-hidden="true"><Smartphone size={26} /></div>
        <h2 id="aap-title">QazGost — приложение для Android</h2>
        <p id="aap-text">В одном приложении всё: заказчик, исполнитель, инженер, менеджер и администратор. Сметы по фото, заказы и проверка дефектов — с телефона.</p>
        <div className="aap-actions">
          <a className="qg-btn qg-btn--primary aap-btn" href={ANDROID_APK_URL} download={ANDROID_APK_FILE} onClick={close}>
            <Download size={18} aria-hidden="true" />Скачать приложение
          </a>
          <button type="button" className="qg-btn qg-btn--ghost aap-btn" onClick={close}>Остаться на сайте</button>
        </div>
        <p className="aap-note">{`Файл APK, ${ANDROID_APK_SIZE_MB} МБ, версия ${ANDROID_APP_VERSION}. Android попросит разрешить установку из браузера.`}</p>
      </div>
    </div>
  );
}
