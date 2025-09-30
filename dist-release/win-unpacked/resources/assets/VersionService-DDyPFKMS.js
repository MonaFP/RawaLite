const a="rawalite",c="1.0.0",p={"better-sqlite3":"^12.4.1",react:"^18.3.1"},m={electron:"^31.2.0",vite:"^5.4.0"},i={name:a,version:c,dependencies:p,devDependencies:m};var o={};class l{static getAppVersion(){return{version:i.version,name:i.name,buildDate:new Date().toISOString(),buildEnvironment:"production",gitCommit:o.VITE_GIT_COMMIT||void 0,gitBranch:o.VITE_GIT_BRANCH||void 0}}static getSystemInfo(){var r;const e=navigator.userAgent,t=e.match(/Electron\/([^\s]+)/),n=e.match(/Chrome\/([^\s]+)/),s=(r=process.versions)==null?void 0:r.node;return{platform:navigator.platform,userAgent:e,electronVersion:t==null?void 0:t[1],chromeVersion:n==null?void 0:n[1],nodeVersion:s}}static getFullVersionInfo(){var e,t,n,s;return{app:this.getAppVersion(),system:this.getSystemInfo(),dependencies:{react:(e=i.dependencies)==null?void 0:e.react,electron:(t=i.devDependencies)==null?void 0:t.electron,"better-sqlite3":(n=i.dependencies)==null?void 0:n["better-sqlite3"],vite:(s=i.devDependencies)==null?void 0:s.vite}}}static getDisplayVersion(){const e=this.getAppVersion();return`${e.name} v${e.version}`}static getAboutVersionString(){const e=this.getAppVersion(),t=this.getSystemInfo();let n=`${e.name} v${e.version}`;if(e.buildEnvironment!=="production"&&(n+=` (${e.buildEnvironment})`),t.electronVersion&&(n+=`
Electron ${t.electronVersion}`),e.gitCommit){const s=e.gitCommit.substring(0,7);n+=`
Build ${s}`}return n}static getBackupVersionInfo(){const e=this.getAppVersion(),t=this.getSystemInfo();return{version:e.version,timestamp:new Date().toISOString(),buildInfo:`${e.name}@${e.version} (Electron ${t.electronVersion||"unknown"})`}}static isCompatibleVersion(e){const t=this.getAppVersion().version;try{const n=t.split(".").map(Number),s=e.split(".").map(Number);return!(n[0]!==s[0]||n[1]<s[1]||n[1]===s[1]&&n[2]<s[2])}catch(n){return console.warn("Version comparison failed:",n),!1}}static getDebugInfo(){var t;const e=this.getFullVersionInfo();return`
=== RawaLite Debug Information ===
App: ${e.app.name} v${e.app.version}
Build: ${e.app.buildEnvironment} (${e.app.buildDate})
Platform: ${e.system.platform}
Electron: ${e.system.electronVersion||"unknown"}
Chrome: ${e.system.chromeVersion||"unknown"}
Node: ${e.system.nodeVersion||"unknown"}

Dependencies:
${Object.entries(e.dependencies).map(([n,s])=>`- ${n}: ${s}`).join(`
`)}

System:
${e.system.userAgent}

Git: ${e.app.gitBranch||"unknown"}@${((t=e.app.gitCommit)==null?void 0:t.substring(0,7))||"unknown"}
    `.trim()}}export{l as VersionService,l as default};
