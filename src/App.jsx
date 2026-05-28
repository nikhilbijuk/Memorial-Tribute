import { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&family=Cinzel:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Lato:wght@300;400;700&display=swap');
`;

const css = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  :root {
    --bg-parchment: #faf7f0;
    --bg-card: #ffffff;
    --text-dark: #2a2018;
    --text-light: #fefcf9;
    --text-muted: #6e5b4b;
    --gold-primary: #c4a478;
    --gold-dark: #8b6e4b;
    --gold-light: #eedcbe;
    --gold-glow: rgba(196, 164, 120, 0.4);
    --gold-border: rgba(196, 164, 120, 0.35);
    --shadow-subtle: 0 4px 20px rgba(61, 43, 31, 0.05);
    --shadow-premium: 0 16px 44px rgba(42, 32, 24, 0.08);
    --font-serif: 'Cinzel', 'Playfair Display', serif;
    --font-sans: 'Lato', sans-serif;
    --font-script: 'Caveat', cursive;
    --border-radius-sm: 8px;
    --border-radius-md: 14px;
    --border-radius-lg: 24px;
  }

  .dark-mode {
    --bg-parchment: #13100d;
    --bg-card: #1c1814;
    --text-dark: #f0e6dc;
    --text-muted: #ab9887;
    --gold-primary: #dcbfa0;
    --gold-dark: #ae8b63;
    --gold-light: #524334;
    --gold-glow: rgba(220, 191, 160, 0.35);
    --gold-border: rgba(220, 191, 160, 0.22);
    --shadow-subtle: 0 4px 24px rgba(0, 0, 0, 0.3);
    --shadow-premium: 0 16px 48px rgba(0, 0, 0, 0.55);
  }

  body {
    font-family: var(--font-sans);
    background: var(--bg-parchment);
    color: var(--text-dark);
    min-height: 100vh;
    transition: background 0.4s, color 0.4s;
    overflow-x: hidden;
  }

  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  /* FIREBASE CONNECTIVITY STATUS BAR */
  .status-bar {
    background: #eae1d4;
    color: #5c4a3c;
    font-size: 12px;
    text-align: center;
    padding: 6px 1rem;
    font-family: var(--font-sans);
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-bottom: 1px solid var(--gold-border);
    transition: background 0.3s, color 0.3s;
  }
  .dark-mode .status-bar {
    background: #251e18;
    color: #bfa58f;
  }
  .status-indicator {
    width: 8px; height: 8px;
    border-radius: 50%;
    display: inline-block;
  }
  .status-indicator.online { background: #3fa15c; box-shadow: 0 0 8px rgba(63, 161, 92, 0.6); }
  .status-indicator.offline { background: #d3733c; box-shadow: 0 0 8px rgba(211, 115, 60, 0.6); }

  /* UTILITIES & ORNAMENTS */
  .gold-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.2rem;
    margin: 1.5rem 0;
  }
  .gold-divider::before, .gold-divider::after {
    content: '';
    height: 1px;
    flex: 1;
    background: linear-gradient(to var(--gold-primary), transparent);
  }
  .gold-divider::before { background: linear-gradient(90deg, transparent, var(--gold-primary)); }
  .gold-divider::after { background: linear-gradient(90deg, var(--gold-primary), transparent); }
  .gold-divider .symbol {
    color: var(--gold-primary);
    font-size: 14px;
    letter-spacing: 2px;
  }

  /* DECORATIVE CORNERS */
  .deco-border {
    position: relative;
    border: 1px solid var(--gold-border);
    border-radius: var(--border-radius-md);
    padding: 2rem;
    background: var(--bg-card);
    box-shadow: var(--shadow-subtle);
  }
  .deco-border::before, .deco-border::after {
    content: '';
    position: absolute;
    width: 20px; height: 20px;
    border: 2px solid var(--gold-primary);
    pointer-events: none;
    transition: border-color 0.3s;
  }
  .deco-border::before { top: 8px; left: 8px; border-right: none; border-bottom: none; }
  .deco-border::after { bottom: 8px; right: 8px; border-left: none; border-top: none; }

  /* HEADER / HERO */
  .memorial-hero {
    background: linear-gradient(135deg, #241c15 0%, #3e3024 50%, #1a1410 100%);
    color: var(--text-light);
    padding: 3.5rem 2rem 3rem;
    text-align: center;
    position: relative;
    overflow: hidden;
    border-bottom: 2px solid var(--gold-primary);
    box-shadow: 0 8px 30px rgba(0,0,0,0.25);
  }
  .memorial-hero::before {
    content: '';
    position: absolute; inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c4a478' fill-opacity='0.03'%3E%3Cpath d='M40 0l40 40-40 40L0 40z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    opacity: 0.7;
    pointer-events: none;
  }
  .hero-eyebrow {
    font-family: var(--font-serif);
    font-size: 11px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--gold-primary);
    margin-bottom: 1rem;
    font-weight: 600;
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }
  .hero-title {
    font-family: var(--font-serif);
    font-size: clamp(2.2rem, 5vw, 3.8rem);
    color: #fff9f2;
    font-weight: 500;
    line-height: 1.25;
    margin-bottom: 0.6rem;
    letter-spacing: 1px;
  }
  .hero-dates {
    font-family: var(--font-serif);
    font-size: clamp(1.05rem, 3vw, 1.4rem);
    color: var(--gold-primary);
    letter-spacing: 2px;
    margin-bottom: 1.2rem;
    display: inline-block;
    padding-bottom: 0.4rem;
    border-bottom: 1px solid var(--gold-border);
  }
  .hero-quote {
    font-family: 'Playfair Display', serif;
    font-style: italic;
    font-size: clamp(0.95rem, 2.5vw, 1.15rem);
    color: #dfd2c4;
    max-width: 680px;
    margin: 0.5rem auto 1.5rem;
    line-height: 1.6;
  }
  .hero-location {
    font-size: 13px;
    color: #a4917f;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
  }
  .hero-controls {
    position: absolute; top: 1.2rem; right: 1.2rem;
    display: flex; gap: 8px;
    z-index: 10;
  }
  .hero-btn {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.18);
    color: #e6d8cb;
    padding: 8px 14px;
    border-radius: 20px;
    font-size: 12px;
    cursor: pointer;
    font-family: var(--font-sans);
    display: flex; align-items: center; gap: 6px;
    transition: all 0.2s;
  }
  .hero-btn:hover {
    background: rgba(255,255,255,0.18);
    border-color: var(--gold-primary);
    color: #fff;
  }

  /* NAVIGATION TABS */
  .tab-nav {
    display: flex;
    justify-content: center;
    background: var(--bg-card);
    border-bottom: 1px solid var(--gold-border);
    position: sticky; top: 0;
    z-index: 20;
    box-shadow: 0 4px 15px rgba(0,0,0,0.02);
  }
  .tab-btn {
    background: none;
    border: none;
    padding: 1.2rem 2rem;
    font-family: var(--font-serif);
    font-size: 0.95rem;
    font-weight: 500;
    letter-spacing: 1px;
    color: var(--text-muted);
    cursor: pointer;
    position: relative;
    transition: color 0.25s;
    display: flex; align-items: center; gap: 8px;
  }
  .tab-btn:hover { color: var(--gold-dark); }
  .tab-btn.active {
    color: var(--text-dark);
    font-weight: 600;
  }
  .tab-btn.active::after {
    content: '';
    position: absolute; bottom: -1px; left: 15%; right: 15%;
    height: 3px;
    background: var(--gold-primary);
    border-radius: 4px 4px 0 0;
    box-shadow: 0 -2px 6px var(--gold-glow);
  }

  /* CONTAINER LAYOUT */
  .container {
    max-width: 960px;
    margin: 2.2rem auto 4rem;
    padding: 0 1.5rem;
    width: 100%;
    animation: fadeIn 0.4s ease-out;
  }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  /* REMEMBRANCE ALTAR TAB */
  .altar-grid {
    display: grid;
    grid-template-columns: 1.1fr 1fr;
    gap: 2rem;
    align-items: start;
    margin-bottom: 3rem;
  }

  /* MEMORIAL PORTRAIT */
  .portrait-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .portrait-frame-container {
    position: relative;
    width: 240px; height: 290px;
    margin-bottom: 1.2rem;
  }
  .portrait-frame {
    width: 100%; height: 100%;
    border-radius: 120px 120px 24px 24px;
    border: 4px solid var(--bg-card);
    outline: 2px solid var(--gold-primary);
    box-shadow: var(--shadow-premium), 0 0 25px var(--gold-glow);
    overflow: hidden;
    position: relative;
    background: #e6dfd5;
    transition: outline-color 0.3s;
  }
  .portrait-frame.placeholder {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    color: var(--gold-dark);
  }
  .portrait-img {
    width: 100%; height: 100%;
    object-fit: cover;
  }
  .portrait-upload-overlay {
    position: absolute; inset: 0;
    background: rgba(0,0,0,0.6);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    color: #fff; font-size: 12px; font-weight: bold;
    cursor: pointer; opacity: 0;
    transition: opacity 0.25s;
    text-transform: uppercase; letter-spacing: 1px;
    text-align: center; padding: 1rem;
  }
  .portrait-frame-container:hover .portrait-upload-overlay { opacity: 1; }
  
  .epitaph-box {
    margin-top: 1rem;
    font-family: 'Playfair Display', serif;
    font-style: italic;
    color: var(--text-muted);
    font-size: 0.98rem;
    line-height: 1.6;
    max-width: 320px;
  }

  /* CANDLE ALTAR */
  .candle-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 290px;
  }
  .candle-display {
    position: relative;
    height: 160px; width: 140px;
    display: flex; justify-content: center; align-items: flex-end;
    margin-bottom: 1.5rem;
  }
  
  /* REALISTIC CSS CANDLE */
  .candle-pillar {
    width: 48px; height: 90px;
    background: linear-gradient(to right, #f6f0e4, #fffef9 50%, #ebdcb9);
    border-radius: 4px 4px 2px 2px;
    box-shadow: inset -4px 0 10px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.08);
    position: relative;
    transition: height 0.3s;
  }
  .candle-pillar::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 6px;
    background: radial-gradient(ellipse at center, #ffffff 0%, #ebdcb9 80%);
    border-radius: 50%;
  }
  .candle-wick {
    width: 3px; height: 12px;
    background: #3a2e2b;
    position: absolute; bottom: 90px; left: 50%;
    transform: translateX(-50%);
    border-radius: 1px;
  }
  .candle-flame {
    position: absolute;
    bottom: 100px; left: 50%;
    transform: translateX(-50%);
    width: 18px; height: 38px;
    border-radius: 50% 50% 20% 20% / 60% 60% 40% 40%;
    background: linear-gradient(to top, rgba(0,20,150,0.8) 0%, rgba(240,110,10,0.9) 30%, rgba(255,230,120,1) 70%, rgba(255,255,255,1) 100%);
    filter: drop-shadow(0 0 12px var(--gold-primary));
    animation: flicker 2s infinite alternate ease-in-out;
    transform-origin: center bottom;
  }
  .candle-flame.off { display: none; }
  .candle-glow {
    position: absolute;
    bottom: 90px; left: 50%;
    transform: translate(-50%, 30px);
    width: 120px; height: 120px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,235,170,0.3) 0%, rgba(255,235,170,0.05) 50%, rgba(255,235,170,0) 70%);
    pointer-events: none;
    animation: pulseGlow 4s infinite alternate;
  }
  .candle-glow.off { display: none; }

  @keyframes flicker {
    0% { transform: translateX(-50%) scale(1) rotate(-1deg); }
    20% { transform: translateX(-50%) scale(1.04) rotate(1deg); }
    45% { transform: translateX(-50%) scale(0.96) rotate(-0.5deg); }
    70% { transform: translateX(-50%) scale(1.02) rotate(1.5deg); }
    100% { transform: translateX(-50%) scale(0.99) rotate(0deg); }
  }
  @keyframes pulseGlow {
    0% { opacity: 0.8; transform: translate(-50%, 30px) scale(0.95); }
    100% { opacity: 1; transform: translate(-50%, 30px) scale(1.05); }
  }

  .altar-info { text-align: center; }
  .candle-count-title {
    font-family: var(--font-serif);
    font-size: 1.15rem;
    color: var(--text-dark);
    margin-bottom: 0.5rem;
  }
  .candle-count-title span {
    font-weight: bold; color: var(--gold-dark);
  }
  .candle-btn {
    background: linear-gradient(135deg, var(--gold-dark), var(--gold-primary));
    color: #fff; border: none;
    border-radius: 30px;
    padding: 10px 24px; font-family: var(--font-serif);
    font-size: 0.9rem; letter-spacing: 1px;
    cursor: pointer; font-weight: 600;
    box-shadow: 0 4px 15px var(--gold-glow);
    transition: all 0.25s;
    margin-top: 0.8rem;
    display: inline-flex; align-items: center; gap: 8px;
  }
  .candle-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px var(--gold-glow);
  }

  /* CEREMONY SCHEDULE TIMELINE */
  .schedule-container {
    margin-top: 2rem;
  }
  .section-title {
    font-family: var(--font-serif);
    text-align: center;
    font-size: 1.45rem;
    margin-bottom: 1.8rem;
    letter-spacing: 1.5px;
    color: var(--text-dark);
  }
  .schedule-timeline {
    position: relative;
    max-width: 680px; margin: 0 auto;
    padding: 0.5rem 0;
  }
  .schedule-timeline::before {
    content: '';
    position: absolute; top: 0; bottom: 0; left: 80px;
    width: 2px; background: var(--gold-border);
  }
  .schedule-item {
    display: flex;
    margin-bottom: 1.8rem;
    position: relative;
    animation: fadeIn 0.3s ease;
  }
  .schedule-time {
    width: 65px;
    font-family: var(--font-serif);
    font-size: 0.85rem;
    color: var(--gold-dark);
    text-align: right;
    padding-top: 2px;
    font-weight: 600;
    margin-right: 15px;
  }
  .schedule-dot {
    position: absolute; left: 81px; top: 7px;
    width: 10px; height: 10px;
    background: var(--bg-card);
    border: 2.5px solid var(--gold-primary);
    border-radius: 50%;
    transform: translateX(-50%);
    z-index: 2;
  }
  .schedule-content {
    flex: 1;
    margin-left: 25px;
    background: var(--bg-card);
    border: 1px solid var(--gold-border);
    border-radius: var(--border-radius-sm);
    padding: 1rem 1.2rem;
    box-shadow: var(--shadow-subtle);
    position: relative;
  }
  .schedule-item-title {
    font-family: var(--font-serif);
    font-size: 1rem;
    color: var(--text-dark);
    font-weight: 600;
    margin-bottom: 4px;
    display: flex; justify-content: space-between; align-items: center;
  }
  .schedule-item-desc {
    font-size: 13.5px;
    color: var(--text-muted);
    line-height: 1.5;
  }
  .schedule-edit-btn {
    background: none; border: none; color: var(--gold-primary);
    cursor: pointer; font-size: 12px; transition: color 0.2s;
  }
  .schedule-edit-btn:hover { color: var(--gold-dark); }

  /* UPLOAD ZONE */
  .upload-zone {
    margin-bottom: 2.5rem;
  }
  .drop-area {
    border: 2px dashed var(--gold-primary);
    border-radius: var(--border-radius-md);
    padding: 3rem 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.25s;
    background: var(--bg-card);
    position: relative;
    box-shadow: var(--shadow-subtle);
  }
  .drop-area:hover, .drop-area.dragging {
    border-color: var(--gold-dark);
    background: rgba(196,164,120,0.05);
    transform: scale(1.005);
  }
  .drop-icon {
    font-size: 3rem;
    margin-bottom: 0.8rem;
    display: block;
    filter: drop-shadow(0 4px 8px var(--gold-glow));
  }
  .drop-title {
    font-family: var(--font-serif);
    font-size: 1.15rem;
    color: var(--text-dark);
    margin-bottom: 0.4rem;
  }
  .drop-sub { font-size: 13px; color: var(--text-muted); }
  .drop-input { display: none; }
  .upload-btn {
    display: inline-block;
    margin-top: 1.2rem;
    background: linear-gradient(135deg, #42352b, #2a2018);
    color: #fff;
    border: none; border-radius: 8px;
    padding: 10px 24px; font-size: 13.5px;
    cursor: pointer; font-family: var(--font-serif); font-weight: 500;
    letter-spacing: 0.5px;
    transition: background 0.2s, transform 0.2s;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  }
  .upload-btn:hover { background: #1a1410; transform: translateY(-1px); }

  /* PHOTO GRID */
  .photo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;
  }
  .photo-card {
    background: var(--bg-card);
    border-radius: var(--border-radius-md);
    overflow: hidden;
    box-shadow: var(--shadow-subtle);
    border: 1px solid var(--gold-border);
    cursor: pointer;
    transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
    position: relative;
  }
  .photo-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-premium);
    border-color: var(--gold-primary);
  }
  .photo-thumb-container {
    width: 100%;
    aspect-ratio: 4/3;
    overflow: hidden;
    background: #e6dfd5;
    position: relative;
  }
  .photo-thumb {
    width: 100%; height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease;
  }
  .photo-card:hover .photo-thumb { transform: scale(1.05); }
  .photo-info {
    padding: 12px 16px;
    border-top: 1px solid var(--gold-border);
  }
  .photo-caption {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 0.9rem;
    color: var(--text-dark);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    font-weight: 500;
  }
  .photo-date { font-size: 11.5px; color: var(--text-muted); margin-top: 4px; }
  .photo-delete {
    position: absolute; top: 10px; right: 10px;
    background: rgba(30,18,8,0.7);
    border: 1px solid rgba(255,255,255,0.2);
    color: #fff;
    border-radius: 50%; width: 30px; height: 30px;
    font-size: 16px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    opacity: 0;
    transition: all 0.2s;
    z-index: 5;
  }
  .photo-card:hover .photo-delete { opacity: 1; }
  .photo-delete:hover { background: rgba(180,50,30,0.9); border-color: rgba(180,50,30,1); }

  /* GUESTBOOK / MEMORY WALL */
  .tribute-form-card {
    margin-bottom: 3rem;
  }
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.2rem;
    margin-bottom: 1.2rem;
  }
  .form-group {
    display: flex;
    flex-direction: column;
  }
  .form-group label {
    font-family: var(--font-serif);
    font-size: 12px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-muted);
    font-weight: 600;
    margin-bottom: 6px;
  }
  .form-control {
    width: 100%;
    background: var(--bg-card);
    border: 1.5px solid var(--gold-border);
    border-radius: 8px;
    padding: 11px 15px;
    font-family: var(--font-sans);
    font-size: 14.5px;
    color: var(--text-dark);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .form-control:focus {
    border-color: var(--gold-primary);
    box-shadow: 0 0 8px var(--gold-glow);
  }
  textarea.form-control {
    resize: vertical;
    min-height: 100px;
  }
  
  .tribute-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    align-items: start;
  }
  
  /* LETTER STYLE TRIBUTE CARDS */
  .tribute-card {
    background: var(--bg-card);
    border: 1px solid var(--gold-border);
    border-radius: var(--border-radius-md);
    padding: 1.5rem 1.8rem;
    box-shadow: var(--shadow-subtle);
    position: relative;
    animation: fadeIn 0.3s ease;
  }
  .tribute-card::before {
    content: '“';
    position: absolute; top: 10px; left: 14px;
    font-size: 4rem; font-family: var(--font-serif);
    color: rgba(196, 164, 120, 0.12);
    line-height: 1;
  }
  .tribute-msg {
    font-family: var(--font-script);
    font-size: 1.35rem;
    line-height: 1.45;
    color: var(--text-dark);
    margin-bottom: 1.2rem;
    white-space: pre-line;
    position: relative;
    z-index: 2;
  }
  .tribute-meta {
    border-top: 1px dashed var(--gold-border);
    padding-top: 10px;
    font-size: 13px;
    color: var(--text-muted);
  }
  .tribute-author {
    font-family: var(--font-serif);
    font-weight: 600;
    color: var(--text-dark);
    font-size: 0.9rem;
    margin-bottom: 2px;
  }
  .tribute-relation {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--gold-dark);
    font-weight: 600;
  }
  .tribute-date {
    font-size: 11px;
    margin-top: 2px;
    opacity: 0.8;
  }
  .tribute-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 12px;
  }
  .prayer-btn {
    background: none; border: none;
    color: var(--gold-dark); font-size: 12px;
    cursor: pointer; display: flex; align-items: center; gap: 4px;
    transition: all 0.2s;
    font-family: var(--font-sans);
  }
  .prayer-btn:hover { color: var(--gold-primary); transform: scale(1.05); }
  .tribute-delete-btn {
    background: none; border: none; color: rgba(180, 50, 30, 0.6);
    cursor: pointer; font-size: 12px; transition: color 0.2s;
    font-family: var(--font-sans);
  }
  .tribute-delete-btn:hover { color: rgba(180, 50, 30, 1); }

  /* LIGHTBOX */
  .lightbox {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(12,8,6,0.96);
    display: flex; align-items: center; justify-content: center;
    padding: 1rem;
    backdrop-filter: blur(8px);
  }
  .lightbox-inner {
    max-width: 860px; width: 100%;
    display: flex; flex-direction: column; align-items: center; gap: 1.2rem;
    position: relative;
  }
  .lightbox img {
    max-width: 100%;
    max-height: 72vh;
    object-fit: contain;
    border-radius: var(--border-radius-sm);
    box-shadow: 0 24px 70px rgba(0,0,0,0.6);
    border: 2px solid var(--gold-primary);
  }
  .lightbox-caption {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 1.1rem;
    color: var(--gold-light);
    text-align: center;
  }
  .lightbox-close {
    position: absolute; top: -20px; right: 0;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    color: #fff;
    border-radius: 50%; width: 40px; height: 40px;
    font-size: 24px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
  }
  .lightbox-close:hover { background: rgba(255,255,255,0.22); border-color: #fff; }
  .lightbox-nav {
    position: absolute; top: 50%; transform: translateY(-50%);
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.15);
    color: #fff;
    width: 48px; height: 48px;
    border-radius: 50%;
    font-size: 24px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s;
    user-select: none;
  }
  .lightbox-nav:hover { background: rgba(255,255,255,0.18); border-color: var(--gold-primary); }
  .lightbox-nav.prev { left: -60px; }
  .lightbox-nav.next { right: -60px; }
  .lightbox-toolbar {
    display: flex; gap: 15px; align-items: center;
    font-size: 12px; color: #ab9887;
  }
  .lightbox-btn {
    background: rgba(255,255,255,0.08); border: none; color: #fff;
    border-radius: 6px; padding: 6px 14px; cursor: pointer;
    font-size: 12.5px; font-family: var(--font-sans);
    transition: background 0.2s;
    display: flex; align-items: center; gap: 6px;
  }
  .lightbox-btn:hover { background: rgba(255,255,255,0.18); }
  
  .lb-edit-input {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(196,164,120,0.4);
    border-radius: 8px;
    padding: 8px 14px;
    color: #fff;
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 1rem;
    text-align: center;
    width: 320px; max-width: 100%;
    outline: none;
  }
  .lb-edit-input:focus { border-color: var(--gold-primary); }
  .lb-save-btn {
    background: var(--gold-dark); color: #fff;
    border: none; border-radius: 6px;
    padding: 8px 16px; font-size: 13px; cursor: pointer;
    font-family: var(--font-serif);
    margin-left: 8px;
  }

  /* MODALS */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 1100;
    background: rgba(20,15,12,0.75);
    display: flex; align-items: center; justify-content: center;
    padding: 1rem;
    backdrop-filter: blur(4px);
  }
  .modal {
    background: var(--bg-card);
    border-radius: var(--border-radius-md);
    padding: 2.2rem;
    width: 100%; max-width: 520px;
    box-shadow: var(--shadow-premium);
    animation: zoomIn 0.3s ease;
  }
  @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  
  .modal h2 {
    font-family: var(--font-serif);
    font-size: 1.45rem;
    color: var(--text-dark);
    margin-bottom: 0.5rem;
    letter-spacing: 0.5px;
  }
  .modal label {
    display: block; font-size: 11px; letter-spacing: 1px;
    text-transform: uppercase; color: var(--text-muted);
    font-weight: 600; margin-bottom: 6px; margin-top: 1.2rem;
  }
  .modal-actions {
    display: flex; gap: 10px; margin-top: 2rem; justify-content: flex-end;
  }
  .btn-primary {
    background: linear-gradient(135deg, var(--gold-dark), var(--gold-primary));
    color: #fff;
    border: none; border-radius: 8px;
    padding: 10px 22px; font-size: 14px;
    cursor: pointer; font-family: var(--font-serif); font-weight: 500;
    transition: transform 0.15s, opacity 0.2s;
    box-shadow: 0 4px 10px var(--gold-glow);
  }
  .btn-primary:hover { transform: translateY(-1px); opacity: 0.95; }
  .btn-ghost {
    background: transparent; color: var(--text-muted);
    border: 1.5px solid var(--gold-border); border-radius: 8px;
    padding: 10px 22px; font-size: 14px;
    cursor: pointer; font-family: var(--font-serif);
    transition: background 0.2s;
  }
  .btn-ghost:hover { background: rgba(196,164,120,0.08); color: var(--text-dark); }

  /* EMPTY STATES */
  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    color: var(--text-muted);
  }
  .empty-state p {
    font-family: var(--font-serif);
    font-style: italic;
    font-size: 1.15rem;
  }

  /* LOADING & TOAST */
  .loading-screen {
    min-height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    background: #faf7f0;
    font-family: var(--font-serif);
    color: var(--gold-dark);
    gap: 1rem;
  }
  .loading-spinner {
    width: 40px; height: 40px;
    border: 3.5px solid rgba(139,110,75,0.15);
    border-radius: 50%;
    border-top-color: var(--gold-dark);
    animation: spin 1s infinite linear;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .toast {
    position: fixed; bottom: 2rem; right: 2rem; z-index: 2000;
    background: var(--text-dark); color: var(--bg-parchment);
    padding: 12px 24px; border-radius: 30px;
    font-size: 13.5px; font-family: var(--font-sans);
    box-shadow: 0 8px 30px rgba(0,0,0,0.25);
    animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex; align-items: center; gap: 8px;
    border: 1px solid var(--gold-border);
  }
  @keyframes slideUp { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform: translateY(0); } }

  /* RESPONSIVE LAYOUT */
  @media (max-width: 800px) {
    .altar-grid { grid-template-columns: 1fr; gap: 2.5rem; justify-items: center; }
    .lightbox-nav { display: none; }
    .lightbox img { max-height: 65vh; }
    .memorial-hero { padding: 3rem 1.2rem 2.5rem; }
    .tab-btn { padding: 1rem 1.2rem; font-size: 0.85rem; }
    .form-grid { grid-template-columns: 1fr; gap: 0.8rem; }
    .schedule-timeline::before { left: 20px; }
    .schedule-time { text-align: left; width: auto; margin-right: 0; font-size: 11px; margin-bottom: 4px; }
    .schedule-dot { left: 21px; }
    .schedule-content { margin-left: 15px; }
    .schedule-item { flex-direction: column; padding-left: 30px; }
  }
`;

// Initialize Firebase dynamically
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.projectId;
const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
const db = app ? getFirestore(app) : null;
const storageBucket = (app && firebaseConfig.storageBucket && firebaseConfig.storageBucket.trim() !== "") ? getStorage(app) : null;

// Unified storage client mapping Firebase Firestore and Storage with local localStorage fallback
const storage = {
  get: async (key, fallback = null) => {
    try {
      if (db) {
        if (key === "event-info") {
          const docRef = doc(db, "settings", "event-info");
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().value) return docSnap.data().value;
        }
        if (key === "memorial-portrait") {
          const docRef = doc(db, "settings", "memorial-portrait");
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().value) return docSnap.data().value;
        }
      }
    } catch (e) {
      console.warn("Firebase fetch failed, fallback to local storage", e);
    }
    // Local fallback
    try {
      const r = localStorage.getItem(key);
      if (r) return JSON.parse(r);
    } catch {}
    return fallback;
  },
  set: async (key, val) => {
    try {
      if (db) {
        if (key === "event-info" || key === "memorial-portrait") {
          const docRef = doc(db, "settings", key);
          await setDoc(docRef, { value: val });
          return;
        }
      }
    } catch (e) {
      console.warn("Firebase save failed, fallback to local storage", e);
    }
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  },
  // Triple-redundant photo hosting adapter:
  // 1. Attempts Cloudinary Unsigned Upload (if configured) - 100% Free CDN & No Credit Card
  // 2. Falls back to Firebase Storage (if enabled/configured)
  // 3. Returns null to trigger native Firestore base64 document storage fallback (100% Free & No Configuration)
  uploadPhoto: async (base64DataUrl, filename) => {
    // A. Attempt Cloudinary
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "";
      
      if (cloudName && uploadPreset && cloudName.trim() !== "" && uploadPreset.trim() !== "") {
        const formData = new FormData();
        formData.append("file", base64DataUrl);
        formData.append("upload_preset", uploadPreset);
        
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.secure_url) return data.secure_url;
        } else {
          const errData = await response.json();
          console.warn("Cloudinary upload failed, checking next adapter:", errData);
        }
      }
    } catch (err) {
      console.warn("Cloudinary adapter error, checking next:", err);
    }

    // B. Fallback to Firebase Storage
    try {
      if (storageBucket) {
        const response = await fetch(base64DataUrl);
        const blob = await response.blob();
        const extension = filename.split(".").pop() || "jpg";
        const filePath = `photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
        
        const storageRef = ref(storageBucket, filePath);
        await uploadBytes(storageRef, blob, { contentType: blob.type });
        const downloadUrl = await getDownloadURL(storageRef);
        return downloadUrl;
      }
    } catch (err) {
      console.error("Firebase Storage upload failed, using local/Firestore base64:", err);
    }
    
    return null;
  }
};

function compressImage(file, maxW = 1200, quality = 0.82) {
  return new Promise((res) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        res(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

function formatRelativeTime(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return formatDate(iso);
}

const defaultSchedule = [
  { id: "s1", time: "08:30 AM", title: "Anniversary Memorial Prayers", details: "Chanting and homage at the family altar" },
  { id: "s2", time: "10:30 AM", title: "Homage & Chanting", details: "Laying flowers and singing sacred peace chants" },
  { id: "s3", time: "01:00 PM", title: "Commemorative Lunch", details: "Solemn vegetarian feast served in loving remembrance" },
  { id: "s4", time: "06:30 PM", title: "Remembrance Lamp Lighting", details: "Lighting oil lamps around the altar followed by silent prayers" }
];

export default function MemorialAlbum() {
  const [activeTab, setActiveTab] = useState("altar");
  const [photos, setPhotos] = useState([]);
  const [tributes, setTributes] = useState([]);
  const [candles, setCandles] = useState([]);
  const [eventInfo, setEventInfo] = useState({
    name: "Late Shri Ramakrishnan Biju",
    title: "First Anniversary Remembrance",
    quote: "Those we love don't go away, they walk beside us every day. Unseen, unheard, but always near, still loved, still missed, and very dear.",
    birthDate: "1942-08-15",
    passingDate: "2025-05-27",
    location: "Kochi, Kerala",
    schedule: defaultSchedule
  });
  
  const [portrait, setPortrait] = useState("");
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState("");
  
  // Modals & States
  const [editingDetails, setEditingDetails] = useState(false);
  const [detailsDraft, setDetailsDraft] = useState({});
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [scheduleDraft, setScheduleDraft] = useState([]);
  
  // Guestbook & Candle form inputs
  const [newTribute, setNewTribute] = useState({ author: "", relation: "", message: "" });
  const [candleForm, setCandleForm] = useState(false);
  const [candleInput, setCandleInput] = useState({ author: "", relation: "" });
  const [candleLitAnimation, setCandleLitAnimation] = useState(true);
  
  // Lightbox
  const [lightbox, setLightbox] = useState(null);
  const [lbCaption, setLbCaption] = useState("");
  const [editingCaption, setEditingCaption] = useState(false);
  const [dragging, setDragging] = useState(false);
  
  const fileRef = useRef();
  const portraitFileRef = useRef();

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // Synchronized Fetch from Storage (Firebase Firestore or Local)
  const syncData = async () => {
    // 1. Event Info & Portrait
    const savedInfo = await storage.get("event-info");
    if (savedInfo) setEventInfo(savedInfo);

    const savedPortrait = await storage.get("memorial-portrait");
    if (savedPortrait) setPortrait(savedPortrait);

    // 2. Load Photos
    if (db) {
      try {
        const q = query(collection(db, "photos"), orderBy("uploadedAt", "desc"));
        const querySnapshot = await getDocs(q);
        const loaded = [];
        querySnapshot.forEach((doc) => {
          loaded.push({ id: doc.id, ...doc.data() });
        });
        setPhotos(loaded);
      } catch (err) {
        console.warn("Firestore photos fetch failed, falling back to local:", err);
        const photoKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith("photo:")) photoKeys.push(k);
        }
        const loadedPhotos = [];
        for (const k of photoKeys) {
          try {
            const r = localStorage.getItem(k);
            if (r) loadedPhotos.push(JSON.parse(r));
          } catch {}
        }
        loadedPhotos.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        setPhotos(loadedPhotos);
      }
    } else {
      const photoKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("photo:")) photoKeys.push(k);
      }
      const loadedPhotos = [];
      for (const k of photoKeys) {
        try {
          const r = localStorage.getItem(k);
          if (r) loadedPhotos.push(JSON.parse(r));
        } catch {}
      }
      loadedPhotos.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
      setPhotos(loadedPhotos);
    }

    // 3. Load Tributes
    if (db) {
      try {
        const q = query(collection(db, "tributes"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const loaded = [];
        querySnapshot.forEach((doc) => {
          loaded.push({ id: doc.id, ...doc.data() });
        });
        setTributes(loaded);
      } catch (err) {
        console.warn("Firestore tributes fetch failed, falling back to local:", err);
        const tributeKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith("tribute:")) tributeKeys.push(k);
        }
        const loadedTributes = [];
        for (const k of tributeKeys) {
          try {
            const r = localStorage.getItem(k);
            if (r) loadedTributes.push(JSON.parse(r));
          } catch {}
        }
        loadedTributes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setTributes(loadedTributes);
      }
    } else {
      const tributeKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("tribute:")) tributeKeys.push(k);
      }
      const loadedTributes = [];
      for (const k of tributeKeys) {
        try {
          const r = localStorage.getItem(k);
          if (r) loadedTributes.push(JSON.parse(r));
        } catch {}
      }
      loadedTributes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setTributes(loadedTributes);
    }

    // 4. Load Candles
    if (db) {
      try {
        const q = query(collection(db, "candles"), orderBy("litAt", "desc"));
        const querySnapshot = await getDocs(q);
        const loaded = [];
        querySnapshot.forEach((doc) => {
          loaded.push({ id: doc.id, ...doc.data() });
        });
        setCandles(loaded);
      } catch (err) {
        console.warn("Firestore candles fetch failed, falling back to local:", err);
        const candleKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith("candle:")) candleKeys.push(k);
        }
        const loadedCandles = [];
        for (const k of candleKeys) {
          try {
            const r = localStorage.getItem(k);
            if (r) loadedCandles.push(JSON.parse(r));
          } catch {}
        }
        loadedCandles.sort((a, b) => new Date(b.litAt) - new Date(a.litAt));
        setCandles(loadedCandles);
      }
    } else {
      const candleKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("candle:")) candleKeys.push(k);
      }
      const loadedCandles = [];
      for (const k of candleKeys) {
        try {
          const r = localStorage.getItem(k);
          if (r) loadedCandles.push(JSON.parse(r));
        } catch {}
      }
      loadedCandles.sort((a, b) => new Date(b.litAt) - new Date(a.litAt));
      setCandles(loadedCandles);
    }
  };

  useEffect(() => {
    async function load() {
      // Dark mode preference
      try {
        const savedTheme = localStorage.getItem("memorial-theme");
        if (savedTheme !== null) {
          const isDark = JSON.parse(savedTheme);
          setDarkMode(isDark);
          if (isDark) document.body.classList.add("dark-mode");
        }
      } catch {}
      
      await syncData();
      setLoading(false);
    }
    load();
  }, []);

  const toggleDarkMode = () => {
    const val = !darkMode;
    setDarkMode(val);
    localStorage.setItem("memorial-theme", JSON.stringify(val));
    if (val) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  };

  // Profile details save
  const saveDetails = async () => {
    setEventInfo(detailsDraft);
    await storage.set("event-info", detailsDraft);
    setEditingDetails(false);
    showToast("✓ Memorial details updated.");
  };

  // Schedule program save
  const saveSchedule = async () => {
    const updated = { ...eventInfo, schedule: scheduleDraft };
    setEventInfo(updated);
    await storage.set("event-info", updated);
    setEditingSchedule(false);
    showToast("✓ Ceremony schedule updated.");
  };

  // Add ceremony photos
  const addPhotos = useCallback(async (files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!valid.length) return;
    showToast(`Sharing ${valid.length} ceremony photos…`);
    
    let uploadedCount = 0;
    for (const file of valid) {
      try {
        const compressedBase64 = await compressImage(file);
        const id = `photo:${Date.now()}-${Math.random().toString(36).slice(2)}`;
        
        let finalUrl = compressedBase64;
        if (storageBucket) {
          const publicUrl = await storage.uploadPhoto(compressedBase64, file.name);
          if (publicUrl) finalUrl = publicUrl;
        }

        const photo = { 
          id, 
          data: finalUrl, 
          caption: file.name.replace(/\.[^.]+$/, ""), 
          uploadedAt: new Date().toISOString() 
        };

        if (db) {
          await setDoc(doc(db, "photos", photo.id), {
            data: photo.data,
            caption: photo.caption,
            uploadedAt: photo.uploadedAt
          });
        } else {
          localStorage.setItem(id, JSON.stringify(photo));
        }
        uploadedCount++;
      } catch (err) {
        console.error(err);
      }
    }
    
    await syncData();
    showToast(`✓ Shared ${uploadedCount} optimized photo${uploadedCount !== 1 ? "s" : ""}!`);
  }, []);

  const deletePhoto = async (id) => {
    if (db) {
      await deleteDoc(doc(db, "photos", id));
    } else {
      localStorage.removeItem(id);
    }
    await syncData();
    if (lightbox !== null) setLightbox(null);
    showToast("Photo removed from gallery.");
  };

  const updateCaption = async (id, caption) => {
    if (db) {
      await updateDoc(doc(db, "photos", id), { caption });
    } else {
      const match = photos.find(p => p.id === id);
      if (match) {
        match.caption = caption;
        localStorage.setItem(id, JSON.stringify(match));
      }
    }
    await syncData();
  };

  // Portrait upload
  const handlePortraitUpload = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      showToast("Optimizing portrait…");
      try {
        const compressedBase64 = await compressImage(file, 600, 0.85);
        let finalUrl = compressedBase64;
        
        if (storageBucket) {
          const publicUrl = await storage.uploadPhoto(compressedBase64, "portrait.jpg");
          if (publicUrl) finalUrl = publicUrl;
        }

        setPortrait(finalUrl);
        await storage.set("memorial-portrait", finalUrl);
        showToast("✓ Memorial portrait set.");
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Light tribute candle
  const lightCandle = async (e) => {
    e.preventDefault();
    if (!candleInput.author.trim()) return;

    const id = `candle:${Date.now()}`;
    const newCandle = {
      id,
      author: candleInput.author.trim(),
      relation: candleInput.relation.trim() || "Family Member",
      litAt: new Date().toISOString()
    };

    if (db) {
      await setDoc(doc(db, "candles", newCandle.id), {
        author: newCandle.author,
        relation: newCandle.relation,
        litAt: newCandle.litAt
      });
    } else {
      localStorage.setItem(id, JSON.stringify(newCandle));
    }

    await syncData();

    // Visual animation flicker feedback
    setCandleLitAnimation(false);
    setTimeout(() => setCandleLitAnimation(true), 300);

    setCandleForm(false);
    setCandleInput({ author: "", relation: "" });
    showToast(`🕯 Candle lit by ${newCandle.author}`);
  };

  // Leave guestbook tribute
  const submitTribute = async (e) => {
    e.preventDefault();
    if (!newTribute.author.trim() || !newTribute.message.trim()) return;

    const id = `tribute:${Date.now()}`;
    const tribute = {
      id,
      author: newTribute.author.trim(),
      relation: newTribute.relation.trim() || "Relative",
      message: newTribute.message.trim(),
      prayers: 0,
      createdAt: new Date().toISOString()
    };

    if (db) {
      await setDoc(doc(db, "tributes", tribute.id), {
        author: tribute.author,
        relation: tribute.relation,
        message: tribute.message,
        prayers: tribute.prayers,
        createdAt: tribute.createdAt
      });
    } else {
      localStorage.setItem(id, JSON.stringify(tribute));
    }

    await syncData();
    setNewTribute({ author: "", relation: "", message: "" });
    showToast("✓ Tribute shared on the memory wall.");
  };

  // Offer prayer count
  const sendPrayer = async (id) => {
    const match = tributes.find(t => t.id === id);
    if (match) {
      const nextCount = (match.prayers || 0) + 1;
      if (db) {
        await updateDoc(doc(db, "tributes", id), { prayers: nextCount });
      } else {
        match.prayers = nextCount;
        localStorage.setItem(id, JSON.stringify(match));
      }
      await syncData();
    }
  };

  const deleteTribute = async (id) => {
    if (db) {
      await deleteDoc(doc(db, "tributes", id));
    } else {
      localStorage.removeItem(id);
    }
    await syncData();
    showToast("Tribute removed.");
  };

  // Lightbox operations
  const openLightbox = (idx) => {
    setLightbox(idx);
    setLbCaption(photos[idx]?.caption || "");
    setEditingCaption(false);
  };

  const navLightbox = (dir) => {
    const next = (lightbox + dir + photos.length) % photos.length;
    setLightbox(next);
    setLbCaption(photos[next]?.caption || "");
    setEditingCaption(false);
  };

  const saveLbCaption = () => {
    if (lightbox !== null) {
      updateCaption(photos[lightbox].id, lbCaption);
      setEditingCaption(false);
      showToast("Caption updated.");
    }
  };

  const copyShareLink = () => {
    const inviteText = `In Loving Memory of ${eventInfo.name} ✦ First Anniversary Remembrance. Please visit this sacred album to light a virtual candle, share photos of the ceremony, and leave your tributes: ${window.location.href}`;
    navigator.clipboard.writeText(inviteText);
    showToast("✓ Invitation details copied to clipboard!");
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    addPhotos(e.dataTransfer.files);
  };

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-spinner"></div>
      <p>Opening the memorial album…</p>
    </div>
  );

  const currentPhoto = lightbox !== null ? photos[lightbox] : null;

  return (
    <>
      <style>{FONTS}{css}</style>
      <div className="app">
        
        {/* FIREBASE STATUS BAR */}
        <div className="status-bar">
          <span className={`status-indicator ${db ? "online" : "offline"}`}></span>
          {db 
            ? "✦ Live Database Active (All family members can see photos & wishes in real-time) ✦"
            : "Offline Local Mode (Wishes stay on your device. Connect Firebase to share with family)"}
        </div>

        {/* HERO */}
        <div className="memorial-hero">
          <div className="hero-eyebrow">✦ Memorial Tribute ✦</div>
          <h1 className="hero-title">{eventInfo.name}</h1>
          <div className="hero-dates">
            {formatDate(eventInfo.birthDate)} – {formatDate(eventInfo.passingDate)}
          </div>
          <p className="hero-quote">“{eventInfo.quote}”</p>
          <div className="hero-location">
            📍 Ceremony Location: <span>{eventInfo.location}</span>
          </div>

          <div className="hero-controls">
            <button className="hero-btn" onClick={toggleDarkMode} title="Toggle Serene Altar Light">
              {darkMode ? "☀️ Light Mode" : "🌙 Twilight Mode"}
            </button>
            <button className="hero-btn" onClick={() => { setDetailsDraft(eventInfo); setEditingDetails(true); }}>
              ✏ Edit Memorial
            </button>
            <button className="hero-btn" onClick={copyShareLink}>
              🔗 Share Page
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="tab-nav">
          <button className={`tab-btn ${activeTab === "altar" ? "active" : ""}`} onClick={() => setActiveTab("altar")}>
            🕯 Remembrance Altar
          </button>
          <button className={`tab-btn ${activeTab === "gallery" ? "active" : ""}`} onClick={() => setActiveTab("gallery")}>
            📸 Ceremony Gallery ({photos.length})
          </button>
          <button className={`tab-btn ${activeTab === "wall" ? "active" : ""}`} onClick={() => setActiveTab("wall")}>
            ✍ Memory Wall ({tributes.length})
          </button>
        </div>

        {/* MAIN BODY CONTAINER */}
        <div className="container">
          
          {/* TAB 1: REMEMBRANCE ALTAR */}
          {activeTab === "altar" && (
            <div>
              <div className="altar-grid">
                
                {/* PORTRAIT */}
                <div className="deco-border portrait-card">
                  <div className="portrait-frame-container">
                    {portrait ? (
                      <div className="portrait-frame">
                        <img src={portrait} alt="Memorial Portrait" className="portrait-img" />
                        <div className="portrait-upload-overlay" onClick={() => portraitFileRef.current.click()}>
                          📷 Change Portrait
                        </div>
                      </div>
                    ) : (
                      <div className="portrait-frame placeholder" onClick={() => portraitFileRef.current.click()}>
                        <span style={{ fontSize: "3rem" }}>🌸</span>
                        <div style={{ fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase", marginTop: "8px", fontWeight: "600" }}>
                          Set Portrait Photo
                        </div>
                      </div>
                    )}
                    <input ref={portraitFileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePortraitUpload} />
                  </div>
                  <div className="gold-divider" style={{ width: "180px", margin: "0.5rem 0" }}>
                    <span className="symbol">✦ 🕯 ✦</span>
                  </div>
                  <div className="epitaph-box">
                    “In our hearts you will forever live, a guiding light, a silent whisper, a beautiful memory.”
                  </div>
                </div>

                {/* VIRTUAL CANDLE LIGHTING */}
                <div className="deco-border candle-section">
                  <div className="candle-display">
                    <div className={`candle-glow ${candleLitAnimation && candles.length > 0 ? "" : "off"}`}></div>
                    {candles.length > 0 && <div className={`candle-flame ${candleLitAnimation ? "" : "off"}`}></div>}
                    <div className="candle-wick"></div>
                    <div className="candle-pillar" style={{ height: candles.length > 0 ? "90px" : "40px" }}></div>
                  </div>

                  <div className="altar-info">
                    <h3 className="candle-count-title">
                      🕯 <span>{candles.length}</span> Tribute Candle{candles.length !== 1 ? "s" : ""} Lit
                    </h3>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", maxWidth: "260px", margin: "4px auto 14px", lineHeight: "1.4" }}>
                      {candles.length > 0 
                        ? `Last candle lit by ${candles[0].author} (${formatRelativeTime(candles[0].litAt)})`
                        : "Light a digital candle of prayers and remembrance to pay respects."}
                    </p>
                    <button className="candle-btn" onClick={() => setCandleForm(true)}>
                      ✨ Light a Tribute Candle
                    </button>
                  </div>
                </div>

              </div>

              {/* TIMELINE / CEREMONY SCHEDULE */}
              <div className="deco-border schedule-container">
                <h2 className="section-title">
                  Ceremony Schedule
                  <button className="schedule-edit-btn" style={{ marginLeft: "10px", fontSize: "14px" }} onClick={() => { setScheduleDraft(eventInfo.schedule || []); setEditingSchedule(true); }}>
                    ✏ Edit
                  </button>
                </h2>
                
                <div className="schedule-timeline">
                  {(eventInfo.schedule || defaultSchedule).map((item, idx) => (
                    <div key={item.id || idx} className="schedule-item">
                      <div className="schedule-time">{item.time}</div>
                      <div className="schedule-dot"></div>
                      <div className="schedule-content">
                        <div className="schedule-item-title">{item.title}</div>
                        <div className="schedule-item-desc">{item.details}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CEREMONY GALLERY */}
          {activeTab === "gallery" && (
            <div>
              {/* UPLOADER */}
              <div className="upload-zone">
                <div
                  className={`drop-area ${dragging ? "dragging" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current.click()}
                >
                  <span className="drop-icon">📸</span>
                  <div className="drop-title">Share Ceremony & Event Photos</div>
                  <div className="drop-sub">Drag and drop professional ceremony photos, or click to browse files</div>
                  <button className="upload-btn" onClick={e => { e.stopPropagation(); fileRef.current.click(); }}>
                    Select Photos
                  </button>
                  <input ref={fileRef} className="drop-input" type="file" multiple accept="image/*" onChange={e => addPhotos(e.target.files)} />
                </div>
              </div>

              {/* GRID */}
              {photos.length === 0 ? (
                <div className="empty-state">
                  <p>No ceremony photos shared yet. Click above to add some memories.</p>
                </div>
              ) : (
                <div className="photo-grid">
                  {photos.map((photo, idx) => (
                    <div key={photo.id} className="photo-card" onClick={() => openLightbox(idx)}>
                      <div className="photo-thumb-container">
                        <img src={photo.data} alt={photo.caption} className="photo-thumb" />
                      </div>
                      <div className="photo-info">
                        <div className="photo-caption">{photo.caption || "Untitled Memory"}</div>
                        <div className="photo-date">{formatDate(photo.uploadedAt)}</div>
                      </div>
                      <button className="photo-delete" onClick={e => { e.stopPropagation(); deletePhoto(photo.id); }} title="Remove photo">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GUESTBOOK / MEMORY WALL */}
          {activeTab === "wall" && (
            <div>
              
              {/* WRITE TRIBUTE FORM */}
              <div className="deco-border tribute-form-card" style={{ marginBottom: "2.5rem" }}>
                <h3 className="section-title" style={{ marginBottom: "1.2rem", fontSize: "1.25rem", textAlign: "left" }}>
                  Leave a Remembrance & Condolence Tribute
                </h3>
                
                <form onSubmit={submitTribute}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Your Name</label>
                      <input 
                        className="form-control" 
                        required 
                        placeholder="e.g. Rohan Biju" 
                        value={newTribute.author} 
                        onChange={e => setNewTribute(p => ({ ...p, author: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Relationship / Role</label>
                      <input 
                        className="form-control" 
                        placeholder="e.g. Grandson, Cousin, Family Friend" 
                        value={newTribute.relation} 
                        onChange={e => setNewTribute(p => ({ ...p, relation: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: "1.2rem" }}>
                    <label>Comforting Words & Memories</label>
                    <textarea 
                      className="form-control" 
                      required 
                      placeholder="Share a comforting memory, words of peace, or your prayers for their soul…" 
                      value={newTribute.message} 
                      onChange={e => setNewTribute(p => ({ ...p, message: e.target.value }))}
                    />
                  </div>
                  <button className="btn-primary" type="submit">
                    🕊 Share Tribute Message
                  </button>
                </form>
              </div>

              {/* LIST TRIBUTES */}
              {tributes.length === 0 ? (
                <div className="empty-state">
                  <p>The memory wall is silent. Be the first to share your comforting words above.</p>
                </div>
              ) : (
                <div className="tribute-grid">
                  {tributes.map((tribute) => (
                    <div key={tribute.id} className="tribute-card">
                      <div className="tribute-msg">{tribute.message}</div>
                      <div className="tribute-meta">
                        <div className="tribute-author">{tribute.author}</div>
                        <div className="tribute-relation">{tribute.relation}</div>
                        <div className="tribute-date">{formatRelativeTime(tribute.createdAt)}</div>
                      </div>
                      
                      <div className="tribute-actions">
                        <button className="prayer-btn" onClick={() => sendPrayer(tribute.id)}>
                          🙏 Offer Prayer ({tribute.prayers || 0})
                        </button>
                        <button className="tribute-delete-btn" onClick={() => deleteTribute(tribute.id)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>

        {/* LIGHTBOX FOR GALLERY */}
        {currentPhoto && (
          <div className="lightbox" onClick={() => setLightbox(null)}>
            <div className="lightbox-inner" onClick={e => e.stopPropagation()}>
              <button className="lightbox-close" onClick={() => setLightbox(null)}>×</button>
              {photos.length > 1 && (
                <>
                  <button className="lightbox-nav prev" onClick={() => navLightbox(-1)}>‹</button>
                  <button className="lightbox-nav next" onClick={() => navLightbox(1)}>›</button>
                </>
              )}
              <img src={currentPhoto.data} alt={currentPhoto.caption} />
              
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {editingCaption ? (
                  <>
                    <input
                      className="lb-edit-input"
                      value={lbCaption}
                      onChange={e => setLbCaption(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && saveLbCaption()}
                      autoFocus
                    />
                    <button className="lb-save-btn" onClick={saveLbCaption}>Save</button>
                  </>
                ) : (
                  <div className="lightbox-caption" onClick={() => setEditingCaption(true)} title="Click to edit caption" style={{ cursor: "pointer" }}>
                    {currentPhoto.caption || <em style={{ color: "#ab9887" }}>Add details/caption…</em>}
                    <span style={{ fontSize: "11px", color: "#c4a478", marginLeft: "8px" }}>✏</span>
                  </div>
                )}
              </div>

              <div className="lightbox-toolbar">
                <span>{lightbox + 1} / {photos.length}</span>
                <button className="lightbox-btn" onClick={() => deletePhoto(currentPhoto.id)}>
                  🗑 Remove
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT DETAILS MODAL */}
        {editingDetails && (
          <div className="modal-overlay" onClick={() => setEditingDetails(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>Edit Memorial Details</h2>
              
              <label>Name of Late Family Member</label>
              <input className="form-control" value={detailsDraft.name} onChange={e => setDetailsDraft(p => ({ ...p, name: e.target.value }))} />
              
              <label>Remembrance Title</label>
              <input className="form-control" value={detailsDraft.title} onChange={e => setDetailsDraft(p => ({ ...p, title: e.target.value }))} />
              
              <label>Birth Date</label>
              <input className="form-control" type="date" value={detailsDraft.birthDate} onChange={e => setDetailsDraft(p => ({ ...p, birthDate: e.target.value }))} />
              
              <label>Departure Date</label>
              <input className="form-control" type="date" value={detailsDraft.passingDate} onChange={e => setDetailsDraft(p => ({ ...p, passingDate: e.target.value }))} />
              
              <label>Epitaph / Remembrance Quote</label>
              <textarea className="form-control" value={detailsDraft.quote} onChange={e => setDetailsDraft(p => ({ ...p, quote: e.target.value }))} />

              <label>Ceremony Location</label>
              <input className="form-control" value={detailsDraft.location} onChange={e => setDetailsDraft(p => ({ ...p, location: e.target.value }))} />

              <div className="modal-actions">
                <button className="btn-ghost" onClick={() => setEditingDetails(false)}>Cancel</button>
                <button className="btn-primary" onClick={saveDetails}>Save Details</button>
              </div>
            </div>
          </div>
        )}

        {/* EDIT CEREMONY SCHEDULE MODAL */}
        {editingSchedule && (
          <div className="modal-overlay" onClick={() => setEditingSchedule(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "560px" }}>
              <h2>Edit Ceremony Schedule</h2>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "1rem" }}>
                Add the timing and descriptions of the shradh rituals or prayers so family members can follow along.
              </p>

              <div style={{ maxHeight: "300px", overflowY: "auto", paddingRight: "5px" }}>
                {scheduleDraft.map((item, idx) => (
                  <div key={idx} style={{ border: "1px solid var(--gold-border)", padding: "10px", borderRadius: "6px", marginBottom: "10px", background: "var(--bg-parchment)" }}>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                      <input 
                        className="form-control" 
                        style={{ flex: 1, padding: "6px" }} 
                        placeholder="Time (e.g. 08:30 AM)" 
                        value={item.time} 
                        onChange={e => {
                          const updated = [...scheduleDraft];
                          updated[idx].time = e.target.value;
                          setScheduleDraft(updated);
                        }} 
                      />
                      <button 
                        style={{ background: "none", border: "none", color: "red", cursor: "pointer" }} 
                        type="button"
                        onClick={() => setScheduleDraft(scheduleDraft.filter((_, sidx) => sidx !== idx))}
                      >
                        🗑
                      </button>
                    </div>
                    
                    <input 
                      className="form-control" 
                      style={{ padding: "6px", marginBottom: "6px" }} 
                      placeholder="Ritual / Item Title" 
                      value={item.title} 
                      onChange={e => {
                        const updated = [...scheduleDraft];
                        updated[idx].title = e.target.value;
                        setScheduleDraft(updated);
                      }} 
                    />
                    <textarea 
                      className="form-control" 
                      style={{ padding: "6px", minHeight: "45px" }} 
                      placeholder="Details / Chants / Directions" 
                      value={item.details} 
                      onChange={e => {
                        const updated = [...scheduleDraft];
                        updated[idx].details = e.target.value;
                        setScheduleDraft(updated);
                      }} 
                    />
                  </div>
                ))}
              </div>

              <button 
                className="btn-ghost" 
                style={{ width: "100%", marginTop: "8px", borderStyle: "dashed" }}
                onClick={() => setScheduleDraft([...scheduleDraft, { id: `s-${Date.now()}`, time: "", title: "", details: "" }])}
              >
                + Add Ceremony Step
              </button>

              <div className="modal-actions">
                <button className="btn-ghost" onClick={() => setEditingSchedule(false)}>Cancel</button>
                <button className="btn-primary" onClick={saveSchedule}>Save Program</button>
              </div>
            </div>
          </div>
        )}

        {/* LIGHT CANDLE FORM MODAL */}
        {candleForm && (
          <div className="modal-overlay" onClick={() => setCandleForm(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>Light a Tribute Candle</h2>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "1rem" }}>
                Light a digital candle at the altar. You can optionally share your name and relationship.
              </p>
              
              <form onSubmit={lightCandle}>
                <label>Your Name</label>
                <input 
                  className="form-control" 
                  required 
                  placeholder="e.g. Rahul Biju" 
                  value={candleInput.author} 
                  onChange={e => setCandleInput(p => ({ ...p, author: e.target.value }))}
                />
                
                <label>Relationship / Role</label>
                <input 
                  className="form-control" 
                  placeholder="e.g. Nephew, Close Friend, Neighbor" 
                  value={candleInput.relation} 
                  onChange={e => setCandleInput(p => ({ ...p, relation: e.target.value }))}
                />

                <div className="modal-actions">
                  <button className="btn-ghost" type="button" onClick={() => setCandleForm(false)}>Cancel</button>
                  <button className="btn-primary" type="submit">🕯 Light Candle</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TOAST NOTIFICATION */}
        {toast && <div className="toast">✨ {toast}</div>}

      </div>
    </>
  );
}
