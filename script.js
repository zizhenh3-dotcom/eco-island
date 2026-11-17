// 環保小島：初學者版主程式
// 已填入你先前提供的 Teachable Machine 模型網址。
const MODEL_URL = "https://teachablemachine.withgoogle.com/models/iABirI9qd/";

const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "ecoIslandSave_v2";
// AI 辨識錯誤回報紀錄
const REPORT_STORAGE_KEY = "ecoIslandReports_v1";
let aiReports = JSON.parse(
  localStorage.getItem(REPORT_STORAGE_KEY) || "[]"
);
const UNLOCK_COST = 40;
const EXP_PER_CORRECT = 20;
const FOG_COUNT = 6;
const BUILDINGS = { house: {cost:60, emoji:"🏡", name:"溫馨小屋"}, garden:{cost:40,emoji:"🌳",name:"綠意庭院"} };

let saveData = { nickname:"", exp:0, built:[], quizDone:[] };
let model = null;
let webcam = null;
let selectedImage = null;
let currentCategory = null;
let quizIndex = 0;
let quizAnswered = false;
let quizQuestions = [];

const QUIZ_QUESTION_COUNT = 2;
let pendingBuildType = null;


const knowledge = {
  "紙類": {
    title: "紙類回收小知識",
    text: "乾淨、乾燥的紙張通常可以回收。回收前可先移除塑膠封膜、膠帶及其他不易回收的複合材質；沾到油污或食物的紙類，應依所在地清潔隊規定處理。",
    questions: [
      {q:"回收紙類前，哪一項做法比較適當？",a:["保持乾淨乾燥並移除異材質","把整疊紙泡水","和廚餘混在一起"],correct:0},
      {q:"沾滿油污的紙餐盒應該怎麼做？",a:["直接當成乾淨紙類回收","依地方分類規定處理","放進玻璃回收桶"],correct:1},
      {q:"回收紙張前，為什麼要移除塑膠封膜？",a:["讓紙張變重","避免不同材質混在一起","讓紙張變濕"],correct:1},
      {q:"下列哪一種通常屬於可回收紙類？",a:["乾淨的影印紙","沾滿油的衛生紙","用過的紙尿布"],correct:0},
      {q:"紙箱回收前可以先做什麼？",a:["裝入廚餘","壓平並整理乾淨","塗上油漆"],correct:1},
      {q:"紙類回收最需要避免哪種情況？",a:["保持乾燥","混入大量食物殘渣","整理成一疊"],correct:1},
      {q:"報紙通常可以如何處理？",a:["依規定分類回收","丟進廚餘桶","倒入水溝"],correct:0},
      {q:"紙張受潮後，可能造成什麼問題？",a:["增加回收處理困難","自動變成塑膠","變成金屬"],correct:0},
      {q:"紙類回收前，訂書針應如何處理？",a:["視回收規定及情況移除","全部泡在油裡","和廚餘一起丟"],correct:0},
      {q:"下列哪個行為能減少紙類垃圾？",a:["重複使用紙張背面","每天多印幾份文件","把空白紙撕碎丟掉"],correct:0},
      {q:"紙杯是否一定能當作一般紙類回收？",a:["一定可以","不一定，可能有防水複合材質","只要是白色就可以"],correct:1},
      {q:"乾淨紙盒回收前應注意什麼？",a:["確認沒有大量食物殘留","裝滿飲料","和電池混合"],correct:0},
      {q:"紙類回收再利用可以減少什麼？",a:["資源消耗","所有自然資源","地球的氧氣"],correct:0},
      {q:"為什麼不建議把濕紙張和乾淨紙張混在一起？",a:["可能影響紙類回收品質","會讓紙張變成玻璃","會增加紙張厚度"],correct:0},
      {q:"下列哪個最符合紙類減量的概念？",a:["優先使用電子文件","每份文件都印三次","購買不需要的紙製品"],correct:0}
    ]
  },

  "塑膠類": {
    title: "塑膠容器回收小知識",
    text: "塑膠容器回收前，先倒空內容物並簡單清理，依地方規定分類。不同塑膠材質及複合包裝的回收方式可能不同，請留意容器標示與所在地公告。",
    questions: [
      {q:"塑膠瓶回收前，最重要的第一步是？",a:["倒空內容物","裝滿水","和一般垃圾混在一起"],correct:0},
      {q:"所有塑膠製品都一定能放進同一個回收桶嗎？",a:["一定可以","不一定，要看材質與地方規定","只有黑色塑膠可以"],correct:1},
      {q:"寶特瓶回收前應先做什麼？",a:["倒空內容物並依規定整理","裝入沙子","丟進廚餘桶"],correct:0},
      {q:"塑膠容器上的材質標示有什麼用途？",a:["協助辨識塑膠種類","表示容器的重量","表示製造日期而已"],correct:0},
      {q:"下列哪個行為可以減少塑膠垃圾？",a:["自備環保杯","每天使用更多塑膠袋","把塑膠丟進河川"],correct:0},
      {q:"喝完的塑膠飲料瓶應如何處理？",a:["倒空後依規定回收","裝滿廚餘","直接埋進土裡"],correct:0},
      {q:"塑膠袋是否一定可以和塑膠容器一起回收？",a:["一定可以","需依所在地分類規定","只能放進玻璃桶"],correct:1},
      {q:"塑膠垃圾大量進入海洋可能造成什麼影響？",a:["危害海洋生物","讓海水變成淡水","增加珊瑚生長速度"],correct:0},
      {q:"塑膠容器回收前，為什麼要倒空內容物？",a:["減少殘留物污染","讓容器變成金屬","增加容器重量"],correct:0},
      {q:"下列哪一項可能是複合材質包裝？",a:["不同材料結合的飲料包裝","單一材質玻璃瓶","純金屬鋁罐"],correct:0},
      {q:"塑膠製品的回收標誌代表什麼？",a:["提供材質辨識資訊","保證所有地方都能回收","代表可以直接食用"],correct:0},
      {q:"減少一次性塑膠用品的方式是？",a:["使用可重複清洗的餐具","每天拿新的塑膠餐具","把塑膠袋隨地丟棄"],correct:0},
      {q:"塑膠容器沾有大量油污時應如何處理？",a:["依地方回收規定處理","直接當成乾淨容器","丟進紙類桶"],correct:0},
      {q:"回收塑膠可以帶來什麼好處？",a:["讓部分材料有機會再利用","讓塑膠完全消失","讓垃圾自動分類"],correct:0},
      {q:"為什麼不能隨意焚燒塑膠垃圾？",a:["可能產生有害污染物","會製造乾淨的氧氣","能讓塑膠變成食物"],correct:0}
    ]
  },

  "金屬類": {
    title: "金屬回收小知識",
    text: "常見金屬容器如鋁罐、鐵罐具有回收價值。回收前應倒空內容物，並依回收規定分類；尖銳或特殊金屬物品不要直接混入一般容器回收。",
    questions: [
      {q:"鋁罐回收前應先做什麼？",a:["倒空內容物","裝入沙子","包進廚餘"],correct:0},
      {q:"金屬回收的好處之一是？",a:["增加垃圾量","讓材料有機會再製利用","讓海洋更髒"],correct:1},
      {q:"下列哪個物品通常含有金屬？",a:["鋁飲料罐","紙巾","木頭"],correct:0},
      {q:"鐵罐回收前應注意什麼？",a:["倒空內容物並依規定整理","裝滿泥土","和廚餘混合"],correct:0},
      {q:"鋁是一種可以回收再利用的材料嗎？",a:["是","不是","只有下雨天可以"],correct:0},
      {q:"金屬回收可以減少什麼？",a:["部分原料開採需求","所有降雨","植物生長"],correct:0},
      {q:"下列哪一個通常不是金屬製品？",a:["鋁罐","鐵罐","紙盒"],correct:2},
      {q:"為什麼回收金屬具有資源價值？",a:["金屬可經處理再利用","金屬不能製造成新物品","金屬會自動變成水"],correct:0},
      {q:"金屬罐內還有飲料時應該怎麼做？",a:["先倒空內容物","直接裝進紙類桶","再加入更多飲料"],correct:0},
      {q:"遇到尖銳的金屬廢棄物應如何處理？",a:["依規定妥善包裝處理","徒手隨便抓取","丟在地上"],correct:0},
      {q:"回收鋁罐有助於什麼？",a:["節省部分製造所需能源","增加海洋垃圾","製造更多一次性用品"],correct:0},
      {q:"下列哪種物品可能需要另外處理，而非一般金屬容器回收？",a:["大型金屬廢棄物","乾淨鋁飲料罐","一般鐵罐"],correct:0},
      {q:"金屬回收前為什麼要分類？",a:["方便後續處理與再利用","讓金屬變成塑膠","增加垃圾重量"],correct:0},
      {q:"下列哪個做法較符合資源循環？",a:["將符合規定的金屬容器回收","把金屬罐丟進河川","把金屬全部埋在公園"],correct:0},
      {q:"金屬材料回收後可能被製成什麼？",a:["新的金屬產品","天然雲朵","海水"],correct:0}
    ]
  },

  "玻璃類": {
    title: "玻璃回收小知識",
    text: "玻璃容器可依地方規定回收。回收前倒空內容物並注意安全；破裂玻璃應妥善包覆、標示，避免清潔人員受傷，並依地方清運方式處理。",
    questions: [
      {q:"破裂玻璃最重要的是？",a:["徒手拿取","妥善包覆並依規定處理","丟進紙類回收"],correct:1},
      {q:"玻璃容器回收前應？",a:["倒空內容物","裝滿泥土","和廚餘混合"],correct:0},
      {q:"下列哪一項通常屬於玻璃容器？",a:["玻璃飲料瓶","塑膠袋","鋁箔紙"],correct:0},
      {q:"玻璃回收前應注意什麼？",a:["確認內容物已倒空","裝滿沙子","混入紙屑"],correct:0},
      {q:"玻璃可以經過處理後再次利用嗎？",a:["可以","完全不可能","只能變成木頭"],correct:0},
      {q:"破裂玻璃為什麼不能隨意丟棄？",a:["可能造成他人受傷","會讓玻璃變成塑膠","會增加雨水"],correct:0},
      {q:"下列哪一項通常不是玻璃容器？",a:["玻璃醬料瓶","玻璃飲料瓶","塑膠水壺"],correct:2},
      {q:"不同顏色的玻璃是否一定可以混在一起回收？",a:["不一定，依地方規定分類","一定可以","只能混入廚餘"],correct:0},
      {q:"玻璃回收有什麼好處？",a:["讓材料有機會重新利用","讓垃圾完全消失","增加塑膠使用量"],correct:0},
      {q:"玻璃容器回收前，殘留食物應如何處理？",a:["依規定清理","直接倒進回收桶","用泥土填滿"],correct:0},
      {q:"下列哪種玻璃不一定適用一般玻璃容器回收？",a:["耐熱玻璃器皿","一般玻璃飲料瓶","一般玻璃醬料瓶"],correct:0},
      {q:"為什麼玻璃回收需要注意安全？",a:["碎片可能造成割傷","玻璃會發出聲音","玻璃會自己移動"],correct:0},
      {q:"回收玻璃瓶前，可以先做什麼？",a:["倒空並依規定整理","裝滿油污","包進廚餘"],correct:0},
      {q:"玻璃材料回收再製可以減少什麼？",a:["部分原料與資源消耗","所有地震","所有交通事故"],correct:0},
      {q:"遇到大量破損玻璃時，應該怎麼辦？",a:["依所在地清運指引處理","徒手撿拾","混入一般回收容器"],correct:0}
    ]
  },

  "廚餘": {
    title: "廚餘分類小知識",
    text: "廚餘應依所在地分類規定處理。一般可先瀝乾水分，並留意骨頭、硬殼、包裝及其他不屬於廚餘的物品是否需要另外分類。",
    questions: [
      {q:"廚餘回收前可以先做什麼？",a:["瀝乾多餘水分","混入塑膠袋一起丟","倒進紙類桶"],correct:0},
      {q:"吃完的塑膠包裝應該？",a:["當成廚餘","依材質分類處理","埋進土裡"],correct:1},
      {q:"下列哪一項通常屬於廚餘？",a:["剩菜剩飯","塑膠瓶","玻璃杯"],correct:0},
      {q:"廚餘中的多餘水分應如何處理？",a:["先瀝乾","全部倒入紙類桶","混入乾淨紙張"],correct:0},
      {q:"為什麼廚餘不應混入塑膠包裝？",a:["包裝材質需要另外分類","塑膠會變成米飯","可以增加廚餘營養"],correct:0},
      {q:"廚餘依規定回收後，可能用於什麼？",a:["資源再利用","製造玻璃","變成金屬"],correct:0},
      {q:"吃剩的水果果皮通常應如何分類？",a:["依所在地廚餘規定處理","一定放進玻璃桶","當成紙類回收"],correct:0},
      {q:"下列哪個行為能減少廚餘？",a:["適量購買食物","買太多吃不完","把食物隨意丟棄"],correct:0},
      {q:"廚餘中混入大量塑膠袋可能造成什麼問題？",a:["增加後續處理困難","讓廚餘變成金屬","讓食物變新鮮"],correct:0},
      {q:"吃不完的飯菜可以怎麼做？",a:["妥善保存並盡量避免浪費","直接倒入水溝","混進紙類回收"],correct:0},
      {q:"骨頭是否一定可以和所有廚餘一起回收？",a:["不一定，依地方規定","一定可以","只能放進塑膠桶"],correct:0},
      {q:"減少食物浪費有什麼好處？",a:["減少廚餘及資源浪費","增加垃圾量","讓食物更快壞掉"],correct:0},
      {q:"廚餘回收前為什麼要去除非廚餘物品？",a:["提升後續處理品質","讓廚餘變成塑膠","增加包裝重量"],correct:0},
      {q:"下列哪個行為較環保？",a:["依照食量取餐","一次拿很多卻吃不完","把剩菜倒進河川"],correct:0},
      {q:"廚餘分類時最重要的是？",a:["遵守所在地分類規定","所有垃圾都混在一起","把塑膠當成食物"],correct:0}
    ]
  },

  "一般垃圾": {
    title: "一般垃圾小知識",
    text: "無法回收、也不適合做廚餘的廢棄物，依所在地一般垃圾規定處理。減少一次性用品、重複使用物品，能從源頭減少垃圾。",
    questions: [
      {q:"減少一般垃圾的好方法是？",a:["多使用一次性用品","自備環保杯與購物袋","把垃圾丟在路邊"],correct:1},
      {q:"不能回收的垃圾應該？",a:["依一般垃圾規定處理","丟進河川","混入乾淨紙類"],correct:0},
      {q:"下列哪一項通常屬於一般垃圾？",a:["使用過的衛生紙","乾淨的紙箱","乾淨的鋁罐"],correct:0},
      {q:"減少一般垃圾可以從哪裡開始？",a:["減少不必要的消費","增加一次性用品","隨意丟棄垃圾"],correct:0},
      {q:"使用環保袋有什麼好處？",a:["減少一次性塑膠袋使用","增加垃圾量","讓紙類不能回收"],correct:0},
      {q:"垃圾應該丟在哪裡？",a:["指定垃圾桶或清運地點","河川裡","道路中央"],correct:0},
      {q:"下列哪個行為不恰當？",a:["隨手亂丟垃圾","做好垃圾分類","重複使用物品"],correct:0},
      {q:"減少垃圾的三個重要方向之一是？",a:["減量","隨意焚燒","亂倒廢棄物"],correct:0},
      {q:"物品還能正常使用時，可以怎麼做？",a:["繼續使用或轉送他人","立刻丟掉","故意破壞"],correct:0},
      {q:"為什麼垃圾不應該丟進河川？",a:["可能污染水域並危害生物","可以淨化河水","能增加魚類食物"],correct:0},
      {q:"購買商品時，如何減少包裝垃圾？",a:["選擇包裝較簡單的商品","選擇多層不必要包裝","每件商品多包三層"],correct:0},
      {q:"下列哪個符合物品重複使用的概念？",a:["重複使用可清洗的水瓶","每次喝水都買新瓶子","用完就丟掉還能用的物品"],correct:0},
      {q:"垃圾分類錯誤可能造成什麼問題？",a:["增加後續處理困難","讓垃圾自動消失","讓所有物品變成新品"],correct:0},
      {q:"面對不確定分類方式的垃圾，應該怎麼辦？",a:["查詢所在地分類規定","隨便丟進任一回收桶","丟到別人家門口"],correct:0},
      {q:"下列哪個最符合環保生活？",a:["珍惜資源並做好分類","大量浪費食物","隨意棄置垃圾"],correct:0}
    ]
  }
};

