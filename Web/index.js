// ==========================================
// GEOPOLITICAL & FINANCIAL ASSISTANT LOGIC
// ==========================================

// Predefined sources from the prompt
const SOURCES = [
  "Türkiye Cumhuriyeti Resmî Gazete",
  "TCMB",
  "Hazine ve Maliye Bakanlığı",
  "Ticaret Bakanlığı",
  "Enerji ve Tabii Kaynaklar Bakanlığı",
  "Dışişleri Bakanlığı",
  "Reuters World",
  "Reuters Markets",
  "AP News",
  "Financial Times",
  "IMF",
  "Dünya Bankası",
  "Avrupa Merkez Bankası (ECB)",
  "ABD Merkez Bankası (Fed)",
  "NATO",
  "Avrupa Birliği",
  "Birleşmiş Milletler"
];

// Default historical/mock dataset
let rawEvents = [
  {
    id: "real-law-1",
    source: "Türkiye Cumhuriyeti Resmî Gazete",
    title: "Millî Eğitim Bakanlığı Okul Öncesi Eğitim ve İlköğretim Kurumları Yönetmeliğinde Değişiklik Yapılmasına Dair Yönetmelik",
    body: "Okul öncesi eğitim kurumları ve ilköğretim okullarında kayıt, nakil, devamsızlık takibi ve şube belirleme işlemlerine yönelik kuralları güncelleyen yönetmelik Resmi Gazete'de yürürlüğe girdi. Velilerin okul kayıt dönemlerindeki idari süreçleri ve şube seçim usulleri kolaylaştırıldı.",
    category: "Hukuk ve Mevzuat",
    subType: "Yönetmelik",
    timestamp: "2026-07-28T02:45:00+03:00",
    isRelevant: true,
    analysis: {
      summary: "Milli Eğitim Bakanlığı, ilköğretim ve okul öncesi seviyedeki kayıt, nakil ve sınıf belirleme usullerini güncelleyen bir yönetmelik yayımlamıştır.",
      geopoliticalImpact: "Küresel ölçekte bir etkisi bulunmamaktadır.",
      turkeyImpact: "Milyonlarca öğrenci ve velinin okul kayıt dönemindeki nakil ve şube seçimi süreçlerini kolaylaştırmayı ve fırsat eşitliğini artırmayı hedefler.",
      financialImpact: "Velilerin kayıt dönemlerindeki kayıt bağışı veya ek masraf talepleriyle karşılaşma riskini azaltmaya yönelik yasal denetim sağlar.",
      longTerm: "Okul öncesi eğitime katılımın artırılması ve eğitim lojistiğinde standardizasyon sağlanması.",
      isCritical: false
    }
  },
  {
    id: "real-law-2",
    source: "Türkiye Cumhuriyeti Resmî Gazete",
    title: "Emniyet Teşkilatı Disiplin Kurullarının Çalışma Esas ve Yöntemlerine İlişkin Yönetmeliğin Yürürlükten Kaldırılması Hakkında Yönetmelik",
    body: "Emniyet Teşkilatı disiplin kurullarının teşekkülü, çalışma esasları ve karar alma mekanizmalarını düzenleyen eski yönetmelik Resmi Gazete'de yayımlanan yeni karar ile yürürlükten kaldırılmıştır. Yeni disiplin usullerine zemin hazırlanmıştır.",
    category: "Hukuk ve Mevzuat",
    subType: "Yönetmelik",
    timestamp: "2026-07-28T02:15:00+03:00",
    isRelevant: true,
    analysis: {
      summary: "Emniyet Teşkilatı disiplin kurullarının çalışma usullerini belirleyen yönetmelik yürürlükten kaldırılmış, yeni disiplin süreçleri tanımlanmıştır.",
      geopoliticalImpact: "Doğrudan küresel jeopolitik etkisi yoktur ancak iç güvenlik ve kolluk kuvvetleri yönetiminde şeffaflık standartlarını etkileyebilir.",
      turkeyImpact: "Emniyet mensuplarının disiplin soruşturması süreçlerinde usuli değişiklikler yaratarak kolluk gücü içi idari yargı denetimini şekillendirecektir.",
      financialImpact: "Kamu maliyesi üzerinde doğrudan bir etkisi bulunmamaktadır.",
      longTerm: "Emniyet güçlerinin idari disiplin yapısında daha merkeziyetçi veya modernize edilmiş yeni bir yasal çerçevenin kurulmasına zemin hazırlayacaktır.",
      isCritical: false
    }
  },
  {
    id: "real-law-3",
    source: "Türkiye Cumhuriyeti Resmî Gazete",
    title: "Anayasa Mahkemesi Bireysel Başvuru ve Yargı Yolu Kısıtlamalarına İlişkin İptal Kararı (Esas Sayısı: 2024/102)",
    body: "Anayasa Mahkemesi, hak arama hürriyetini kısıtladığı gerekçesiyle bazı idari yaptırımların yargısal denetim sürelerine dair kanun maddelerinin iptaline karar vermiştir. Karar Resmi Gazete'de yayımlanarak yürürlüğe girmiştir.",
    category: "Hukuk ve Mevzuat",
    subType: "Mahkeme Kararı",
    timestamp: "2026-07-28T02:05:00+03:00",
    isRelevant: true,
    analysis: {
      summary: "Anayasa Mahkemesi, hak arama özgürlüğünü kısıtladığı gerekçesiyle bazı idari yaptırım denetim sürelerine dair kanun maddelerini iptal etmiştir.",
      geopoliticalImpact: "Türkiye'nin Avrupa İnsan Hakları Sözleşmesi (AİHS) ve AB uyum sürecindeki hukukun üstünlüğü endeks puanlarını olumlu etkileyebilir.",
      turkeyImpact: "Bireysel başvurularda hak kayıplarını engelleyecek ve idari yaptırımlara karşı yargı yolunu daha etkin hale getirecektir.",
      financialImpact: "Kamu idaresinin usulsüz cezalar nedeniyle ödemek zorunda kalacağı tazminat riskini azaltacak yasal reformları zorunlu kılacaktır.",
      longTerm: "İdarenin işlem ve eylemlerinde hukuka uygunluk standartlarının ve yargı denetiminin kalıcı olarak güçlenmesi.",
      isCritical: true,
      whyImportant: "Vatandaşların devlete karşı hak arama hürriyetini genişleten ve kanunların anayasaya uygunluğunu denetleyen dönüm noktası bir karardır.",
      whoAffected: "Tüm vatandaşlar, hukukçular ve idari yaptırım uygulayan kamu kurumları.",
      followUp: "TBMM'nin iptal edilen maddeler doğrultusunda yapacağı yeni yasal düzenleme takvimi."
    }
  },
  {
    id: "real-1",
    source: "Türkiye Cumhuriyeti Resmî Gazete",
    title: "Tarım ve Orman Bakanlığı Tarafından Bazı Tarımsal Ürünlerin İthalat Denetimine İlişkin Tebliğde Değişiklik Yapılmasına Dair Tebliğ",
    body: "Tarımsal ürünlerin gümrük denetimleri, sağlık sertifikası kontrolleri ve ithalata uygunluk prosedürlerinde yeni düzenlemeler getiren tebliğ Resmi Gazete'de yürürlüğe girdi. Tarım ürünlerinde gümrükteki denetim standartlarının sıkılaştırılması amaçlanmaktadır.",
    category: "Resmî Gazete",
    subType: "Tebliğ",
    timestamp: "2026-07-28T02:10:00+03:00",
    isRelevant: true,
    analysis: {
      summary: "Tarım ve Orman Bakanlığı, gümrükteki tarımsal ithalat denetim prosedürlerini ve sağlık sertifikası standartlarını sıkılaştırmıştır.",
      geopoliticalImpact: "Bölgesel gıda ticareti ortaklarımız (örneğin AB ülkeleri ve Ukrayna) ile gümrük süreçlerinde dönemsel bürokratik gecikmelere sebep olabilir.",
      turkeyImpact: "Yerli tarım üreticilerini koruyarak gümrükte denetimsiz ürün girişini sınırlandırırken, ithal tarımsal hammaddelerin tedarik süresini uzatabilir.",
      financialImpact: "Tarımsal hammadde ithalat maliyetlerinde hafif bir artışa ve dolayısıyla gıda enflasyonu üzerinde sınırlı yukarı yönlü baskıya yol açabilir.",
      longTerm: "Türkiye'nin tarımsal denetim standartlarının AB yeşil mutabakat kriterleriyle uyumlandırılması sürecini destekleyecektir.",
      isCritical: false
    }
  },
  {
    id: "real-2",
    source: "Türkiye Cumhuriyeti Resmî Gazete",
    title: "Sendikalar ve Toplu İş Sözleşmesi Kanunu Temmuz 2026 Dönemi İstatistikleri Tebliği",
    body: "6356 sayılı Kanun gereğince, Çalışma ve Sosyal Güvenlik Bakanlığı tarafından hazırlanan Temmuz 2026 dönemi iş kollarındaki işçi ve üye sendika sayılarına ilişkin istatistiki veriler Resmi Gazete'de yayımlandı.",
    category: "Resmî Gazete",
    subType: "Tebliğ",
    timestamp: "2026-07-28T02:30:00+03:00",
    isRelevant: false,
    analysis: null
  },
  {
    id: "real-4",
    source: "TCMB",
    title: "TCMB Haftalık Likidite Yönetimi ve Para Politikası Duruş Değerlendirmesi",
    body: "TCMB, 23 Temmuz'daki politika faizini %37 seviyesinde sabit tutma kararının ardından piyasadaki fonlama miktarını ve sterilizasyon adımlarını artırdığını açıkladı. Günlük geçici rezerv miktarındaki değişimler ve repo ihaleleri yakından izlenmektedir.",
    category: "Finans ve Ekonomi",
    subType: "Genel",
    timestamp: "2026-07-28T10:00:00+03:00",
    isRelevant: true,
    analysis: {
      summary: "TCMB, politika faizini %37'de sabit bırakmasının ardından piyasadaki TL likidite fazlasını sterilize etmek amacıyla depo ihalelerini sürdüreceğini açıklamıştır. Bu durum sıkı duruşun korunduğunu gösterir.",
      geopoliticalImpact: "Küresel yabancı yatırımcıların TL varlıklara olan carry trade ilgisinin ve rasyonel ekonomi politikalarına olan güvenin sürdürülmesini destekler.",
      turkeyImpact: "Bankacılık sektöründe mevduat faizlerinin yüksek kalmasını sağlarken, kredi genişlemesini sınırlayarak iç talebi baskılamaya devam edecektir.",
      financialImpact: "BIST 100 endeksindeki banka hisseleri üzerinde hafif baskı oluştururken, TL'nin kurlar karşısındaki istikrarını ve CDS risk primlerinin 240 baz puan seviyelerinde kalmasını destekler.",
      longTerm: "Enflasyonda kalıcı düşüş sağlanana kadar piyasadaki para arzının kontrol altında tutulması hedeflenmektedir.",
      isCritical: true,
      whyImportant: "Faiz oranının sabit tutulmasına rağmen piyasadaki fazla likiditenin çekilmesi, enflasyonla mücadelede kararlılık göstergesidir.",
      whoAffected: "Ticari bankalar, reel sektör borçlanıcıları ve mevduat sahipleri.",
      followUp: "TCMB'nin günlük depo ihalesi sonuçları ve net fonlama tutarları."
    }
  },
  {
    id: "real-5",
    source: "Reuters Markets",
    title: "Borsa İstanbul Güne Yükselişle Başladı, Döviz Piyasasında Yatay Seyir",
    body: "BIST 100 endeksi güne %0,08 artışla 13.786 puandan başlarken, Dolar/TL 47,38 ve Euro/TL 53,90 seviyelerinde yatay bir açılış gerçekleştirdi. Sektörel güven endekslerindeki hizmet ve inşaat artışı Borsa açılışına yansıdı.",
    category: "Finans ve Ekonomi",
    subType: "Piyasa",
    timestamp: "2026-07-28T09:45:00+03:00",
    isRelevant: true,
    analysis: {
      summary: "Borsa İstanbul güne hafif yükselişle 13.786 puandan başlarken, döviz kurları perakende güven endeksindeki düşüşe rağmen yatay seyrini sürdürmüştür.",
      geopoliticalImpact: "Küresel piyasalarda çip üreticisi hisselerindeki satış baskısının ortasında Borsa İstanbul'un gelişmekte olan piyasalar arasında görece dirençli kaldığını göstermektedir.",
      turkeyImpact: "İç piyasada perakende sektöründeki yavaşlama sinyallerine rağmen hizmet ve inşaat sektörlerindeki iyimserliğin borsa performansını koruduğuna işaret etmektedir.",
      financialImpact: "BIST 100'de teknoloji dışı sektörlerde alımları tetiklerken, döviz kurlarında kısa vadeli stabilizasyonu destekler.",
      longTerm: "Borsa İstanbul'un 14.000 puan direncini test etme eğilimini destekleyebilir.",
      isCritical: false
    }
  },
  {
    id: "real-6",
    source: "Reuters World",
    title: "Hürmüz Boğazı ve Orta Doğu'da Enerji Arz Güvenliği Riskleri",
    body: "Orta Doğu'da ABD ve İran eksenli askeri gerilimlerin tırmanması, küresel petrol sevkiyatının en kritik geçiş noktası olan Hürmüz Boğazı'nda arz güvenliği endişelerini artırdı. Petrol fiyatları jeopolitik risk primiyle dalgalanıyor.",
    category: "Uluslararası İlişkiler",
    subType: "Enerji Güvenliği",
    timestamp: "2026-07-28T08:15:00+03:00",
    isRelevant: true,
    analysis: {
      summary: "ABD-İran gerilimi sebebiyle Hürmüz Boğazı'ndaki petrol sevkiyat güvenliği riskleri artmış ve Brent petrol fiyatları bu jeopolitik risk primiyle yükseliş eğilimine girmiştir.",
      geopoliticalImpact: "Küresel enerji arzında transit hatların askeri koruma altına alınması ihtiyacını doğurmakta ve ABD'nin bölgedeki askeri angajmanını artırmaktadır.",
      turkeyImpact: "Enerji ithalatçı olan Türkiye'nin doğalgaz ve petrol ithalat maliyetlerini artırarak cari açık ve enflasyon hedeflerini zorlaştıracaktır.",
      financialImpact: "Akaryakıt fiyatlarında zam riskine yol açabilir, cari dengede bozulma beklentisiyle TL varlıklar üzerinde baskı oluşturabilir.",
      longTerm: "Küresel enerji tedarik rotalarının çeşitlendirilmesi ve yenilenebilir enerji yatırımlarının dünya genelinde hızlandırılması.",
      isCritical: true,
      whyImportant: "Küresel petrol arzının yaklaşık %20'sinin geçtiği Hürmüz Boğazı'nın güvenliği, dünya enerji fiyatlarını belirleyen en kritik etkendir.",
      whoAffected: "Global enerji ithalatcı ülkeler, rafineriler, nakliye şirketleri ve tüketiciler.",
      followUp: "Hürmüz Boğazı'ndaki askeri devriye faaliyetleri ve petrol ihraç eden ülkelerin (OPEC) üretim açıklamaları."
    }
  },
  {
    id: "real-7",
    source: "AP News",
    title: "Ukrayna'nın Hazar Denizi'ndeki Rus Tesislerine Saldırıları ve Lojistik Kriz",
    body: "Ukrayna askeri unsurlarının Hazar Denizi'nde Rus lojistik tesislerini vurması, Rusya ile İran arasındaki askeri ve ticari tedarik rotalarında ciddi aksamalara yol açtı. Güvenlik analistleri Hazar Denizi'nin yeni bir çatışma havzası haline geldiğini belirtiyor.",
    category: "Uluslararası İlişkiler",
    subType: "Savunma ve Güvenlik",
    timestamp: "2026-07-28T07:30:00+03:00",
    isRelevant: true,
    analysis: {
      summary: "Ukrayna'nın Hazar Denizi'ndeki Rus askeri-lojistik noktalarına yönelik saldırıları, Rusya ile İran arasındaki tedarik zincirinde aksamalara yol açmıştır.",
      geopoliticalImpact: "Hazar havzasının çatışma alanı haline gelmesi, bölgedeki Türk devletlerinin (Azerbaycan, Kazakistan, Türkmenistan) Hazar geçişli ticaret yollarının güvenliğini tehdit etmektedir.",
      turkeyImpact: "Hazar geçişli 'Orta Koridor' lojistik projesinin güvenliği üzerinde risk oluşturarak Türkiye'nin bölgesel ticaret hedeflerini olumsuz etkileyebilir.",
      financialImpact: "Bölgedeki transit lojistik sigorta maliyetlerini artıracak ve Hazar havzasından yapılan enerji sevkiyatlarında risk primini yükseltecektir.",
      longTerm: "Rusya-İran stratejik askeri ittifakının lojistik olarak zorlaşması ve Hazar Denizi'nin güvenliğine dair yeni kıyıdaş mutabakat arayışları.",
      isCritical: true,
      whyImportant: "Hazar Denizi, Rusya ile Asya/Orta Doğu arasındaki en korunaklı tedarik rotasıydı; buranın vurulması savaşın coğrafi sınırlarının genişlediğini gösterir.",
      whoAffected: "Rusya ve İran orduları, Orta Koridor ticaretini kullanan lojistik firmaları ve Hazar kıyıdaş ülkeleri.",
      followUp: "Hazar kıyısında konuşlu Rus donanmasının askeri misilleme hareketleri ve Azerbaycan'ın bölgedeki diplomatik temasları."
    }
  },
  {
    id: "real-8",
    source: "Reuters Markets",
    title: "Avustralya Merkez Bankası (RBA) Faiz Artırım Sinyalleri",
    body: "RBA Başkanı Michele Bullock, çekirdek enflasyonun hedeflerin üzerinde kalmaya devam ettiğini belirterek, enflasyonu düşürmek için gerekirse faiz oranlarını daha da artırmaya hazır olduklarını duyurdu. Küresel sıkı para duruşu mesajı verildi.",
    category: "Finans ve Ekonomi",
    subType: "Para Politikası",
    timestamp: "2026-07-28T06:00:00+03:00",
    isRelevant: true,
    analysis: {
      summary: "RBA Başkanı Bullock, enflasyonun yüksek seyretmesi sebebiyle para politikasını daha da sıkılaştırabileceklerini ve ek faiz artışlarının masada olduğunu bildirmiştir.",
      geopoliticalImpact: "Küresel ölçekte sıkı para politikası duruşunun sona ermesinin henüz erken olduğuna dair gelişmiş ülkeler arasında bir fikir birliği oluşturabilir.",
      turkeyImpact: "Gelişmiş ülkelerde faizlerin yüksek kalması, Türkiye gibi gelişmekte olan ülkelere yönelik yabancı sermaye akış hızını yavaşlatabilecek küresel bir likidite kısıtı yaratabilir.",
      financialImpact: "Küresel tahvil faizlerinde hafif yükseliş ve hisse senedi piyasalarında temkinli duruşu tetikler.",
      longTerm: "Küresel enflasyon dalgasının tamamen sönümlenmesinin beklenenden daha uzun süreceği tezini güçlendirir.",
      isCritical: false
    }
  },
  {
    id: "real-9",
    source: "ABD Merkez Bankası (Fed)",
    title: "Federal Rezerv (Fed) Temmuz Toplantısı Başladı: Faiz İndirimi İpuçları Aranıyor",
    body: "Fed'in Temmuz ayı FOMC toplantısı bugün başlarken, faiz oranlarının %5.25-5.50 aralığında sabit tutulması ve Eylül ayı indirim sinyallerinin netleşmesi beklenmektedir.",
    category: "Finans ve Ekonomi",
    subType: "Para Politikası",
    timestamp: "2026-07-28T11:00:00+03:00",
    isRelevant: true,
    analysis: {
      summary: "Fed'in Temmuz ayı FOMC toplantısı bugün başlarken, faiz oranlarının %5.25-5.50 aralığında sabit tutulması ve Eylül ayı indirim sinyallerinin netleşmesi beklenmektedir.",
      geopoliticalImpact: "Küresel dolar likiditesinin gelişmekte olan piyasalara geri dönüş eğilimini hızlandıracaktır.",
      turkeyImpact: "Dış borçlanma faizlerinde gerileme sağlayarak Türkiye hazinesinin borçlanma maliyetlerini düşürecektir.",
      financialImpact: "Küresel borsalarda yükseliş, gelişmekte olan ülke tahvillerinde alım ve altın fiyatlarında yukarı yönlü hareketleri tetikleyebilir.",
      longTerm: "Küresel para politikasında sıkılaşma döngüsünün resmen sona erdiğinin teyit edilmesi.",
      isCritical: true,
      whyImportant: "Dünya finansal piyasalarının yönünü belirleyecek en önemli merkez bankası kararıdır.",
      whoAffected: "Global hisse senedi ve tahvil yatırımcıları, borçlu ülkeler, emtia tüccarları.",
      followUp: "Yarın akşam açıklanacak olan Fed faiz kararı ve Powell'ın basın toplantısı satır araları."
    }
  },
  {
    id: "real-10",
    source: "Avrupa Birliği",
    title: "Avrupa Birliği Yeni Yapay Zeka Yasası (AI Act) Uyum Kılavuzu",
    body: "Avrupa Birliği Komisyonu, dünyanın ilk kapsamlı yapay zeka mevzuatı olan AI Act'e yönelik üye ülkelerin uyması gereken teknik standart kılavuzunu yayımlamıştır.",
    category: "Hukuk ve Mevzuat",
    subType: "Mevzuat",
    timestamp: "2026-07-28T10:30:00+03:00",
    isRelevant: true,
    analysis: {
      summary: "Avrupa Birliği, dünyanın ilk kapsamlı yapay zeka mevzuatı olan AI Act'e yönelik üye ülkelerin uyması gereken teknik standart kılavuzunu yayımlamıştır.",
      geopoliticalImpact: "Küresel yapay zeka standartlarında Brüksel'in düzenleyici gücünü artırarak ABD ve Çin karşısında standart belirleyici rol oynar.",
      turkeyImpact: "AB pazarına yazılım ihraç eden Türk teknoloji firmalarının AI Act standartlarına uyum sağlaması zorunlu hale gelecektir.",
      financialImpact: "Teknoloji firmalarının uyum maliyetlerini artırırken, denetim ve danışmanlık sektörlerinde yeni iş kolları yaratacaktır.",
      longTerm: "Güvenilir ve etik yapay zeka teknolojilerinin dünya genelinde yasal altyapısının standartlaşması.",
      isCritical: false
    }
  },
  {
    id: "real-11",
    source: "NATO",
    title: "NATO Karadeniz Güvenlik İş Birliği Anlaşması ve Ortak Devriyeler",
    body: "NATO, Karadeniz'de seyrüsefer ve mayın güvenliğinin sağlanması amacıyla kıyıdaş üye ülkelerin katılımıyla ortak güvenlik koordinasyon planını kabul etti.",
    category: "Uluslararası İlişkiler",
    subType: "Savunma ve Güvenlik",
    timestamp: "2026-07-28T09:00:00+03:00",
    isRelevant: true,
    analysis: {
      summary: "NATO, Karadeniz'de seyrüsefer ve mayın güvenliğinin sağlanması amacıyla kıyıdaş üye ülkelerin katılımıyla ortak güvenlik koordinasyon planını kabul etti.",
      geopoliticalImpact: "Rusya'nın Karadeniz'deki deniz hareketliliğini dengelemeyi hedefler ve bölgedeki caydırıcılığı artırır.",
      turkeyImpact: "Türkiye'nin öncülük ettiği MCM Black Sea operasyonunun diplomatik meşruiyetini ve bölgesel koordinasyonunu güçlendirir.",
      financialImpact: "Karadeniz nakliye rotalarındaki denizcilik sigorta primlerini düşürerek bölgesel dış ticaret maliyetlerini azaltabilir.",
      longTerm: "Karadeniz'in uluslararası seyrüsefer güvenliğinin kalıcı olarak koruma altına alınması.",
      isCritical: false
    }
  },
  {
    id: "real-12",
    source: "Dışişleri Bakanlığı",
    title: "Dışişleri Bakanlığı'ndan Orta Doğu'daki Gerilimin Tırmanmasına İlişkin Güvenlik Uyarısı",
    body: "Dışişleri Bakanlığı, Orta Doğu bölgesinde artan güvenlik riskleri nedeniyle vatandaşlarına bölgedeki bazı ülkelere seyahat etmemeleri konusunda uyarıda bulunmuştur.",
    category: "Uluslararası İlişkiler",
    subType: "Dış Politika",
    timestamp: "2026-07-28T09:15:00+03:00",
    isRelevant: true,
    analysis: {
      summary: "Dışişleri Bakanlığı, Orta Doğu bölgesinde artan güvenlik riskleri nedeniyle vatandaşlarına seyahat uyarısında bulunmuştur.",
      geopoliticalImpact: "Bölgesel çatışmaların yayılma riskine karşı diplomatik önlemlerin artırıldığını göstermektedir.",
      turkeyImpact: "Bölgede bulunan Türk vatandaşlarının güvenliğinin tahliyesi ve diplomatik misyonların koruma düzeylerinin artırılması.",
      financialImpact: "Havayolu şirketlerinin bölge uçuş rotalarında düzenlemeye gitmesine ve petrol fiyatlarında dönemsel risk primine yol açabilir.",
      longTerm: "Bölgesel güvenlik koridorlarında yeni tahliye ve savunma iş birliklerinin önem kazanması.",
      isCritical: false
    }
  },
  {
    id: "real-13",
    source: "Birleşmiş Milletler",
    title: "BM Güvenlik Konseyi Sudan ve Doğu Afrika İnsani Yardım Koridorları Kararı",
    body: "BM Güvenlik Konseyi, Sudan'daki çatışmalardan etkilenen sivillere insani yardım ulaştırılması için sınır kapılarının açık tutulması kararını oy birliğiyle uzatmıştır.",
    category: "Uluslararası İlişkiler",
    subType: "Diplomasi",
    timestamp: "2026-07-28T08:45:00+03:00",
    isRelevant: true,
    analysis: {
      summary: "BM Güvenlik Konseyi, Sudan'daki çatışmalardan etkilenen sivillere insani yardım ulaştırılması için sınır kapılarının açık tutulması kararını uzatmıştır.",
      geopoliticalImpact: "Afrika Boynuzu'nda insani krizin yayılmasını engellemede küresel mutabakatın sürdüğünü göstermektedir.",
      turkeyImpact: "Türkiye'nin Afrika'daki insani yardım projeleri ve diplomatik arabuluculuk faaliyetleri için güvenli zemin sağlar.",
      financialImpact: "Küresel yardım fonlarından bölgeye yapılacak finansman akışını kolaylaştırır.",
      longTerm: "Bölgesel göç dalgalarının sınırlandırılması ve istikrarın korunması.",
      isCritical: false
    }
  },
  {
    id: "real-14",
    source: "Dünya Bankası",
    title: "Dünya Bankası Türkiye Yeşil Sanayi Projesi Kredi Dilimini Onayladı",
    body: "Dünya Bankası, Türkiye'deki organize sanayi bölgelerinin yeşil dönüşüm yatırımlarında kullanılmak üzere onaylanan kredi paketinin yeni dilimini serbest bırakmıştır.",
    category: "Finans ve Ekonomi",
    subType: "Kredi Onayı",
    timestamp: "2026-07-28T11:30:00+03:00",
    isRelevant: true,
    analysis: {
      summary: "Dünya Bankası, Türkiye'deki organize sanayi bölgelerinin yeşil dönüşüm yatırımlarında kullanılmak üzere yeni kredi dilimini serbest bırakmıştır.",
      geopoliticalImpact: "Türkiye'nin uluslararası kalkınma kuruluşlarıyla yürüttüğü yeşil finans iş birliğini pekiştirir.",
      turkeyImpact: "Sanayi tesislerinin karbon emisyonlarını azaltmasına, modernizasyonuna ve dış pazarlarda rekabet gücünü korumasına katkı sağlar.",
      financialImpact: "Türkiye'ye uzun vadeli ve düşük maliyetli doğrudan yabancı kredi girişi sağlayarak sermaye dengesini destekler.",
      longTerm: "Sanayide yeşil mutabakat standartlarına uyumun hızlandırılması ve temiz enerji altyapısının kurulması.",
      isCritical: false
    }
  }
];

