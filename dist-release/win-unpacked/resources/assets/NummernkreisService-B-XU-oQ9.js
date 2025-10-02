var g=Object.defineProperty;var m=(a,e,t)=>e in a?g(a,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):a[e]=t;var o=(a,e,t)=>m(a,typeof e!="symbol"?e+"":e,t);import{D as y,a as i,m as E}from"./index-QELgR4il.js";const s=class s{static async getNextNumber(e){const t=i(`
      SELECT id, prefix, digits, current, resetMode, lastResetYear 
      FROM numbering_circles 
      WHERE id = ?
    `),n=await this.client.query(t,[e]);if(n.length===0)throw new Error(`Nummernkreis '${e}' nicht gefunden`);const r=n[0],l=new Date().getFullYear();let c=r.current+1;r.resetMode==="yearly"&&(!r.lastResetYear||r.lastResetYear!==l)&&(c=1),await this.client.transaction([{sql:i(`
          UPDATE numberingCircles 
          SET current = ?, lastResetYear = ?, updatedAt = datetime('now')
          WHERE id = ?
        `),params:[c,r.resetMode==="yearly"?l:r.lastResetYear,e]}]);const d=c.toString().padStart(r.digits,"0");return`${r.prefix}${d}`}static async getAllCircles(){const e=i(`
      SELECT id, name, prefix, digits, current, resetMode, lastResetYear 
      FROM numbering_circles 
      ORDER BY name
    `),t=await this.client.query(e);return E(t)}async getAll(){return await s.getAllCircles()}async getNext(e){return s.getNextNumber(e)}async update(e,t){const n=i(`
      UPDATE numberingCircles 
      SET name = ?, prefix = ?, digits = ?, current = ?, resetMode = ?, updatedAt = datetime('now')
      WHERE id = ?
    `);await s.client.exec(n,[t.name,t.prefix,t.digits,t.current,t.resetMode,e])}};o(s,"client",y.getInstance());let u=s;export{u as NummernkreisService};