// 記錄每個分類已經出現過的題目
const quizHistory = {};

// 隨機抽題：同一分類的題目盡量不重複
function getRandomQuestion(category) {
  const questions = knowledge[category].questions;

  if (!quizHistory[category]) {
    quizHistory[category] = [];
  }

  let available = questions.filter(
    q => !quizHistory[category].includes(q.q)
  );

  if (available.length === 0) {
    quizHistory[category] = [];
    available = questions;
  }

  const index = Math.floor(Math.random() * available.length);
  const question = available[index];

  quizHistory[category].push(question.q);

  return question;
}

// 每次測驗隨機抽取指定數量的題目
function createQuiz(category) {
  const questions = [];

  for (let i = 0; i < QUIZ_QUESTION_COUNT; i++) {
    questions.push(getRandomQuestion(category));
  }

  return questions;
}

function loadSave(){
  try { const raw = localStorage.getItem(STORAGE_KEY); if(raw) saveData = {...saveData,...JSON.parse(raw)}; } catch(e){ console.warn("讀取進度失敗",e); }
}
function persist(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData)); }
function showToast(message){ const t=$("toast"); t.textContent=message; t.classList.remove("hidden"); clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>t.classList.add("hidden"),2600); }
function showModal(id){ $(id).classList.remove("hidden"); }
function hideModal(id){ $(id).classList.add("hidden"); }
function submitAiReport(){
  const correctCategory = $("correctCategory").value;
  const description = $("reportDescription").value.trim();

  if(!correctCategory){
    alert("請先選擇正確的垃圾分類！");
    return;
  }

  const report = {
    predictedCategory: currentCategory,
    correctCategory: correctCategory,
    description: description,
    time: new Date().toLocaleString("zh-TW")
  };

  aiReports.push(report);

  localStorage.setItem(
    REPORT_STORAGE_KEY,
    JSON.stringify(aiReports)
  );

  hideModal("reportModal");
  showToast("感謝回報！已記錄這筆辨識問題。");
}
function enterGame(){
  const name = $("nicknameInput").value.trim();
  if(!name){ alert("請先輸入玩家暱稱！"); return; }
  saveData.nickname = name.slice(0,12); persist(); renderGame();
}
function renderGame(){
  $("loginScreen").classList.add("hidden"); $("gameScreen").classList.remove("hidden");
  $("playerName").textContent = "👤 " + saveData.nickname;
  $("expValue").textContent = saveData.exp;
  renderMap();
}
function renderMap(){
  $("expValue").textContent = saveData.exp;
  const unlocked = Math.min(FOG_COUNT, Math.floor(saveData.exp / UNLOCK_COST));
  document.querySelectorAll(".fog-cloud").forEach((cloud)=>{
    const number = Number(cloud.dataset.fog);
    cloud.classList.toggle("unlocked", number <= unlocked);
  });
  const percent = Math.round(unlocked / FOG_COUNT * 100);
  $("mapProgressText").textContent = `地圖探索進度 ${percent}%`;
  $("mapProgressBar").style.width = percent + "%";
  $("nextUnlockText").textContent = unlocked >= FOG_COUNT ? "🎉 全部土地已解鎖！EXP 可用於建設" : `下一片土地：${(unlocked+1)*UNLOCK_COST} EXP`;
  document.querySelectorAll(".build-plot").forEach(p=>p.style.opacity=unlocked>=FOG_COUNT?1:0);
  renderHouses();
}
function renderHouses(){
  const layer=$("houseLayer"); layer.innerHTML="";
  const positions=[{x:39,y:70},{x:49,y:75},{x:63,y:72},{x:73,y:62},{x:31,y:62},{x:57,y:60}];
  saveData.built.forEach((b,i)=>{
    const pos = (typeof b.x === "number" && typeof b.y === "number") ? {x:b.x,y:b.y} : positions[i%positions.length];
    const el=document.createElement("span");
    el.className="placed-house";el.textContent=b.emoji;el.style.left=pos.x+"%";el.style.top=pos.y+"%";layer.appendChild(el);
  });
}
function openScan(){showModal("scanModal");}
async function loadModel(){
  if(model) return true;
  if(!window.tmImage){$("scanStatus").textContent="模型函式庫尚未載入，請確認網路連線後重新整理。";return false;}
  try{
    $("scanStatus").textContent="正在載入 AI 模型，請稍候…";
    model=await tmImage.load(MODEL_URL+"model.json",MODEL_URL+"metadata.json");
    $("scanStatus").textContent="AI 模型載入完成，可以開始辨識。"; return true;
  }catch(err){console.error(err);$("scanStatus").textContent="模型載入失敗。請確認模型網址、網路連線與模型是否已公開。";return false;}
}
async function startCamera(){
  const ok=await loadModel(); if(!ok)return;
  try{
    if(webcam){webcam.stop();webcam=null;}
    $("webcam-container").innerHTML="";$("imagePreview").classList.add("hidden");
    webcam=new tmImage.Webcam(360,270,true); await webcam.setup(); await webcam.play();
    $("webcam-container").appendChild(webcam.canvas); $("predictBtn").disabled=false;
    $("scanStatus").textContent="相機已開啟，請將垃圾物品放在畫面中央。";
    requestAnimationFrame(cameraLoop);
  }catch(err){console.error(err);$("scanStatus").textContent="無法開啟相機。請允許瀏覽器使用相機，並使用 HTTPS 或 localhost。";}
}
function cameraLoop(){if(webcam&&!$("scanModal").classList.contains("hidden")){webcam.update();requestAnimationFrame(cameraLoop);}}