// App State
let state = {
  currentDate: "2026-07-28",
  simulatedTime: "12:10",
  events: [...rawEvents],
  filters: {
    source: "all",
    category: "all",
    selectedSource: "all"
  },
  assistantRules: {
    neutralMode: true,
    officialGazetteStrict: true,
    readingTimeTarget: "2 dakikada özet"
  }
};

// Collapses or expands a bulletin section on click
window.toggleSection = function(headerElement) {
  const section = headerElement.closest('.bulletin-section');
  if (section) {
    section.classList.toggle('collapsed');
  }
};

const SOURCE_URLS = {
  "Türkiye Cumhuriyeti Resmî Gazete": "https://www.resmigazete.gov.tr",
  "TCMB": "https://www.tcmb.gov.tr",
  "Hazine ve Maliye Bakanlığı": "https://www.hmb.gov.tr",
  "Ticaret Bakanlığı": "https://www.ticaret.gov.tr",
  "Enerji ve Tabii Kaynaklar Bakanlığı": "https://enerji.gov.tr",
  "Dışişleri Bakanlığı": "https://www.mfa.gov.tr",
  "Reuters World": "https://www.reuters.com/world/",
  "Reuters Markets": "https://www.reuters.com/markets/",
  "AP News": "https://apnews.com",
  "Financial Times": "https://www.ft.com",
  "IMF": "https://www.imf.org",
  "Dünya Bankası": "https://www.worldbank.org",
  "Avrupa Merkez Bankası (ECB)": "https://www.ecb.europa.eu",
  "ABD Merkez Bankası (Fed)": "https://www.federalreserve.gov",
  "NATO": "https://www.nato.int",
  "Avrupa Birliği": "https://europa.eu",
  "Birleşmiş Milletler": "https://www.un.org"
};

