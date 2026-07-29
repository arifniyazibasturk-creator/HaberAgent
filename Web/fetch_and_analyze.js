const https = require('https');
const fs = require('fs');
const path = require('path');

// RSS Feeds list targeting the requested sources
const FEEDS = [
  {
    name: "Türkiye Cumhuriyeti Resmî Gazete",
    url: "https://www.resmigazete.gov.tr/rss.xml",
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
    const linkMatch = content.match(/<link>([\s\S]*?)<\/link>/);
    
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
                    }
                  }
                },
                required: ["source", "title", "body", "category", "isRelevant"]
              }
            }
          },
          required: ["date", "events"]
        }
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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("HATA: GEMINI_API_KEY ortam değişkeni tanımlı değil!");
    process.exit(1);
  }

  console.log("Haberler ve RSS kaynakları taranıyor...");
  let allEvents = [];

  for (const feed of FEEDS) {
    try {
      console.log(`Taranyor: ${feed.name}`);
      const xml = await fetchUrl(feed.url);
      const items = parseRss(xml, feed.category, feed.name);
      console.log(`-> ${items.length} içerik bulundu.`);
      // Limit to 10 newest items per feed to avoid overloading prompt context
      allEvents = allEvents.concat(items.slice(0, 10));
    } catch (err) {
      console.error(`HATA: ${feed.name} RSS'i alınamadı:`, err.message);
    }
  }

  if (allEvents.length === 0) {
    console.error("HATA: Hiçbir kaynaktan veri alınamadı!");
    process.exit(1);
  }

  console.log(`Toplam ${allEvents.length} içerik Gemini ile analiz edilmek üzere paketleniyor...`);

  // Build the prompt containing prompt guidelines
  const systemPrompt = `
Sen profesyonel bir jeopolitik, ekonomi, finans ve hukuk analiz asistanısın.

Görevin: Sana sunulan son 24 saatlik haberleri ve resmi duyuruları incele ve kurallara göre analiz et.

Filtreleme Kuralları:
Aşağıdaki konular dışındaki haberleri 'isRelevant': false olarak işaretle.
- Uluslararası İlişkiler (Dış politika, diplomasi, savaşlar, yaptırımlar, NATO, AB, BM, ABD, Rusya, Çin, Orta Doğu, Türk dış politikası, Savunma sanayii, Enerji güvenliği, Uluslararası ticaret)
- Finans ve Ekonomi (TCMB, Faiz, Enflasyon, Vergi düzenlemeleri, Resmi Gazete'deki ekonomik kararlar, Gümrük mevzuatı, İhracat, İthalat, Borsa İstanbul, Döviz piyasası, Altın, Petrol, CDS, Tahvil)
- Hukuk ve Mevzuat (Emniyet, okul, eğitim veya idari yönetmelikler, kanun değişiklikleri, AYM ve Danıştay kararları, ulusal hukuki reformlar ve anlaşmalar)

Resmî Gazete Kuralları:
Resmî Gazete'deki kararlardan YALNIZCA ekonomi, finans, vergi, bankacılık, ticaret, gümrük, yatırım, kamu ihaleleri, dış ticaret, enerji, uluslararası anlaşmalar, cumhurbaşkanlığı kararları, yönetmelik, tebliğ ve hukuki kararları seç.
Önemli yasal reformlar, yönetmelik değişiklikleri (MEB, Emniyet vb.) ve AYM kararlarını 'isRelevant': true yap ve kategorisini 'Hukuk ve Mevzuat' olarak ata.
Önemsiz bireysel personel atamaları, üniversite kadro ilanları ve küçük bireysel mahkeme ilanlarını 'isRelevant': false yap.

Analiz Formatı:
Kabul edilen her haber için 'analysis' objesi içinde şu bilgileri doldur (Kategori 'Hukuk ve Mevzuat' ise de bu alanları doldur):
- summary: Kısa özet (en fazla 3 cümle)
- geopoliticalImpact: Jeopolitik etkisi (Eğer hukuk haberiyse uluslararası etkilerini veya AB/AİHM uyumunu değerlendir)
- turkeyImpact: Türkiye açısından etkisi
- financialImpact: Finansal etkisi
- longTerm: Uzun vadeli olası sonuçları
- isCritical: Eğer en kritik 5 gelişmeden biriyse true, değilse false yap.
- whyImportant: (Sadece isCritical true ise doldur) Neden önemli?
- whoAffected: (Sadece isCritical true ise doldur) Kimleri etkiliyor?
- followUp: (Sadece isCritical true ise doldur) Önümüzdeki günlerde ne takip edilmeli?

Yazım Kuralları:
- Tarafsız ol.
- Spekülasyon yapma.
- Gereksiz ayrıntıya girme.

Analiz Edilecek İçerikler:
${JSON.stringify(allEvents, null, 2)}
`;

  try {
    const analysisResult = await callGemini(apiKey, systemPrompt);
    const dateToday = new Date().toISOString().substring(0, 10);
    
    // Structure final json
    const outputData = {
      date: dateToday,
      events: analysisResult.events || []
    };

    const targetPath = path.join(__dirname, 'data_parsed.json');
    fs.writeFileSync(targetPath, JSON.stringify(outputData, null, 2), 'utf-8');
    console.log(`BAŞARILI: Güncel sabah bülteni analizi '${targetPath}' dosyasına yazıldı!`);
  } catch (err) {
    console.error("HATA: Gemini API analizi sırasında bir hata oluştu:", err);
    process.exit(1);
  }
}

run();
