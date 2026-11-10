const $ = (id) => document.getElementById(id);
const DB_KEY = "llp_quote_tool_v1";
const money = (n) => new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND",maximumFractionDigits:0}).format(Number(n)||0);
const num = (v) => Math.max(0, Number(v)||0);
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const today = () => new Date().toISOString().slice(0,10);
const escapeHtml = (s="") => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const seedProducts = [
 {id:"p1",sku:"CAM-IP-4MP",name:"Camera IP 4MP hồng ngoại",unit:"Cái",brand:"Hikvision",spec:"4MP, PoE, IR 30m",cost:1250000,price:1680000,vat:.1,required:[],suggested:["BOX-CAM"],labor:180000,laborUnit:"Cái"},
 {id:"p2",sku:"NVR-16CH",name:"Đầu ghi hình IP 16 kênh",unit:"Bộ",brand:"Hikvision",spec:"16CH, hỗ trợ HDD",cost:2850000,price:3650000,vat:.1,required:[],suggested:["HDD-8TB"],labor:250000,laborUnit:"Bộ"},
 {id:"p3",sku:"SW-POE-8",name:"Switch PoE 8 port",unit:"Cái",brand:"TP-Link",spec:"8 port PoE, uplink",cost:1150000,price:1550000,vat:.1,required:[],suggested:[],labor:150000,laborUnit:"Cái"},
 {id:"p4",sku:"SPR-DN15",name:"Đầu phun sprinkler DN15",unit:"Cái",brand:"Theo hồ sơ duyệt",spec:"K-factor theo thiết kế",cost:85000,price:125000,vat:.08,required:[],suggested:["FLEX-DN15"],labor:35000,laborUnit:"Cái"},
 {id:"p5",sku:"SMK-DET",name:"Đầu báo khói quang",unit:"Cái",brand:"Notifier",spec:"Địa chỉ / thường tùy hệ",cost:420000,price:580000,vat:.08,required:[],suggested:["BASE-DET"],labor:85000,laborUnit:"Cái"},
 {id:"p6",sku:"PIPE-DN25",name:"Ống thép mạ kẽm DN25",unit:"Mét",brand:"Theo tiêu chuẩn dự án",spec:"Chiều dài cây 6m",cost:62000,price:82000,vat:.08,required:[],suggested:["CLAMP-DN25"],labor:28000,laborUnit:"Mét"},
 {id:"p7",sku:"BOX-CAM",name:"Hộp kỹ thuật camera",unit:"Cái",brand:"Phụ kiện",spec:"Hộp bảo vệ đầu nối",cost:38000,price:55000,vat:.1,required:[],suggested:[],labor:15000,laborUnit:"Cái"},
 {id:"p8",sku:"HDD-8TB",name:"Ổ cứng giám sát 8TB",unit:"Cái",brand:"WD Purple",spec:"Surveillance HDD",cost:3850000,price:4650000,vat:.1,required:[],suggested:[],labor:50000,laborUnit:"Cái"},
 {id:"p9",sku:"BASE-DET",name:"Đế đầu báo",unit:"Cái",brand:"Phụ kiện",spec:"Đế tương thích đầu báo",cost:45000,price:65000,vat:.08,required:[],suggested:[],labor:10000,laborUnit:"Cái"},
 {id:"p10",sku:"FLEX-DN15",name:"Dây mềm sprinkler DN15",unit:"Bộ",brand:"Phụ kiện",spec:"Dây mềm + đầu nối",cost:190000,price:260000,vat:.08,required:[],suggested:[],labor:45000,laborUnit:"Bộ"},
 {id:"p11",sku:"CLAMP-DN25",name:"Cùm treo ống DN25",unit:"Cái",brand:"Phụ kiện",spec:"Cùm treo + ty ren",cost:12000,price:18000,vat:.08,required:[],suggested:[],labor:8000,laborUnit:"Cái"}
];
const defaultSettings = {
 companyName:"CÔNG TY TNHH VIỄN THÔNG L.L.P",companyPhone:"028.3845.6184",
 companyAddress:"136/11 Đặng Văn Ngữ, P.Phú Nhuận, Tp.HCM",companyTax:"0303057502",
 companyWebsite:"www.llp.com.vn",bankName:"Ngân hàng Sài Gòn Thương Tín - CN Trung Tâm",
 bankAccount:"060005928764",bankOwner:"CÔNG TY TNHH VIỄN THÔNG L.L.P",
 terms:"1/ Báo giá đã bao gồm VAT theo từng dòng.\\n2/ Bảo hành: 12 tháng (trừ khi có thỏa thuận khác).\\n3/ Hình thức thanh toán: Tiền mặt hoặc chuyển khoản.\\n4/ Phương thức thanh toán: 50% trước khi xác nhận, 50% sau khi hoàn thành."
};
let state = loadState();
let currentLines = [];
let savedOptions = [];
let deferredInstall = null;
let editingQuoteId = null;