// ==========================================
// UTILITY FUNCTIONS & FILTERS
// ==========================================

// Checks if a Resmi Gazete item should be accepted under strict rules
function isResmiGazeteItemRelevant(item) {
  if (item.category !== "Resmî Gazete" && item.category !== "Hukuk ve Mevzuat") return true;
  
  const irrelevantSubtypes = [
    "Personel Ataması", 
    "Akademik İlan", 
    "Bireysel Duyuru",
    "Atama Kararı"
  ];
  
  if (irrelevantSubtypes.includes(item.subType)) {
    return false;
  }
  
  const relevantKeywords = [
    "ithalat", "ihracat", "vergi", "faiz", "gümrük", "karar sayısı", "tarife", 
    "enerji", "yatırım", "finans", "banka", "tahvil", "kamu ihale", "anlaşma", "protokol",
    "yönetmelik", "tebliğ", "hukuk", "karar", "mahkeme", "anayasa", "iptal", "disiplin", "okul"
  ];
  
  const text = (item.title + " " + item.body).toLowerCase();
  return relevantKeywords.some(keyword => text.includes(keyword));
}

// Get filtered items for the active bulletin
function getProcessedEvents() {
  let items = state.events.map(item => {
    const isRelevant = item.analysis != null && isResmiGazeteItemRelevant(item);
    return {
      ...item,
      isRelevant
    };
  });

  if (state.filters.selectedSource && state.filters.selectedSource !== "all") {
    items = items.filter(item => item.source === state.filters.selectedSource);
  }

  return items;
}

