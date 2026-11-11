/* Smart Scan beta: browser OCR + editable rule-based item extraction; no API keys. */
'use strict';
(()=>{
const $=id=>document.getElementById(id), fmt=n=>Number(n||0).toLocaleString('uk-UA',{minimumFractionDigits:2,maximumFractionDigits:2})+' ₴';
let items=[],selectedCategory='';
const categories=['Їжа','Транспорт','Покупки',"Здоров'я",'Розваги','Доставка','Житло','Перекази','Інше'];
const guess=n=>/карт|цибул|молок|хліб|яйц|сир|масл|яблук|банан|кав|чай|помід|огір|м'яс|кур|цук|борош|рис|греч|макарон|сіль|вода|сік|йогурт|шокол|печив|ковбас|сметан|хлiб|батон|food|bread|milk/i.test(n)?'Їжа':/шампун|мил|порош|гель|паст|сервет|пакет|засіб|побут|щітк|підгуз/i.test(n)?'Покупки':'Інше';
const cleanPrice=x=>Number(String(x).replace(/\s/g,'').replace(',','.'));
const parse=text=>{const result=[];for(const raw of text.split(/\r?\n/)){const line=raw.trim();if(!line||/^(разом|сума|всього|готівк|решта|знижка|пдв|фіскальн|термінал|чек №|дата|касир|оплата|картка|total|subtotal|change|tax)/i.test(line))continue;
const match=line.match(/^(.{2,90}?)\s+(?:(?:\d+[.,]\d+\s*[xх*]\s*)?)(\d{1,6}[.,]\d{2})(?:\s*(?:грн|uah|₴))?\s*$/i);
if(match){const name=match[1].replace(/^[\d.\-*\s]+/,'').trim();const price=cleanPrice(match[2]);if(name.length>=2&&price>0&&price<100000)result.push({name,price,category:guess(name)})}}
return result};
let detectedPayment=false;
const isPaymentText=text=>/платник|одержувач|отримувач|призначення платежу|засіб оплати|платіжна картка|безготівкова|номер транзакції|нова пошта|переказ коштів|платіжна інструкція|сума до сплати/i.test(text);
const findPaymentAmount=text=>{
 const patterns=[/сума\s+до\s+сплати\s*[:№-]?\s*([\d\s]+[.,]\d{2})/i,/сума\s+платежу\s*[:№-]?\s*([\d\s]+[.,]\d{2})/i,/всього\s+до\s+сплати\s*[:№-]?\s*([\d\s]+[.,]\d{2})/i,/разом\s*[:№-]?\s*([\d\s]+[.,]\d{2})/i,/сума\s*[:№-]?\s*([\d\s]+[.,]\d{2})/i];
 for(const pat of patterns){const match=text.match(pat);if(match){const n=cleanPrice(match[1]);if(Number.isFinite(n)&&n>0&&n<10000000)return n}}return null;
};
const getStore=text=>{const t=text.toLowerCase();if(/нова пошта|novaposhta/.test(t))return 'Нова Пошта';if(/сільпо|silpo/.test(t))return 'Сільпо';if(/атб|атб-маркет/.test(t))return 'АТБ';return ''};
const setMode=mode=>{detectedPayment=mode==='payment';$('paymentEditor').hidden=!detectedPayment;$('receiptItems').hidden=detectedPayment;$('addReceiptRow').hidden=detectedPayment;$('receiptTotal').parentElement.hidden=detectedPayment;$('totalHint').hidden=detectedPayment};
const analyze=text=>{
 const mode=$('receiptMode').value;
 const payment=mode==='payment'||(mode==='auto'&&isPaymentText(text));setMode(payment?'payment':'receipt');
 if(!$('receiptStore').value.trim())$('receiptStore').value=getStore(text);
 if(payment){items=[];const amount=findPaymentAmount(text);$('paymentAmount').value=amount??'';
 const store=$('receiptStore').value.trim();$('paymentNote').value=store?('Оплата · '+store):'Оплата за квитанцією';$('paymentCategory').value=/нова пошта|доставк|посилк/i.test(text)?'Доставка':'Інше';
 $('paymentHint').textContent=amount===null?'Не вдалося впевнено визначити суму. Введи її вручну за квитанцією.':'Знайдено можливу суму '+fmt(amount)+'. Перевір її перед збереженням.';
 $('scanStatus').textContent='Визначено квитанцію / платіж. Перевір суму, категорію та опис.';
 }else{items=parse(text);$('scanStatus').textContent=`Товарний чек: знайдено ${items.length} позицій. Перевір назви та ціни.`}
 renderItems();$('totalHint').textContent=!payment&&items.length===0?'Товарів не знайдено. Додай позицію вручну або обери режим «Квитанція / оплата».':'';
};
$('receiptMode').onchange=()=>analyze($('receiptText').value);
const renderItems=()=>{const root=$('receiptItems');root.replaceChildren();for(let i=0;i<items.length;i++){const item=items[i],row=document.createElement('div');row.className='receipt-row';const name=document.createElement('input');name.value=item.name;name.placeholder='Назва товару';name.setAttribute('aria-label','Назва товару');name.oninput=()=>{item.name=name.value};const price=document.createElement('input');price.type='number';price.step='0.01';price.min='0';price.value=item.price;price.setAttribute('aria-label','Ціна товару');price.oninput=()=>{item.price=Math.max(0,Number(price.value)||0);total()};const select=document.createElement('select');select.setAttribute('aria-label','Категорія');for(const c of categories){const o=document.createElement('option');o.value=c;o.textContent=c;select.append(o)}select.value=item.category;select.onchange=()=>item.category=select.value;const del=document.createElement('button');del.type='button';del.className='delete';del.textContent='×';del.setAttribute('aria-label','Прибрати товар');del.onclick=()=>{items.splice(i,1);renderItems()};row.append(name,price,select,del);root.append(row)}total()};
const total=()=>$('receiptTotal').textContent=fmt(items.reduce((s,x)=>s+(Number(x.price)||0),0));
$('receiptDate').value=new Date().toLocaleDateString('sv-SE');
$('addReceiptRow').onclick=()=>{items.push({name:'',price:0,category:'Інше'});renderItems()};
$('parseReceipt').onclick=()=>analyze($('receiptText').value);
$('receiptPhoto').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;$('scanStatus').textContent='Завантаження розпізнавача…';try{if(!window.Tesseract){await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';script.onload=resolve;script.onerror=()=>reject(new Error('Не вдалося завантажити OCR. Перевір інтернет.'));document.head.append(script)})}const worker=await Tesseract.createWorker('ukr+eng',1,{logger:m=>{if(m.status==='recognizing text')$('scanStatus').textContent='Розпізнавання: '+Math.round(m.progress*100)+'%'}});try{const result=await worker.recognize(file);$('receiptText').value=result.data.text;analyze(result.data.text)}finally{await worker.terminate()}}catch(err){$('scanStatus').textContent='Не вдалося розпізнати фото: '+err.message+'. Можна вставити текст вручну.'}};
$('saveReceipt').onclick=()=>{
 const store=$('receiptStore').value.trim()||'Документ',date=$('receiptDate').value||new Date().toLocaleDateString('sv-SE');
 const id=crypto.randomUUID?.()||String(Date.now());let entry;
 if(detectedPayment){const amount=Number($('paymentAmount').value);if(!Number.isFinite(amount)||amount<=0){alert('Вкажи правильну суму платежу.');return}
 entry={id,type:'expense',amount:Math.round(amount*100)/100,category:$('paymentCategory').value,date,note:$('paymentNote').value.trim()||'Оплата · '+store,store,source:'payment'};
 }else{const valid=items.filter(x=>x.name.trim()&&Number(x.price)>0);if(!valid.length){alert('Додай хоча б один товар із ціною.');return}
 const sum=valid.reduce((acc,x)=>acc+Number(x.price),0);entry={id,type:'expense',amount:Math.round(sum*100)/100,category:'Покупки',date,note:'Чек · '+store,items:valid.map(x=>({...x,price:Number(x.price)})),store,source:'receipt'};
 }
 if(!confirm('Зберегти витрату '+fmt(entry.amount)+'? Перевір суму на документі.'))return;
 state.transactions.push(entry);save();window.renderBudget();items=[];$('receiptPhoto').value='';$('receiptText').value='';$('receiptStore').value='';$('paymentAmount').value='';$('paymentNote').value='';$('scanStatus').textContent='Витрату збережено. Перевір її в списку операцій.';renderItems();
};
function renderReceiptItems(){renderItems()}
window.showCategoryDetails=name=>{selectedCategory=selectedCategory===name?'':name;window.refreshCategoryDetails()};
window.refreshCategoryDetails=()=>{const root=$('categoryDetails');root.replaceChildren();if(!selectedCategory)return;const heading=document.createElement('h3');heading.textContent='Товари · '+selectedCategory;root.append(heading);const entries=[];for(const t of state.transactions){if(t.type!=='expense'||typeof t.date!=='string'||t.date.slice(0,7)!==month())continue;if(Array.isArray(t.items)){for(const item of t.items)if(item.category===selectedCategory)entries.push({name:item.name,price:item.price,date:t.date,store:t.store||''})}else if(t.category===selectedCategory)entries.push({name:t.note||'Витрата',price:t.amount,date:t.date,store:''})}if(!entries.length){const p=document.createElement('p');p.className='note';p.textContent='Позицій цього місяця немає';root.append(p)}for(const e of entries){const line=document.createElement('div');line.className='line item-line';const left=document.createElement('span');left.textContent=e.name+' · '+e.date+(e.store?' · '+e.store:'');const right=document.createElement('strong');right.textContent=fmt(e.price);line.append(left,right);root.append(line)}};
// Replace category overview amounts with per-item categories, while preserving legacy transactions.
const originalRender=renderItems; // only receipt editor, budget render remains in app.js
const categoryContainer=$('categories');window.renderScanCategories=()=>{const sums={};for(const t of current().filter(t=>t.type==='expense')){if(Array.isArray(t.items)){for(const it of t.items)sums[it.category]=(sums[it.category]||0)+Number(it.price||0)}else sums[t.category]=(sums[t.category]||0)+Number(t.amount||0)}categoryContainer.replaceChildren();const max=Math.max(1,...Object.values(sums));for(const [name,sum] of Object.entries(sums).sort((a,b)=>b[1]-a[1])){const row=document.createElement('div');row.className='barrow';const lab=document.createElement('div');lab.className='barlabel';const btn=document.createElement('button');btn.className='category-toggle';btn.textContent=name+' ▾';btn.onclick=()=>window.showCategoryDetails(name);const v=document.createElement('strong');v.textContent=fmt(sum);lab.append(btn,v);const track=document.createElement('div');track.className='track';const fill=document.createElement('div');fill.className='fill';fill.style.width=(100*sum/max)+'%';track.append(fill);row.append(lab,track);categoryContainer.append(row)}if(!Object.keys(sums).length){const p=document.createElement('p');p.className='empty';p.textContent='Додай витрати, щоб побачити розподіл';categoryContainer.append(p)}window.refreshCategoryDetails()};
renderItems();window.renderScanCategories();
})();
