var u=Object.defineProperty;var d=(s,e,t)=>e in s?u(s,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):s[e]=t;var c=(s,e,t)=>d(s,typeof e!="symbol"?e+"":e,t);import{D as m,a as l,m as g}from"./index-CnvUd2cw.js";class y{static async getNextNumber(e){const t=l(`
      SELECT id, prefix, digits, current, resetMode, lastResetYear 
      FROM numbering_circles 
      WHERE id = ?
    `),n=await this.client.query(t,[e]);if(n.length===0)throw new Error(`Nummernkreis '${e}' nicht gefunden`);const r=n[0],i=new Date().getFullYear();let a=r.current+1;r.resetMode==="yearly"&&(!r.lastResetYear||r.lastResetYear!==i)&&(a=1),await this.client.transaction([{sql:`
          UPDATE numbering_circles 
          SET current = ?, last_reset_year = ?, updated_at = datetime('now')
          WHERE id = ?
        `,params:[a,r.resetMode==="yearly"?i:r.lastResetYear,e]}]);const o=a.toString().padStart(r.digits,"0");return`${r.prefix}${o}`}static async getAllCircles(){const e=l(`
      SELECT id, name, prefix, digits, current, resetMode, lastResetYear 
      FROM numbering_circles 
      ORDER BY name
    `),t=await this.client.query(e);return g(t)}}c(y,"client",m.getInstance());export{y as NummernkreisService};