// Countdown to 09:00 next day
function updateCountdown() {
  const countdownEl = document.getElementById("countdown-timer");
  if (!countdownEl) return;
  
  const now = new Date();
  let target = new Date();
  target.setHours(9, 0, 0, 0);
  
  if (now.getHours() >= 9) {
    target.setDate(target.getDate() + 1);
  }
  
  const diffMs = target - now;
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  
  countdownEl.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Generate unique mock analysis based on title/body keywords when user inputs custom news
function generateMockAnalysis(title, body, category, source, subType) {
  const cleanTitle = title.trim();
  const cleanBody = body.trim();
  
  // Extract keywords for dynamic responses
  const hasFaiz = /faiz|tcmb|fed|ecb|merkez bankası/gi.test(cleanTitle + cleanBody);
  const hasEnerji = /enerji|gaz|petrol|doğalgaz|sondaj/gi.test(cleanTitle + cleanBody);
  const hasSavunma = /savunma|nato|askeri|silah|türk silahlı/gi.test(cleanTitle + cleanBody);
  const hasTicaret = /ithalat|ihracat|gümrük|ticaret|vergi/gi.test(cleanTitle + cleanBody);
  
  let summary = `Son gelişmelere göre, ${source} kaynaklı açıklamada ${cleanTitle.toLowerCase()} konusu ele alınmıştır.`;
  let geopolitical = "Küresel dengeler açısından tarafların müzakerelerini ve bölgesel nüfuz mücadelelerini etkilemektedir.";
  let turkey = "Türkiye'nin jeopolitik konumlanması ve dış diplomatik ilişkileri üzerinde dengeli bir etkisi olacaktır.";
  let financial = "Piyasalarda risk primlerinin seyrine ve yerel döviz kurlarının hareketliliğine göre fiyatlanacaktır.";
  let longTerm = "Sürecin uzun vadede ilgili sektörlerde kurumsallaşma ve yapısal değişimler getirmesi beklenmektedir.";
  
  if (hasFaiz) {
    summary = `Para politikası cephesinde faiz oranları ve parasal sıkılaşma adımları piyasaların ana gündemini oluşturmaktadır.`;
    geopolitical = "Küresel likiditenin gelişmekte olan piyasalara akış yönünü ve doların rezerv para statüsünü etkiler.";
    turkey = "TCMB'nin sıkı duruşu çerçevesinde TL cinsi varlıkların çekiciliğini artırırken, borçlanma maliyetlerini yüksek tutar.";
    financial = "Tahvil faizleri, banka mevduat oranları ve Borsa İstanbul hisse senedi çarpanları üzerinde doğrudan baskı oluşturur.";
    longTerm = "Enflasyon beklentilerinin çıpalanması ve sürdürülebilir büyüme ortamının oluşturulması hedeflenir.";
  } else if (hasEnerji) {
    summary = `Enerji arz güvenliği ve yerli üretim kapasitesinin artırılmasına yönelik kritik teknik adımlar atılmaktadır.`;
    geopolitical = "Enerji koridorlarında Türkiye'nin geçiş ve merkez ülke rolünü güçlendirirken ithalatçı ülkelere bağımlılığı azaltır.";
    turkey = "Cari açığın en önemli bileşeni olan enerji ithalat faturalarını azaltarak döviz ihtiyacını baskılar.";
    financial = "Enerji sektörü hisseleri üzerinde olumlu yansırken, cari denge kanalıyla makro göstergeleri destekler.";
    longTerm = "Türkiye'nin enerji bağımsızlığı oranını artırarak dış şoklara karşı bağışıklığını güçlendirir.";
  } else if (hasSavunma) {
    summary = `Savunma sanayiinde yerlilik oranının artırılması ve ittifak içi askeri koordinasyonun güçlendirilmesi hedeflenmektedir.`;
    geopolitical = "Bölgesel caydırıcılık dengesini Türkiye lehine değiştirmekte ve NATO çerçevesindeki ağırlığını artırmaktadır.";
    turkey = "Yerli savunma sanayi şirketlerinin sipariş defterlerini büyütürken milli güvenlik doktrinlerini pekiştirir.";
    financial = "Savunma sanayi hisselerine (ASELS vb.) talep yaratabilir ve ihracat gelirleri kanalıyla döviz girdisini artırır.";
    longTerm = "Milli teknolojilerde dışa bağımlılığın bitmesi ve yüksek katma değerli savunma ihracatının kalıcı hale gelmesi.";
  } else if (hasTicaret) {
    summary = `Ticari sınırlamalar, ek gümrük yükümlülükleri ve yerli sanayiyi koruma tedbirleri yürürlüğe konmaktadır.`;
    geopolitical = "Küresel ticaret savaşları ve korumacılık eğilimlerinin bölgesel tedarik zincirlerine olan etkisini yansıtır.";
    turkey = "Yerli üreticilerin pazar payını korumasına destek verirken ithal girdi maliyetlerinde dönemsel artış riski taşır.";
    financial = "Dış ticaret dengesi ve cari dengede iyileşme yaratarak rezerv birikimine dolaylı katkı sunar.";
    longTerm = "Yerli üretimin teşvik edilmesi ve stratejik sektörlerde üretim kapasitesinin millileştirilmesi.";
  }
  
  return {
    summary,
    geopoliticalImpact: geopolitical,
    turkeyImpact: turkey,
    financialImpact: financial,
    longTerm,
    isCritical: false
  };
}

// Generate the raw Markdown output format of the bulletin
function generateMarkdownBulletin() {
  const processed = getProcessedEvents();
  const dateStr = state.currentDate;
  
  let md = `# Günlük Sabah Bülteni\n\n`;
  md += `(${dateStr})\n\n`;
  
  // 1. Resmi Gazete Section
  md += `## 📜 Resmî Gazete\n\n`;
  const rgItems = processed.filter(item => item.category === "Resmî Gazete");
  const relevantRg = rgItems.filter(item => item.isRelevant);
  
  if (relevantRg.length === 0) {
    md += `* Bugün ekonomi, finans ve ticaret alanlarında analiz gerektiren bir Resmî Gazete kararı bulunmamaktadır.\n\n`;
  } else {
    relevantRg.forEach(item => {
      const a = item.analysis;
      md += `### 📌 ${item.title}\n\n`;
      md += `📄 ${a.summary}\n\n`;
      md += `* **Jeopolitik Etkisi:** ${a.geopoliticalImpact}\n`;
      md += `* **Türkiye Açısından Etkisi:** ${a.turkeyImpact}\n`;
      md += `* **Finansal Etkisi:** ${a.financialImpact}\n`;
      md += `* **Uzun Vadeli Olası Sonuçları:** ${a.longTerm}\n\n`;
    });
  }
  
  // 2. Uluslararası İlişkiler Section
  md += `## 🌍 Uluslararası İlişkiler\n\n`;
  const uiItems = processed.filter(item => item.category === "Uluslararası İlişkiler" && item.isRelevant);
  if (uiItems.length === 0) {
    md += `* Son 24 saat içinde bu kapsamda kritik bir diplomatik gelişme kaydedilmemiştir.\n\n`;
  } else {
    uiItems.forEach(item => {
      const a = item.analysis;
      md += `### 📌 ${item.title}\n\n`;
      md += `📄 ${a.summary}\n\n`;
      md += `* **Jeopolitik Etkisi:** ${a.geopoliticalImpact}\n`;
      md += `* **Türkiye Açısından Etkisi:** ${a.turkeyImpact}\n`;
      md += `* **Finansal Etkisi:** ${a.financialImpact}\n`;
      md += `* **Uzun Vadeli Olası Sonuçları:** ${a.longTerm}\n\n`;
    });
  }
  
  // 3. Finans ve Ekonomi Section
  md += `## 💹 Finans ve Ekonomi\n\n`;
  const feItems = processed.filter(item => item.category === "Finans ve Ekonomi" && item.isRelevant);
  if (feItems.length === 0) {
    md += `* Son 24 saat içinde bu kapsamda kritik bir ekonomik gelişme kaydedilmemiştir.\n\n`;
  } else {
    feItems.forEach(item => {
      const a = item.analysis;
      md += `### 📌 ${item.title}\n\n`;
      md += `📄 ${a.summary}\n\n`;
      md += `* **Jeopolitik Etkisi:** ${a.geopoliticalImpact}\n`;
      md += `* **Türkiye Açısından Etkisi:** ${a.turkeyImpact}\n`;
      md += `* **Finansal Etkisi:** ${a.financialImpact}\n`;
      md += `* **Uzun Vadeli Olası Sonuçları:** ${a.longTerm}\n\n`;
    });
  }
  
  // 4. Bugün Takip Edilecek Gelişmeler
  md += `## 📅 Bugün Takip Edilecek Gelişmeler\n\n`;
  const criticalItems = processed.filter(item => item.isRelevant && item.analysis && item.analysis.isCritical);
  if (criticalItems.length === 0) {
    md += `* Bugün için beklenen kritik bir ekonomik veri veya resmi toplantı takvimi bulunmamaktadır.\n\n`;
  } else {
    criticalItems.forEach(item => {
      md += `* **${item.source}:** ${item.analysis.followUp}\n`;
    });
    md += `\n`;
  }
  
  // 5. Bugünün En Kritik 5 Gelişmesi
  md += `## 🎯 Bugünün En Kritik 5 Gelişmesi\n\n`;
  const top5 = criticalItems.slice(0, 5);
  if (top5.length === 0) {
    md += `* Bugün için en kritik 5 gelişme sınıflandırmasına giren öğe bulunmamaktadır.\n\n`;
  } else {
    top5.forEach((item, index) => {
      const a = item.analysis;
      md += `### ${index + 1}. ${item.title}\n\n`;
      md += `* **Neden önemli?** ${a.whyImportant}\n`;
      md += `* **Kimleri etkiliyor?** ${a.whoAffected}\n`;
      md += `* **Önümüzdeki günlerde ne takip edilmeli?** ${a.followUp}\n\n`;
    });
  }
  
  return md;
}

// ==========================================
// RENDER ENGINE (DOM MANIPULATION)
// ==========================================

// Renders the source lists and their online/fetched status
function renderSources() {
  const sourcesContainer = document.getElementById("sources-list");
  if (!sourcesContainer) return;
  
  sourcesContainer.innerHTML = "";
  SOURCES.forEach(source => {
    const count = state.events.filter(e => e.source === source).length;
    const isResmiGazete = source.includes("Resmî Gazete");
    const filteredCount = state.events.filter(e => e.source === source && !isResmiGazeteItemRelevant(e)).length;
    
    const li = document.createElement("li");
    li.className = "source-item-container";
    if (state.filters.selectedSource === source) {
      li.classList.add("active");
    }
    
    let statusClass = "status-online";
    let statusText = "Senkronize";
    
    if (count > 0) {
      statusText = `${count} İçerik`;
      if (isResmiGazete && filteredCount > 0) {
        statusText += ` (${filteredCount} Filtrelendi)`;
      }
    }
    
    const url = SOURCE_URLS[source] || "https://www.google.com";
    const filterActive = state.filters.selectedSource === source;
    
    li.innerHTML = `
      <div class="source-item-header" onclick="toggleSourceDropdown(this)">
        <div class="source-info">
          <span class="source-name">${source}</span>
          <span class="source-meta">${statusText}</span>
        </div>
        <span class="status-indicator ${statusClass}"></span>
      </div>
      <div class="source-dropdown-content">
        <a href="${url}" target="_blank" class="dropdown-link-btn">🔗 Resmi Siteye Git</a>
        <button onclick="filterBySource('${source}', this)" class="dropdown-filter-btn ${filterActive ? 'active' : ''}">
          ${filterActive ? '❌ Filtreyi Kaldır' : '📰 Analizleri Filtrele'}
        </button>
      </div>
    `;
    sourcesContainer.appendChild(li);
  });
}

// Renders the news events list that went into the pipeline
function renderEventsList() {
  const container = document.getElementById("events-pipeline-list");
  if (!container) return;
  
  container.innerHTML = "";
  
  state.events.forEach(item => {
    const isRelevant = isResmiGazeteItemRelevant(item);
    const card = document.createElement("div");
    card.className = `pipeline-card ${isRelevant ? 'accepted' : 'filtered'}`;
    
    let badgeText = item.category;
    if (item.category === "Resmî Gazete") {
      badgeText += ` / ${item.subType}`;
    }
    
    const badgeClass = item.category === 'Resmî Gazete' ? 'badge-rg' : 
                       item.category === 'Uluslararası İlişkiler' ? 'badge-ui' : 
                       item.category === 'Hukuk ve Mevzuat' ? 'badge-law' : 'badge-fe';
    
    card.innerHTML = `
      <div class="pipeline-card-header">
        <span class="badge ${badgeClass}">${badgeText}</span>
        <span class="pipeline-time">${(item.timestamp && item.timestamp.length >= 16) ? item.timestamp.substring(11, 16) : "09:00"}</span>
      </div>
      <h4 class="pipeline-title">${item.title}</h4>
      <p class="pipeline-desc">${item.body.substring(0, 100)}...</p>
      <div class="pipeline-status">
        <span>Kaynak: <strong>${item.source}</strong></span>
        <span class="status-label">${isRelevant ? '✅ Analize Dahil' : '❌ Filtre Kuralları (Hariç)'}</span>
      </div>
    `;
    
    container.appendChild(card);
  });
}

// Render the visual bulletin view
function renderVisualBulletin() {
  const processed = getProcessedEvents();
  
  // Render Hero Section (Top Critical Event or fallback to latest event)
  const heroTitle = document.getElementById("hero-title");
  const heroSummary = document.getElementById("hero-summary");
  const heroCategory = document.getElementById("hero-category");
  const heroDate = document.getElementById("hero-date");
  
  if (heroTitle && heroSummary) {
    const criticalItems = processed.filter(item => item.isRelevant && item.analysis && item.analysis.isCritical);
    const fallbackItems = processed.filter(item => item.isRelevant && item.analysis);
    const topEvent = criticalItems.length > 0 ? criticalItems[0] : (fallbackItems.length > 0 ? fallbackItems[0] : null);
    
    if (topEvent) {
      heroTitle.innerHTML = `<a href="${topEvent.link || '#'}" target="_blank" style="color: inherit; text-decoration: none;">${topEvent.title}</a>`;
      heroSummary.textContent = topEvent.analysis.summary;
      heroCategory.textContent = topEvent.category + (topEvent.subType ? ` / ${topEvent.subType}` : '');
      heroDate.textContent = (topEvent.timestamp && topEvent.timestamp.length >= 10) ? topEvent.timestamp.substring(0, 10) : state.currentDate;
    } else {
      heroTitle.textContent = "Aktif Kritik Gelişme Bulunmamaktadır";
      heroSummary.textContent = "Bugün için analiz süzgecine giren yüksek öncelikli bir kritik gelişme bulunmamaktadır. Tüm sistemler normal seyretmektedir.";
      heroCategory.textContent = "Genel Durum";
      heroDate.textContent = state.currentDate;
    }
  }
  
  // Render Resmi Gazete Section
  const rgContainer = document.getElementById("rg-bulletin-container");
  if (rgContainer) {
    rgContainer.innerHTML = "";
    const rgItems = processed.filter(item => item.category === "Resmî Gazete");
    const relevantRg = rgItems.filter(item => item.isRelevant);
    const filteredRg = rgItems.filter(item => !item.isRelevant);
    
    // Tab controls for RG
    const tabWrapper = document.createElement("div");
    tabWrapper.className = "rg-tabs";
    tabWrapper.innerHTML = `
      <button class="rg-tab-btn active" id="rg-relevant-tab-btn" onclick="switchRgTab('relevant')">Analiz Edilenler (${relevantRg.length})</button>
      <button class="rg-tab-btn" id="rg-filtered-tab-btn" onclick="switchRgTab('filtered')">Filtreyle Elenenler (${filteredRg.length})</button>
    `;
    rgContainer.appendChild(tabWrapper);
    
    // Relevant items div
    const relevantDiv = document.createElement("div");
    relevantDiv.id = "rg-relevant-list";
    relevantDiv.className = "rg-tab-content active";
    
    if (relevantRg.length === 0) {
      relevantDiv.innerHTML = `<div class="empty-section-msg">Bugün analiz süzgecine giren Resmi Gazete kararı bulunmamaktadır.</div>`;
    } else {
      relevantRg.forEach(item => {
        relevantDiv.appendChild(createAnalysisCard(item));
      });
    }
    rgContainer.appendChild(relevantDiv);
    
    // Filtered items div
    const filteredDiv = document.createElement("div");
    filteredDiv.id = "rg-filtered-list";
    filteredDiv.className = "rg-tab-content";
    
    if (filteredRg.length === 0) {
      filteredDiv.innerHTML = `<div class="empty-section-msg">Filtrelenen karar bulunmamaktadır.</div>`;
    } else {
      filteredRg.forEach(item => {
        const div = document.createElement("div");
        div.className = "filtered-rg-item";
        div.innerHTML = `
          <div class="filtered-rg-meta">
            <span class="filtered-rg-badge">${item.subType}</span>
            <span class="filtered-rg-reason">Gerekçe: Personel/İlan/Bireysel Karar (Hariç Tutuldu)</span>
          </div>
          <h5><a href="${item.link || '#'}" target="_blank" class="analysis-card-link">${item.title}</a></h5>
          <p>${item.body}</p>
        `;
        filteredDiv.appendChild(div);
      });
    }
    rgContainer.appendChild(filteredDiv);
  }
  
  // Render Uluslararası İlişkiler
  const uiContainer = document.getElementById("ui-bulletin-container");
  if (uiContainer) {
    uiContainer.innerHTML = "";
    const uiItems = processed.filter(item => item.category === "Uluslararası İlişkiler" && item.isRelevant);
    if (uiItems.length === 0) {
      uiContainer.innerHTML = `<div class="empty-section-msg">Son 24 saatte bu kategoride kritik gelişme bulunmamaktadır.</div>`;
    } else {
      uiItems.forEach(item => {
        uiContainer.appendChild(createAnalysisCard(item));
      });
    }
  }
  
  // Render Hukuk ve Mevzuat
  const lawContainer = document.getElementById("law-bulletin-container");
  if (lawContainer) {
    lawContainer.innerHTML = "";
    const lawItems = processed.filter(item => item.category === "Hukuk ve Mevzuat" && item.isRelevant);
    if (lawItems.length === 0) {
      lawContainer.innerHTML = `<div class="empty-section-msg">Son 24 saatte bu kategoride hukuki gelişme bulunmamaktadır.</div>`;
    } else {
      lawItems.forEach(item => {
        lawContainer.appendChild(createAnalysisCard(item));
      });
    }
  }

  // Render Finans ve Ekonomi
  const feContainer = document.getElementById("fe-bulletin-container");
  if (feContainer) {
    feContainer.innerHTML = "";
    const feItems = processed.filter(item => item.category === "Finans ve Ekonomi" && item.isRelevant);
    if (feItems.length === 0) {
      feContainer.innerHTML = `<div class="empty-section-msg">Son 24 saatte bu kategoride kritik gelişme bulunmamaktadır.</div>`;
    } else {
      feItems.forEach(item => {
        feContainer.appendChild(createAnalysisCard(item));
      });
    }
  }
  
  // Render Takip Edilecekler
  const trackingContainer = document.getElementById("tracking-bulletin-container");
  if (trackingContainer) {
    trackingContainer.innerHTML = "";
    const criticalItems = processed.filter(item => item.isRelevant && item.analysis && item.analysis.isCritical);
    if (criticalItems.length === 0) {
      trackingContainer.innerHTML = `<li>Bugün için beklenen spesifik bir takvim maddesi yok.</li>`;
    } else {
      criticalItems.forEach(item => {
        const li = document.createElement("li");
        li.className = "tracking-item-li";
        li.innerHTML = `<span class="tracking-source">${item.source}:</span> <span class="tracking-desc">${item.analysis.followUp}</span>`;
        trackingContainer.appendChild(li);
      });
    }
  }
  
  // Render Kritik 5 Gelişme
  const criticalContainer = document.getElementById("critical-bulletin-container");
  if (criticalContainer) {
    criticalContainer.innerHTML = "";
    const criticalItems = processed.filter(item => item.isRelevant && item.analysis && item.analysis.isCritical);
    const top5 = criticalItems.slice(0, 5);
    
    if (top5.length === 0) {
      criticalContainer.innerHTML = `<div class="empty-section-msg">Kritik seviyede sınıflandırılmış gelişme bulunmamaktadır.</div>`;
    } else {
      top5.forEach((item, index) => {
        const a = item.analysis;
        const card = document.createElement("div");
        card.className = "critical-top-card";
        card.innerHTML = `
          <div class="critical-number">0${index + 1}</div>
          <div class="critical-top-content">
            <h4><a href="${item.link || '#'}" target="_blank" class="analysis-card-link">${item.title}</a></h4>
            <div class="critical-details-grid">
              <div class="critical-detail-item">
                <span class="detail-label">📌 Neden önemli?</span>
                <p class="detail-val">${a.whyImportant}</p>
              </div>
              <div class="critical-detail-item">
                <span class="detail-label">👥 Kimleri etkiliyor?</span>
                <p class="detail-val">${a.whoAffected}</p>
              </div>
              <div class="critical-detail-item">
                <span class="detail-label">🔍 Ne takip edilmeli?</span>
                <p class="detail-val">${a.followUp}</p>
              </div>
            </div>
          </div>
        `;
        criticalContainer.appendChild(card);
      });
    }
  }
  
  // Render raw markdown editor text
  const rawTextarea = document.getElementById("raw-markdown-content");
  if (rawTextarea) {
    rawTextarea.value = generateMarkdownBulletin();
  }
}

// Helper to create an analysis card
function createAnalysisCard(item) {
  const a = item.analysis;
  const card = document.createElement("div");
  card.className = "analysis-card";
  
  card.innerHTML = `
    <div class="analysis-card-header">
      <h4 class="analysis-card-title">
        <a href="${item.link || '#'}" target="_blank" class="analysis-card-link">📌 ${item.title}</a>
      </h4>
      <span class="analysis-card-source">${item.source} (${(item.timestamp && item.timestamp.length >= 16) ? item.timestamp.substring(11, 16) : "09:00"})</span>
    </div>
    
    <div class="analysis-summary-box">
      <strong>📄 Kısa Özet:</strong> ${a.summary}
    </div>
    
    <div class="analysis-details-grid">
      <div class="analysis-detail-box">
        <span class="detail-icon">🌍</span>
        <div class="detail-text">
          <strong>Jeopolitik Etkisi:</strong>
          <p>${a.geopoliticalImpact}</p>
        </div>
      </div>
      <div class="analysis-detail-box">
        <span class="detail-icon">🇹🇷</span>
        <div class="detail-text">
          <strong>Türkiye Açısından Etkisi:</strong>
          <p>${a.turkeyImpact}</p>
        </div>
      </div>
      <div class="analysis-detail-box">
        <span class="detail-icon">💰</span>
        <div class="detail-text">
          <strong>Finansal Etkisi:</strong>
          <p>${a.financialImpact}</p>
        </div>
      </div>
      <div class="analysis-detail-box">
        <span class="detail-icon">📈</span>
        <div class="detail-text">
          <strong>Uzun Vadeli Olası Sonuçları:</strong>
          <p>${a.longTerm}</p>
        </div>
      </div>
    </div>
  `;
  
  return card;
}



// Switch between visual tabs in Resmi Gazete
window.switchRgTab = function(type) {
  const relList = document.getElementById("rg-relevant-list");
  const filtList = document.getElementById("rg-filtered-list");
  const relBtn = document.getElementById("rg-relevant-tab-btn");
  const filtBtn = document.getElementById("rg-filtered-tab-btn");
  
  if (type === 'relevant') {
    if (relList) relList.classList.add("active");
    if (filtList) filtList.classList.remove("active");
    if (relBtn) relBtn.classList.add("active");
    if (filtBtn) filtBtn.classList.remove("active");
  } else {
    if (relList) relList.classList.remove("active");
    if (filtList) filtList.classList.add("active");
    if (relBtn) relBtn.classList.remove("active");
    if (filtBtn) filtBtn.classList.add("active");
  }
};

// Switch between Visual Dashboard and Raw Markdown View
window.toggleViewMode = function(mode) {
  const visualView = document.getElementById("visual-bulletin-view");
  const rawView = document.getElementById("raw-bulletin-view");
  const visualBtn = document.getElementById("btn-view-visual");
  const rawBtn = document.getElementById("btn-view-raw");
  
  if (mode === 'visual') {
    if (visualView) visualView.classList.add("active");
    if (rawView) rawView.classList.remove("active");
    if (visualBtn) visualBtn.classList.add("active");
    if (rawBtn) rawBtn.classList.remove("active");
  } else {
    if (visualView) visualView.classList.remove("active");
    if (rawView) rawView.classList.add("active");
    if (visualBtn) visualBtn.classList.remove("active");
    if (rawBtn) rawBtn.classList.add("active");
  }
};

// Copy Markdown to Clipboard
window.copyMarkdown = function() {
  const rawTextarea = document.getElementById("raw-markdown-content");
  if (!rawTextarea) return;
  
  rawTextarea.select();
  document.execCommand("copy");
  
  const copyBtn = document.getElementById("btn-copy-md");
  if (!copyBtn) return;
  const origText = copyBtn.innerHTML;
  copyBtn.innerHTML = "✅ Kopyalandı!";
  copyBtn.style.background = "#238636";
  
  setTimeout(() => {
    copyBtn.innerHTML = origText;
    copyBtn.style.background = "";
  }, 2000);
};

// Download Markdown File
window.downloadMarkdown = function() {
  const content = generateMarkdownBulletin();
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `sabah-bulteni-${state.currentDate}.md`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ==========================================
// INTERACTIVE SIMULATOR (NEWS INJECTOR)
// ==========================================

// Handle injecting custom items
window.handleInjectNews = function(event) {
  event.preventDefault();
  
  const source = document.getElementById("inject-source").value;
  const title = document.getElementById("inject-title").value;
  const body = document.getElementById("inject-body").value;
  const category = document.getElementById("inject-category").value;
  const subType = document.getElementById("inject-subtype").value;
  const isCritical = document.getElementById("inject-critical").checked;
  
  if (!title || !body) {
    alert("Lütfen başlık ve içerik giriniz.");
    return;
  }
  
  const now = new Date();
  const timestamp = now.toISOString();
  
  const basicAnalysis = generateMockAnalysis(title, body, category, source, subType);
  
  if (isCritical) {
    basicAnalysis.isCritical = true;
    basicAnalysis.whyImportant = "Kullanıcı tarafından kritik olarak işaretlenen stratejik gelişme.";
    basicAnalysis.whoAffected = "İlgili ticari grupları, piyasa yapıcıları ve politika yapıcıları.";
    basicAnalysis.followUp = "Önümüzdeki günlerde bu kararın ikincil mevzuat adımları takip edilmeli.";
  }
  
  const newEvent = {
    id: `custom-${Date.now()}`,
    source,
    title,
    body,
    category,
    subType,
    timestamp,
    isRelevant: true,
    analysis: basicAnalysis
  };
  
  state.events.unshift(newEvent);
  
  document.getElementById("inject-title").value = "";
  document.getElementById("inject-body").value = "";
  document.getElementById("inject-critical").checked = false;
  
  renderSources();
  renderEventsList();
  renderVisualBulletin();
  
  const tabBtn = document.getElementById("btn-view-visual");
  if (tabBtn) {
    tabBtn.classList.add("pulse");
    setTimeout(() => tabBtn.classList.remove("pulse"), 1000);
  }
};

// Handle category change in injector to toggle subtypes display
window.handleInjectorCategoryChange = function() {
  const category = document.getElementById("inject-category").value;
  const subtypeWrapper = document.getElementById("subtype-wrapper");
  const sourceDropdown = document.getElementById("inject-source");
  
  if (!subtypeWrapper || !sourceDropdown) return;
  
  if (category === "Resmî Gazete") {
    subtypeWrapper.style.display = "block";
    sourceDropdown.value = "Türkiye Cumhuriyeti Resmî Gazete";
  } else {
    subtypeWrapper.style.display = "none";
    if (sourceDropdown.value === "Türkiye Cumhuriyeti Resmî Gazete") {
      sourceDropdown.value = "Reuters World";
    }
  }
};

// ==========================================
// SOURCE DROPDOWN & FILTER LOGIC
// ==========================================

window.toggleSourceDropdown = function(headerElement) {
  const container = headerElement.parentElement;
  const isActive = container.classList.contains("active");
  console.log("KAYNAK SEKMESİ: toggleSourceDropdown tetiklendi! Seçilen kaynak:", container.querySelector(".source-name")?.textContent, "Aktiflik durumu:", !isActive);
  
  // Close all other dropdowns
  document.querySelectorAll(".source-item-container").forEach(el => {
    el.classList.remove("active");
  });
  
  // Open clicked one if it wasn't active
  if (!isActive) {
    container.classList.add("active");
  }
};

window.filterBySource = function(sourceName, buttonElement) {
  if (state.filters.selectedSource === sourceName) {
    state.filters.selectedSource = "all";
    buttonElement.classList.remove("active");
    buttonElement.innerHTML = "📰 Analizleri Filtrele";
  } else {
    state.filters.selectedSource = sourceName;
    
    document.querySelectorAll(".dropdown-filter-btn").forEach(btn => {
      btn.classList.remove("active");
      btn.innerHTML = "📰 Analizleri Filtrele";
    });
    
    buttonElement.classList.add("active");
    buttonElement.innerHTML = "❌ Filtreyi Kaldır";
  }
  
  // Update Header Subtitle
  const dateEl = document.getElementById("bulletin-date");
  if (dateEl) {
    if (state.filters.selectedSource !== "all") {
      dateEl.parentElement.innerHTML = `Tarih: <span id="bulletin-date">${state.currentDate}</span> | Filtre: <strong>${state.filters.selectedSource}</strong>`;
    } else {
      dateEl.parentElement.innerHTML = `Tarih: <span id="bulletin-date">${state.currentDate}</span> | Son 24 Saatlik Gelişmeler`;
    }
  }
  
  renderVisualBulletin();
  renderSources();
};

// ==========================================
// APP INITIALIZATION
// ==========================================

async function loadBulletinData() {
  try {
    const response = await fetch('data_parsed.json');
    if (!response.ok) throw new Error("Dosya okunamadı");
    const data = await response.json();
    if (data.date && data.events) {
      state.currentDate = data.date;
      state.events = data.events;
      console.log("Dinamik bülten verisi başarıyla yüklendi:", data.date);
    }
  } catch (err) {
    console.warn("Dinamik bülten yüklenemedi, yerel mock veri havuzu kullanılıyor:", err.message);
  }
}


// Newsletter email subscription helper
window.subscribeEmail = function() {
  const emailInput = document.getElementById("sub-email");
  const msgEl = document.getElementById("sub-msg");
  if (!emailInput || !msgEl) return;
  
  const email = emailInput.value.trim();
  if (!email) {
    msgEl.textContent = "Lütfen e-posta adresinizi girin.";
    msgEl.className = "sub-msg error";
    return;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    msgEl.textContent = "Geçersiz e-posta adresi.";
    msgEl.className = "sub-msg error";
    return;
  }
  
  // Show loading state
  msgEl.textContent = "Kaydediliyor...";
  msgEl.className = "sub-msg";
  msgEl.style.display = "block";
  
  // Submit to Google Sheet Web App
  fetch("https://script.google.com/macros/s/AKfycbzZR2jLwFmUBE8xtHaKmcFHK6vUV5KOCb7Wr2cMIw4R9Xdr2Mxq4_6hNb39zFGo75Kf/exec", {
    method: "POST",
    mode: "no-cors", // Required to bypass CORS restrictions on Google Scripts
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email: email })
  })
  .then(() => {
    localStorage.setItem("subscribed_email", email);
    msgEl.textContent = "Başarıyla kaydoldunuz! Raporlar bu adrese iletilecektir.";
    msgEl.className = "sub-msg success";
    emailInput.value = "";
  })
  .catch(err => {
    console.error(err);
    msgEl.textContent = "Kayıt sırasında hata oluştu. Lütfen tekrar deneyin.";
    msgEl.className = "sub-msg error";
  });
};

