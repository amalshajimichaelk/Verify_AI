import React, { useState } from 'react';
import { Terminal, Copy, Check, Play, Send, ShieldCheck, Code, Globe } from 'lucide-react';
import { GlassPanel } from '../components/glass/GlassPanel';
import { Button } from '../components/ui/Button';

export const LiveCheckApiView: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState<'CURL' | 'PYTHON' | 'NODE'>('CURL');
  const [copiedCode, setCopiedCode] = useState(false);
  const [testPayloadUrl, setTestPayloadUrl] = useState(
    'https://cdn.verifyai.org/samples/press_conference_leak.mp4'
  );
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const snippets = {
    CURL: `curl -X POST https://api.verifyai.org/v1/verify \\
  -H "Authorization: Bearer vai_live_enclave_key_8492" \\
  -H "Content-Type: application/json" \\
  -d '{
    "mediaUrl": "${testPayloadUrl}",
    "detectors": ["optical_fft", "c2pa", "phoneme_viseme", "sensor_cfa"],
    "zeroRetention": true
  }'`,
    PYTHON: `import requests

url = "https://api.verifyai.org/v1/verify"
headers = {
    "Authorization": "Bearer vai_live_enclave_key_8492",
    "Content-Type": "application/json"
}
payload = {
    "mediaUrl": "${testPayloadUrl}",
    "detectors": ["optical_fft", "c2pa", "phoneme_viseme"],
    "zeroRetention": True
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
    NODE: `const axios = require('axios');

async function verifyMedia() {
  const res = await axios.post('https://api.verifyai.org/v1/verify', {
    mediaUrl: '${testPayloadUrl}',
    detectors: ['optical_fft', 'c2pa', 'phoneme_viseme'],
    zeroRetention: true
  }, {
    headers: { 'Authorization': 'Bearer vai_live_enclave_key_8492' }
  });
  console.log(res.data);
}

verifyMedia();`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[selectedLang]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleExecute = () => {
    setIsExecuting(true);
    setApiResponse(null);
    setTimeout(() => {
      setApiResponse(
        JSON.stringify(
          {
            status: 'COMPLETED',
            jobId: 'job_' + Math.random().toString(36).substring(2, 8),
            classification: 'POTENTIAL_MANIPULATION',
            calibratedConfidence: 76.4,
            uncertaintyMargin: '±4.2%',
            evidenceStrength: 'HIGH',
            primaryFinding:
              'Phoneme-viseme desynchronization detected: 142ms latency delay between bilabial plosives and lip closure.',
            c2paValidation: {
              present: false,
              isValid: false,
              hardwareSigned: false,
            },
            enclaveProcessingMs: 342,
            zeroRetentionConfirmed: true,
          },
          null,
          2
        )
      );
      setIsExecuting(false);
    }, 600);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1 pb-4 border-b border-white/8">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 font-mono text-xs font-bold uppercase border border-orange-500/30">
            Developer Infrastructure
          </span>
          <span className="text-xs font-mono text-[#737373]">• Sub-500ms Edge Latency</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#e0e0e0]">
          VerifyAI Live Check REST API
        </h1>
        <p className="text-xs sm:text-sm text-[#a3a3a3]">
          Programmatic headless verification pipeline for social platforms, newsroom content
          management systems, and trust & safety teams.
        </p>
      </div>

      {/* API Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Code Snippets (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <GlassPanel tier={2} className="p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/8">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#e0e0e0]">
                <Terminal className="w-4 h-4 text-orange-400" />
                <span>POST /v1/verify</span>
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-1 bg-black p-1 rounded-lg border border-white/8 font-mono text-xs">
                {(['CURL', 'PYTHON', 'NODE'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setSelectedLang(lang)}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      selectedLang === lang
                        ? 'bg-gradient-to-r from-orange-400 to-amber-200 text-black font-bold shadow-sm'
                        : 'text-[#a3a3a3] hover:text-white'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Box */}
            <div className="relative">
              <pre className="p-4 rounded-lg bg-black border border-white/8 font-mono text-xs text-orange-400 overflow-x-auto leading-relaxed">
                {snippets[selectedLang]}
              </pre>
              <button
                type="button"
                onClick={handleCopy}
                className="absolute top-3 right-3 p-1.5 rounded bg-white/5 hover:bg-white/10 text-[#a3a3a3] hover:text-white transition-colors text-xs font-mono flex items-center gap-1 border border-white/10"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </GlassPanel>
        </div>

        {/* Live Interactive Request Simulator (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <GlassPanel tier={2} className="p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/8 text-xs font-mono font-semibold text-[#e0e0e0]">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-orange-400" />
                <span>Interactive Request Runner</span>
              </div>
              <span className="text-[#737373]">SANDBOX ENVIRONMENT</span>
            </div>

            <div className="flex flex-col gap-1.5 font-mono text-xs">
              <label htmlFor="payload-url-input" className="text-[#a3a3a3]">Payload Media URL</label>
              <input
                id="payload-url-input"
                type="text"
                value={testPayloadUrl}
                onChange={(e) => setTestPayloadUrl(e.target.value)}
                className="w-full bg-black text-[#e0e0e0] p-2.5 rounded-lg border border-white/10 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleExecute}
              isLoading={isExecuting}
              icon={<Send className="w-4 h-4" />}
            >
              Dispatch Verification Request
            </Button>

            {apiResponse && (
              <div className="flex flex-col gap-1.5 pt-2 border-t border-white/8">
                <span className="text-[11px] font-mono text-[#737373]">Response 200 OK (342ms)</span>
                <pre className="p-3.5 rounded-lg bg-black border border-white/8 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-56 leading-relaxed">
                  {apiResponse}
                </pre>
              </div>
            )}
          </GlassPanel>
        </div>
      </div>
    </div>
  );
};
