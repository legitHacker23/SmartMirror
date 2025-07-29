import React, { useEffect, useState } from 'react';
import { getStockPrice, getMultipleStockPrices } from '../apiHandlers/stocksapi';

const CreateStocks = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if market is open (9:30 AM - 4:00 PM ET, Monday-Friday)
  const isMarketOpen = () => {
    const now = new Date();
    const etTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    
    const dayOfWeek = etTime.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = etTime.getHours();
    const minute = etTime.getMinutes();
    const currentTime = hour * 100 + minute; // Convert to HHMM format
    
    // Market is closed on weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }
    
    // Market hours: 9:30 AM (930) to 4:00 PM (1600) ET
    return currentTime >= 930 && currentTime <= 1600;
  };

  // Get next market open time
  const getNextMarketOpen = () => {
    const now = new Date();
    const etTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    
    const dayOfWeek = etTime.getDay();
    const hour = etTime.getHours();
    const minute = etTime.getMinutes();
    const currentTime = hour * 100 + minute;
    
    let nextOpen = new Date(etTime);
    
    // If it's weekend, go to next Monday
    if (dayOfWeek === 0) { // Sunday
      nextOpen.setDate(etTime.getDate() + 1); // Monday
    } else if (dayOfWeek === 6) { // Saturday
      nextOpen.setDate(etTime.getDate() + 2); // Monday
    } else if (currentTime >= 1600) { // After market close
      nextOpen.setDate(etTime.getDate() + 1); // Next day
    }
    
    // Set to 9:30 AM ET
    nextOpen.setHours(9, 30, 0, 0);
    
    return nextOpen;
  };

  useEffect(() => {
    async function fetchStocks() {
      try {
        setLoading(true);
        setError(null);
        
        const stockData = await getStockPrice('SPY');
        setStocks([stockData]);
        setError(null); // Clear any previous market closed message
      } catch (err) {
        console.error('Stocks fetch error:', err);
        setError('Failed to fetch stock data');
        setStocks([]);
      } finally {
        setLoading(false);
      }
    }
    
    // Always fetch on initial load to get the most recent price
    fetchStocks();
    
    // Set up interval for market hours only
    const interval = setInterval(() => {
      if (isMarketOpen()) {
        fetchStocks();
      } else {
        // When market is closed, just show the market closed indicator
        // but keep the existing stock data
        setError('Market Closed');
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'N/A';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Format large numbers
  const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) {
      return 'N/A';
    }
    if (num >= 1e9) {
      return (num / 1e9).toFixed(1) + 'B';
    } else if (num >= 1e6) {
      return (num / 1e6).toFixed(1) + 'M';
    } else if (num >= 1e3) {
      return (num / 1e3).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Get change color based on positive/negative change
  const getChangeColor = (change) => {
    if (change === null || change === undefined || isNaN(change)) {
      return '#FFC107'; // Yellow for no data
    }
    if (change > 0) return '#4CAF50'; // Green for positive
    if (change < 0) return '#F44336'; // Red for negative
    return '#FFC107'; // Yellow for no change
  };

  // Get change icon
  const getChangeIcon = (change) => {
    if (change === null || change === undefined || isNaN(change)) {
      return '→';
    }
    if (change > 0) return '↗';
    if (change < 0) return '↘';
    return '→';
  };

  if (loading) {
    return (
      <div className="stocks-container">
        <h2>Stock Market</h2>
        <p>Loading stock data...</p>
      </div>
    );
  }

  return (
    <div className="stocks-container">
      <h2>Stock Market</h2>
      
      {error && error !== 'Market Closed' && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      {error === 'Market Closed' && (
        <div className="market-closed-indicator">
          <span className="market-status-dot"></span>
          <span className="market-status-text">Market Closed</span>
        </div>
      )}
      
              <div className="stock-data-container">
          {stocks.map((stock, index) => (
            <div key={stock.symbol} className="stock-item">
              <div className="stock-symbol-name">{stock.symbol}</div>
              <div className="stock-current-price">{formatCurrency(stock.price, stock.currency)}</div>
              <div className="stock-change-info" style={{ color: getChangeColor(stock.change) }}>
                {getChangeIcon(stock.change)} {formatCurrency(Math.abs(stock.change || 0), stock.currency)}
              </div>
              <div className="stock-ohlc">
                <span className="ohlc-item">O {formatCurrency(stock.open, stock.currency)}</span>
                <span className="ohlc-item">H {formatCurrency(stock.high, stock.currency)}</span>
                <span className="ohlc-item">L {formatCurrency(stock.low, stock.currency)}</span>
              </div>
            </div>
          ))}
        </div>
      

    </div>
  );
};

export default CreateStocks; 