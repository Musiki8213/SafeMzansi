import { useState, useEffect } from 'react';
import { X, Server, CheckCircle, AlertCircle } from 'lucide-react';
import { setApiBaseUrl, getCurrentApiUrl } from '../utils/api';
import toast from 'react-hot-toast';

function ApiConfigModal({ onClose, onConfigured }) {
  const [apiUrl, setApiUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    // Load current URL if exists
    const current = getCurrentApiUrl();
    if (current && !current.includes('localhost')) {
      setApiUrl(current);
    }
  }, []);

  const handleTest = async () => {
    if (!apiUrl.trim()) {
      toast.error('Please enter an API URL');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      let testUrl = apiUrl.trim().replace(/\/$/, ''); // Remove trailing slash
      
      // If URL doesn't end with /api, add it
      if (!testUrl.endsWith('/api')) {
        testUrl = `${testUrl}/api`;
      }
      
      // Test the base API endpoint
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      // Even if it fails, if we get a response, the server is reachable
      if (response.status === 400 || response.status === 401 || response.status === 500) {
        // Server is reachable (these are expected errors)
        setTestResult({ success: true, message: 'Server is reachable!' });
      } else if (response.ok) {
        setTestResult({ success: true, message: 'Server is reachable!' });
      } else {
        setTestResult({ success: true, message: 'Server responded (connection works)' });
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: 'Cannot connect to server. Check URL and ensure server is running.' 
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (!apiUrl.trim()) {
      toast.error('Please enter an API URL');
      return;
    }

    const url = apiUrl.trim().replace(/\/$/, ''); // Remove trailing slash
    if (!url.endsWith('/api')) {
      // Auto-add /api if not present
      setApiBaseUrl(`${url}/api`);
    } else {
      setApiBaseUrl(url);
    }

    toast.success('API URL configured!');
    if (onConfigured) {
      onConfigured();
    }
    onClose();
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X className="w-5 h-5" style={{ color: '#666' }} />
        </button>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Server className="w-6 h-6" style={{ color: '#007A4D' }} />
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#1D3557' }}>
              Configure API Server
            </h2>
          </div>
          <p style={{ color: '#666', fontSize: '0.9375rem', marginTop: '0.5rem' }}>
            Enter your backend server URL to connect the app.
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '600', 
            color: '#374151',
            fontSize: '0.9375rem'
          }}>
            API Server URL
          </label>
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="http://192.168.1.100:5000/api or https://your-backend.vercel.app/api"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '0.9375rem',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#007A4D'}
            onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
          />
          <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6B7280' }}>
            <p style={{ margin: '0.25rem 0' }}>• For local testing: Use your computer's IP (e.g., http://192.168.1.100:5000/api)</p>
            <p style={{ margin: '0.25rem 0' }}>• For production: Use your deployed backend URL</p>
            <p style={{ margin: '0.25rem 0' }}>• Find your IP: Windows (ipconfig) or Mac/Linux (ifconfig)</p>
          </div>
        </div>

        {testResult && (
          <div style={{
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            backgroundColor: testResult.success ? '#D1FAE5' : '#FEE2E2',
            border: `1px solid ${testResult.success ? '#10B981' : '#EF4444'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {testResult.success ? (
              <CheckCircle className="w-5 h-5" style={{ color: '#10B981' }} />
            ) : (
              <AlertCircle className="w-5 h-5" style={{ color: '#EF4444' }} />
            )}
            <span style={{ 
              color: testResult.success ? '#065F46' : '#991B1B',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              {testResult.message}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleTest}
            disabled={testing || !apiUrl.trim()}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              border: '1px solid #D1D5DB',
              borderRadius: '8px',
              fontSize: '0.9375rem',
              fontWeight: '600',
              cursor: testing || !apiUrl.trim() ? 'not-allowed' : 'pointer',
              opacity: testing || !apiUrl.trim() ? 0.5 : 1,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!testing && apiUrl.trim()) {
                e.target.style.backgroundColor = '#E5E7EB';
              }
            }}
            onMouseLeave={(e) => {
              if (!testing && apiUrl.trim()) {
                e.target.style.backgroundColor = '#F3F4F6';
              }
            }}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          <button
            onClick={handleSave}
            disabled={!apiUrl.trim()}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: '#007A4D',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9375rem',
              fontWeight: '600',
              cursor: !apiUrl.trim() ? 'not-allowed' : 'pointer',
              opacity: !apiUrl.trim() ? 0.5 : 1,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => {
              if (apiUrl.trim()) {
                e.target.style.backgroundColor = '#006B44';
              }
            }}
            onMouseLeave={(e) => {
              if (apiUrl.trim()) {
                e.target.style.backgroundColor = '#007A4D';
              }
            }}
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApiConfigModal;

