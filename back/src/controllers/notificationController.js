const supabase = require('../config/supabase');

exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      if (error.code === '42P01') return res.json({ success: true, data: [] });
      throw error;
    }
    res.json({ success: true, data: notifications });
  } catch (error) { next(error); }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const { id } = req.params;

    let query = supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
    
    if (id && id !== 'all') {
      query = query.eq('id', id);
    }

    const { error } = await query;
    if (error) throw error;
    
    res.json({ success: true, data: { message: '읽음 처리 완료' } });
  } catch (error) { next(error); }
};
