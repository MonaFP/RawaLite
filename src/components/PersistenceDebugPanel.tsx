// Debug Component für Persistence-Tests
import {useState, useEffect } from 'react';
import { useCustomers } from '../hooks/useCustomers';

export function PersistenceDebugPanel() {
  const { customers, createCustomer, loading } = useCustomers();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestLog = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const refreshDebugInfo = () => {
    if ((window as any).rawaliteDebug) {
      const info = (window as any).rawaliteDebug.getDatabaseInfo();
      setDebugInfo(info);
      addTestLog(`Debug info: DB=${info.hasDB}, Electron=${info.isElectronMode}, LSSize=${info.lsSize}`);
    }
  };

  const testCreateCustomer = async () => {
    try {
      addTestLog('Creating test customer...');
      await createCustomer({
        name: `Test Customer ${Date.now()}`,
        email: 'test@example.com',
        city: 'Test Stadt'
      });
      addTestLog('✅ Customer created successfully');
      
      // Trigger manual save
      if ((window as any).rawaliteDebug) {
        await (window as any).rawaliteDebug.saveDatabase();
        addTestLog('✅ Manual database save triggered');
      }
      
      refreshDebugInfo();
    } catch (error) {
      addTestLog(`❌ Error creating customer: ${error}`);
    }
  };

  const testPersistence = () => {
    addTestLog('Testing localStorage persistence...');
    const lsData = localStorage.getItem('rawalite.db');
    if (lsData) {
      addTestLog(`✅ LocalStorage data found: ${lsData.length} characters`);
      addTestLog(`✅ Base64 data sample: ${lsData.substring(0, 50)}...`);
    } else {
      addTestLog('❌ No localStorage data found');
    }
  };

  useEffect(() => {
    refreshDebugInfo();
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      width: '400px',
      background: 'white', 
      border: '1px solid #ccc', 
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      fontSize: '12px',
      zIndex: 9999,
      maxHeight: '80vh',
      overflow: 'auto'
    }}>
      <h3>🔧 Persistence Debug Panel</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Database Status:</strong><br/>
        {debugInfo && (
          <>
            • DB Initialized: {debugInfo.hasDB ? '✅' : '❌'}<br/>
            • Electron Mode: {debugInfo.isElectronMode ? '✅' : '❌'}<br/>
            • LocalStorage Size: {debugInfo.lsSize} chars<br/>
          </>
        )}
        • Total Customers: {customers.length}<br/>
        • Loading: {loading ? '⏳' : '✅'}<br/>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={testCreateCustomer}
          style={{ marginRight: '5px', padding: '5px 10px', fontSize: '11px' }}
        >
          Create Test Customer
        </button>
        <button 
          onClick={testPersistence}
          style={{ marginRight: '5px', padding: '5px 10px', fontSize: '11px' }}
        >
          Check Persistence
        </button>
        <button 
          onClick={refreshDebugInfo}
          style={{ padding: '5px 10px', fontSize: '11px' }}
        >
          Refresh Info
        </button>
      </div>

      <div style={{ 
        background: '#f5f5f5', 
        padding: '8px', 
        borderRadius: '4px',
        maxHeight: '200px',
        overflow: 'auto',
        fontSize: '10px'
      }}>
        <strong>Test Log:</strong><br/>
        {testResults.map((result, i) => (
          <div key={i}>{result}</div>
        ))}
      </div>
    </div>
  );
}
