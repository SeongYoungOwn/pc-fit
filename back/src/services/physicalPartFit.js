const socketKey = value => String(value || '').toUpperCase().replace(/[\s-]/g,'');
const formKey = value => String(value || '').toUpperCase().replace(/MICRO/g,'M').replace(/[^A-Z0-9]/g,'');
function caseFitsParts(pcCase,motherboard,gpu) {
  const enclosure=pcCase.specs || {}, board=motherboard.specs || {}, graphics=gpu.specs || {};
  const forms=enclosure.supported_motherboard_form_factors;
  if (!Array.isArray(forms) || !board.form_factor || !forms.some(f=>formKey(f)===formKey(board.form_factor))) return false;
  if (!String(gpu.id).startsWith('dummy_')) {
    if (!(enclosure.max_video_card_length>0 && graphics.length>0 && graphics.length<=enclosure.max_video_card_length)) return false;
  }
  return true;
}
function airCoolerFits(cooler,cpu,pcCase) {
  const cooling=cooler.specs || {}, processor=cpu.specs || {}, enclosure=pcCase.specs || {};
  // The source lacks reliable radiator mounting positions for many cases. Choose a
  // socket/height-verified air cooler until radiator fit data is available.
  return cooling.water_cooled===false && Array.isArray(cooling.cpu_sockets)
    && cooling.cpu_sockets.some(s=>socketKey(s)===socketKey(processor.Socket || processor.socket))
    && cooling.height>0 && enclosure.max_cpu_cooler_height>0 && cooling.height<=enclosure.max_cpu_cooler_height;
}
module.exports={caseFitsParts,airCoolerFits,socketKey,formKey};