async function predictImage(){
  const ok = await loadModel();
  if(!ok) return;

  try{
    let predictions;

    if(selectedImage){
      predictions = await model.predict(selectedImage);
    }
    else if(webcam){
      predictions = await model.predict(webcam.canvas);
    }
    else{
      $("scanStatus").textContent = "請先開啟相機或上傳圖片。";
      return;
    }

    predictions.sort((a,b) => b.probability - a.probability);

    const best = predictions[0];
    const category = mapLabel(best.className);

    currentCategory = category;

    $("predictionResult").classList.remove("hidden");

    $("predictionResult").innerHTML = `
      <h3>辨識結果：${escapeHTML(category)}</h3>
      <p>
        模型標籤：${escapeHTML(best.className)}
        ｜信心度：${(best.probability * 100).toFixed(1)}%
      </p>
      <p>辨識成功不會增加 EXP；閱讀知識並答對測驗才會獲得經驗值。</p>
      <button id="openReportBtn" class="secondary-btn">
        ⚠️ 回報辨識錯誤
      </button>
    `;

    $("openReportBtn").addEventListener("click", () => {
      $("correctCategory").value = "";
      $("reportDescription").value = "";
      showModal("reportModal");
    });

    showKnowledge(category);

    $("scanStatus").textContent =
      "辨識完成！先閱讀下方知識，再挑戰測驗。";

  }catch(err){
    console.error(err);
    $("scanStatus").textContent = "辨識時發生問題，請再試一次。";
  }
}