// Theme Toggle Logic
window.toggleTheme = function() {
  const body = document.body;
  if (body.classList.contains("light-theme")) {
    body.classList.remove("light-theme");
    body.classList.add("dark-theme");
    localStorage.setItem("theme", "dark");
  } else {
    body.classList.remove("dark-theme");
    body.classList.add("light-theme");
    localStorage.setItem("theme", "light");
  }
};

window.toggleSidebar = function() {
  console.log("KONTROL PANELİ: toggleSidebar tetiklendi! sidebar-open sınıfı eklendi/çıkarıldı.");
  document.body.classList.toggle("sidebar-open");
};

window.toggleCategorySection = function(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.toggle("collapsed");
    
    // Toggle state icon indicator
    const icon = section.querySelector(".accordion-icon");
    if (icon) {
      icon.textContent = section.classList.contains("collapsed") ? "▲" : "▼";
    }
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  // On mobile viewports, automatically open the control panel drawer on load
  if (window.innerWidth <= 768) {
    document.body.classList.add("sidebar-open");
  }

  // Initialize Theme from localStorage
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.body.classList.remove("light-theme", "dark-theme");
  document.body.classList.add(`${savedTheme}-theme`);

  // Set top-bar calendar date in Turkish locale
  const topBarDate = document.getElementById("top-bar-date");
  if (topBarDate) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    topBarDate.textContent = "Bugün: " + new Date().toLocaleDateString('tr-TR', options);
  }

  // Load dynamic data from json if available
  await loadBulletinData();

  const dateEl = document.getElementById("bulletin-date");
  if (dateEl) dateEl.textContent = state.currentDate;
  
  renderSources();
  renderEventsList();
  renderVisualBulletin();
  
  updateCountdown();
  setInterval(updateCountdown, 1000);
});
