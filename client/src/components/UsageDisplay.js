import React, { useState, useEffect } from 'react';
import { getUsageStats } from '../apiHandlers/gptapi';

function UsageDisplay() {
  const [usage, setUsage] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateUsage = () => {
      const stats = getUsageStats();
      setUsage(stats);
    };

    // Update usage immediately
    updateUsage();

    // Update usage every 30 seconds
    const interval = setInterval(updateUsage, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!usage) return null;

  const getUsageColor = () => {
    if (usage.usagePercentage >= 90) return '#ff4444';
    if (usage.usagePercentage >= 70) return '#ffaa00';
    return '#44ff44';
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 1000,
      cursor: 'pointer',
      minWidth: '200px'
    }}
    onClick={() => setIsVisible(!isVisible)}
    title="Click to toggle details"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: getUsageColor(),
          flexShrink: 0
        }} />
        <span>API Usage: {usage.dailyRequestCount}/{usage.dailyLimit}</span>
      </div>
      
      {isVisible && (
        <div style={{ marginTop: '8px', fontSize: '11px' }}>
          <div>Remaining: {usage.remaining} requests</div>
          <div>Usage: {usage.usagePercentage.toFixed(1)}%</div>
          <div style={{ 
            width: '100%', 
            height: '4px', 
            background: '#333', 
            borderRadius: '2px',
            marginTop: '4px'
          }}>
            <div style={{
              width: `${Math.min(usage.usagePercentage, 100)}%`,
              height: '100%',
              background: getUsageColor(),
              borderRadius: '2px',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default UsageDisplay; 