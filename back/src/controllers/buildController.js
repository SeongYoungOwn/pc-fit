const supabase = require('../config/supabase');

exports.create = async (req, res, next) => {
  try {
    if (!supabase) return res.status(500).json({ success: false, error: 'Supabase 설정이 필요합니다.' });

    const insertData = { 
      user_id: req.session.userId,
      title: req.body.title,
      build_data: req.body.parts_data || req.body.parts,
      total_price: req.body.total_price || req.body.totalPrice || 0,
      purpose: req.body.prompt || req.body.purpose || ''
    };
    
    const { data: savedBuild, error } = await supabase.from('saved_builds').insert([insertData]).select().single();
    
    if (error) throw error;
    res.status(201).json({ success: true, data: { message: '견적이 성공적으로 저장되었습니다.', buildId: savedBuild.id } });
  } catch (e) { next(e); }
};

exports.getMyBuilds = async (req, res, next) => {
  try {
    if (!supabase) return res.status(500).json({ success: false, error: 'Supabase 설정이 필요합니다.' });

    const { data: builds, error } = await supabase
      .from('saved_builds')
      .select('*')
      .eq('user_id', req.session.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: builds });
  } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    if (!supabase) return res.status(500).json({ success: false, error: 'Supabase 설정이 필요합니다.' });

    const { data: build, error } = await supabase
      .from('saved_builds')
      .select('*, users(nickname, profile_image)')
      .eq('id', req.params.id)
      .single();

    if (error || !build) return res.status(404).json({ success: false, error: '견적을 찾을 수 없습니다.' });

    res.json({ success: true, data: build });
  } catch (e) { next(e); }
};

// updateStatus is generally not needed if takeoff is handled separately via takeoff_posts
exports.updateStatus = async (req, res, next) => {
    res.status(400).json({ success: false, error: 'Status update logic moved to takeoff controller.' });
};

exports.remove = async (req, res, next) => {
  try {
    if (!supabase) return res.status(500).json({ success: false, error: 'Supabase 설정이 필요합니다.' });

    const { data: build, error: fetchErr } = await supabase.from('saved_builds').select('user_id').eq('id', req.params.id).single();
    if (fetchErr || !build || build.user_id !== req.session.userId) {
      return res.status(403).json({ success: false, error: '권한이 없습니다.' });
    }

    const { error } = await supabase.from('saved_builds').delete().eq('id', req.params.id);
    if (error) throw error;
    
    res.json({ success: true, data: { message: '삭제 완료' } });
  } catch (e) { next(e); }
};