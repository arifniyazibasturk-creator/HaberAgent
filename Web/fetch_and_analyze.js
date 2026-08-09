const https = require('https');
const fs = require('fs');
const path = require('path');

// RSS Feeds list targeting the requested sources with broader query terms
const FEEDS = [
  {
    name: "Türkiye Cumhuriyeti Resmî Gazete",
    query: '"resmi gazete" OR "cumhurbaşkanlığı kararı" OR "yönetmelik" OR "tebliğ" OR "anayasa mahkemesi"',
    category: "Resmî Gazete"
  },
  {
    name: "TCMB",
    query: 'site:tcmb.gov.tr OR "merkez bankası" OR "para politikası"',
    category: "Finans ve Ekonomi"
  },
  {
    name: "Reuters World & AP News (Jeopolitik)",
    query: 'jeopolitik OR diplomasi OR "dış politika" OR "savunma sanayii" OR NATO OR "birleşmiş milletler" OR "doğu akdeniz"',
    category: "Uluslararası İlişkiler"
  },
  {
    name: "Reuters Markets & Financial Times (Ekonomi)",
    query: 'ekonomi OR finans OR enflasyon OR "para politikası" OR hazine OR borsa OR IMF OR "dünya bankası" OR Fed OR ECB',
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
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec)) // Decimal entities like &#305; (ı), &#287; (ğ)
    .replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16))); // Hexadecimal entities
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
        // Handle HTTP redirects (status code 3xx)
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          let nextUrl = res.headers.location;
          if (nextUrl.startsWith('/')) {
            const parsedUrl = new URL(targetUrl);
            nextUrl = `${parsedUrl.protocol}//${parsedUrl.host}${nextUrl}`;
          }
          get(nextUrl, depth + 1);
          return;
        }
        
        // Reject on HTTP error status codes (e.g. 403, 429, 503)
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP status code ${res.statusCode}`));
          return;
        }
        
        res.setEncoding('utf8'); // Ensure multi-byte UTF-8 streams are decoded correctly
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => { resolve(data); });
      }).on('error', (err) => { reject(err); });
    };
    get(url, 0);
  });
}

// Custom lightweight XML/RSS parser to avoid external npm dependencies
function parseRss(xmlText, defaultCategory, defaultSource) {
  const items = [];
  const matches = xmlText.matchAll(/<item>([\s\S]*?)<\/item>/g);
  
  for (const match of matches) {
    const content = match[1];
    
    // Extract title, description/body, pubDate, and link
    const titleMatch = content.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || content.match(/<title>([\s\S]*?)<\/title>/);
    const descMatch = content.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || content.match(/<description>([\s\S]*?)<\/description>/);
    const pubDateMatch = content.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const linkMatch = content.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/) || content.match(/<link>([\s\S]*?)<\/link>/);
    
    if (titleMatch) {
      // Decode HTML entities and strip XML/HTML tags
      let title = decodeHtmlEntities(titleMatch[1].replace(/<[^>]*>/g, '').trim());
      let body = descMatch ? decodeHtmlEntities(descMatch[1].replace(/<[^>]*>/g, '').trim()) : "";
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
        timestamp: new Date(pubDate).toISOString(),
        link: linkMatch ? linkMatch[1].trim() : ""
      });
    }
  }
  
  return items;
}

// Helper to normalize news titles (lowercase, strips source names like "- Bloomberg" or "- Reuters", and removes special chars)
function getNormalizedTitle(title) {
  if (!title) return "";
  let t = title.toLowerCase();
  // Strip trailing source name patterns like "- bloomberg.com", "- reuters", etc.
  t = t.replace(/\s*-\s*[^-\s]+(?:\.[a-z]{2,})?\s*$/i, '');
  // Keep only alphanumeric characters and Turkish-specific letters
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

  // Load previously processed event titles from existing data_parsed.json for historical deduplication
  const historicalTitles = new Set();
  let historicalEvents = [];
  try {
    const targetPath = path.join(__dirname, 'data_parsed.json');
    if (fs.existsSync(targetPath)) {
      const existingData = JSON.parse(fs.readFileSync(targetPath, 'utf-8'));
      if (existingData && Array.isArray(existingData.events)) {
        historicalEvents = existingData.events;
        existingData.events.forEach(event => {
          if (event.title) {
            historicalTitles.add(getNormalizedTitle(event.title));
          }
        });
      }
    }
  } catch (err) {
    console.warn("UYARI: Geçmiş veritabanı okunamadı, tarihsel tekillik kontrolü atlanıyor:", err.message);
  }

  console.log("Haberler ve RSS kaynakları taranıyor...");
  let allEvents = [];

  for (const feed of FEEDS) {
    try {
      console.log(`Taranyor: ${feed.name}`);
      // Build Google News query URL dynamically with URL encoding
      const url = "https://news.google.com/rss/search?q=" + encodeURIComponent(feed.query) + "&hl=tr&gl=TR&ceid=TR:tr";
      const xml = await fetchUrl(url);
      const items = parseRss(xml, feed.category, feed.name);
      console.log(`-> ${items.length} içerik bulundu.`);
      // Limit to 20 newest items per feed to have a wider pool of news for deeper research
      allEvents = allEvents.concat(items.slice(0, 20));
    } catch (err) {
      console.error(`HATA: ${feed.name} RSS'i alınamadı:`, err.message);
    }
  }

  if (allEvents.length === 0) {
    console.error("HATA: Hiçbir kaynaktan veri alınamadı!");
    process.exit(1);
  }

  // Deduplicate: Filter out duplicates of items fetched today, and items historically analyzed previously
  const uniqueEvents = [];
  const seenTitlesToday = new Set();

  for (const event of allEvents) {
    const normTitle = getNormalizedTitle(event.title);
    if (!normTitle) continue;

    // Skip if seen in today's scrape pool
    if (seenTitlesToday.has(normTitle)) {
      continue;
    }
    
    // Skip if processed in previous days
    if (historicalTitles.has(normTitle)) {
      continue;
    }

    seenTitlesToday.add(normTitle);
    uniqueEvents.push(event);
  }

  console.log(`Tekilleştirme sonrası kalan özgün içerik sayısı: ${uniqueEvents.length} (Toplam taranan: ${allEvents.length})`);

  // Split events into potentially relevant (for AI) and irrelevant (direct output)
  const toAnalyze = uniqueEvents.filter(isItemPotentiallyRelevant);
  const skipped = uniqueEvents.filter(item => !isItemPotentiallyRelevant(item));

  console.log(`Toplam ${uniqueEvents.length} özgün içerikten ${toAnalyze.length} adedi Gemini ile analiz edilmek üzere paketleniyor...`);
  
  let analyzedEvents = [];
  const dateToday = new Date().toISOString().substring(0, 10);
  const BATCH_SIZE = 6; // Process in small batches of 6 to prevent output truncation and avoid rate limits

  if (toAnalyze.length > 0) {
    for (let i = 0; i < toAnalyze.length; i += BATCH_SIZE) {
      const batch = toAnalyze.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(toAnalyze.length / BATCH_SIZE);
      
      console.log(`Gemini analizi yapılıyor: Paket ${batchNum} / ${totalBatches} (${batch.length} haber)...`);

      // Build the prompt containing prompt guidelines for this specific batch
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
Kabul edilen her haber için 'analysis' objesi içinde şu bilgileri doldur (Kategori 'Hukuk ve Mevzuat' ise de bu alanları doldur):
- summary: Haber özetini yazın. Özet çok uzun olmamalı (en fazla 3-4 cümle) ancak son derece somut, bilgilendirici ve açıklayıcı olmalıdır.
  * ÖZET YAZIMINDA ALTIN KURALLAR:
    1. Haber özetlerinin ucunu kesinlikle açık veya belirsiz bırakmayın. "Değişiklik yapıldı", "kurallar değişti", "kararlar ve duyurular yayımlandı" gibi genel, içi boş ve hiçbir bilgi içermeyen ifadeler KESİNLİKLE YASAKTIR.
    2. Kararın ne olduğunu, ne ile ilgili alındığını, hangi somut kuralların/maddelerin değiştiğini ve doğrudan sonucunun ne olacağını ilk okuyuşta tam olarak anlaşılacak şekilde somut detaylarıyla yazın.
    3. ÖRNEK KÖTÜ ÖZET (YASAK): "Milli Eğitim Bakanlığı okul yönetmeliğinde bazı önemli değişiklikler yaptı."
    4. ÖRNEK KÖTÜ ÖZET (YASAK): "Resmi Gazete'nin güncel sayısında kararlar ve duyurular kamuoyunun bilgisine sunulmuştur."
    5. ÖRNEK İYİ ÖZET (İSTENEN): "Milli Eğitim Bakanlığı okul öncesi yönetmeliğini değiştirerek; okula kayıt yaşını 36-68 ay aralığına çekti, velilerden alınan aylık aidat sistemini kaldırdı ve ders sürelerini 50 dakikadan 40 dakikaya indirdi."
    6. EĞER elinizdeki haber veya Resmi Gazete içeriği somut detaylar (maddeler, oranlar, isimler vb.) İÇERMİYORSA ve sadece "Resmi Gazete yayımlandı" gibi boş bir başlıktan ibaretse, bu haberi kesinlikle 'isRelevant': false yapıp eleyin! Yalnızca içeriğinde somut bilgi olan haberleri kabul edin.
- geopoliticalImpact: Jeopolitik etkisi (Eğer hukuk haberiyse uluslararası etkilerini veya AB/AİHM uyumunu değerlendir)
- turkeyImpact: Türkiye açısından etkisi
- financialImpact: Finansal etkisi
- longTerm: Uzun vadeli olası sonuçları
- isCritical: Eğer en kritik 5 gelişmeden biriyse true, değilse false yap.
- whyImportant: Bu gelişmenin neden önemli olduğu (en az 2 cümle, her haber için kesinlikle detaylıca doldurulmalı, asla boş bırakılmamalı).
- whoAffected: Bu gelişmenin kimleri veya hangi sektörleri/ülkeleri etkilediği (en az 2 cümle, her haber için kesinlikle detaylıca doldurulmalı, asla boş bırakılmamalı).
- followUp: Önümüzdeki günlerde bu gelişmeye dair nelerin takip edilmesi gerektiği (en az 2 cümle, her haber için kesinlikle detaylıca doldurulmalı, asla boş bırakılmamalı).

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
          break; // Success!
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
      
      // Wait 2 seconds between batch calls to prevent rate limits on Gemini API
      if (i + BATCH_SIZE < toAnalyze.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  // Restore original link URLs from scraped uniqueEvents using normalized titles
  const originalLinkMap = new Map();
  uniqueEvents.forEach(evt => {
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

  // Only keep relevant analyzed events. Discard all skipped/irrelevant items to prevent generic placeholder leaks.
  const combinedEvents = analyzedEvents.filter(item => item.isRelevant === true);

  // Format skipped events to output schema
  const formattedSkipped = skipped.map(item => ({
    ...item,
    isRelevant: false,
    analysis: null
  }));

  const finalEventsList = [...combinedEvents, ...formattedSkipped];

  // Normalize analysis keys to camelCase in case Gemini uses snake_case or different casings
  const normalizedEvents = finalEventsList.map(item => {
    const defaultTimestamp = new Date().toISOString();
    if (item.analysis) {
      return {
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
      };
    }
    return {
      ...item,
      timestamp: item.timestamp || defaultTimestamp
    };
  });

  // Combine today's newly analyzed events with historical database events
  const combinedHistory = [...normalizedEvents, ...historicalEvents];

  // Deduplicate combined database by normalized title to prevent identical duplicates across runs
  const finalDeduplicatedEvents = [];
  const seenDbTitles = new Set();
  combinedHistory.forEach(item => {
    const norm = getNormalizedTitle(item.title);
    if (norm && !seenDbTitles.has(norm)) {
      seenDbTitles.add(norm);
      finalDeduplicatedEvents.push(item);
    }
  });

  // Limit database size to last 150 events to keep the file lightweight for web fetches
  const limitedEventsList = finalDeduplicatedEvents.slice(0, 150);

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
    
    // Add default email from Secrets if configured
    if (toEmail) {
      toEmail.split(',').forEach(e => recipientEmails.push(e.trim().toLowerCase()));
    }
    
    try {
      // Fetch subscribers from the Google Sheets Web App URL
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
    
    // Deduplicate and filter emails
    const uniqueRecipients = [...new Set(recipientEmails)];
    
    if (uniqueRecipients.length > 0) {
      console.log(`E-posta bülteni ${uniqueRecipients.length} aboneye gönderiliyor... Liste:`, uniqueRecipients);
      const emailSubject = `AnalizAsistanı: Günlük Sabah Raporu (${dateToday})`;
      const emailHtml = generateHtmlEmail(dateToday, normalizedEvents);
      
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
