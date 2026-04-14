import React from 'react';
import { Shield, Globe, Lock } from 'lucide-react';

export default function DNSVPNPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl" data-testid="dns-vpn-page">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-3"><Shield className="w-8 h-8" />DNS & VPN</h1>
      <div className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Globe className="w-5 h-5" />DNS Recommandes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[{name:'Cloudflare',primary:'1.1.1.1',secondary:'1.0.0.1'},{name:'Google',primary:'8.8.8.8',secondary:'8.8.4.4'},{name:'Quad9',primary:'9.9.9.9',secondary:'149.112.112.112'},{name:'OpenDNS',primary:'208.67.222.222',secondary:'208.67.220.220'}]
              .map(d => (
                <div key={d.name} className="bg-secondary/30 rounded-lg p-4">
                  <h3 className="font-bold mb-2">{d.name}</h3>
                  <p className="text-sm text-muted-foreground">Primaire: <code className="bg-background px-2 py-0.5 rounded">{d.primary}</code></p>
                  <p className="text-sm text-muted-foreground mt-1">Secondaire: <code className="bg-background px-2 py-0.5 rounded">{d.secondary}</code></p>
                </div>
              ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Lock className="w-5 h-5" />VPN Recommandes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[{name:'NordVPN',desc:'Rapide et securise'},{name:'ExpressVPN',desc:'Fiable et rapide'},{name:'ProtonVPN',desc:'Version gratuite disponible'}]
              .map(v => (
                <div key={v.name} className="bg-secondary/30 rounded-lg p-4 text-center">
                  <h3 className="font-bold">{v.name}</h3><p className="text-sm text-muted-foreground mt-1">{v.desc}</p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
