const https = require('https');
const fs = require('fs');
const path = require('path');

// RSS Feeds list targeting the requested sources with strictly 24-hour time-bound queries
const FEEDS = [
  {
    name: "Türkiye Cumhuriyeti Resmî Gazete",
    query: '("resmi gazete" OR "cumhurbaşkanlığı kararı" OR "yönetmelik" OR "tebliğ" OR "anayasa mahkemesi") when:1d',
    category: "Resmî Gazete"
  },
  {
    name: "TCMB",
    query: '(site:tcmb.gov.tr OR "merkez bankası" OR "para politikası") when:1d',
    category: "Finans ve Ekonomi"
  },
  {
    name: "Reuters World & AP News (Jeopolitik)",
    query: '(jeopolitik OR diplomasi OR "dış politika" OR "savunma sanayii" OR NATO OR "birleşmiş milletler" OR "doğu akdeniz") when:1d',
    category: "Uluslararası İlişkiler"
  },
  {
    name: "Reuters Markets & Financial Times (Ekonomi)",
    query: '(ekonomi OR finans OR enflasyon OR "para politikası" OR hazine OR borsa OR IMF OR "dünya bankası" OR Fed OR ECB) when:1d',
    category: "Finans ve Ekonomi"
  }
];

// Helper to decode standard and numerical HTML entities in RSS feeds
function decodeHtmlEntities(str) {
  if (!str) return "";
  return str
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&ouml;/g, 'ö')
    .replace(/&Ouml;/g, 'Ö')
    .replace(/&uuml;/g, 'ü')
    .replace(/&Uuml;/g, 'Ü')
    .replace(/&ccedil;/g, 'ç')
    .replace(/&Ccedil;/g, 'Ç')
    .replace(/&gbreve;/g, 'ğ')
    .replace(/&Gbreve;/g, 'Ğ')
    .replace(/&scedil;/g, 'ş')
    .replace(/&Scedil;/g, 'Ş')
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// Helper to fetch URL content natively in CommonJS Node, supporting HTTP redirects
function fetchUrl(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    const get = (targetUrl, depth) => {
      if (depth > maxRedirects) {
        reject(new Error("Too many redirects"));
        return;
      }
      https.get(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          let nextUrl = res.headers.location;
          if (nextUrl.startsWith('/')) {
            const parsedUrl = new URL(targetUrl);
            nextUrl = `${parsedUrl.protocol}//${parsedUrl.host}${nextUrl}`;
          }
          get(nextUrl, depth + 1);
          return;
        }
        
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP status code ${res.statusCode}`));
          return;
        }
        
        res.setEncoding('utf8');
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => { resolve(data); });
      }).on('error', (err) => { reject(err); });
    };
    get(url, 0);
  });
}

// Custom lightweight XML/RSS parser with strict 28-hour publication age cutoff
function parseRss(xmlText, defaultCategory, defaultSource) {
  const items = [];
  const matches = xmlText.matchAll(/<item>([\s\S]*?)<\/item>/g);
  const now = Date.now();
  const MAX_AGE_MS = 28 * 60 * 60 * 1000; // 28 hours max to strictly eliminate stale news from previous days
  
  for (const match of matches) {
    const content = match[1];
    
    const titleMatch = content.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || content.match(/<title>([\s\S]*?)<\/title>/);
    const descMatch = content.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || content.match(/<description>([\s\S]*?)<\/description>/);
    const pubDateMatch = content.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const linkMatch = content.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/) || content.match(/<link>([\s\S]*?)<\/link>/);
    
    if (titleMatch) {
      let title = decodeHtmlEntities(titleMatch[1].replace(/<[^>]*>/g, '').trim());
      let body = descMatch ? decodeHtmlEntities(descMatch[1].replace(/<[^>]*>/g, '').trim()) : "";
      let pubDate = pubDateMatch ? new Date(pubDateMatch[1].trim()) : new Date();
      
      // Strict date check: drop anything older than 28 hours
      if (!isNaN(pubDate.getTime()) && (now - pubDate.getTime()) > MAX_AGE_MS) {
        continue;
      }
      
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
        timestamp: !isNaN(pubDate.getTime()) ? pubDate.toISOString() : new Date().toISOString(),
        link: linkMatch ? linkMatch[1].trim() : ""
      });
    }
  }
  
  return items;
}

// Turkish NLP Stop words for semantic keyword extraction
const STOP_WORDS = new Set([
  "ve", "ile", "bir", "bu", "da", "de", "için", "olan", "olarak", "sonra", "kadar", "göre", 
  "daha", "çok", "en", "ne", "var", "yok", "ama", "fakat", "lakin", "ancak", "veya", "ya", 
  "resmi", "gazete", "gazetede", "gazetesinde", "yayımlandı", "yayınlandı", "açıkladı", "etti",
  "dair", "ilişkin", "hakkında", "kararı", "sayılı", "maddesi", "tarafından", "haber", "son",
  "dakika", "yeni", "belli", "oldu", "duyuruldu", "geldi", "açıklama", "karar", "tarihinde",
  "güncel", "bülten", "rapor", "sayısı", "başkanı", "bakanlığı", "bakanı", "kararları", "günü",
  "temmuz", "ağustos", "eylül", "ekim", "kasım", "aralık", "ocak", "şubat", "mart", "nisan", "mayıs", "haziran"
]);

// Turkish verbal/nominal suffix stripper (stemmer)
function stemTurkish(word) {
  if (word.length <= 4) return word;
  const suffixes = [
    /^(.*?)(?:lar|ler|da|de|ta|te|dan|den|tan|ten|ın|in|un|ün|nın|nin|nun|nün|a|e|ya|ye|ı|i|u|ü|yı|yi|yu|yü)$/,
    /^(.*?)(?:acak|ecek|ıyor|iyor|uyor|üyor|dı|di|du|dü|tı|ti|tu|tü|mış|miş|muş|müş|ır|ir|ur|ür|ar|er)$/,
    /^(.*?)(?:mak|mek|ma|me|ış|iş|uş|üş|ken|alı|eli|arak|erek|ınca|ince)$/,
    /^(.*?)(?:lık|lik|luk|lük|cı|ci|cu|cü|çı|çi|çu|çü|sız|siz|suz|süz)$/
  ];

  let stemmed = word;
  for (const regex of suffixes) {
    const match = stemmed.match(regex);
    if (match && match[1] && match[1].length >= 3) {
      stemmed = match[1];
    }
  }
  return stemmed;
}

// Clean and normalize text
function cleanText(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/\s*-\s*[^-\s]+(?:\.[a-z]{2,})?\s*$/i, '')
    .replace(/[^a-z0-9ıığüşöç\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract Turkish NLP keyword stems
function getKeywords(text) {
  const words = cleanText(text).split(' ');
  const stems = new Set();
  for (const w of words) {
    if (w.length > 2 && !STOP_WORDS.has(w)) {
      stems.add(stemTurkish(w));
    }
  }
  return stems;
}

// Jaccard similarity between two keyword sets
function getSimilarity(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return intersection / union;
}

// Containment ratio of smaller keyword set inside larger set
function getContainment(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  return intersection / Math.min(setA.size, setB.size);
}

// Semantic clustering and deduplication for news items
function clusterAndDeduplicate(newsList) {
  const clusters = [];

  for (const news of newsList) {
    const text = (news.title || "") + " " + (news.body || "") + " " + ((news.analysis && news.analysis.summary) || "");
    const keywords = getKeywords(text);
    let addedToCluster = false;

    for (const cluster of clusters) {
      const sim = getSimilarity(keywords, cluster.keywords);
      const containment = getContainment(keywords, cluster.keywords);

      // If keywords share >= 30% similarity or >= 45% containment, treat as duplicate coverage of the same event
      if (sim >= 0.30 || containment >= 0.45) {
        cluster.items.push(news);
        for (const kw of keywords) cluster.keywords.add(kw);
        
        // Pick the representative with the richest, most detailed title and body
        const curScore = (news.title || "").length + (news.body || "").length + ((news.analysis && news.analysis.summary) || "").length;
        const bestScore = (cluster.representative.title || "").length + (cluster.representative.body || "").length + ((cluster.representative.analysis && cluster.representative.analysis.summary) || "").length;
        if (curScore > bestScore) {
          cluster.representative = news;
        }
        addedToCluster = true;
        break;
      }
    }

    if (!addedToCluster) {
      clusters.push({
        representative: news,
        keywords: new Set(keywords),
        items: [news]
      });
    }
  }

  return clusters.map(c => c.representative);
}

// Helper to normalize news titles for exact string matching
function getNormalizedTitle(title) {
  if (!title) return "";
  let t = title.toLowerCase();
  t = t.replace(/\s*-\s*[^-\s]+(?:\.[a-z]{2,})?\s*$/i, '');
  t = t.replace(/[^a-z0-9ıığüşöç]/gi, '');
  return t.trim();
}

// Local pre-filtering logic to avoid sending obviously irrelevant items to AI
function isItemPotentiallyRelevant(item) {
  if (item.category !== "Resmî Gazete") return true; // Always analyze geopolitics and finance news
  
  const relevantKeywords = [
    "ithalat", "ihracat", "vergi", "faiz", "gümrük", "karar sayısı", "tarife", 
    "enerji", "yatırım", "finans", "banka", "tahvil", "kamu ihale", "anlaşma", "protokol",
    "yönetmelik", "tebliğ", "hukuk", "karar", "mahkeme", "anayasa", "iptal", "disiplin", "okul",
    "kamu", "ihale", "asgari", "maaş", "zam", "enflasyon", "parasal", "kredi", "mevduat",
    "kararname", "yargı", "adliye", "ceza", "tazminat", "tüzük"
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
                  link: { type: "STRING" },
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
                    required: ["summary", "geopoliticalImpact", "turkeyImpact", "financialImpact", "longTerm", "isCritical", "whyImportant", "whoAffected", "followUp"]
                  }
                },
                required: ["source", "title", "body", "category", "subType", "timestamp", "isRelevant", "analysis", "link"]
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
      res.setEncoding('utf8'); // Decode Gemini API response as UTF-8 stream
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts[0]) {
            const rawText = json.candidates[0].content.parts[0].text;
            
            try {
              // Strip markdown wrapper ticks if Gemini accidentally outputs them
              let cleanedText = rawText.trim();
              if (cleanedText.startsWith("```json")) {
                cleanedText = cleanedText.substring(7);
              } else if (cleanedText.startsWith("```")) {
                cleanedText = cleanedText.substring(3);
              }
              if (cleanedText.endsWith("```")) {
                cleanedText = cleanedText.substring(0, cleanedText.length - 3);
              }
              cleanedText = cleanedText.trim();
              
              resolve(JSON.parse(cleanedText));
            } catch (parseErr) {
              console.error("HATA: Gemini yanıtı geçerli bir JSON formatında değil!");
              console.error("Ham yanıt uzunluğu:", rawText.length);
              console.error("Ham yanıt başı (ilk 300 karakter):", rawText.substring(0, 300));
              console.error("Ham yanıt sonu (son 300 karakter):", rawText.substring(Math.max(0, rawText.length - 300)));
              reject(new Error(`Gemini JSON Ayrıştırma Hatası: ${parseErr.message}`));
            }
            
          } else {
            reject(new Error("Gemini API call failed: " + JSON.stringify(json)));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => { reject(e); });
    req.write(postData, 'utf8'); // Ensure explicitly encoded as UTF-8
    req.end();
  });
}

