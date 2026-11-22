import { useState } from 'react';
import { Shield, UserCheck, Lock, Unlock } from 'lucide-react';

interface RoleSwitcherProps {
  role: 'admin' | 'agent';
  onRoleChange: (newRole: 'admin' | 'agent') => void;
}

export function RoleSwitcher({ role, onRoleChange }: RoleSwitcherProps) {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  function handleAdminSwitch(e: React.FormEvent) {
    e.preventDefault();
    if (pin === '2026' || pin === '0000') {
      onRoleChange('admin');
      setShowPinModal(false);
      setPin('');
      setError('');
    } else {
      setError('Incorrect Admin PIN (Try 2026)');
    }
  }

  return (
    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
      <button
        onClick={() => onRoleChange('agent')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${role === 'agent' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
      >
        <UserCheck size={14} className="text-emerald-600" /> Agent Mode
      </button>
      <button
        onClick={() => {
          if (role === 'admin') {
            onRoleChange('agent');
          } else {
            setShowPinModal(true);
          }
        }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${role === 'admin' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500'}`}
      >
        <Shield size={14} className={role === 'admin' ? 'text-amber-400' : 'text-slate-400'} />
        {role === 'admin' ? 'Admin / Owner' : 'Unlock Admin'}
      </button>

      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Lock size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Admin Authorization</h3>
                <p className="text-xs text-slate-500">Enter 4-digit PIN to access P&L and analytics</p>
              </div>
            </div>

            {error && <div className="mb-3 p-2.5 bg-rose-50 text-rose-700 text-xs rounded-xl">{error}</div>}

            <form onSubmit={handleAdminSwitch} className="space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="•••• (Default: 2026)"
                  autoFocus
                  required
                  className="w-full text-center tracking-widest text-2xl font-bold py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm shadow-md"
                >
                  Authenticate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
