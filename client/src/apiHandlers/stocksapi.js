import axios from 'axios';

// Yahoo Finance API configuration
// Using Yahoo Finance API through RapidAPI for better reliability
const RAPIDAPI_KEY = '08143d6bf3msh54252425f7f1584p139f69jsn6242cef06d32'; // You'll need to get this from RapidAPI
const RAPIDAPI_HOST = 'yahoo-finance15.p.rapidapi.com';
const BASE_URL = 'https://yahoo-finance15.p.rapidapi.com/api/yahoo';

export async function getStockPrice(symbol = 'AAPL') {
  try {
    // Try Yahoo Finance first (if API key is available)
    if (RAPIDAPI_KEY !== 'YOUR_RAPIDAPI_KEY') {
      return await getYahooFinanceData(symbol);
    }
    
    // Fallback to Alpha Vantage
    return await getAlphaVantageData(symbol);
  } catch (error) {
    console.error('Error fetching stock data:', error);
    throw error;
  }
}

async function getYahooFinanceData(symbol) {
  const options = {
    method: 'GET',
    url: `https://yahoo-finance15.p.rapidapi.com/api/yahoo/qu/quote/${symbol}`,
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST
    }
  };

  const response = await axios.request(options);
  const data = response.data;
  
  console.log('Yahoo Finance API Response:', data);
  
  // The API returns data in body[0] array
  const stockData = data.body[0];
  
  return {
    symbol: stockData.symbol,
    price: stockData.regularMarketPrice,
    change: stockData.regularMarketChange,
    changePercent: stockData.regularMarketChangePercent,
    previousClose: stockData.regularMarketPreviousClose,
    open: stockData.regularMarketOpen,
    high: stockData.regularMarketDayHigh,
    low: stockData.regularMarketDayLow,
    volume: stockData.regularMarketVolume,
    marketCap: stockData.marketCap,
    companyName: stockData.longName || stockData.shortName,
    currency: stockData.currency,
    exchange: stockData.fullExchangeName,
    timestamp: new Date().toISOString()
  };
}

async function getAlphaVantageData(symbol) {
  const response = await axios.get(ALPHA_VANTAGE_URL, {
    params: {
      function: 'GLOBAL_QUOTE',
      symbol: symbol,
      apikey: ALPHA_VANTAGE_KEY
    }
  });

  const data = response.data['Global Quote'];
  
  if (!data) {
    throw new Error('No data received from Alpha Vantage API');
  }

  return {
    symbol: data['01. symbol'],
    price: parseFloat(data['05. price']),
    change: parseFloat(data['09. change']),
    changePercent: parseFloat(data['10. change percent'].replace('%', '')),
    previousClose: parseFloat(data['08. previous close']),
    open: parseFloat(data['02. open']),
    high: parseFloat(data['03. high']),
    low: parseFloat(data['04. low']),
    volume: parseInt(data['06. volume']),
    companyName: symbol, // Alpha Vantage doesn't provide company name in this endpoint
    currency: 'USD',
    exchange: 'Unknown',
    timestamp: new Date().toISOString()
  };
}

// Get multiple stock prices at once
export async function getMultipleStockPrices(symbols = ['AAPL', 'GOOGL', 'MSFT']) {
  try {
    const promises = symbols.map(symbol => getStockPrice(symbol));
    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Failed to fetch ${symbols[index]}:`, result.reason);
        return {
          symbol: symbols[index],
          error: 'Failed to fetch data',
          price: 0,
          change: 0,
          changePercent: 0
        };
      }
    });
  } catch (error) {
    console.error('Error fetching multiple stock prices:', error);
    throw error;
  }
}

 