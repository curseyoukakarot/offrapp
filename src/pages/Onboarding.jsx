import React, { useEffect, useState } from 'react';
import { PLANS } from '../lib/plans';

export default function Onboarding() {
  const [state, setState] = useState({ step: 'plan' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await fetch('/api/onboarding-status');
      const json = await res.json();
      setState(json || { step: 'plan' });
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading…</div>;
  if (state.ready) {
    const url = `https://${state.tenantSlug}.nestbase.io`;
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white border rounded-2xl p-8 text-center">
          <div className="text-xl font-semibold mb-3">Workspace Ready</div>
          <a className="text-blue-600 underline" href={url}>Go to your workspace</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto bg-white border rounded-2xl p-6">
        {state.step === 'plan' && <StepPlan onNext={async (plan, seats) => {
          await fetch('/api/onboarding-plan', { method: 'POST', body: JSON.stringify({ plan, adminSeats: seats }) });
          const s = await (await fetch('/api/onboarding-status')).json();
          setState(s);
        }} />}
        {state.step === 'branding' && <StepBranding onNext={async (b) => {
          await fetch('/api/onboarding-branding', { method: 'POST', body: JSON.stringify(b) });
          const s = await (await fetch('/api/onboarding-status')).json();
          setState(s);
        }} />}
        {state.step === 'capabilities' && <StepCapabilities onNext={async (c) => {
          await fetch('/api/onboarding-capabilities', { method: 'POST', body: JSON.stringify(c) });
          const s = await (await fetch('/api/onboarding-status')).json();
          setState(s);
        }} />}
        {state.step === 'review' && <StepReview onProvision={async () => {
          const res = await fetch('/api/onboarding-provision', { method: 'POST' });
          const json = await res.json();
          if (json.ready) setState(json);
        }} state={state} />}
      </div>
    </div>
  );
}

function StepPlan({ onNext }) {
  const [plan, setPlan] = useState('starter');
  const [seats, setSeats] = useState(1);
  return (
    <div>
      <div className="text-xl font-semibold mb-4">Step 1: Choose Plan & Seats</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(PLANS).map(([key, p]) => (
          <label key={key} className={`border rounded-xl p-4 cursor-pointer ${plan === key ? 'border-blue-500' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <span className="font-medium capitalize">{key}</span>
              <input type="radio" name="plan" checked={plan === key} onChange={() => setPlan(key)} />
            </div>
            <div className="text-sm text-gray-600 mt-1">{p.price === null ? 'Contact us' : `$${p.price}/mo`}</div>
            <div className="text-xs text-gray-500 mt-2">Max clients: {p.maxClients ?? 'Unlimited'}</div>
          </label>
        ))}
      </div>
      <div className="mt-4">
        <label className="text-sm text-gray-700 mr-2">Admin seats</label>
        <input type="number" min={1} value={seats} onChange={(e) => setSeats(parseInt(e.target.value || '1', 10))} className="border rounded px-2 py-1 w-24" />
      </div>
      <div className="mt-6 text-right">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg" onClick={() => onNext(plan, seats)}>Continue</button>
      </div>
    </div>
  );
}

function StepBranding({ onNext }) {
  const [brandColor, setBrandColor] = useState('#2563eb');
  const [logoUrl, setLogoUrl] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [status, setStatus] = useState('idle'); // idle|checking|available|taken|invalid
  const valid = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$/.test(subdomain);

  useEffect(() => {
    if (!subdomain) { setStatus('idle'); return; }
    const sanitized = sanitize(subdomain);
    if (sanitized !== subdomain) setSubdomain(sanitized);
    if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$/.test(sanitized)) { setStatus('invalid'); return; }
    const id = setTimeout(async () => {
      setStatus('checking');
      try {
        const res = await fetch('/api/onboarding-check-subdomain', { method: 'POST', body: JSON.stringify({ subdomain: sanitized }) });
        const json = await res.json();
        if (json.available) setStatus('available'); else setStatus(json.reason === 'invalid' ? 'invalid' : 'taken');
      } catch (_e) {
        setStatus('invalid');
      }
    }, 400);
    return () => clearTimeout(id);
  }, [subdomain]);

  const disabled = !(status === 'available');
  return (
    <div>
      <div className="text-xl font-semibold mb-4">Step 2: Branding</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Brand color</label>
          <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="w-full h-10 border rounded" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Logo URL</label>
          <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-700 mb-1">Subdomain</label>
          <div className="flex items-center gap-2">
            <input value={subdomain} onChange={(e) => setSubdomain(e.target.value)} placeholder="yourcompany" className="flex-1 border rounded px-3 py-2" />
            <span className="text-sm text-gray-600">.nestbase.io</span>
          </div>
          {status === 'invalid' && subdomain && <div className="text-xs text-red-600 mt-1">Invalid subdomain format.</div>}
          {status === 'taken' && <div className="text-xs text-red-600 mt-1">This subdomain is already taken.</div>}
          {status === 'available' && <div className="text-xs text-green-600 mt-1">Available</div>}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-700 mb-1">Custom domain (optional)</label>
          <input value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder="app.yourdomain.com" className="w-full border rounded px-3 py-2" />
        </div>
      </div>
      <div className="mt-6 text-right">
        <button disabled={disabled} className={`px-4 py-2 rounded-lg text-white ${!disabled ? 'bg-blue-600' : 'bg-blue-300 cursor-not-allowed'}`} onClick={() => onNext({ brandColor, logoUrl, subdomain, customDomain })}>Continue</button>
      </div>
    </div>
  );
}

function sanitize(s) {
  return String(s).toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/--+/g, '-').slice(0, 63);
}

function StepCapabilities({ onNext }) {
  const [useEmbeds, setUseEmbeds] = useState(true);
  const [useForms, setUseForms] = useState(true);
  const [useFiles, setUseFiles] = useState(true);
  const [slackWebhook, setSlackWebhook] = useState('');
  const [emailFromName, setEmailFromName] = useState('');
  const [emailFromAddress, setEmailFromAddress] = useState('');
  return (
    <div>
      <div className="text-xl font-semibold mb-4">Step 3: Capabilities</div>
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={useEmbeds} onChange={(e) => setUseEmbeds(e.target.checked)} /> Embeds</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={useForms} onChange={(e) => setUseForms(e.target.checked)} /> Forms</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={useFiles} onChange={(e) => setUseFiles(e.target.checked)} /> Files</label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        <div>
          <label className="block text-sm text-gray-700 mb-1">Slack Webhook (optional)</label>
          <input value={slackWebhook} onChange={(e) => setSlackWebhook(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Email From Name</label>
          <input value={emailFromName} onChange={(e) => setEmailFromName(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-gray-700 mb-1">Email From Address</label>
          <input value={emailFromAddress} onChange={(e) => setEmailFromAddress(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>
      </div>
      <div className="mt-6 text-right">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg" onClick={() => onNext({ useEmbeds, useForms, useFiles, slackWebhook, emailFromName, emailFromAddress })}>Continue</button>
      </div>
    </div>
  );
}

function StepReview({ onProvision, state }) {
  return (
    <div>
      <div className="text-xl font-semibold mb-4">Step 4: Review & Provision</div>
      <div className="bg-gray-50 border rounded-xl p-4 text-sm">
        <div><span className="text-gray-600">Company:</span> {state.companyName}</div>
        <div><span className="text-gray-600">Plan:</span> {state.plan}</div>
        <div><span className="text-gray-600">Subdomain:</span> {state.branding?.subdomain}.nestbase.io</div>
      </div>
      <div className="mt-6 text-right">
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg" onClick={onProvision}>Create Workspace</button>
      </div>
    </div>
  );
}


