// Reviewed manufacturer facts. Family records retain configuration options;
// exact Korean retail SKUs are explicitly named where the manufacturer lists them.
const samsung = 'https://news.samsung.com/kr/';
const sources = {
  book: samsung+'삼성전자-새로운-ai-경험과-터치-디스플레이의-갤럭시',
  tab9: samsung+'삼성전자갤럭시-탭-s9-시리즈-공개',
  tab10: samsung+'삼성전자-갤럭시-탭-s10-시리즈-공개',
  lg: 'https://www.lg.co.kr/media/release/27153',
  asus: 'https://www.asus.com/kr/laptops/for-home/zenbook/asus-zenbook-14-oled-ux3405/'
};
function product(id,brand,category,name,date,key,f) {
  const sourceUrl=sources[key],yearOnly=date.length===4;
  return {id:'official_'+id,brand,category,name,model:f.model||name,version:f.model||null,
    region:'대한민국',domesticVerified:true,sourceUrl,imageUrl:null,
    releaseDate:yearOnly?date+'년 (연도 기준)':date,releaseStart:yearOnly?date+'-01-01':date,releaseEnd:yearOnly?date+'-12-31':date,releasePrecision:yearOnly?'year':'day',
    specs:{Inside:{Processor:{CPU:f.cpu,GPU:f.gpu},RAM:{Capacity:f.ram},Storage:{Capacity:f.storage},Software:{OS:f.os},
      Battery:{Capacity_mAh:f.mah,'Energy (Wh)':f.wh,'Charging Power':f.charging},Wireless:{'Bluetooth Version':f.bluetooth}},
      Display:{Diagonal:f.screen,Type:f.panel,'Resolution (H x W)':f.resolution,'Refresh Rate':f.refresh},
      Camera:{'Back Camera':{Resolution:f.camera},'Front Camera':{Resolution:f.front}},
      Design:{Body:{Weight:f.weight,Thickness:f.thickness,'IP Rating':f.ip}},
      _provenance:{provider:'manufacturer',source:brand+' 공식 자료',sourceUrl,checkedOn:'2026-11-10',dateNote:f.dateNote||null}},
    imageKey:key,imageMatch:f.imageMatch||name};
}
const products=[];
for(const [id,label,screen,weight,thickness,wh] of [
  ['book4pro14','프로 14','14 inches','1.23 kg','11.6 mm','63 Wh'],
  ['book4pro16','프로 16','16 inches','1.56 kg','12.5 mm','76 Wh'],
  ['book4pro360','프로 360','16 inches','1.66 kg','12.8 mm','76 Wh'],
  ['book4ultra','울트라','16 inches','1.86 kg','16.5 mm','76 Wh']]) {
  const ultra=id==='book4ultra';
  products.push(product('samsung_'+id,'Samsung','Laptops','갤럭시 북4 '+label,'2024-01-02','book',{
    cpu:ultra?'Intel Core Ultra 7 / Ultra 9':'Intel Core Ultra 5 / Ultra 7',gpu:ultra?'RTX 4050 / RTX 4070 Laptop GPU':'Intel Arc Graphics',
    ram:ultra?'32 GB / 64 GB':'16 GB / 32 GB',storage:ultra?'512 GB / 1 TB / 2 TB':'256 GB / 512 GB / 1 TB',
    os:'Windows 11',screen,panel:'Dynamic AMOLED 2X 터치',resolution:'2880 x 1800',refresh:'최대 120 Hz',weight,thickness,wh,bluetooth:'5.3',front:'2 MP',imageMatch:ultra?'갤럭시 북4 울트라':'갤럭시 북4 시리즈',
    // Adapter wattage is not equated with battery charge rate.
  }));
}
products.push(product('samsung_tabs9','Samsung','Tablets','갤럭시 탭 S9','2023-08-11','tab9',{
  cpu:'Snapdragon 8 Gen 2 for Galaxy',ram:'8 GB / 12 GB',storage:'128 GB / 256 GB',screen:'11 inches',panel:'Dynamic AMOLED 2X',refresh:'60~120 Hz',
  weight:'498 g (Wi-Fi) / 500 g (5G)',thickness:'5.9 mm',mah:8400,charging:'최대 45 W',camera:'13 MP',front:'12 MP',ip:'IP68',imageMatch:'갤럭시 탭 S9 그라파이트 제품 사진'
}));
for(const [id,name,screen,ram,storage,weight,thickness,mah,front] of [
  ['tabs10plus','갤럭시 탭 S10+','12.4 inches','12 GB','256 GB / 512 GB','571 g (Wi-Fi) / 576 g (5G)','5.6 mm',10090,'12 MP'],
  ['tabs10ultra','갤럭시 탭 S10 울트라','14.6 inches','12 GB / 16 GB','256 GB / 512 GB / 1 TB','718 g (Wi-Fi) / 723 g (5G)','5.4 mm',11200,'12 MP + 12 MP']])
  products.push(product('samsung_'+id,'Samsung','Tablets',name,'2024-10-04','tab10',{cpu:'MediaTek Dimensity 9300+',ram,storage,screen,panel:'Dynamic AMOLED 2X',refresh:'60~120 Hz',weight,thickness,mah,charging:'최대 45 W',camera:'13 MP + 8 MP',front,imageMatch:name}));