function mapLabel(label){
  const s=String(label).toLowerCase();
  if(/紙|paper|cardboard/.test(s))return "紙類";
  if(/塑膠|寶特瓶|瓶|plastic|pet/.test(s))return "塑膠類";
  if(/鋁|金屬|鐵|metal|can/.test(s))return "金屬類";
  if(/玻璃|glass/.test(s))return "玻璃類";
  if(/廚餘|食物|food|organic/.test(s))return "廚餘";
  return "一般垃圾";
}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}

function showKnowledge(category) {
  const item = knowledge[category];

  $("knowledgePanel").classList.remove("hidden");

  $("knowledgePanel").innerHTML = `
    <h3>📚 ${item.title}</h3>
    <p>${item.text}</p>
    <p class="muted">
      閱讀完成後，接著回答兩道隨機小測驗。
      每答對一題可獲得 ${EXP_PER_CORRECT} EXP。
    </p>
    <button id="startQuizBtn" class="primary-btn">
      我讀完了，開始測驗
    </button>
  `;

  $("quizPanel").classList.add("hidden");

  $("startQuizBtn").addEventListener("click", () => {
    currentCategory = category;
    quizQuestions = createQuiz(category);
    quizIndex = 0;
    quizAnswered = false;
    renderQuestion();
  });
}


