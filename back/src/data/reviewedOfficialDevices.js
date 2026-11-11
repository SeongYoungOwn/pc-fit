// Facts reviewed against Samsung's Korean launch announcement and specification table.
const sourceUrl = 'https://news.samsung.com/kr/삼성전자-갤럭시-링·갤럭시-워치-7·갤럭시-워치-울';
const imageBase = 'https://img.kr.news.samsung.com/kr/wp-content/uploads/2024/07/';
module.exports = [
  ['watch7_40','갤럭시 워치7 40mm','432 x 432',300,28.8,'삼성전자-모바일-갤럭시-워치7-언팩2024-11-e1720617348836.jpg'],
  ['watch7_44','갤럭시 워치7 44mm','480 x 480',425,33.8,'삼성전자-모바일-갤럭시-워치7-언팩2024-13-e1720617394697.jpg'],
  ['watch_ultra_2024','갤럭시 워치 울트라 47mm (2024)','480 x 480',590,60.5,'삼성전자-모바일-갤럭시-워치울트라-언팩2024-7-e1720617234572.jpg']
].map(([id,name,resolution,battery,weight,image])=>({
  id:`official_samsung_${id}`,brand:'Samsung',category:'Smartwatches',name,model:name,version:null,
  region:'대한민국',releaseDate:'2024-07-24',releaseStart:'2024-07-24',releaseEnd:'2024-07-24',releasePrecision:'day',
  domesticVerified:true,sourceUrl,imageUrl:imageBase+encodeURIComponent(image),
  specs:{Inside:{Processor:{CPU:'Exynos W1000'},RAM:{Capacity:'2 GB'},Storage:{Capacity:'32 GB'},Battery:{Capacity_mAh:battery},Software:{OS:'Wear OS 5 (출시 기준)'}},
    Display:{Type:'Super AMOLED','Resolution (H x W)':resolution},Design:{Body:{Weight_g:weight}},
    _provenance:{provider:'manufacturer',source:'삼성전자 공식 뉴스룸',sourceUrl,checkedOn:'2026-11-10'}}
}));
