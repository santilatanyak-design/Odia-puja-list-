import React, { useState, useEffect } from 'react';
import { 
  Key, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  HelpCircle, 
  X,
  Server,
  Cloud,
  Check,
  Zap,
  HardDrive
} from 'lucide-react';
import { getClientAwsConfig, saveClientAwsConfig, syncAwsConfigFromServer } from '../lib/s3Upload';

interface AdminAwsSettingsProps {
  isModal?: boolean;
  onClose?: () => void;
  onSaved?: () => void;
}

export const AdminAwsSettings: React.FC<AdminAwsSettingsProps> = ({ 
  isModal = false, 
  onClose,
  onSaved 
}) => {
  const [config, setConfig] = useState(() => getClientAwsConfig());
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    // Attempt to sync from server on mount
    syncAwsConfigFromServer().then((serverCfg) => {
      if (serverCfg) {
        setConfig(serverCfg);
      }
    });
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setStatusMessage(null);
    setTestResult(null);

    try {
      // Save to localStorage & sync to server
      saveClientAwsConfig(config);

      // Verify server persisted
      const res = await fetch('/api/s3/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (res.ok) {
        setStatusMessage({ 
          type: 'success', 
          text: '✅ AWS S3 କ୍ରେଡେନ୍ସିଆଲ୍ ସଫଳତାର ସହ ସେଭ୍ ହୋଇଛି! (Credentials saved successfully!)' 
        });
      } else {
        setStatusMessage({ 
          type: 'success', 
          text: '✅ କ୍ରେଡେନ୍ସିଆଲ୍ ଲୋକାଲ୍ ଷ୍ଟୋରେଜ୍ ରେ ସେଭ୍ ହୋଇଛି! (Saved in local storage)' 
        });
      }

      // Update state
      setConfig(getClientAwsConfig());

      if (onSaved) {
        onSaved();
      }
    } catch (err: any) {
      setStatusMessage({ 
        type: 'error', 
        text: '❌ ସେଭ୍ କରିବାରେ ତ୍ରୁଟି: ' + (err?.message || 'Error') 
      });
    } finally {
      setSaving(false);
      setTimeout(() => {
        if (isModal && onClose && !statusMessage) {
          onClose();
        }
      }, 1500);
    }
  };

  const handleTestConnection = async () => {
    if (!config.accessKeyId || !config.secretAccessKey) {
      setTestResult({
        success: false,
        message: 'ଦୟାକରି ପ୍ରଥମେ Access Key ID ଏବଂ Secret Key ଦିଅନ୍ତୁ (Please enter Access Key ID & Secret Key first).'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/s3/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: `✅ AWS S3 ସଫଳତାର ସହ ସଂଯୁକ୍ତ! (${data.message || config.bucket})`
        });
      } else {
        setTestResult({
          success: false,
          message: `❌ ସଂଯୋଗ ବିଫଳ: ${data.message || 'Check credentials and bucket policy'}`
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `⚠️ Connection probe error: ${err?.message || 'Network error'}`
      });
    } finally {
      setTesting(false);
    }
  };

  const isConnected = Boolean(config.accessKeyId && config.secretAccessKey);

  const content = (
    <div className={`space-y-6 ${isModal ? 'p-6' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl shadow-sm">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
              AWS S3 Cloud Storage Settings
              {isConnected ? (
                <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  <Check className="w-3 h-3 text-emerald-600" /> Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-300">
                  <AlertCircle className="w-3 h-3 text-amber-600" /> Setup Needed
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure AWS S3 credentials for product media, banner photos, and social previews.
            </p>
          </div>
        </div>

        {isModal && onClose && (
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Status Notice */}
      <div className={`p-4 rounded-2xl border flex items-start gap-3 transition-colors ${
        isConnected 
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' 
          : 'bg-amber-50/80 border-amber-200 text-amber-950'
      }`}>
        {isConnected ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        )}
        <div className="text-xs leading-relaxed">
          <p className="font-bold">
            {isConnected 
              ? 'AWS S3 Credentials Configured (କ୍ରେଡେନ୍ସିଆଲ୍ ସଂଯୁକ୍ତ)' 
              : 'AWS S3 Access Key & Secret Key Required (କ୍ରେଡେନ୍ସିଆଲ୍ ଆବଶ୍ୟକ)'}
          </p>
          <p className="mt-0.5 text-slate-600">
            {isConnected 
              ? `Direct upload ready for bucket "${config.bucket}" in region "${config.region}". All product and banner photos upload directly to AWS.`
              : 'ଫଟୋ ଅପଲୋଡ୍ କରିବା ପାଇଁ AWS IAM ରୁ Access Key ଏବଂ Secret Key ଏଠାରେ ସେଭ୍ କରନ୍ତୁ। (Please enter your AWS credentials below so photos save directly to your S3 bucket).'}
          </p>
        </div>
      </div>

      {/* Messages */}
      {statusMessage && (
        <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
            : 'bg-rose-100 text-rose-900 border border-rose-300'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-700" /> : <AlertCircle className="w-4 h-4 text-rose-700" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {testResult && (
        <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
          testResult.success 
            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
            : 'bg-rose-100 text-rose-900 border border-rose-300'
        }`}>
          {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-700" /> : <AlertCircle className="w-4 h-4 text-rose-700" />}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Access Key ID */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-600" />
              <span>AWS Access Key ID</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={config.accessKeyId}
              onChange={(e) => setConfig({ ...config, accessKeyId: e.target.value.trim() })}
              placeholder="e.g. AKIAIOSFODNN7EXAMPLE"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-2xs"
            />
          </div>

          {/* Secret Access Key */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>AWS Secret Access Key</span>
                <span className="text-rose-500">*</span>
              </span>
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="text-[11px] text-amber-700 hover:text-amber-900 font-bold flex items-center gap-1 cursor-pointer"
              >
                {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showSecret ? 'Hide' : 'Show'}</span>
              </button>
            </label>
            <input
              type={showSecret ? 'text' : 'password'}
              required
              value={config.secretAccessKey}
              onChange={(e) => setConfig({ ...config, secretAccessKey: e.target.value.trim() })}
              placeholder="e.g. wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-2xs"
            />
          </div>

          {/* S3 Bucket Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-slate-500" />
              <span>S3 Bucket Name</span>
            </label>
            <input
              type="text"
              value={config.bucket}
              onChange={(e) => setConfig({ ...config, bucket: e.target.value.trim() })}
              placeholder="bhakti-ananda-photos"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-2xs"
            />
          </div>

          {/* AWS Region */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-slate-500" />
              <span>AWS Region</span>
            </label>
            <input
              type="text"
              value={config.region}
              onChange={(e) => setConfig({ ...config, region: e.target.value.trim() })}
              placeholder="ap-south-1 (Mumbai)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-2xs"
            />
          </div>

          {/* Amplify Webhook URL */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-slate-500" />
              <span>AWS Amplify Incoming Webhook URL (Optional for CDN Auto-refresh)</span>
            </label>
            <input
              type="url"
              value={config.amplifyWebhookUrl || ''}
              onChange={(e) => setConfig({ ...config, amplifyWebhookUrl: e.target.value.trim() })}
              placeholder="https://webhooks.amplify.ap-south-1.amazonaws.com/prod/webhooks?..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-2xs"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !config.accessKeyId || !config.secretAccessKey}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin text-amber-600' : ''}`} />
              <span>{testing ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="px-3 py-2 rounded-xl text-slate-500 hover:text-amber-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showHelp ? 'Hide Guide' : 'Setup Help'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save & Connect AWS S3'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* IAM / S3 Help Guide Accordion */}
      {showHelp && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 space-y-3 animate-in fade-in">
          <h4 className="font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>How to get AWS S3 Credentials (କ୍ରେଡେନ୍ସିଆଲ୍ କିପରି ପାଇବେ):</span>
          </h4>
          <ol className="list-decimal pl-5 space-y-1.5 text-slate-600">
            <li>Log into your <strong>AWS Management Console</strong> (<a href="https://console.aws.amazon.com" target="_blank" rel="noopener noreferrer" className="text-amber-700 underline font-semibold">console.aws.amazon.com</a>).</li>
            <li>Go to <strong>IAM &rarr; Users &rarr; Create User</strong> (e.g. name: <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">bhakti-s3-admin</code>).</li>
            <li>Attach the policy: <strong>AmazonS3FullAccess</strong>.</li>
            <li>In the user page, open <strong>Security credentials &rarr; Create access key</strong>.</li>
            <li>Choose <strong>Application running outside AWS</strong>.</li>
            <li>Copy the <strong>Access Key ID</strong> and <strong>Secret Access Key</strong> and paste them above!</li>
            <li>
              Ensure your S3 bucket <strong>CORS configuration</strong> allows <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">PUT, POST, GET</code> from <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">*</code>.
            </li>
          </ol>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-100">
      {content}
    </div>
  );
};
export default AdminAwsSettings;