function renderQuestion() {
  const q = quizQuestions[quizIndex];

  const panel = $("quizPanel");
  panel.classList.remove("hidden");

  panel.innerHTML = `
    <h3>📝 環保知識測驗（${quizIndex + 1}/${QUIZ_QUESTION_COUNT}）</h3>
    <p class="quiz-question">${q.q}</p>
    <div id="answerOptions"></div>
    <p id="quizFeedback" class="status-text">
      選出你認為正確的答案。
    </p>
  `;

  q.a.forEach((answer, index) => {
    const btn = document.createElement("button");

    btn.className = "answer-btn";
    btn.textContent = String.fromCharCode(65 + index) + ". " + answer;

    btn.addEventListener("click", () => checkAnswer(index));

    $("answerOptions").appendChild(btn);
  });

  quizAnswered = false;
}


function checkAnswer(index) {
  if (quizAnswered) return;

  const q = quizQuestions[quizIndex];
  const feedback = $("quizFeedback");

  if (index === q.correct) {
    quizAnswered = true;

    saveData.exp += EXP_PER_CORRECT;
    persist();
    renderMap();

    feedback.textContent =
      `答對了！獲得 ${EXP_PER_CORRECT} EXP 🎉`;

    document.querySelectorAll(".answer-btn").forEach(btn => {
      btn.disabled = true;
    });

    const next = document.createElement("button");
    next.className = "primary-btn";
    next.style.marginTop = "8px";

    next.textContent =
      quizIndex === QUIZ_QUESTION_COUNT - 1
        ? "完成測驗"
        : "下一題";

    next.addEventListener("click", () => {
      if (quizIndex < QUIZ_QUESTION_COUNT - 1) {
        quizIndex++;
        renderQuestion();
      } else {
        $("quizPanel").innerHTML = `
          <h3>🎉 測驗完成！</h3>
          <p>太棒了！你已完成這次的兩道環保知識測驗。</p>
          <p>本次測驗最多可獲得 ${QUIZ_QUESTION_COUNT * EXP_PER_CORRECT} EXP。</p>
          <p>目前累積 EXP：${saveData.exp}</p>
          <button class="primary-btn" id="retakeQuizBtn">
            再挑戰一次
          </button>
        `;

        $("retakeQuizBtn").addEventListener("click", () => {
          quizQuestions = createQuiz(currentCategory);
          quizIndex = 0;
          quizAnswered = false;
          renderQuestion();
        });
      }
    });

    $("quizPanel").appendChild(next);

  } else {
    feedback.textContent =
      "再想一想，選擇其他答案試試看！答對才會獲得 EXP。";

    showToast("再試一次，你可以的！");
  }
}

