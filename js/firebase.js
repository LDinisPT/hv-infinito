// ============================================================
// FIREBASE — catálogo partilhado de modelos de garrafa (Firestore)
// © 2026 Luís Dinis — Verallia Portugal
// Módulo ES (carregado com type="module").
// Expõe window.BottlesDB para o resto da app (scripts clássicos).
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
  query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCajQW3kNB2TPJhJTP5J1OJVaQmyVSPkf4",
  authDomain: "verallia-turnos.firebaseapp.com",
  projectId: "verallia-turnos",
  storageBucket: "verallia-turnos.firebasestorage.app",
  messagingSenderId: "316970507842",
  appId: "1:316970507842:web:923a7c5dbe05335e4997db",
  measurementId: "G-39HL9C7H4Q"
};

const app = initializeApp(firebaseConfig);

// Firestore com cache offline (vê o catálogo sem rede; edições sincronizam depois)
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
} catch (e) {
  // fallback caso a persistência não esteja disponível
  const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
  db = getFirestore(app);
}

const COL = 'bottles';
const colRef = collection(db, COL);

// Cache local em memória + estado de ligação
let cache = [];
let loaded = false;

function notify(){
  window.dispatchEvent(new CustomEvent('bottles-changed', { detail: { bottles: cache, loaded } }));
}

// Ouvinte em tempo real — qualquer alteração (de qualquer colega) chega aqui
onSnapshot(
  query(colRef, orderBy('codigo')),
  snap => {
    cache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    loaded = true;
    notify();
  },
  err => {
    console.warn('[BottlesDB] erro no onSnapshot:', err);
    loaded = true;
    notify();
  }
);

// API pública (usada pelo rendimento.js)
window.BottlesDB = {
  isReady(){ return loaded; },
  getAll(){ return cache.slice(); },
  getByCode(code){ return cache.find(b => b.codigo === code) || null; },
  getById(id){ return cache.find(b => b.id === id) || null; },
  async add(bottle){
    return addDoc(colRef, {
      codigo: (bottle.codigo || '').trim(),
      modelo: (bottle.modelo || '').trim(),
      velocidade: Number(bottle.velocidade) || 0,
      garrafas: Number(bottle.garrafas) || 0,
      editadoPor: bottle.editadoPor || '—',
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp()
    });
  },
  async update(id, bottle){
    return updateDoc(doc(db, COL, id), {
      codigo: (bottle.codigo || '').trim(),
      modelo: (bottle.modelo || '').trim(),
      velocidade: Number(bottle.velocidade) || 0,
      garrafas: Number(bottle.garrafas) || 0,
      editadoPor: bottle.editadoPor || '—',
      atualizadoEm: serverTimestamp()
    });
  },
  async remove(id){
    return deleteDoc(doc(db, COL, id));
  }
};

// Avisa quem já estava à espera que a API existe
window.dispatchEvent(new CustomEvent('bottlesdb-ready'));
