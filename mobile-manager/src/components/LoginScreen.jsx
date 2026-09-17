import React, { useState } from 'react';
import { LogIn, Shield, User, Lock, Mail, CheckCircle2, Sparkles, Smartphone, ArrowRight } from 'lucide-react';
import { MANAGERS_LIST, loginManager } from '../api/crmApi';

export default function LoginScreen({ serverUrl, onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('quick'); // 'quick' | 'form'
  const [selectedManagerId, setSelectedManagerId] = useState('m1');
  const [email, setEmail] = useState('alikhan@qazgost.kz');
  const [password, setPassword] = useState('1234');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleQuickSelect = (mgr) => {
    setSelectedManagerId(mgr.id);
    setEmail(mgr.email);
    setPassword(mgr.passcode);
  };

  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await loginManager(serverUrl, email, password, selectedManagerId);
      if (res.success) {
        onLoginSuccess(res.authData);
      } else {
        setErrorMsg('РћС€РёР±РєР° РІС…РѕРґР°. РџСЂРѕРІРµСЂСЊС‚Рµ РґР°РЅРЅС‹Рµ РёР»Рё РІС‹Р±РµСЂРёС‚Рµ Р±С‹СЃС‚СЂС‹Р№ РїСЂРѕС„РёР»СЊ.');
      }
    } catch (err) {
      setErrorMsg('РќРµ СѓРґР°Р»РѕСЃСЊ РІС‹РїРѕР»РЅРёС‚СЊ РІС…РѕРґ: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', height: '100dvh',
      background: 'radial-gradient(circle at 50% 10%, #152445 0%, #060913 80%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '24px 20px',
      maxWidth: '480px',
      margin: '0 auto',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Ambient background blur circles */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '20%',
        width: '260px',
        height: '260px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 229, 255, 0.25) 0%, transparent 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '240px',
        height: '240px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none'
      }} />

      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px', position: 'relative', zIndex: 2 }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)',
          margin: '0 auto 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 30px rgba(0, 229, 255, 0.45)',
          color: '#000',
          fontWeight: 900,
          fontSize: '1.8rem'
        }}>
          рџЏ—пёЏ
        </div>

        <span style={{
          fontSize: '0.72rem',
          background: 'rgba(0, 229, 255, 0.15)',
          color: '#00e5ff',
          padding: '3px 10px',
          borderRadius: '999px',
          fontWeight: 800,
          letterSpacing: '0.08em',
          border: '1px solid rgba(0, 229, 255, 0.3)'
        }}>
          QAZGOST AI вЂў MOBILE CRM
        </span>

        <h1 style={{ color: '#fff', fontSize: '1.65rem', fontWeight: 900, marginTop: '8px', letterSpacing: '-0.02em' }}>
          Р’С…РѕРґ РґР»СЏ РјРµРЅРµРґР¶РµСЂР°
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.84rem', marginTop: '4px' }}>
          РЈРїСЂР°РІР»РµРЅРёРµ СЃРґРµР»РєР°РјРё, СЃРјРµС‚Р°РјРё Рё РІС‹РµР·РґР°РјРё РЅР° РѕР±СЉРµРєС‚Р°С…
        </p>
      </div>

      {/* Mode Switcher */}
      <div style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '4px',
        marginBottom: '20px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'relative',
        zIndex: 2
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('quick')}
          style={{
            flex: 1,
            padding: '9px 0',
            borderRadius: '9px',
            border: 'none',
            background: activeTab === 'quick' ? 'linear-gradient(135deg, rgba(0, 229, 255, 0.25), rgba(2, 132, 199, 0.25))' : 'transparent',
            color: activeTab === 'quick' ? '#00e5ff' : '#94a3b8',
            fontWeight: 800,
            fontSize: '0.82rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'quick' ? '0 2px 10px rgba(0, 229, 255, 0.2)' : 'none'
          }}
        >
          вљЎ Р‘С‹СЃС‚СЂС‹Р№ РІС‹Р±РѕСЂ
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('form')}
          style={{
            flex: 1,
            padding: '9px 0',
            borderRadius: '9px',
            border: 'none',
            background: activeTab === 'form' ? 'linear-gradient(135deg, rgba(0, 229, 255, 0.25), rgba(2, 132, 199, 0.25))' : 'transparent',
            color: activeTab === 'form' ? '#00e5ff' : '#94a3b8',
            fontWeight: 800,
            fontSize: '0.82rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'form' ? '0 2px 10px rgba(0, 229, 255, 0.2)' : 'none'
          }}
        >
          рџ”ђ Р›РѕРіРёРЅ / РџР°СЂРѕР»СЊ
        </button>
      </div>

      {/* Content based on Active Tab */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {activeTab === 'quick' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>
              Р’С‹Р±РµСЂРёС‚Рµ РІР°С€ СЂР°Р±РѕС‡РёР№ Р°РєРєР°СѓРЅС‚:
            </span>

            {MANAGERS_LIST.map((m) => {
              const isSelected = selectedManagerId === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => handleQuickSelect(m)}
                  className="glass-panel"
                  style={{
                    padding: '14px 16px',
                    borderRadius: '14px',
                    border: isSelected ? '1.5px solid #00e5ff' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isSelected ? 'linear-gradient(135deg, rgba(0, 229, 255, 0.15), rgba(15, 23, 42, 0.9))' : 'rgba(15, 23, 42, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 4px 18px rgba(0, 229, 255, 0.2)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.4rem'
                    }}>
                      {m.avatar}
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.94rem' }}>
                        {m.name}
                      </div>
                      <div style={{ color: isSelected ? '#38bdf8' : '#94a3b8', fontSize: '0.75rem', marginTop: '2px' }}>
                        {m.role}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: isSelected ? '2px solid #00e5ff' : '2px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isSelected ? '#00e5ff' : 'transparent',
                    color: '#000'
                  }}>
                    {isSelected && <CheckCircle2 size={16} strokeWidth={3} />}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '5px' }}>
                Р Р°Р±РѕС‡РёР№ Email РјРµРЅРµРґР¶РµСЂР°:
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@qazgost.kz"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '11px 12px 11px 38px',
                    color: '#fff',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '5px' }}>
                РџР°СЂРѕР»СЊ РёР»Рё PIN-РєРѕРґ:
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="вЂўвЂўвЂўвЂўвЂўвЂўвЂўвЂў"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '11px 12px 11px 38px',
                    color: '#fff',
                    fontSize: '0.88rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </form>
        )}

        {errorMsg && (
          <div style={{
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171',
            fontSize: '0.8rem',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            {errorMsg}
          </div>
        )}

        {/* Submit Login Button */}
        <button
          type="button"
          onClick={handleLoginSubmit}
          disabled={isLoading}
          className="glow-btn"
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <LogIn size={20} />
          <span>{isLoading ? 'РђРІС‚РѕСЂРёР·Р°С†РёСЏ...' : 'Р’РѕР№С‚Рё РІ Р»РёС‡РЅС‹Р№ РєР°Р±РёРЅРµС‚'}</span>
          <ArrowRight size={18} />
        </button>

        {/* Offline Badge Footer */}
        <div style={{
          marginTop: '22px',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          color: '#10b981',
          fontSize: '0.75rem',
          fontWeight: 700
        }}>
          <CheckCircle2 size={14} /> РђРІС‚РѕРЅРѕРјРЅС‹Р№ СЂРµР¶РёРј Р°РєС‚РёРІРµРЅ вЂў Р”РѕСЃС‚СѓРїРµРЅ Р±РµР· РёРЅС‚РµСЂРЅРµС‚Р°
        </div>
      </div>
    </div>
  );
}