function updateBuildButtons(){
  const allUnlocked=saveData.exp>=FOG_COUNT*UNLOCK_COST;
  $("buildIntro").textContent=allUnlocked?"🎉 小島已全部探索完成！選擇建築，放到空曠土地上吧。":`目前還有雲霧尚未散去。需要累積 ${FOG_COUNT*UNLOCK_COST} EXP 才能開始建設。`;
  $("buildHouseBtn").disabled=!allUnlocked||saveData.exp<BUILDINGS.house.cost;
  $("buildGardenBtn").disabled=!allUnlocked||saveData.exp<BUILDINGS.garden.cost;
}
function build(type){
  const allUnlocked=saveData.exp>=FOG_COUNT*UNLOCK_COST;
  if(!allUnlocked){showToast("請先解鎖整張地圖！");return;}
  const item=BUILDINGS[type];if(saveData.exp<item.cost){showToast("EXP 還不夠喔！");return;}
  pendingBuildType=type;
  hideModal("buildModal");
  $("buildStatus").textContent=`已選擇${item.name}。請在地圖上點選一塊空曠草地放置；確認位置後才會扣除 ${item.cost} EXP。`;
  showToast("請在地圖空地上點一下，放置建築！");
}
function placeBuilding(event){
  if(!pendingBuildType)return;
  const map=$("islandMap");
  const rect=map.getBoundingClientRect();
  const x=((event.clientX-rect.left)/rect.width)*100;
  const y=((event.clientY-rect.top)/rect.height)*100;
  // 限制在島嶼中央草地，避免建築放到海面或畫面外。
  if(x<28||x>82||y<48||y>88){showToast("請選擇島嶼中央的空曠草地！");return;}
  const item=BUILDINGS[pendingBuildType];
  if(saveData.exp<item.cost){pendingBuildType=null;showToast("EXP 不足，無法完成建造。");return;}
  saveData.exp-=item.cost;
  saveData.built.push({type:pendingBuildType,emoji:item.emoji,name:item.name,x,y});
  pendingBuildType=null;persist();renderMap();updateBuildButtons();
  $("buildStatus").textContent=`建造成功！${item.name} 已放在你選擇的位置。`;
  showToast("建設完成！小島變得更美了！");
}
function setupEvents(){
  $("startGameBtn").addEventListener("click",enterGame);
  $("nicknameInput").addEventListener("keydown",e=>{if(e.key==="Enter")enterGame();});
  $("openScanBtn").addEventListener("click",openScan);
  $("openBuildBtn").addEventListener("click",()=>{updateBuildButtons();showModal("buildModal");});
  $("openGuideBtn").addEventListener("click",()=>showModal("guideModal"));
  $("changeNameBtn").addEventListener("click",()=>{const name=prompt("請輸入新的玩家暱稱：",saveData.nickname);if(name&&name.trim()){saveData.nickname=name.trim().slice(0,12);persist();$("playerName").textContent="👤 "+saveData.nickname;}});
  $("startCameraBtn").addEventListener("click",startCamera);
  $("predictBtn").addEventListener("click",predictImage);
  $("imageUpload").addEventListener("change",e=>{
    const file=e.target.files[0];if(!file)return;
    const img=$("imagePreview");img.src=URL.createObjectURL(file);img.classList.remove("hidden");selectedImage=img;
    if(webcam){webcam.stop();webcam=null;$("webcam-container").innerHTML="";}
    $("predictBtn").disabled=false;$("scanStatus").textContent="圖片已載入，按「辨識圖片」開始分析。";
  });
  $("buildHouseBtn").addEventListener("click",()=>build("house"));
  $("buildGardenBtn").addEventListener("click",()=>build("garden"));
  $("islandMap").addEventListener("click",placeBuilding);
  document.querySelectorAll("[data-close]").forEach(btn=>btn.addEventListener("click",()=>hideModal(btn.dataset.close)));
  document.querySelectorAll(".modal").forEach(modal=>modal.addEventListener("click",e=>{if(e.target===modal)hideModal(modal.id);}));
}
loadSave();setupEvents();
if(saveData.nickname){$("nicknameInput").value=saveData.nickname;renderGame();}
