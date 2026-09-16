import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Printer, Renew, TrashCan } from '@carbon/icons-react';
import { ADMIN_API_URL as API_URL } from '../../config/runtime';
import { ConfirmModal } from '../../components/common/ConfirmModal';

interface PrinterAgent {
  id: string;
  shop_id: string;
  name: string;
  agent_version: string | null;
  printers: string[];
  last_seen_at: string | null;
  revoked_at: string | null;
  status: 'CONNECTED' | 'OFFLINE';
  shops?: { name?: string } | Array<{ name?: string }> | null;
}

const shopName = (agent: PrinterAgent) => {
  if (Array.isArray(agent.shops)) return agent.shops[0]?.name || agent.shop_id;
  return agent.shops?.name || agent.shop_id;
};

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleString() : 'Never';

const requestErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
};

export const PrinterAgentsPage: React.FC = () => {
  const [agents, setAgents] = useState<PrinterAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [agentToRevoke, setAgentToRevoke] = useState<PrinterAgent | null>(null);
  const [error, setError] = useState('');

  const requestHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('admin_access_token')}`,
  });

  const loadAgents = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const response = await axios.get<PrinterAgent[]>(`${API_URL}/daemon-devices`, {
        headers: requestHeaders(),
      });
      setAgents(response.data);
      setError('');
    } catch (requestError: unknown) {
      setError(requestErrorMessage(requestError, 'Failed to load printer agents.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => void loadAgents(false), 0);
    const timer = window.setInterval(() => void loadAgents(false), 10_000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [loadAgents]);

  const rescan = async (agent: PrinterAgent) => {
    setPendingId(agent.id);
    try {
      await axios.post(`${API_URL}/daemon-devices/${agent.id}/rescan`, {}, {
        headers: requestHeaders(),
      });
      window.setTimeout(() => void loadAgents(false), 1_500);
    } catch (requestError: unknown) {
      setError(requestErrorMessage(requestError, 'Failed to request printer rescan.'));
    } finally {
      setPendingId(null);
    }
  };

  const revoke = async (agent: PrinterAgent) => {
    setPendingId(agent.id);
    try {
      await axios.post(`${API_URL}/daemon-devices/${agent.id}/revoke`, {}, {
        headers: requestHeaders(),
      });
      await loadAgents(false);
    } catch (requestError: unknown) {
      setError(requestErrorMessage(requestError, 'Failed to revoke printer agent.'));
    } finally {
      setPendingId(null);
      setAgentToRevoke(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-carbon-gray-10 p-8 font-sans">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-carbon-blue-60">Device operations</p>
            <h1 className="mt-1 text-3xl font-black text-carbon-gray-100">Printer Agents</h1>
            <p className="mt-2 text-sm text-gray-600">Monitor and revoke the Windows printing computers registered by verified shops.</p>
          </div>
          <button onClick={() => void loadAgents(true)} className="flex min-h-11 items-center bg-carbon-blue-60 px-5 text-sm font-bold text-white hover:bg-carbon-blue-70">
            <Renew className="mr-2 h-5 w-5" /> Refresh
          </button>
        </div>

        {error && <div className="mb-5 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{error}</div>}

        <div className="overflow-x-auto border border-gray-200 bg-white shadow-[0_8px_24px_rgba(22,22,22,0.06)]">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead className="bg-carbon-gray-100 text-white">
              <tr>
                <th className="px-5 py-4 font-bold">Shop</th>
                <th className="px-5 py-4 font-bold">Computer</th>
                <th className="px-5 py-4 font-bold">Status</th>
                <th className="px-5 py-4 font-bold">Printers</th>
                <th className="px-5 py-4 font-bold">Version</th>
                <th className="px-5 py-4 font-bold">Last seen</th>
                <th className="px-5 py-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-500">Loading printer agents...</td></tr>
              ) : agents.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center">
                  <Printer className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                  <span className="font-semibold text-gray-500">No printer agents have been registered.</span>
                </td></tr>
              ) : agents.map((agent) => (
                <tr key={agent.id} className={agent.revoked_at ? 'bg-gray-50 text-gray-400' : 'text-gray-700'}>
                  <td className="px-5 py-4 font-bold text-carbon-gray-100">{shopName(agent)}</td>
                  <td className="px-5 py-4">{agent.name}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider ${agent.revoked_at ? 'bg-red-100 text-red-800' : agent.status === 'CONNECTED' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                      {agent.revoked_at ? 'Revoked' : agent.status === 'CONNECTED' ? 'Connected' : 'Offline'}
                    </span>
                  </td>
                  <td className="max-w-[260px] px-5 py-4">
                    {Array.isArray(agent.printers) && agent.printers.length > 0 ? agent.printers.join(', ') : 'None reported'}
                  </td>
                  <td className="px-5 py-4">{agent.agent_version || 'Unknown'}</td>
                  <td className="px-5 py-4">{formatDate(agent.last_seen_at)}</td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => void rescan(agent)}
                        disabled={agent.status !== 'CONNECTED' || Boolean(agent.revoked_at) || pendingId === agent.id}
                        className="p-2 text-carbon-blue-60 hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-gray-300"
                        aria-label={`Rescan printers on ${agent.name}`}
                        title="Rescan printers"
                      ><Renew className="h-5 w-5" /></button>
                      <button
                        onClick={() => setAgentToRevoke(agent)}
                        disabled={Boolean(agent.revoked_at) || pendingId === agent.id}
                        className="p-2 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-gray-300"
                        aria-label={`Revoke ${agent.name}`}
                        title="Revoke agent"
                      ><TrashCan className="h-5 w-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmModal
        isOpen={Boolean(agentToRevoke)}
        title="Revoke printer agent?"
        message={agentToRevoke ? `${agentToRevoke.name} will be removed from ${shopName(agentToRevoke)} and must be registered again before it can print.` : ''}
        confirmLabel="Revoke agent"
        cancelLabel="Keep connected"
        isBusy={Boolean(agentToRevoke && pendingId === agentToRevoke.id)}
        onCancel={() => setAgentToRevoke(null)}
        onConfirm={() => {
          if (agentToRevoke) void revoke(agentToRevoke);
        }}
      />
    </div>
  );
};