// Send Email via Gmail SMTP Server (Port 465 SSL/TLS) natively in Node.js, supporting multi-line replies
function sendEmail(user, pass, to, subject, html) {
  const tls = require('tls');
  
  // Sanitize email parameters by trimming spaces and stripping quotes
  const cleanUser = user.trim().replace(/['"]/g, '');
  const cleanTo = to.trim().replace(/['"]/g, '');

  return new Promise((resolve, reject) => {
    const socket = tls.connect(465, 'smtp.gmail.com', {}, () => {
      // SMTP Connection established
    });

    let step = 0;
    let buffer = '';

    const send = (cmd) => {
      socket.write(cmd + '\r\n');
    };

    socket.setEncoding('utf8');
    socket.on('data', (data) => {
      buffer += data;

      // Process lines from SMTP socket stream
      while (true) {
        const lineEnd = buffer.indexOf('\n');
        if (lineEnd === -1) break;

        const line = buffer.substring(0, lineEnd).replace(/\r$/, '');
        buffer = buffer.substring(lineEnd + 1);

        const code = line.substring(0, 3);
        const separator = line.charAt(3); // '-' indicates multi-line intermediate, ' ' indicates final line

        // If it's a multi-line intermediate reply, skip processing until we hit the final line
        if (separator === '-') {
          continue;
        }

        // Process only once the final line of the reply is received
        if (step === 0 && code === '220') {
          send('EHLO localhost');
          step = 1;
        } else if (step === 1 && code === '250') {
          send('AUTH LOGIN');
          step = 2;
        } else if (step === 2 && code === '334') {
          // Send base64 username
          send(Buffer.from(cleanUser).toString('base64'));
          step = 3;
        } else if (step === 3 && code === '334') {
          // Send base64 password
          send(Buffer.from(pass).toString('base64'));
          step = 4;
        } else if (step === 4 && code === '235') {
          send(`MAIL FROM:<${cleanUser}>`);
          step = 5;
        } else if (step === 5 && code === '250') {
          send(`RCPT TO:<${cleanTo}>`);
          step = 6;
        } else if (step === 6 && code === '250') {
          send('DATA');
          step = 7;
        } else if (step === 7 && code === '354') {
          const emailData = [
            `From: "AnalizAsistanı" <${cleanUser}>`,
            `To: <${cleanTo}>`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            '',
            html,
            '.'
          ].join('\r\n');
          send(emailData);
          step = 8;
        } else if (step === 8 && code === '250') {
          send('QUIT');
          step = 9;
          socket.end();
          resolve();
        } else if (code.startsWith('4') || code.startsWith('5')) {
          socket.end();
          reject(new Error(`SMTP Error [Step ${step}]: ${line}`));
        }
      }
    });

    socket.on('error', (err) => {
      reject(err);
    });

    socket.on('close', () => {
      if (step < 9) {
        reject(new Error('SMTP Connection closed prematurely'));
      }
    });
  });
}

// Generate premium dark-mode HTML template for daily newsletter (Critical developments only)
function generateHtmlEmail(date, events) {
  const relevantEvents = events.filter(e => e.isRelevant && e.analysis);
  const criticalEvents = relevantEvents.filter(e => e.analysis.isCritical).slice(0, 5);
  
  let criticalHtml = "";
  if (criticalEvents.length > 0) {
    criticalHtml = `
      <div style="background-color: #1a1515; border-left: 4px solid #ef4444; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
        <h3 style="color: #ef4444; margin-top: 0; font-family: sans-serif; font-size: 16px; margin-bottom: 15px;">🚨 Günün Kritik Gelişmeleri</h3>
        <ol style="margin: 0; padding-left: 20px; color: #f8fafc; font-family: sans-serif; font-size: 13px; line-height: 1.6;">
          ${criticalEvents.map(e => `
            <li style="margin-bottom: 15px; border-bottom: 1px dashed rgba(255, 255, 255, 0.08); padding-bottom: 12px;">
              <strong><a href="${e.link || '#'}" style="color: #ef4444; text-decoration: underline; font-size: 14px;">📌 ${e.title}</a></strong>
              <div style="color: #f8fafc; font-size: 12px; margin-top: 6px; background: rgba(255, 255, 255, 0.02); padding: 8px; border-radius: 4px; border: 1px dashed rgba(255, 255, 255, 0.04);">
                <strong>📄 Kısa Özet:</strong> ${e.analysis.summary}
              </div>
              <div style="color: #94a3b8; font-size: 12px; margin-top: 6px;">📌 <strong>Neden Önemli:</strong> ${e.analysis.whyImportant}</div>
              <div style="color: #94a3b8; font-size: 12px;">👥 <strong>Kimleri Etkiliyor:</strong> ${e.analysis.whoAffected}</div>
              <div style="color: #94a3b8; font-size: 12px;">🔍 <strong>Takip Edilecek:</strong> ${e.analysis.followUp}</div>
            </li>
          `).join('')}
        </ol>
      </div>
    `;
  } else {
    criticalHtml = `
      <div style="background-color: #131926; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; text-align: center; color: #94a3b8; font-family: sans-serif; font-size: 13px;">
        📢 Bugün için kritik seviyede sınıflandırılmış özel bir gelişme bulunmamaktadır. Tüm günlük gelişmeleri ve detaylı analizleri web dashboard üzerinden inceleyebilirsiniz.
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Günlük Sabah Bülteni</title>
    </head>
    <body style="background-color: #0b0f17; color: #f8fafc; font-family: sans-serif; padding: 20px; margin: 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #0f1422; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
        
        <!-- Header -->
        <div style="border-bottom: 2px solid rgba(255, 255, 255, 0.08); padding-bottom: 12px; margin-bottom: 20px;">
          <h2 style="color: #f8fafc; margin: 0; font-family: sans-serif; font-size: 18px; font-weight: bold;">
            🧠 AnalizAsistanı Sabah Raporu
          </h2>
          <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 11px;">Tarih: ${date} | Kritik Gelişmeler Bülteni</p>
        </div>

        <!-- Critical Events -->
        ${criticalHtml}

        <!-- Footer -->
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 12px; margin-top: 25px; text-align: center; font-size: 10px; color: #64748b;">
          Bu rapor AnalizAsistanı tarafından otomatik olarak hazırlanmıştır.<br>
          <a href="https://haber-agent.vercel.app" style="color: #06b6d4; text-decoration: none; font-weight: bold;">Canlı Dashboard'u Görüntüle</a>
        </div>

      </div>
    </body>
    </html>
  `;
}

// Main function
async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("HATA: GEMINI_API_KEY ortam değişkeni tanımlı değil!");
    process.exit(1);
  }

  // Load previously processed events from existing data_parsed.json for historical cross-day deduplication
  let historicalEvents = [];
  const historicalKeywordSets = [];
  try {
    const targetPath = path.join(__dirname, 'data_parsed.json');
    if (fs.existsSync(targetPath)) {
      const existingData = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
      if (existingData && Array.isArray(existingData.events)) {
        historicalEvents = existingData.events;
        existingData.events.forEach(event => {
          const text = (event.title || "") + " " + (event.body || "") + " " + ((event.analysis && event.analysis.summary) || "");
          const kw = getKeywords(text);
          if (kw.size > 0) {
            historicalKeywordSets.push(kw);
          }
        });
      }
    }
  } catch (err) {
    console.warn("UYARI: Geçmiş veritabanı okunamadı, tarihsel tekillik kontrolü atlanıyor:", err.message);
  }

  console.log("Haberler ve RSS kaynakları taranıyor (son 24 saat)...");
  let allEvents = [];

  for (const feed of FEEDS) {
    try {
      console.log(`Taranyor: ${feed.name}`);
      const url = "https://news.google.com/rss/search?q=" + encodeURIComponent(feed.query) + "&hl=tr&gl=TR&ceid=TR:tr";
      const xml = await fetchUrl(url);
      const items = parseRss(xml, feed.category, feed.name);
      console.log(`-> ${items.length} taze içerik bulundu.`);
      allEvents = allEvents.concat(items);
    } catch (err) {
      console.error(`HATA: ${feed.name} RSS'i alınamadı:`, err.message);
    }
  }

  if (allEvents.length === 0) {
    console.error("HATA: Hiçbir kaynaktan taze veri alınamadı!");
    process.exit(1);
  }

  // Step 1: Pre-Gemini Semantic Clustering (merges same story from multiple newspapers)
  const preClusteredEvents = clusterAndDeduplicate(allEvents);
  console.log(`İlk tarama: ${allEvents.length} haber -> Farklı ajans/başlık kümeleme sonrası: ${preClusteredEvents.length} özgün haber.`);

  // Step 2: Cross-day Historical Deduplication (drops stories already reported in previous days)
  const freshEvents = [];
  for (const event of preClusteredEvents) {
    const text = (event.title || "") + " " + (event.body || "");
    const eventKeywords = getKeywords(text);
    let isHistoricalDuplicate = false;

    for (const histKw of historicalKeywordSets) {
      const sim = getSimilarity(eventKeywords, histKw);
      const cont = getContainment(eventKeywords, histKw);
      // If 40%+ similar to an event from previous days, treat as already reported
      if (sim >= 0.40 || cont >= 0.60) {
        isHistoricalDuplicate = true;
        break;
      }
    }

    if (!isHistoricalDuplicate) {
      freshEvents.push(event);
    }
  }

  console.log(`Geçmiş günlerle karşılaştırma sonrası kalan taze ve yeni haber sayısı: ${freshEvents.length}`);

  // Split events into potentially relevant (for AI) and irrelevant (direct output)
  const toAnalyze = freshEvents.filter(isItemPotentiallyRelevant);
  const skipped = freshEvents.filter(item => !isItemPotentiallyRelevant(item));

  console.log(`Toplam ${freshEvents.length} özgün içerikten ${toAnalyze.length} adedi Gemini ile analiz edilmek üzere paketleniyor...`);
  
  let analyzedEvents = [];
  const dateToday = new Date().toISOString().substring(0, 10);
  const BATCH_SIZE = 6;

  if (toAnalyze.length > 0) {
    for (let i = 0; i < toAnalyze.length; i += BATCH_SIZE) {
      const batch = toAnalyze.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(toAnalyze.length / BATCH_SIZE);
      
      console.log(`Gemini analizi yapılıyor: Paket ${batchNum} / ${totalBatches} (${batch.length} haber)...`);

      const systemPrompt = `
Sen profesyonel bir jeopolitik, ekonomi, finans ve hukuk analiz asistanısın.

Görevin: Sana sunulan son 24 saatlik haberleri ve resmi duyuruları incele ve kurallara göre analiz et.

Semantik Tekilleştirme Kuralı:
Aynı gelişmeyi veya olayı bildiren çok benzer haberler veya duyurular varsa (farklı ajansların veya kaynakların aynı olayı geçmesi), sadece en detaylı, net ve güncel olanını 'isRelevant': true yap. Diğer mükerrer veya kopya haberleri 'isRelevant': false yaparak kesinlikle ele. Bir haberin veya resmi kararın kopyaları bültende ve mailde kesinlikle yer almamalıdır.

Filtreleme Kuralları:
Aşağıdaki konular dışındaki haberleri 'isRelevant': false olarak işaretle.
- Uluslararası İlişkiler (Dış politika, diplomasi, savaşlar, yaptırımlar, NATO, AB, BM, ABD, Rusya, Çin, Orta Doğu, Türk dış politikası, Savunma sanayii, Enerji güvenliği, Uluslararası ticaret)
- Finans ve Ekonomi (TCMB, Faiz, Enflasyon, Vergi düzenlemeleri, Resmi Gazete'deki ekonomik kararlar, Gümrük mevzuatı, İhracat, İthalat, Borsa İstanbul, Döviz piyasası, Altın, Petrol, CDS, Tahvil)
- Hukuk ve Mevzuat (Emniyet, okul, eğitim veya idari yönetmelikler, kanun değişiklikleri, AYM ve Danıştay kararları, ulusal hukuki reformlar ve anlaşmalar)

Resmî Gazete Kuralları:
Resmî Gazete'deki kararlardan YALNIZCA ekonomi, finans, vergi, bankacılık, ticaret, gümrük, yatırım, kamu ihaleleri, dış ticaret, energy, uluslararası anlaşmalar, cumhurbaşkanlığı kararları, yönetmelik, tebliğ ve hukuki kararları seç.
Önemli yasal reformlar, yönetmelik değişiklikleri (MEB, Emniyet vb.) ve AYM kararlarını 'isRelevant': true yap ve kategorisini 'Hukuk ve Mevzuat' olarak ata.
Önemsiz bireysel personel atamaları, üniversite kadro ilanları ve küçük bireysel mahkeme ilanlarını 'isRelevant': false yap.

Analiz Formatı:
Kabul edilen her haber için 'analysis' objesi içinde şu bilgileri doldur:
- summary: Haber özetini yazın. Özet çok uzun olmamalı (en fazla 3-4 cümle) ancak son derece somut, bilgilendirici ve açıklayıcı olmalıdır.
  * ÖZET YAZIMINDA ALTIN KURALLAR:
    1. Haber özetlerinin ucunu kesinlikle açık veya belirsiz bırakmayın. "Değişiklik yapıldı", "kurallar değişti", "kararlar ve duyurular yayımlandı" gibi genel, içi boş ve hiçbir bilgi içermeyen ifadeler KESİNLİKLE YASAKTIR.
    2. Kararın ne olduğunu, ne ile ilgili alındığını, hangi somut kuralların/maddelerin değiştiğini ve doğrudan sonucunun ne olacağını ilk okuyuşta tam olarak anlaşılacak şekilde somut detaylarıyla yazın.
    3. EĞER elinizdeki haber veya Resmi Gazete içeriği somut detaylar içermiyorsa, bu haberi kesinlikle 'isRelevant': false yapıp eleyin!
- geopoliticalImpact: Jeopolitik etkisi
- turkeyImpact: Türkiye açısından etkisi
- financialImpact: Finansal etkisi
- longTerm: Uzun vadeli olası sonuçları
- isCritical: Eğer en kritik 5 gelişmeden biriyse true, değilse false yap.
- whyImportant: Bu gelişmenin neden önemli olduğu (en az 2 cümle).
- whoAffected: Bu gelişmenin kimleri veya hangi sektörleri/ülkeleri etkilediği (en az 2 cümle).
- followUp: Önümüzdeki günlerde bu gelişmeye dair nelerin takip edilmesi gerektiği (en az 2 cümle).

Yazım Kuralları:
- Tarafsız ol.
- Spekülasyon yapma.
- Gereksiz ayrıntıya girme.

Analiz Edilecek İçerikler:
${JSON.stringify(batch, null, 2)}
`;

      let analysisResult = null;
      let retries = 3;
      
      while (retries > 0) {
        try {
          analysisResult = await callGemini(apiKey, systemPrompt);
          break;
        } catch (err) {
          retries--;
          console.warn(`UYARI: Paket ${batchNum} analiz edilirken hata oluştu (Kalan Deneme: ${retries}):`, err.message || err);
          if (retries > 0) {
            console.log("5 saniye bekleniyor ve tekrar deneniyor...");
            await new Promise(resolve => setTimeout(resolve, 5000));
          } else {
            console.error(`HATA: Paket ${batchNum} 3 deneme sonrasında da başarısız oldu. Bu paket atlanıyor!`);
          }
        }
      }

      if (analysisResult && analysisResult.events) {
        analyzedEvents = analyzedEvents.concat(analysisResult.events);
      }
      
      if (i + BATCH_SIZE < toAnalyze.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // Restore original link URLs
  const originalLinkMap = new Map();
  freshEvents.forEach(evt => {
    if (evt.title) {
      originalLinkMap.set(getNormalizedTitle(evt.title), evt.link);
    }
  });

  analyzedEvents.forEach(evt => {
    const normTitle = getNormalizedTitle(evt.title);
    if (originalLinkMap.has(normTitle)) {
      evt.link = originalLinkMap.get(normTitle);
    }
  });

  // Filter relevant events and normalize keys
  const defaultTimestamp = new Date().toISOString();
  const relevantAnalyzed = analyzedEvents
    .filter(item => item.isRelevant === true && item.analysis)
    .map(item => ({
      ...item,
      timestamp: item.timestamp || defaultTimestamp,
      analysis: {
        summary: item.analysis.summary || "",
        geopoliticalImpact: item.analysis.geopoliticalImpact || item.analysis.geopolitical_impact || item.analysis.geopolitical || "",
        turkeyImpact: item.analysis.turkeyImpact || item.analysis.turkey_impact || item.analysis.turkey || "",
        financialImpact: item.analysis.financialImpact || item.analysis.financial_impact || item.analysis.financial || "",
        longTerm: item.analysis.longTerm || item.analysis.long_term || item.analysis.longterm || "",
        isCritical: !!(item.analysis.isCritical || item.analysis.is_critical),
        whyImportant: item.analysis.whyImportant || item.analysis.why_important || "",
        whoAffected: item.analysis.whoAffected || item.analysis.who_affected || "",
        followUp: item.analysis.followUp || item.analysis.follow_up || ""
      }
    }));

  // Step 3: Post-Gemini Semantic Deduplication (collapses multiple batches covering the same story)
  const finalRelevantEvents = clusterAndDeduplicate(relevantAnalyzed);
  console.log(`Gemini analizi sonrası kabul edilen: ${relevantAnalyzed.length} haber -> Son semantik tekilleştirme sonrası: ${finalRelevantEvents.length} haber.`);

  // Format skipped events to output schema
  const formattedSkipped = skipped.map(item => ({
    ...item,
    isRelevant: false,
    analysis: null,
    timestamp: item.timestamp || defaultTimestamp
  }));

  // Today's complete events list
  const todaysFullEvents = [...finalRelevantEvents, ...formattedSkipped];

  // Combine today's events with unique historical events (semantic clustering)
  const allHistoricalCombined = [...todaysFullEvents, ...historicalEvents];
  const finalDeduplicatedEvents = clusterAndDeduplicate(allHistoricalCombined);

  // Limit database size to last 80 unique events to keep the file lightweight and fresh
  const limitedEventsList = finalDeduplicatedEvents.slice(0, 80);

  // Structure final json
  const outputData = {
    date: dateToday,
    events: limitedEventsList
  };

  try {
    const targetPath = path.join(__dirname, 'data_parsed.json');
    fs.writeFileSync(targetPath, JSON.stringify(outputData, null, 2), 'utf-8');
    console.log(`BAŞARILI: Güncel sabah bülteni analizi '${targetPath}' dosyasına yazıldı!`);
  } catch (err) {
    console.error("HATA: Dosyaya yazma sırasında bir hata oluştu:", err);
    process.exit(1);
  }

  // Trigger email dispatch if configured in secrets
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_PASS;
  const toEmail = process.env.TO_EMAIL;
  
  if (gmailUser && gmailPass) {
    console.log("E-posta alıcıları Google E-Tablo'dan çekiliyor...");
    let recipientEmails = [];
    
    if (toEmail) {
      toEmail.split(',').forEach(e => recipientEmails.push(e.trim().toLowerCase()));
    }
    
    try {
      const webAppUrl = "https://script.google.com/macros/s/AKfycbzZR2jLwFmUBE8xtHaKmcFHK6vUV5KOCb7Wr2cMIw4R9Xdr2Mxq4_6hNb39zFGo75Kf/exec";
      const jsonText = await fetchUrl(webAppUrl);
      const sheetEmails = JSON.parse(jsonText);
      if (Array.isArray(sheetEmails)) {
        sheetEmails.forEach(e => {
          const email = e.trim().toLowerCase();
          if (email && email.includes('@')) {
            recipientEmails.push(email);
          }
        });
      }
    } catch (sheetErr) {
      console.warn("UYARI: E-Tablo abone listesi alınamadı (doGet tanımlanmamış veya yayında değil):", sheetErr.message);
    }
    
    const uniqueRecipients = [...new Set(recipientEmails)];
    
    if (uniqueRecipients.length > 0) {
      console.log(`E-posta bülteni ${uniqueRecipients.length} aboneye gönderiliyor... Liste:`, uniqueRecipients);
      const emailSubject = `AnalizAsistanı: Günlük Sabah Raporu (${dateToday})`;
      const emailHtml = generateHtmlEmail(dateToday, finalRelevantEvents);
      
      for (const email of uniqueRecipients) {
        try {
          console.log(`Gönderiliyor: ${email}`);
          await sendEmail(gmailUser, gmailPass, email, emailSubject, emailHtml);
          console.log(`BAŞARILI: E-posta '${email}' adresine gönderildi!`);
        } catch (emailErr) {
          console.error(`HATA: '${email}' adresine e-posta gönderilemedi:`, emailErr.message);
        }
      }
    } else {
      console.log("Bilgi: E-posta gönderilecek herhangi bir alıcı bulunamadı.");
    }
  } else {
    console.log("Bilgi: E-posta gönderimi yapılandırılmadı (GMAIL_USER veya GMAIL_PASS eksik).");
  }
}

run();
