const https = require('https');
const fs = require('fs');
const path = require('path');

// RSS Feeds list targeting the requested sources
const FEEDS = [
  {
    name: "Türkiye Cumhuriyeti Resmî Gazete",
    url: "https://news.google.com/rss/search?q=\"resmi+gazete\"&hl=tr&gl=TR&ceid=TR:tr",
    category: "Resmî Gazete"
  },
  {
    name: "TCMB",
    url: "https://www.tcmb.gov.tr/wps/wcm/connect/tcmb+tr/tcmb+tr/rss/duyurular",
    category: "Finans ve Ekonomi"
  },
  {
    // Search query mapping Reuters World, AP News, NATO, AB, BM for Geopolitics
    name: "Reuters World & AP News (Jeopolitik)",
    url: "https://news.google.com/rss/search?q=jeopolitik+diplomasi+NATO+BM+AB&hl=tr&gl=TR&ceid=TR:tr",
    category: "Uluslararası İlişkiler"
  },
  {
    // Search query mapping Reuters Markets, FT, IMF, World Bank, Fed, ECB
    name: "Reuters Markets & Financial Times (Ekonomi)",
    url: "https://news.google.com/rss/search?q=ekonomi+finans+Fed+ECB+hazine+borsa&hl=tr&gl=TR&ceid=TR:tr",
    category: "Finans ve Ekonomi"
  }
];

// Helper to fetch URL content natively in CommonJS Node
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { resolve(data); });
    }).on('error', (err) => { reject(err); });
  });
}

// Custom lightweight XML/RSS parser to avoid external npm dependencies
function parseRss(xmlText, defaultCategory, defaultSource) {
  const items = [];
  const matches = xmlText.matchAll(/<item>([\s\S]*?)<\/item>/g);
  
  for (const match of matches) {
    const content = match[1];
    
    // Extract title, description/body, and pubDate
    const titleMatch = content.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || content.match(/<title>([\s\S]*?)<\/title>/);
    const descMatch = content.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || content.match(/<description>([\s\S]*?)<\/description>/);
    const pubDateMatch = content.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    
    if (titleMatch) {
      // Decode HTML entities a bit
      let title = titleMatch[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
      let body = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim() : "";
      let pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();
      
      // Determine specific subType for Resmi Gazete
      let subType = "Genel";
      if (defaultCategory === "Resmî Gazete") {
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes("atama")) subType = "Personel Ataması";
        else if (lowerTitle.includes("ilan")) subType = "Akademik İlan";
        else if (lowerTitle.includes("karar")) subType = "Cumhurbaşkanlığı Kararı";
        else if (lowerTitle.includes("yönetmelik")) subType = "Yönetmelik";
        else if (lowerTitle.includes("tebliğ")) subType = "Tebliğ";
        else if (lowerTitle.includes("mahkeme")) subType = "Mahkeme Kararı";
      }

      items.push({
        source: defaultSource,
        title,
        body: body || title,
        category: defaultCategory,
        subType,
        timestamp: new Date(pubDate).toISOString()
      });
    }
  }
  
  return items;
}

// Local pre-filtering logic to avoid sending obviously irrelevant items to AI
function isItemPotentiallyRelevant(item) {
  if (item.category !== "Resmî Gazete") return true; // Always analyze geopolitics and finance news
  
  const relevantKeywords = [
    "ithalat", "ihracat", "vergi", "faiz", "gümrük", "karar sayısı", "tarife", 
    "enerji", "yatırım", "finans", "banka", "tahvil", "kamu ihale", "anlaşma", "protokol",
    "yönetmelik", "tebliğ", "hukuk", "karar", "mahkeme", "anayasa", "iptal", "disiplin", "okul"
  ];
  
  const text = (item.title + " " + item.body).toLowerCase();
  return relevantKeywords.some(keyword => text.includes(keyword));
}

// Call Gemini API with Structured JSON Schema output
function callGemini(apiKey, promptText) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            date: { type: "STRING" },
            events: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  source: { type: "STRING" },
                  title: { type: "STRING" },
                  body: { type: "STRING" },
                  category: { type: "STRING" },
                  subType: { type: "STRING" },
                  timestamp: { type: "STRING" },
                  isRelevant: { type: "BOOLEAN" },
                  analysis: {
                    type: "OBJECT",
                    properties: {
                      summary: { type: "STRING" },
                      geopoliticalImpact: { type: "STRING" },
                      turkeyImpact: { type: "STRING" },
                      financialImpact: { type: "STRING" },
                      longTerm: { type: "STRING" },
                      isCritical: { type: "BOOLEAN" },
                      whyImportant: { type: "STRING" },
                      whoAffected: { type: "STRING" },
                      followUp: { type: "STRING" }
                    },
                    required: ["summary", "geopoliticalImpact", "turkeyImpact", "financialImpact", "longTerm", "isCritical"]
                  }
                },
                required: ["source", "title", "body", "category", "isRelevant"]
              }
            }
          },
          required: ["date", "events"]
        },
        maxOutputTokens: 8192
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts[0]) {
            resolve(JSON.parse(json.candidates[0].content.parts[0].text));
          } else {
            reject(new Error("Gemini API call failed: " + JSON.stringify(json)));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => { reject(e); });
    req.write(postData);
    req.end();
  });
}

// Main function
async function run() {
  const apiKey = process.env.GEM
