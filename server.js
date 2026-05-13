import express from "express";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Serve static files from root
  app.use(express.static("."));
  app.get("/api/stocks/yahoo-jp/:symbol", async (req, res) => {
    const { symbol } = req.params;
    console.log(`Route hit for symbol: ${symbol}`);
    
    // Map symbol to Yahoo Japan Finance ticker format if needed
    if (symbol === "998407.O") {
        const encodedSymbol = encodeURIComponent("^N225");
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSymbol}?interval=1m&range=1d`;
        try {
            const response = await axios.get(url);
            const result = response.data.chart.result[0];
            const meta = result.meta;
            res.json({
                symbol: "998407.O",
                name: "日経平均",
                price: meta.regularMarketPrice,
                change: meta.regularMarketPrice - meta.previousClose,
                changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
                currency: meta.currency,
                url: `https://finance.yahoo.com/quote/%5EN225`
            });
            return;
        } catch (error) {
            console.error("Global API Error for 998407.O:", error.message);
            res.status(500).json({ error: "Failed to fetch index data" });
            return;
        }
    }

    const targetSymbol = symbol;
    const url = `https://finance.yahoo.co.jp/quote/${encodeURIComponent(targetSymbol)}`;
    
    try {
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
      });
      const $ = cheerio.load(response.data);
      
      // Attempt to extract from __PRELOADED_STATE__
      let preloadedState = null;
      const match = response.data.match(/window\.__PRELOADED_STATE__\s*=\s*({.*?});/s);
      if (match && match[1]) {
          try {
              preloadedState = JSON.parse(match[1]);
          } catch(e) {
              console.error("Error parsing preloaded state", e);
          }
      }

      const priceText = 
        (preloadedState && preloadedState.mainDomesticIndexPriceBoard ? preloadedState.mainDomesticIndexPriceBoard.indexPrices.price : null) ||
        $(".StyledNumber__value__3rXW").first().text() ||
        $("[data-test='price-value']").text() ||
        $("dt:contains('現在値') + dd span").text() || 
        $("._3P79ux_L").first().text() || 
        $("._388SshBy").first().text() || 
        $("div[class*='StyledQuoteSummary__price']").first().text() ||
        $("span[class*='Price__price']").text();
      
      const price = priceText;

      const change = 
        (preloadedState && preloadedState.mainDomesticIndexPriceBoard ? preloadedState.mainDomesticIndexPriceBoard.indexPrices.changePrice : null) ||
        $("._1562i4l-").first().text() ||
        $("[data-test='price-change']").text() ||
        $("[class*='StyledQuoteSummary__change']").first().text();

      const name = 
        $("._10Y-G_fU").text() ||
        $("[class*='StyledQuoteSummary__title']").text() ||
        $("h1").first().text();

      const fallbackPrice = $("div[class*='StyledQuoteSummary__price']").text();
      
      const cleanPrice = (price || fallbackPrice || "0").replace(/[¥円,]/g, '').trim();
      const changeText = change || "0";
      
      const changeMatch = changeText.match(/([+-]?[\d,.]+)/);
      const percentMatch = changeText.match(/\(([+-]?[\d,.]+)%\)/);

      const cleanChange = changeMatch ? changeMatch[1].replace(/,/g, '') : "0";
      const cleanPercent = percentMatch ? percentMatch[1].replace(/,/g, '') : "0";

      res.json({
        symbol,
        name: name || "Unknown",
        price: parseFloat(cleanPrice) || 0,
        change: parseFloat(cleanChange) || 0,
        changePercent: parseFloat(cleanPercent) || 0,
        currency: "JPY",
        url
      });
    } catch (error) {
      console.error("Yahoo JP Scrape Error:", error.message, error.response ? error.response.status : '');
      res.status(500).json({ error: "Failed to fetch Yahoo Japan data", details: error.message });
    }
  });

  // API Route: Get Yahoo Finance (Global) data
  app.get("/api/stocks/yahoo-finance/:symbol", async (req, res) => {
    const { symbol } = req.params;
    const encodedSymbol = encodeURIComponent(symbol);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSymbol}?interval=1m&range=1d`;

    try {
      const response = await axios.get(url);
      const result = response.data.chart.result[0];
      const meta = result.meta;

      res.json({
        symbol: meta.symbol,
        name: meta.symbol,
        price: meta.regularMarketPrice,
        change: meta.regularMarketPrice - meta.previousClose,
        changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
        currency: meta.currency,
        url: `https://finance.yahoo.com/quote/${encodedSymbol}`
      });
    } catch (error) {
      try {
        const scrapeUrl = `https://finance.yahoo.com/quote/${encodedSymbol}`;
        const response = await axios.get(scrapeUrl, {
           headers: { "User-Agent": "Mozilla/5.0" }
        });
        const $ = cheerio.load(response.data);
        const price = $("fin-streamer[data-test='qsp-price']").attr("value") || $("fin-streamer[data-field='regularMarketPrice']").attr("value");
        const change = $("fin-streamer[data-field='regularMarketChange']").attr("value");

        res.json({
          symbol,
          price: parseFloat(price || "0"),
          change: parseFloat(change || "0"),
          currency: symbol.endsWith(".T") ? "JPY" : "USD",
          url: scrapeUrl
        });
      } catch (scrapeError) {
        console.error("Yahoo Finance Scrape Error:", scrapeError);
        res.status(500).json({ error: "Failed to fetch Yahoo Finance data" });
      }
    }
  });

  app.get("*", (req, res) => {
    res.sendFile(path.join(process.cwd(), "index.html"));
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