for(const [model,name,screen,weight,refresh,thickness] of [
  ['16Z90SP','LG 그램 프로 16 (2024)','16 inches','1199 g (내장 그래픽 모델)','최대 144 Hz','12.4 mm (내장 그래픽 모델)'],
  ['17Z90SP','LG 그램 프로 17 (2024)','17 inches',null,'최대 144 Hz',null],
  ['16T90SP','LG 그램 프로 360 (2024)','16 inches','1399 g','최대 120 Hz','12.4 mm']])
  products.push(product('lg_'+model,'LG','Laptops',name,'2024','lg',{model,cpu:'Intel Core Ultra (세부 SKU에 따라 다름)',screen,weight,refresh,thickness,resolution:'2560 x 1600',panel:model==='16T90SP'?'OLED 터치':null,imageMatch:'그램',dateNote:'국내 예약판매 2024-01-02 시작. 출시일은 연도 정밀도로 관리.'}));
for(const [model,cpu,ram,storage,resolution,refresh] of [
  ['UX3405MA-PP208W','Intel Core Ultra 5 125H','16 GB','512 GB','1920 x 1200','60 Hz'],
  ['UX3405MA-PP720W','Intel Core Ultra 7 155H','32 GB','512 GB','2880 x 1800','120 Hz'],
  ['UX3405MA-PZ293W','Intel Core Ultra 9 185H','32 GB','1 TB','2880 x 1800','120 Hz']])
  products.push(product('asus_'+model,'ASUS','Laptops','ASUS Zenbook 14 OLED '+model,'2024','asus',{model,cpu,ram,storage,resolution,refresh,gpu:'Intel Arc Graphics',os:'Windows 11 Home',panel:'OLED',screen:'14 inches',wh:'75 Wh',thickness:'14.9 mm',front:'FHD IR',dateNote:'2023-12-14 발표 / 2024 공식 제품 가이드 및 한국 판매 SKU. 국내 출시 연도 기준.'}));
const imageRoot='https://img.kr.news.samsung.com/kr/wp-content/uploads/';
for(const p of products){
 if(p.id==='official_samsung_tabs9')p.imageUrl=imageRoot+'2023/07/'+encodeURIComponent('갤럭시-탭S9-그라파이트-e1690374023105.jpg');
 if(p.imageKey==='tab10'){p.imageUrl=imageRoot+'2024/09/'+encodeURIComponent('삼성전자-제품뉴스-모바일-갤럭시-탭S10-시리즈-1.jpg');p.imageCaption='갤럭시 탭 S10 시리즈 공식 사진';}
 if(p.imageKey==='book'){p.imageUrl=imageRoot+'2023/12/'+encodeURIComponent(p.id==='official_samsung_book4ultra'?'1000_갤럭시-북4-시리즈-2.jpg':'1000_갤럭시-북4-시리즈-1.jpg');p.imageCaption=p.id==='official_samsung_book4ultra'?'공식 제품 사진':'갤럭시 북4 시리즈 공식 사진';}
 if(p.brand==='ASUS')p.imageUrl='https://press.asus.com/assets/w_894%2Ch_764/18c9e1f1-07ad-4282-a536-c701f889ef72/ASUS%20Zenbook%2014%20OLED_UX3405_Scenario%20photo_04.JPG';
}
module.exports=products;
