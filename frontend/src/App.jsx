import React, { useState } from 'react';

// Custom inline SVG Icons for a clean interface
const CheckIcon = () => (
  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '1.25rem', height: '1.25rem', color: '#34d399' }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
  </svg>
);

const BranchIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '1.25rem', height: '1.25rem', color: '#60a5fa' }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7a2 2 0 110-4 2 2 0 010 4zm8 8a2 2 0 110-4 2 2 0 010 4zm-8 4v2" />
  </svg>
);

const CodeIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '1.25rem', height: '1.25rem', color: '#a78bfa' }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const ShieldIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '1.25rem', height: '1.25rem', color: '#f87171' }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

export default function App() {
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const branches = [
    {
      name: 'feature/agent-core',
      developer: 'Lead AI Engineer',
      owns: ['backend/agents/', 'backend/services/agent/'],
      focus: 'Agent thought loops, LLM tool-calling, Prompt definitions, memory management'
    },
    {
      name: 'feature/frontend-user-flow',
      developer: 'Frontend Specialist',
      owns: ['frontend/', 'backend/routes/user/', 'backend/routes/applications/'],
      focus: 'Dashboard interface, application wizard, profile endpoints, client-side routing'
    },
    {
      name: 'feature/voice-ivr',
      developer: 'Voice Systems Dev',
      owns: ['backend/routes/voice/', 'backend/services/voice/'],
      focus: 'Twilio webhooks, TwiML generation, real-time telephony responses, call queues'
    },
    {
      name: 'feature/status-documents',
      developer: 'Integration Engineer',
      owns: ['backend/services/documents/', 'backend/services/status/', 'backend/jobs/', 'backend/tests/integration/'],
      focus: 'Document rendering, PDF uploads, background status machine transitions, integration suite'
    }
  ];

  const endpoints = [
    {
      path: '/health',
      method: 'GET',
      desc: 'System health check verification.',
      response: { status: 'ok', environment: 'development', version: '1.0.0' }
    },
    {
      path: '/api/v1/user/profile',
      method: 'GET',
      desc: 'Get currently authenticated user details.',
      response: { id: 'usr_9872', name: 'Deon Raj', role: 'developer', status: 'active' }
    },
    {
      path: '/api/v1/applications',
      method: 'POST',
      desc: 'Submit a new application or document packet.',
      response: { application_id: 'app_6521', status: 'SUBMITTED', created_at: '2026-08-23T22:55:00Z' }
    },
    {
      path: '/api/v1/voice/webhook',
      method: 'POST',
      desc: 'Twilio inbound voice connection webhook.',
      response: { response: '<Response><Say>Connecting to Hazela voice core...</Say></Response>' }
    }
  ];

  const triggerTest = (endpoint) => {
    setSelectedEndpoint(endpoint.path);
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      setTestResult(endpoint.response);
    }, 600);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top right, #111827, #070a13)', padding: '2.5rem 1.5rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header Section */}
        <header style={{ marginBottom: '3rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{ background: 'linear-gradient(135deg, #a78bfa, #6366f1)', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 'bold' }}>Sprint Skeleton</span>
                <span style={{ color: '#10b981', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block' }}></span> Active
                </span>
              </div>
              <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: '800', background: 'linear-gradient(to right, #ffffff, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: 'Space Grotesk, sans-serif' }}>
                Hazela Core Scaffolding
              </h1>
              <p style={{ margin: '0.5rem 0 0 0', color: '#9ca3af', fontSize: '1rem' }}>
                Bootstrapped shared workspace. Parallel branch development system.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0.75rem 1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sprint Duration</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#60a5fa' }}>5 Days</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '0.75rem 1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Feature Branches</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#c084fc' }}>4 Active</div>
              </div>
            </div>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
          
          {/* Col 1: Branch Assignments & Ownership */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BranchIcon />
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', fontFamily: 'Space Grotesk, sans-serif' }}>Branch Ownership Matrix</h2>
            </div>
            
            {branches.map((b) => (
              <div key={b.name} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.5rem', backdropFilter: 'blur(10px)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#f3f4f6', fontSize: '1.125rem', fontFamily: 'monospace' }}>{b.name}</h3>
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Owner: {b.developer}</span>
                  </div>
                  <span style={{ background: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa', fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(96,165,250,0.2)' }}>Owned Lane</span>
                </div>
                
                <p style={{ margin: '0 0 1rem 0', color: '#9ca3af', fontSize: '0.875rem', lineHeight: '1.5' }}>
                  {b.focus}
                </p>
                
                <div>
                  <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: '#6b7280', marginBottom: '0.35rem', fontWeight: 'bold' }}>Paths Owned:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {b.owns.map((path) => (
                      <code key={path} style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.04)', padding: '0.15rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)', color: '#38bdf8' }}>{path}</code>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Col 2: API Contract Explorer & Workflow rules */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Interactive API Contract Sandbox */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <CodeIcon />
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', fontFamily: 'Space Grotesk, sans-serif' }}>API Contract Sandbox</h2>
              </div>
              
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.5rem', backdropFilter: 'blur(10px)' }}>
                <p style={{ margin: '0 0 1.25rem 0', color: '#9ca3af', fontSize: '0.875rem' }}>
                  Verify baseline request/response shape contracts. Test mocks in real-time.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {endpoints.map((ep) => (
                    <div key={ep.path} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          background: ep.method === 'GET' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(167, 139, 250, 0.1)',
                          color: ep.method === 'GET' ? '#34d399' : '#a78bfa',
                          border: ep.method === 'GET' ? '1px solid rgba(52,211,153,0.2)' : '1px solid rgba(167,139,250,0.2)'
                        }}>{ep.method}</span>
                        <code style={{ fontSize: '0.875rem', color: '#f3f4f6', fontFamily: 'monospace' }}>{ep.path}</code>
                      </div>
                      <button 
                        onClick={() => triggerTest(ep)}
                        style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.35rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600', transition: 'background 0.2s' }}
                      >
                        Invoke Mock
                      </button>
                    </div>
                  ))}
                </div>

                {selectedEndpoint && (
                  <div style={{ background: '#070a13', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'monospace' }}>Response Stub for: {selectedEndpoint}</span>
                      <span style={{ fontSize: '0.75rem', color: testing ? '#f59e0b' : '#10b981' }}>{testing ? 'Invoking...' : '200 OK'}</span>
                    </div>
                    {testing ? (
                      <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #3b82f6', borderRadius: '50%', width: '24px', height: '24px', animation: 'spin 1s linear infinite' }} />
                      </div>
                    ) : (
                      <pre style={{ margin: 0, padding: '0.5rem', fontSize: '0.75rem', fontFamily: 'monospace', color: '#38bdf8', overflowX: 'auto' }}>
                        {JSON.stringify(testResult, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Strict Branch Boundaries Rules */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <ShieldIcon />
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', fontFamily: 'Space Grotesk, sans-serif' }}>Sprint Governance & Rules</h2>
              </div>
              
              <div style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05), rgba(15, 23, 42, 0.6))', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '16px', padding: '1.5rem', backdropFilter: 'blur(10px)' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>⚠️</span> Strict Shared-File Rule
                </h3>
                <p style={{ margin: '0 0 1rem 0', color: '#d1d5db', fontSize: '0.875rem', lineHeight: '1.5' }}>
                  No branch may independently rewrite or modify shared scaffolding files. Any edits must go through the project lead as tiny, isolated PRs to protect standard integration.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#9ca3af' }}>
                    <span style={{ color: '#f87171', fontWeight: 'bold' }}>⛔ PROTECTED FILES:</span>
                  </div>
                  <code style={{ fontSize: '0.75rem', color: '#93c5fd' }}>• backend/app/main.py</code>
                  <code style={{ fontSize: '0.75rem', color: '#93c5fd' }}>• package.json, requirements.txt</code>
                  <code style={{ fontSize: '0.75rem', color: '#93c5fd' }}>• docs/architecture.md</code>
                </div>
              </div>
            </div>

          </section>
        </div>

        {/* Timeline & Merge Cadence Calendar */}
        <footer style={{ marginTop: '4rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', fontFamily: 'Space Grotesk, sans-serif' }}>Sprint Merge Cadence</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {[
              { day: 'Day 1', desc: 'Sync Skeleton', task: 'All developers pull skeleton, branch out, verify routes', milestone: 'Scaffold Approved' },
              { day: 'Day 2', desc: 'First Integration', task: 'Merge endpoints and webhook mocks to main', milestone: 'Check-point Integration 1' },
              { day: 'Day 3', desc: 'Second Integration', task: 'Merge layout changes and LLM core triggers', milestone: 'Check-point Integration 2' },
              { day: 'Day 4', desc: 'Feature Freeze', task: 'Complete business logic, freeze routes and schema', milestone: 'Stability testing' },
              { day: 'Day 5', desc: 'Release Prep', task: 'Run integration suite, verify end-to-end user flow', milestone: 'Final Deployment' }
            ].map((d, index) => (
              <div key={d.day} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#f3f4f6' }}>{d.day}</span>
                  <span style={{ fontSize: '0.675rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)' }}>
                    {index < 3 ? 'Checkpoint' : 'Final'}
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#fff', marginBottom: '0.25rem' }}>{d.desc}</div>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0 0 0.5rem 0', lineHeight: '1.4' }}>{d.task}</p>
                <div style={{ fontSize: '0.7rem', color: '#a78bfa', fontWeight: '500' }}>🎯 {d.milestone}</div>
              </div>
            ))}
          </div>
        </footer>

      </div>
      
      {/* Dynamic spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