function loadState(){
 try{
  const raw=localStorage.getItem(DB_KEY);
  if(raw){const data=JSON.parse(raw);return {products:data.products||seedProducts,quotes:data.quotes||[],settings:{...defaultSettings,...data.settings}};}
 }catch(err){console.warn("Không đọc được dữ liệu cũ",err);}
 return {products:seedProducts,quotes:[],settings:{...defaultSettings}};
}
function persist(){localStorage.setItem(DB_KEY,JSON.stringify(state));renderStats();}
function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2400);}
function iconRefresh(){if(window.lucide)window.lucide.createIcons();}
function getVal(id){return $(id).value;}
function setVal(id,v){$(id).value=v??"";}
function setDefaultForm(){setVal("customer","");setVal("project","");setVal("customerAddress","");setVal("customerContact","");setVal("quoteNo",`...../NTL/LLP26`);setVal("quoteDate",today());setVal("validDays",15);setVal("quoteStatus","Nháp");setVal("globalDiscount",0);setVal("shipping",0);setVal("handling",0);setVal("inspection",0);setVal("extraVat",.1);setVal("optionName","Option A - Cao cấp");currentLines=[];savedOptions=[];editingQuoteId=null;$("quoteVersion").textContent="Bản nháp";renderLines();calculate();}
function lineFromProduct(p,qty=1){return {id:uid(),productId:p.id,sku:p.sku,name:p.name,brand:p.brand,spec:p.spec,unit:p.unit,qty,price:p.price,cost:p.cost,vat:p.vat,labor:p.labor||0,laborVat:p.vat,discount:0,required:p.required||[],suggested:p.suggested||[],isManual:false};}
function addProductToQuote(productId, autoAccessories=true){
 const p=state.products.find(x=>x.id===productId);if(!p)return;
 const existing=currentLines.find(x=>x.productId===p.id);
 if(existing)existing.qty+=1;else currentLines.push(lineFromProduct(p));
 if(autoAccessories){
  const accessories=(p.required||[]).map(sku=>state.products.find(x=>x.sku.toLowerCase()===sku.toLowerCase())).filter(Boolean);
  accessories.forEach(a=>{const found=currentLines.find(x=>x.productId===a.id);if(found)found.qty+=1;else currentLines.push(lineFromProduct(a));});
 }
 renderLines();calculate();toast("Đã thêm thiết bị vào cấu hình");
}
function searchProducts(){
 const q=getVal("productSearch").trim().toLowerCase();
 const found=state.products.filter(p=>!q||[p.sku,p.name,p.brand,p.spec].join(" ").toLowerCase().includes(q)).slice(0,30);
 $("searchResults").innerHTML=found.map(p=>`<button class="product-pick" data-add="${escapeHtml(p.id)}"><span class="min-w-0"><b class="block truncate text-sm text-navy-950">${escapeHtml(p.name)}</b><span class="block truncate text-xs text-slate-500">${escapeHtml(p.sku)} · ${escapeHtml(p.brand||"")} · ${escapeHtml(p.spec||"")}</span></span><span class="shrink-0 text-right"><b class="block text-xs">${money(p.price)}</b><span class="text-xs text-blue-700">+ Thêm</span></span></button>`).join("")||'<div class="col-span-full p-4 text-center text-sm text-slate-400">Không tìm thấy thiết bị phù hợp.</div>';
 document.querySelectorAll("[data-add]").forEach(b=>b.addEventListener("click",()=>addProductToQuote(b.dataset.add)));
}
function renderLines(){
 const body=$("quoteLines");
 if(!currentLines.length){body.innerHTML='<tr><td colspan="10" class="p-6 text-center text-slate-400">Chưa có thiết bị. Tìm kiếm và chọn thiết bị ở phía trên.</td></tr>';return;}
 body.innerHTML=currentLines.map((l,i)=>`<tr class="border-b border-slate-100 align-middle">
 <td class="p-2"><b class="block">${escapeHtml(l.name)}</b><span class="text-xs text-slate-500">${escapeHtml(l.sku||"")} ${l.brand?"· "+escapeHtml(l.brand):""}</span></td>
 <td class="p-2">${escapeHtml(l.unit)}</td>
 <td class="p-2"><input class="line-input" type="number" min="0" step="0.01" value="${l.qty}" data-field="qty" data-index="${i}"></td>
 <td class="p-2"><input class="line-input line-price" type="number" min="0" value="${l.price}" data-field="price" data-index="${i}"></td>
 <td class="p-2"><select class="line-input" data-field="vat" data-index="${i}">${[0,.08,.1].map(v=>`<option value="${v}" ${Number(l.vat)===v?"selected":""}>${v*100}%</option>`).join("")}</select></td>
 <td class="p-2"><input class="line-input line-price" type="number" min="0" value="${l.labor}" data-field="labor" data-index="${i}"></td>
 <td class="p-2"><select class="line-input" data-field="laborVat" data-index="${i}">${[0,.08,.1].map(v=>`<option value="${v}" ${Number(l.laborVat)===v?"selected":""}>${v*100}%</option>`).join("")}</select></td>
 <td class="p-2"><input class="line-input" type="number" min="0" max="100" step=".1" value="${l.discount}" data-field="discount" data-index="${i}"></td>
 <td class="p-2 whitespace-nowrap font-semibold">${money(lineNet(l))}</td><td class="p-2"><button class="rounded p-2 text-red-600 hover:bg-red-50" data-remove="${i}" title="Xóa dòng"><i data-lucide="trash-2"></i></button></td></tr>`).join("");
 body.querySelectorAll("[data-field]").forEach(el=>el.addEventListener("change",()=>{const l=currentLines[Number(el.dataset.index)];const f=el.dataset.field;l[f]=f==="vat"||f==="laborVat"?Number(el.value):num(el.value);renderLines();calculate();}));
 body.querySelectorAll("[data-remove]").forEach(el=>el.addEventListener("click",()=>{currentLines.splice(Number(el.dataset.remove),1);renderLines();calculate();}));
 iconRefresh();
}
function lineNet(l){const d=Math.min(100,num(l.discount))/100;return num(l.qty)*((num(l.price)+num(l.labor))*(1-d));}
function compute(){
 const globalD=Math.min(100,num(getVal("globalDiscount")))/100;
 const result={material:0,labor:0,extra:0,before:0,vat:{0:0,.08:0,.1:0},cost:0,after:0,lines:[]};
 currentLines.forEach(l=>{
  const d=1-Math.min(100,num(l.discount))/100;
  const m=num(l.qty)*num(l.price)*d*(1-globalD);
  const w=num(l.qty)*num(l.labor)*d*(1-globalD);
  const c=num(l.qty)*(num(l.cost)+num(l.laborCost||0));
  result.material+=m;result.labor+=w;result.cost+=c;result.vat[Number(l.vat)]+=m*Number(l.vat);result.vat[Number(l.laborVat)]+=w*Number(l.laborVat);
  result.lines.push({line:l,material:m,labor:w});
 });
 const extras=[["shipping",num(getVal("shipping"))],["handling",num(getVal("handling"))],["inspection",num(getVal("inspection"))]];
 extras.forEach(([,v])=>{result.extra+=v;result.vat[Number(getVal("extraVat"))]+=v*Number(getVal("extraVat"));});
 result.before=result.material+result.labor+result.extra;
 result.after=result.before+result.vat[0]+result.vat[.08]+result.vat[.1];
 result.cost+=result.extra;
 result.profit=result.before-result.cost;
 result.margin=result.before>0?result.profit/result.before*100:0;
 result.markup=result.cost>0?result.profit/result.cost*100:0;
 return result;
}
function calculate(){
 const r=compute();
 $("sumMaterial").textContent=money(r.material);$("sumLabor").textContent=money(r.labor);$("sumExtra").textContent=money(r.extra);
 $("sumBefore").textContent=money(r.before);$("sumVat0").textContent=money(r.vat[0]);$("sumVat8").textContent=money(r.vat[.08]);$("sumVat10").textContent=money(r.vat[.1]);$("sumAfter").textContent=money(r.after);
 $("grossProfit").textContent=money(r.profit);$("marginPct").textContent=`${r.margin.toFixed(1)}%`;$("markupPct").textContent=`${r.markup.toFixed(1)}%`;
 $("statTotal").textContent=money(r.after);$("statProfit").textContent=money(r.profit);
 renderOptions();
}
function renderOptions(){
 $("optionsSummary").innerHTML=savedOptions.map(o=>`<div class="rounded-lg border border-slate-200 p-3 text-sm"><div class="font-bold">${escapeHtml(o.name)}</div><div class="mt-1 text-slate-600">Tổng sau thuế: <b>${money(o.total)}</b></div><div class="text-xs text-slate-500">Lãi gộp: ${money(o.profit)}</div></div>`).join("");
}
function collectQuote(){
 const calc=compute();
 return {id:editingQuoteId||uid(),customer:getVal("customer"),project:getVal("project"),address:getVal("customerAddress"),contact:getVal("customerContact"),quoteNo:getVal("quoteNo"),date:getVal("quoteDate"),validDays:num(getVal("validDays")),status:getVal("quoteStatus"),globalDiscount:num(getVal("globalDiscount")),shipping:num(getVal("shipping")),handling:num(getVal("handling")),inspection:num(getVal("inspection")),extraVat:Number(getVal("extraVat")),optionName:getVal("optionName"),lines:structuredClone(currentLines),savedOptions:structuredClone(savedOptions),totals:calc,updatedAt:new Date().toISOString()};
}
function saveQuote(){
 const q=collectQuote();if(!q.customer.trim()){toast("Vui lòng nhập tên khách hàng trước khi lưu.");$("customer").focus();return;}
 const old=state.quotes.find(x=>x.id===q.id);
 if(old){q.version=(old.version||1)+1;q.createdAt=old.createdAt;}else{q.version=1;q.createdAt=q.updatedAt;}
 state.quotes.unshift(q);state.quotes=state.quotes.slice(0,500);editingQuoteId=q.id;persist();$("quoteVersion").textContent=`Phiên bản v${q.version}`;toast(`Đã lưu báo giá ${q.quoteNo} · v${q.version}`);
}
function loadQuote(id){
 const q=state.quotes.find(x=>x.id===id);if(!q)return;
 editingQuoteId=q.id;
 setVal("customer",q.customer);setVal("project",q.project);setVal("customerAddress",q.address);setVal("customerContact",q.contact);setVal("quoteNo",q.quoteNo);setVal("quoteDate",q.date);setVal("validDays",q.validDays);setVal("quoteStatus",q.status);setVal("globalDiscount",q.globalDiscount);setVal("shipping",q.shipping);setVal("handling",q.handling);setVal("inspection",q.inspection);setVal("extraVat",q.extraVat);setVal("optionName",q.optionName);
 currentLines=structuredClone(q.lines||[]);savedOptions=structuredClone(q.savedOptions||[]);$("quoteVersion").textContent=`Phiên bản v${q.version||1}`;renderLines();calculate();switchTab("quote");toast("Đã mở báo giá từ lịch sử");
}
function quoteHTML(q=collectQuote()){
 const s=state.settings,t=q.totals||compute(),dateText=q.date?new Date(q.date+"T00:00:00").toLocaleDateString("vi-VN"):"";
 const rows=(q.lines||currentLines).map((l,i)=>{const d=1-Math.min(100,num(l.discount))/100;const material=num(l.qty)*num(l.price)*d*(1-num(q.globalDiscount||0)/100);const labor=num(l.qty)*num(l.labor)*d*(1-num(q.globalDiscount||0)/100);return `<tr><td class="center">${i+1}</td><td>${escapeHtml(l.name)}<br><span class="muted">${escapeHtml(l.sku||"")} ${escapeHtml(l.spec||"")}</span></td><td>${escapeHtml(l.brand||"")}</td><td class="center">${escapeHtml(l.unit)}</td><td class="right">${num(l.qty).toLocaleString("vi-VN")}</td><td class="right">${money(l.price)}</td><td class="center">${Number(l.vat)*100}%</td><td class="right">${money(l.labor)}</td><td class="center">${Number(l.laborVat)*100}%</td><td class="right">${money(material)}</td><td class="right">${money(labor)}</td><td>${escapeHtml(l.note||"")}</td></tr>`;}).join("");
 const extraRows=[["Vận chuyển",q.shipping],["Bốc xếp",q.handling],["Kiểm định / thử nghiệm",q.inspection]].filter(x=>num(x[1])>0).map(x=>`<tr><td colspan="9">${x[0]}</td><td class="right">${money(x[1])}</td><td class="right">0 ₫</td><td></td></tr>`).join("");
 return `<div class="company"><b>${escapeHtml(s.companyName)}</b><br>Điện thoại: ${escapeHtml(s.companyPhone)}<br>Địa chỉ: ${escapeHtml(s.companyAddress)}<br>Mã số thuế: ${escapeHtml(s.companyTax)}<br>Website: ${escapeHtml(s.companyWebsite)}</div>
 <div class="doc-title">BẢNG BÁO GIÁ</div><div class="right muted">Tp.HCM, ngày ${dateText}</div>
 <table class="no-border" style="margin:10px 0"><tr><td><b>Khách hàng:</b> ${escapeHtml(q.customer)}</td><td><b>Số báo giá:</b> ${escapeHtml(q.quoteNo)}</td></tr><tr><td><b>Dự án:</b> ${escapeHtml(q.project)}</td><td><b>Hiệu lực:</b> ${q.validDays} ngày</td></tr><tr><td><b>Địa chỉ:</b> ${escapeHtml(q.address)}</td><td><b>Điện thoại:</b> ${escapeHtml(q.contact)}</td></tr></table>
 <p style="margin:8px 0">Chân thành cảm ơn Quý Khách đã quan tâm đến sản phẩm của công ty chúng tôi. Sau khi khảo sát/nhận thông tin, chúng tôi gửi bảng báo giá theo yêu cầu như sau:</p>
 <table><thead><tr><th rowspan="2">STT</th><th rowspan="2">HÀNG HÓA</th><th rowspan="2">THƯƠNG HIỆU / XUẤT XỨ</th><th rowspan="2">ĐVT</th><th rowspan="2">S.L</th><th colspan="2">ĐƠN GIÁ VẬT TƯ</th><th colspan="2">ĐƠN GIÁ NHÂN CÔNG</th><th colspan="2">TỔNG CỘNG</th><th rowspan="2">GHI CHÚ</th></tr><tr><th>Đơn giá</th><th>VAT</th><th>Đơn giá</th><th>VAT</th><th>Vật tư</th><th>Nhân công</th></tr></thead><tbody>${rows}${extraRows}</tbody></table>
 <table class="totals" style="width:55%;margin:10px 0 10px auto"><tr><td>TỔNG GIÁ TRỊ TRƯỚC THUẾ</td><td class="right">${money(t.before)}</td></tr><tr><td>VAT 8%</td><td class="right">${money(t.vat[.08])}</td></tr><tr><td>VAT 10%</td><td class="right">${money(t.vat[.1])}</td></tr><tr><td>VAT 0%</td><td class="right">${money(t.vat[0])}</td></tr><tr><td>TỔNG GIÁ TRỊ SAU THUẾ</td><td class="right">${money(t.after)}</td></tr></table>
 <div style="margin-top:12px"><b>Lưu ý / Điều khoản:</b><br>${escapeHtml(s.terms).replace(/\n/g,"<br>")}<br><br><b>Thông tin chuyển khoản:</b><br>${escapeHtml(s.bankOwner)}<br>Số TK: ${escapeHtml(s.bankAccount)} tại ${escapeHtml(s.bankName)}</div>
 <table class="no-border" style="margin-top:22px"><tr><td class="signature"><b>TM CÔNG TY TNHH VIỄN THÔNG L.L.P</b><br><br><br><br>(Ký, ghi rõ họ tên)</td><td class="signature"><b>XÁC NHẬN CỦA KHÁCH HÀNG</b><br><br><br><br>(Ký, ghi rõ họ tên và đóng dấu)</td></tr></table>`;
}
function openPreview(){const q=collectQuote();$("printArea").innerHTML=quoteHTML(q);$("previewDialog").showModal();iconRefresh();}
async function exportPDF(){
 const area=$("printArea");if(!area.innerHTML)area.innerHTML=quoteHTML();
 const filename=`Bao_gia_LLP_${(getVal("quoteNo")||"LLP").replace(/[^\w-]/g,"_")}.pdf`;
 if(window.html2pdf){await window.html2pdf().set({margin:0,filename,image:{type:"jpeg",quality:.98},html2canvas:{scale:2,useCORS:true},jsPDF:{unit:"mm",format:"a4",orientation:"portrait"},pagebreak:{mode:["avoid-all","css","legacy"]}}).from(area).save();}
 else{window.print();}
}
function exportExcel(){
 const q=collectQuote(),t=q.totals,rows=[["CÔNG TY TNHH VIỄN THÔNG L.L.P"],["BẢNG BÁO GIÁ"],["Khách hàng",q.customer,"Dự án",q.project],["Số báo giá",q.quoteNo,"Ngày",q.date],[],["STT","SKU","HÀNG HÓA","THƯƠNG HIỆU/XUẤT XỨ","ĐVT","SỐ LƯỢNG","ĐƠN GIÁ VẬT TƯ","VAT VT","ĐƠN GIÁ NHÂN CÔNG","VAT NC","TỔNG VẬT TƯ","TỔNG NHÂN CÔNG","CHIẾT KHẤU %","COGS VT"]];
 q.lines.forEach((l,i)=>rows.push([i+1,l.sku,l.name,l.brand,l.unit,l.qty,l.price,l.vat,l.labor,l.laborVat,l.qty*l.price*(1-l.discount/100)*(1-q.globalDiscount/100),l.qty*l.labor*(1-l.discount/100)*(1-q.globalDiscount/100),l.discount,l.cost,l.laborCost||0]));
 rows.push([],["TỔNG TRƯỚC THUẾ",t.before],["VAT 0%",t.vat[0]],["VAT 8%",t.vat[.08]],["VAT 10%",t.vat[.1]],["TỔNG SAU THUẾ",t.after],["LÃI GỘP NỘI BỘ",t.profit],["MARGIN %",t.margin]);
 if(!window.XLSX){downloadBlob(new Blob([rows.map(r=>r.join("\t")).join("\n")],{type:"text/tab-separated-values"}),"Bao_gia_LLP.xls");toast("Thư viện Excel chưa tải; đã xuất bảng TSV tương thích Excel.");return;}
 const ws=XLSX.utils.aoa_to_sheet(rows);ws["!cols"]=[{wch:6},{wch:18},{wch:32},{wch:22},{wch:10},{wch:12},{wch:18},{wch:10},{wch:18},{wch:10},{wch:18},{wch:18},{wch:12},{wch:16}];
 const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Bao gia");XLSX.writeFile(wb,`Bao_gia_LLP_${q.quoteNo.replace(/[^\w-]/g,"_")||"Moi"}.xlsx`);
}
function downloadBlob(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
async function shareQuote(){
 const q=collectQuote();if(!getVal("customer").trim()){toast("Nhập khách hàng trước khi chia sẻ.");return;}
 $("printArea").innerHTML=quoteHTML(q);
 if(window.html2pdf){
  const worker=window.html2pdf().set({margin:0,filename:"Bao_gia_LLP.pdf",image:{type:"jpeg",quality:.95},html2canvas:{scale:1.5},jsPDF:{unit:"mm",format:"a4"}}).from($("printArea")).toPdf();
  const pdf=await worker.get("pdf");const blob=pdf.output("blob");const file=new File([blob],`Bao_gia_LLP_${q.quoteNo||"LLP"}.pdf`,{type:"application/pdf"});
  if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({title:"Báo giá LLP",text:`Báo giá ${q.quoteNo} - ${q.customer}`,files:[file]});}
  else{downloadBlob(blob,file.name);const text=`Báo giá ${q.quoteNo} - ${q.customer}. Tổng sau thuế: ${money(q.totals.after)}.`;if(navigator.clipboard)await navigator.clipboard.writeText(text);toast("Đã tải PDF và sao chép nội dung chia sẻ.");}
 }else{await exportPDF();}
}
function saveOption(){const q=collectQuote();savedOptions.push({name:q.optionName,total:q.totals.after,profit:q.totals.profit,lines:q.lines,totals:q.totals});renderOptions();toast("Đã lưu phương án so sánh.");}
function compareOptions(){if(savedOptions.length<2){toast("Cần lưu ít nhất 2 phương án để so sánh.");return;}const text=savedOptions.map(o=>`${o.name}: ${money(o.total)} | Lãi gộp: ${money(o.profit)}`).join("\n");alert(`SO SÁNH PHƯƠNG ÁN\n\n${text}`);}
function renderCatalog(){
 const q=(getVal("catalogSearch")||"").toLowerCase();
 const items=state.products.filter(p=>[p.sku,p.name,p.brand,p.spec].join(" ").toLowerCase().includes(q));
 $("catalogRows").innerHTML=items.map(p=>`<tr class="border-b border-slate-100"><td class="p-2 font-semibold">${escapeHtml(p.sku)}</td><td class="p-2">${escapeHtml(p.name)}</td><td class="p-2">${escapeHtml(p.brand||"")}<br><span class="text-xs text-slate-500">${escapeHtml(p.spec||"")}</span></td><td class="p-2">${escapeHtml(p.unit)}</td><td class="p-2">${money(p.cost)}</td><td class="p-2">${money(p.price)}</td><td class="p-2">${p.vat*100}%</td><td class="p-2 text-xs">${escapeHtml([...(p.required||[]),...(p.suggested||[])].join(", "))}</td><td class="p-2 whitespace-nowrap"><button class="mr-1 rounded p-2 text-blue-700" data-edit="${p.id}"><i data-lucide="pencil"></i></button><button class="rounded p-2 text-red-600" data-delete="${p.id}"><i data-lucide="trash-2"></i></button></td></tr>`).join("")||'<tr><td colspan="9" class="p-5 text-center text-slate-400">Danh mục trống.</td></tr>';
 document.querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>editProduct(b.dataset.edit)));
 document.querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>{if(confirm("Xóa thiết bị khỏi danh mục?")){state.products=state.products.filter(p=>p.id!==b.dataset.delete);persist();renderCatalog();searchProducts();}}));iconRefresh();
}
function editProduct(id){
 const p=state.products.find(x=>x.id===id);if(!p)return;
 $("productDialogTitle").textContent="Cập nhật thiết bị";setVal("editProductId",p.id);setVal("pSku",p.sku);setVal("pName",p.name);setVal("pUnit",p.unit);setVal("pBrand",p.brand);setVal("pSpec",p.spec);setVal("pVat",p.vat);setVal("pCost",p.cost);setVal("pPrice",p.price);setVal("pRequired",(p.required||[]).join(","));setVal("pSuggested",(p.suggested||[]).join(","));setVal("pLabor",p.labor);setVal("pLaborCost",p.laborCost||0);setVal("pLaborUnit",p.laborUnit||"Bộ");$("productDialog").showModal();
}
function newProduct(){ $("productForm").reset();setVal("editProductId","");setVal("pUnit","Cái");setVal("pVat",.1);setVal("pCost",0);setVal("pPrice",0);setVal("pLabor",0);setVal("pLaborCost",0);$("productDialogTitle").textContent="Thêm thiết bị";$("productDialog").showModal();}
function saveProduct(e){
 e.preventDefault();const id=getVal("editProductId")||uid(),old=state.products.find(p=>p.id===id);
 const p={id,sku:getVal("pSku").trim(),name:getVal("pName").trim(),unit:getVal("pUnit").trim(),brand:getVal("pBrand").trim(),spec:getVal("pSpec").trim(),vat:Number(getVal("pVat")),cost:num(getVal("pCost")),price:num(getVal("pPrice")),required:getVal("pRequired").split(",").map(s=>s.trim()).filter(Boolean),suggested:getVal("pSuggested").split(",").map(s=>s.trim()).filter(Boolean),labor:num(getVal("pLabor")),laborCost:num(getVal("pLaborCost")),laborUnit:getVal("pLaborUnit")};
 if(state.products.some(x=>x.sku.toLowerCase()===p.sku.toLowerCase()&&x.id!==id)){toast("Mã SKU đã tồn tại.");return;}
 if(old)state.products=state.products.map(x=>x.id===id?p:x);else state.products.push(p);
 persist();renderCatalog();searchProducts();$("productDialog").close();toast("Đã lưu danh mục thiết bị.");
}
function renderStats(){$("statQuotes").textContent=state.quotes.length;$("statProducts").textContent=state.products.length;}
function renderHistory(){
 $("historyList").innerHTML=state.quotes.map(q=>`<div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"><div class="min-w-0"><b class="block truncate text-sm">${escapeHtml(q.customer)} · ${escapeHtml(q.project||"")}</b><span class="text-xs text-slate-500">${escapeHtml(q.quoteNo)} · v${q.version||1} · ${new Date(q.updatedAt).toLocaleString("vi-VN")}</span><span class="block text-xs text-blue-700">${escapeHtml(q.status)}</span></div><div class="flex items-center gap-2"><b class="text-sm">${money(q.totals?.after||0)}</b><button class="secondary-btn" data-openquote="${q.id}">Mở</button><button class="rounded p-2 text-red-600" data-delquote="${q.id}"><i data-lucide="trash-2"></i></button></div></div>`).join("")||'<div class="p-8 text-center text-slate-400">Chưa có báo giá nào được lưu.</div>';
 document.querySelectorAll("[data-openquote]").forEach(b=>b.addEventListener("click",()=>loadQuote(b.dataset.openquote)));
 document.querySelectorAll("[data-delquote]").forEach(b=>b.addEventListener("click",()=>{if(confirm("Xóa báo giá khỏi lịch sử?")){state.quotes=state.quotes.filter(q=>q.id!==b.dataset.delquote);persist();renderHistory();}}));iconRefresh();
}
function switchTab(name){document.querySelectorAll(".tab-panel").forEach(x=>x.classList.add("hidden"));$("tab-"+name).classList.remove("hidden");document.querySelectorAll(".tab-btn").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));if(name==="catalog")renderCatalog();if(name==="history")renderHistory();}
function loadSettings(){Object.entries(state.settings).forEach(([k,v])=>{const el=$(k);if(el)el.value=v;});}
function saveSettings(){Object.keys(defaultSettings).forEach(k=>{if($(k))state.settings[k]=$(k).value;});persist();toast("Đã lưu thông tin công ty và điều khoản.");}
function backupAll(){downloadBlob(new Blob([JSON.stringify({...state,backupAt:new Date().toISOString()},null,2)],{type:"application/json"}),"LLP_Backup_Bao_Gia.json");}
function restoreData(file){const reader=new FileReader();reader.onload=()=>{try{const d=JSON.parse(reader.result);if(!Array.isArray(d.products)||!Array.isArray(d.quotes)||!d.settings)throw new Error("Sai cấu trúc sao lưu");if(!confirm("Phục hồi sẽ thay thế dữ liệu hiện tại trên thiết bị. Tiếp tục?"))return;state={products:d.products,quotes:d.quotes,settings:{...defaultSettings,...d.settings}};persist();loadSettings();renderCatalog();renderHistory();toast("Phục hồi dữ liệu thành công.");}catch(e){toast("File sao lưu không hợp lệ.");}};reader.readAsText(file);}
function exportCatalog(){if(!window.XLSX){downloadBlob(new Blob([JSON.stringify(state.products,null,2)],{type:"application/json"}),"LLP_Danh_muc.json");return;}const ws=XLSX.utils.json_to_sheet(state.products);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Danh muc");XLSX.writeFile(wb,"LLP_Danh_muc_thiet_bi.xlsx");}
function importCatalog(file){
 const reader=new FileReader();reader.onload=()=>{try{let rows;if(file.name.toLowerCase().endsWith(".json"))rows=JSON.parse(reader.result);else{if(!window.XLSX)throw new Error("Chưa tải thư viện XLSX");const wb=XLSX.read(reader.result,{type:"array"});rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);}
 if(!Array.isArray(rows))throw new Error("Dữ liệu không phải danh sách");const mapped=rows.map(r=>({id:r.id||uid(),sku:String(r.sku||r.SKU||r["Mã SKU"]||"").trim(),name:String(r.name||r["Tên thiết bị"]||r["Tên hàng hóa"]||"").trim(),unit:r.unit||r["ĐVT"]||"Cái",brand:r.brand||r["Hãng"]||"",spec:r.spec||r["Thông số"]||"",cost:num(r.cost??r.COGS??r["Đơn giá gốc"]),price:num(r.price??r["Giá bán"]??r["Đơn giá"]),vat:Number(r.vat??r.VAT??.1),required:Array.isArray(r.required)?r.required:String(r.required||"").split(",").filter(Boolean),suggested:Array.isArray(r.suggested)?r.suggested:String(r.suggested||"").split(",").filter(Boolean),labor:num(r.labor??r["Nhân công"]),laborCost:num(r.laborCost??r["COGS nhân công"]),laborUnit:r.laborUnit||"Bộ"})).filter(x=>x.sku&&x.name);
 const bySku=new Map(state.products.map(p=>[p.sku.toLowerCase(),p]));mapped.forEach(p=>bySku.set(p.sku.toLowerCase(),p));state.products=[...bySku.values()];persist();renderCatalog();searchProducts();toast(`Đã nhập ${mapped.length} thiết bị.`);}catch(e){console.error(e);toast("Không thể đọc file danh mục.");}};if(file.name.toLowerCase().endsWith(".json"))reader.readAsText(file);else reader.readAsArrayBuffer(file);
}
function addManual(e){e.preventDefault();currentLines.push({id:uid(),productId:null,sku:"",name:getVal("mName"),unit:getVal("mUnit"),brand:"",spec:"",qty:num(getVal("mQty")),price:num(getVal("mPrice")),cost:num(getVal("mCost")),laborCost:num(getVal("mLaborCost")),vat:Number(getVal("mVat")),labor:num(getVal("mLabor")),laborVat:Number(getVal("mLaborVat")),discount:num(getVal("mDiscount")),required:[],suggested:[],isManual:true});renderLines();calculate();$("manualDialog").close();$("manualForm").reset();toast("Đã thêm dòng tự do.");}
function bindEvents(){
 document.querySelectorAll(".tab-btn").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.tab)));
 $("productSearch").addEventListener("input",searchProducts);$("catalogSearch").addEventListener("input",renderCatalog);
 $("addProductBtn").addEventListener("click",newProduct);$("productForm").addEventListener("submit",saveProduct);
 $("addManualBtn").addEventListener("click",()=>$("manualDialog").showModal());$("manualForm").addEventListener("submit",addManual);
 document.querySelectorAll(".close-dialog").forEach(b=>b.addEventListener("click",()=>b.closest("dialog").close()));
 ["globalDiscount","shipping","handling","inspection","extraVat"].forEach(id=>$(id).addEventListener("input",calculate));
 $("saveOptionBtn").addEventListener("click",saveOption);$("compareOptionsBtn").addEventListener("click",compareOptions);
 $("previewBtn").addEventListener("click",openPreview);$("previewPdfBtn").addEventListener("click",exportPDF);$("pdfBtn").addEventListener("click",()=>{openPreview();});$("excelBtn").addEventListener("click",exportExcel);$("shareBtn").addEventListener("click",shareQuote);
 $("saveQuoteBtn").addEventListener("click",saveQuote);$("newQuoteBtn").addEventListener("click",()=>{if(confirm("Tạo báo giá mới? Hãy lưu báo giá hiện tại trước nếu cần."))setDefaultForm();});
 $("saveSettingsBtn").addEventListener("click",saveSettings);$("backupBtn").addEventListener("click",backupAll);$("exportBackupBtn").addEventListener("click",backupAll);$("restoreBtn").addEventListener("click",()=>$("backupFile").click());$("backupFile").addEventListener("change",e=>e.target.files[0]&&restoreData(e.target.files[0]));
 $("exportCatalogBtn").addEventListener("click",exportCatalog);$("importCatalogBtn").addEventListener("click",()=>$("catalogFile").click());$("catalogFile").addEventListener("change",e=>e.target.files[0]&&importCatalog(e.target.files[0]));
 $("historyExportBtn").addEventListener("click",()=>downloadBlob(new Blob([JSON.stringify(state.quotes,null,2)],{type:"application/json"}),"LLP_Lich_su_bao_gia.json"));
 $("productDialog").addEventListener("click",e=>{if(e.target===$("productDialog"))$("productDialog").close();});
 $("manualDialog").addEventListener("click",e=>{if(e.target===$("manualDialog"))$("manualDialog").close();});
 $("previewDialog").addEventListener("click",e=>{if(e.target===$("previewDialog"))$("previewDialog").close();});
}
function setupPWA(){
 const update=()=>{$("networkState").textContent=navigator.onLine?"● Online":"● Offline";$("networkState").className=navigator.onLine?"rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200 sm:inline-flex":"rounded-full bg-amber-500/20 px-2 py-1 text-xs text-amber-200 sm:inline-flex";};
 window.addEventListener("online",update);window.addEventListener("offline",update);update();
 window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("installBtn").classList.remove("hidden");});
 $("installBtn").addEventListener("click",async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$("installBtn").classList.add("hidden");});
 if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(err=>console.warn("SW registration failed",err)));
}
function init(){setDefaultForm();loadSettings();bindEvents();searchProducts();renderCatalog();renderHistory();renderStats();setupPWA();iconRefresh();}
init();
