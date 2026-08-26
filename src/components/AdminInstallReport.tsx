import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, Smartphone, Monitor, Globe, Calendar, Clock, Sparkles, CheckCircle2, TrendingUp, Filter } from 'lucide-react';
import { AnalyticsInstall } from '../types';
import { getPwaInstalls, subscribePwaInstalls } from '../lib/api';

export const AdminInstallReport: React.FC = () => {
  const [installs, setInstalls] = useState<AnalyticsInstall[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    // Real-time listener for app installs
    const unsubscribe = subscribePwaInstalls((data) => {
      setInstalls(data);
      setLoading(false);
    });

    // Initial manual fetch fallback
    getPwaInstalls()
      .then((data) => {
        setInstalls(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Initial PWA installs load error:', err);
        setLoading(false);
      });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const data = await getPwaInstalls();
      setInstalls(data);
    } catch (err) {
      console.warn('Refresh error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper date calculations
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
  const monthStart = todayStart - 30 * 24 * 60 * 60 * 1000;

  const todayCount = installs.filter((i) => new Date(i.timestamp).getTime() >= todayStart).length;
  const weekCount = installs.filter((i) => new Date(i.timestamp).getTime() >= weekStart).length;
  const monthCount = installs.filter((i) => new Date(i.timestamp).getTime() >= monthStart).length;
  const totalCount = installs.length;

  // Platform metrics
  const androidCount = installs.filter(
    (i) =>
      i.platform?.toLowerCase().includes('android') ||
      i.userAgent?.toLowerCase().includes('android')
  ).length;

  const iosCount = installs.filter(
    (i) =>
      i.platform?.toLowerCase().includes('ios') ||
      i.platform?.toLowerCase().includes('iphone') ||
      i.platform?.toLowerCase().includes('ipad') ||
      i.userAgent?.toLowerCase().includes('iphone') ||
      i.userAgent?.toLowerCase().includes('ipad')
  ).length;

  const desktopCount = installs.filter((i) => {
    const p = (i.platform || '').toLowerCase();
    const ua = (i.userAgent || '').toLowerCase();
    return (
      p.includes('win') ||
      p.includes('mac') ||
      p.includes('linux') ||
      p.includes('cros') ||
      ua.includes('windows') ||
      ua.includes('macintosh')
    );
  }).length;

  // Filtering
  const filteredInstalls = installs.filter((item) => {
    const itemTime = new Date(item.timestamp).getTime();
    if (filterPeriod === 'today' && itemTime < todayStart) return false;
    if (filterPeriod === 'week' && itemTime < weekStart) return false;
    if (filterPeriod === 'month' && itemTime < monthStart) return false;

    if (platformFilter !== 'all') {
      const p = (item.platform || '').toLowerCase();
      const ua = (item.userAgent || '').toLowerCase();
      if (platformFilter === 'android' && !p.includes('android') && !ua.includes('android')) return false;
      if (platformFilter === 'ios' && !p.includes('ios') && !p.includes('iphone') && !p.includes('ipad') && !ua.includes('iphone') && !ua.includes('ipad')) return false;
      if (platformFilter === 'desktop' && !p.includes('win') && !p.includes('mac') && !p.includes('linux') && !ua.includes('windows') && !ua.includes('macintosh')) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        (item.id && item.id.toLowerCase().includes(q)) ||
        (item.platform && item.platform.toLowerCase().includes(q)) ||
        (item.userAgent && item.userAgent.toLowerCase().includes(q)) ||
        (item.referrer && item.referrer.toLowerCase().includes(q)) ||
        (item.timestamp && item.timestamp.includes(q));
      if (!match) return false;
    }

    return true;
  });

  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'ଏହି ମାତ୍ର (Just now)';
      if (diffMins < 60) return `${diffMins} ମିନିଟ ପୂର୍ବେ (${diffMins}m ago)`;
      if (diffHours < 24) return `${diffHours} ଘଣ୍ଟା ପୂର୍ବେ (${diffHours}h ago)`;
      return `${diffDays} ଦିନ ପୂର୍ବେ (${diffDays}d ago)`;
    } catch {
      return '';
    }
  };

  const getPlatformBadge = (platform?: string, userAgent?: string) => {
    const p = (platform || '').toLowerCase();
    const ua = (userAgent || '').toLowerCase();

    if (p.includes('android') || ua.includes('android')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-[11px] font-black">
          <Smartphone className="w-3 h-3 text-emerald-700" />
          <span>Android</span>
        </span>
      );
    }
    if (p.includes('ios') || p.includes('iphone') || p.includes('ipad') || ua.includes('iphone') || ua.includes('ipad')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-900 border border-slate-300 rounded-lg text-[11px] font-black">
          <Smartphone className="w-3 h-3 text-slate-700" />
          <span>iOS / Apple</span>
        </span>
      );
    }
    if (p.includes('win') || ua.includes('windows')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-900 border border-blue-300 rounded-lg text-[11px] font-black">
          <Monitor className="w-3 h-3 text-blue-700" />
          <span>Windows PC</span>
        </span>
      );
    }
    if (p.includes('mac') || ua.includes('macintosh')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-900 border border-indigo-300 rounded-lg text-[11px] font-black">
          <Monitor className="w-3 h-3 text-indigo-700" />
          <span>macOS</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-black">
        <Globe className="w-3 h-3 text-amber-700" />
        <span>{platform || 'Web Browser'}</span>
      </span>
    );
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-amber-300 shadow-md space-y-6">
      {/* Top Title & Live Sync Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-600 to-amber-800 text-white rounded-2xl shadow-md border border-amber-500/40">
            <Download className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-950">
                ଆପ୍ ଡାଉନଲୋଡ୍ ରିପୋର୍ଟ (App Download Report)
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-black">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                <span>LIVE SYNC</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              ରିଅଲ-ଟାଇମ୍ PWA ଆପ୍ ଇନଷ୍ଟଲ୍ ଓ ଡାଉନଲୋଡ୍ ଟ୍ରାକିଂ (Real-time PWA Installation Tracking)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 border border-amber-300 disabled:opacity-50"
            title="ଡାଟା ରିଫ୍ରେଶ୍ କରନ୍ତୁ"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>ରିଫ୍ରେଶ୍ ({installs.length})</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* TOTAL DOWNLOADS */}
        <div className="bg-gradient-to-br from-amber-900 via-slate-900 to-amber-950 text-white p-4 rounded-2xl border border-amber-500/40 shadow-md relative overflow-hidden">
          <div className="absolute top-2 right-2 p-2 bg-amber-500/20 text-amber-400 rounded-xl">
            <Download className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-black text-amber-300 uppercase tracking-wider">
            ସମୁଦାୟ ଡାଉନଲୋଡ୍ (Total)
          </p>
          <div className="text-3xl sm:text-4xl font-black text-white mt-1 tracking-tight">
            {totalCount}
          </div>
          <p className="text-[10px] text-slate-300 mt-1 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> ସଫଳ PWA ଇନଷ୍ଟଲ୍
          </p>
        </div>

        {/* TODAY */}
        <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-300 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-amber-900 uppercase">ଆଜିର ଡାଉନଲୋଡ୍ (Today)</p>
            <Calendar className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-950 mt-1">
            {todayCount}
          </div>
          <p className="text-[10px] text-amber-800 font-bold mt-1">ଗତ ୨୪ ଘଣ୍ଟା ମଧ୍ୟରେ</p>
        </div>

        {/* THIS WEEK */}
        <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-300 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-amber-900 uppercase">୭ ଦିନରେ (Last 7 Days)</p>
            <TrendingUp className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-950 mt-1">
            {weekCount}
          </div>
          <p className="text-[10px] text-amber-800 font-bold mt-1">ଗତ ସପ୍ତାହର ମୋଟ</p>
        </div>

        {/* THIS MONTH */}
        <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-300 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-amber-900 uppercase">୩୦ ଦିନରେ (30 Days)</p>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-950 mt-1">
            {monthCount}
          </div>
          <p className="text-[10px] text-amber-800 font-bold mt-1">ଗତ ମାସର ମୋଟ</p>
        </div>
      </div>

      {/* Platform Breakdown Pills */}
      <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-900 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-amber-700" /> ଡିଭାଇସ୍ ବିଭାଜନ:
          </span>
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 font-black rounded-lg border border-emerald-300 text-[11px]">
            📱 Android: {androidCount}
          </span>
          <span className="px-2.5 py-1 bg-slate-100 text-slate-900 font-black rounded-lg border border-slate-300 text-[11px]">
            🍎 iOS: {iosCount}
          </span>
          <span className="px-2.5 py-1 bg-blue-100 text-blue-900 font-black rounded-lg border border-blue-300 text-[11px]">
            💻 Desktop: {desktopCount}
          </span>
        </div>

        {/* Filter Period Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-amber-300 text-xs font-bold">
          {(['all', 'today', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setFilterPeriod(p)}
              className={`px-3 py-1 rounded-lg cursor-pointer transition ${
                filterPeriod === p
                  ? 'bg-amber-700 text-white font-extrabold'
                  : 'text-slate-800 hover:bg-amber-100'
              }`}
            >
              {p === 'all'
                ? 'ସମସ୍ତ (All)'
                : p === 'today'
                ? 'ଆଜି (Today)'
                : p === 'week'
                ? '୭ ଦିନ (Week)'
                : '୩୦ ଦିନ (Month)'}
            </button>
          ))}
        </div>
      </div>

      {/* Installs Table / Log */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-800" />
            <span>ନିକଟତମ ଆପ୍ ଇନଷ୍ଟଲେସନ୍ ଲଗ୍ (Recent App Installations - {filteredInstalls.length})</span>
          </h4>

          {/* Quick Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search platform / ID / date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-medium outline-none focus:border-amber-600 w-48 sm:w-64"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1.5 text-xs text-slate-500 font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {filteredInstalls.length === 0 ? (
          <div className="p-10 text-center bg-amber-50/40 rounded-2xl border border-dashed border-amber-300 text-xs text-slate-600 font-bold">
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                <span>ଲୋଡ୍ ହେଉଛି... (Loading install records)</span>
              </div>
            ) : (
              'କୌଣସି ଡାଉନଲୋଡ୍ ରେକର୍ଡ ମିଳିଲା ନାହିଁ (No install records found for selected filter).'
            )}
          </div>
        ) : (
          <div className="overflow-x-auto border border-amber-300 rounded-2xl max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-amber-100/80 text-amber-950 font-black uppercase text-[10px] sticky top-0 z-10 border-b border-amber-300">
                <tr>
                  <th className="p-3">କ୍ରମିକ / ID</th>
                  <th className="p-3">ଡାଉନଲୋଡ୍ ସମୟ (Timestamp)</th>
                  <th className="p-3">ପ୍ଲାଟଫର୍ମ (Platform)</th>
                  <th className="p-3">ବ୍ରାଉଜର୍ / User-Agent</th>
                  <th className="p-3 text-right">ସମୟ ଅବଧି</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-200">
                {filteredInstalls.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-amber-50/60 transition">
                    <td className="p-3 font-mono font-extrabold text-amber-950">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 text-[10px]">#{idx + 1}</span>
                        <span className="bg-amber-200/80 px-2 py-0.5 rounded text-[11px] text-amber-950 font-mono">
                          {item.id}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 font-extrabold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>{formatDateTime(item.timestamp)}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      {getPlatformBadge(item.platform, item.userAgent)}
                    </td>
                    <td className="p-3 text-slate-600 font-mono text-[11px] max-w-xs truncate" title={item.userAgent || ''}>
                      {item.userAgent || 'Standard Browser PWA'}
                    </td>
                    <td className="p-3 text-right text-amber-900 font-bold text-[11px]">
                      {getRelativeTime(item.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
