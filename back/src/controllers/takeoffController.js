const supabase = require('../config/supabase');
const xss = require('xss');

exports.create = async (req, res, next) => {
  try {
    const { buildId, title, content, buildData } = req.body;
    const userId = req.session.userId;

    const { data: newPost, error } = await supabase
      .from('takeoff_posts')
      .insert([{
        user_id: userId,
        build_id: buildId,
        title: xss(title),
        content: xss(content),
        build_snapshot: buildData
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data: newPost });
  } catch (error) { next(error); }
};

exports.list = async (req, res, next) => {
  try {
    if (!supabase) return res.status(500).json({ success: false, error: 'Supabase 설정이 필요합니다.' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const start = (page - 1) * limit;
    const end = start + limit - 1;
    const orderColumn = req.query.sort === 'popular' ? 'votes_good' : 'created_at';

    const { data: rows, count, error } = await supabase
      .from('takeoff_posts')
      .select('*, users(nickname, profile_image)', { count: 'exact' })
      .order(orderColumn, { ascending: false })
      .range(start, end);

    if (error) throw error;

    res.json({ success: true, data: { items: rows, total: count, page, totalPages: Math.ceil((count || 0) / limit) } });
  } catch (e) { next(e); }
};

exports.getDetail = async (req, res, next) => {
  try {
    if (!supabase) return res.status(500).json({ success: false, error: 'Supabase 설정이 필요합니다.' });

    const { buildId } = req.params;
    const userId = req.session?.userId || null;

    const { data: post, error } = await supabase
      .from('takeoff_posts')
      .select('*, users(nickname, profile_image, user_level)')
      .eq('id', buildId)
      .maybeSingle();

    if (error) throw error;
    if (!post) return res.status(404).json({ success: false, error: '게시글을 찾을 수 없습니다.' });

    // 조회수(hits) 1 증가
    const nextHits = (post.hits || 0) + 1;
    post.hits = nextHits;
    supabase
      .from('takeoff_posts')
      .update({ hits: nextHits })
      .eq('id', buildId)
      .then(() => {})
      .catch(() => {});

    // 로그인한 사용자의 기존 투표 여부 조회
    let userVote = null;
    if (userId) {
      const { data: existingVote } = await supabase
        .from('takeoff_votes')
        .select('vote_type')
        .eq('build_id', buildId)
        .eq('user_id', userId)
        .maybeSingle();
      userVote = existingVote?.vote_type || null;
    }

    res.json({ success: true, data: { ...post, userVote } });
  } catch (e) { next(e); }
};

exports.vote = async (req, res, next) => {
  try {
    if (!supabase) return res.status(500).json({ success: false, error: 'Supabase 설정이 필요합니다.' });

    const { buildId } = req.params; // 여기서 buildId는 takeoff_posts의 id
    const userId = req.session.userId;
    const voteType = req.body.voteType; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(voteType)) {
      return res.status(400).json({ success: false, error: '유효하지 않은 투표 유형입니다.' });
    }

    // 1. 게시글 존재 확인
    const { data: post } = await supabase
      .from('takeoff_posts')
      .select('user_id, votes_good, votes_bad')
      .eq('id', buildId)
      .maybeSingle();
    if (!post) return res.status(404).json({ success: false, error: '게시글을 찾을 수 없습니다.' });

    // 2. 기존 투표 확인 (신규 투표 / 동일 버튼 클릭 시 취소 / 반대 버튼 클릭 시 변경 지원)
    const { data: existingVote } = await supabase
      .from('takeoff_votes')
      .select('id, vote_type')
      .eq('build_id', buildId)
      .eq('user_id', userId)
      .maybeSingle();

    let nextGood = Math.max(0, Number(post.votes_good) || 0);
    let nextBad = Math.max(0, Number(post.votes_bad) || 0);
    let userVote = null;
    let action = 'added';

    if (!existingVote) {
      // 신규 투표 등록
      const { error: insertError } = await supabase
        .from('takeoff_votes')
        .insert([{ build_id: buildId, user_id: userId, vote_type: voteType }]);

      if (insertError) {
        if (insertError.code === '42P01') {
          return res.status(500).json({ success: false, error: '투표 테이블(takeoff_votes)이 생성되지 않았습니다.' });
        }
        throw insertError;
      }

      if (voteType === 'approve') nextGood += 1;
      else nextBad += 1;
      userVote = voteType;
      action = 'added';
    } else if (existingVote.vote_type === voteType) {
      // 같은 버튼 재클릭 -> 투표 취소 (토글 해제)
      const { error: delError } = await supabase
        .from('takeoff_votes')
        .delete()
        .eq('id', existingVote.id);
      if (delError) throw delError;

      if (voteType === 'approve') nextGood = Math.max(0, nextGood - 1);
      else nextBad = Math.max(0, nextBad - 1);
      userVote = null;
      action = 'cancelled';
    } else {
      // 반대 버튼 클릭 -> 투표 변경 (approve <-> reject)
      const { error: updError } = await supabase
        .from('takeoff_votes')
        .update({ vote_type: voteType })
        .eq('id', existingVote.id);
      if (updError) throw updError;

      if (voteType === 'approve') {
        nextBad = Math.max(0, nextBad - 1);
        nextGood += 1;
      } else {
        nextGood = Math.max(0, nextGood - 1);
        nextBad += 1;
      }
      userVote = voteType;
      action = 'switched';
    }

    // 3. 게시글 카운트 업데이트
    const { data: fresh, error } = await supabase
      .from('takeoff_posts')
      .update({ votes_good: nextGood, votes_bad: nextBad })
      .eq('id', buildId)
      .select('votes_good, votes_bad')
      .single();

    if (error) throw error;

    if (action !== 'cancelled' && post.user_id !== userId) {
      try {
        const { data: actor } = await supabase.from('users').select('nickname').eq('id', userId).single();
        const actionText = voteType === 'approve' ? '이륙을 허가했습니다.' : '대기 권고 평가를 했습니다.';
        const { data: notif, error: notifErr } = await supabase.from('notifications').insert([{
          user_id: post.user_id,
          actor_nickname: actor?.nickname || '알 수 없음',
          type: voteType === 'approve' ? 'approve' : 'reject',
          build_id: buildId,
          message: `${actor?.nickname || '알 수 없음'}님이 회원님의 견적에 ${actionText}`
        }]).select().single();
        if (!notifErr && notif) {
          req.app.get('io').to(`user_${post.user_id}`).emit('new_notification', notif);
        }
      } catch (e) {
        console.error('[Notification] Vote failed to notify', e.message);
      }
    }

    const io = req.app.get('io');
    io.to(`build_${buildId}`).to('takeoff_board').emit('vote_updated', {
      buildId: parseInt(buildId), voteApprove: fresh.votes_good, voteReject: fresh.votes_bad
    });
    res.json({
      success: true,
      data: {
        voteApprove: fresh.votes_good,
        voteReject: fresh.votes_bad,
        userVote,
        action
      }
    });
  } catch (e) { next(e); }
};

exports.getComments = async (req, res, next) => {
  try {
    const { buildId } = req.params; // takeoff_posts 의 id
    let { data: comments, error } = await supabase
      .from('comments')
      .select('*, users(nickname, profile_image, user_level)')
      .eq('build_id', buildId)
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code === '42P01') return res.json({ success: true, data: [] });
      // comments <-> public.users 외래키 스키마 캐시 미연결 시 수동 매핑 폴백
      const { data: rawComments, error: rawErr } = await supabase
        .from('comments')
        .select('*')
        .eq('build_id', buildId)
        .order('created_at', { ascending: true });
      if (rawErr) throw rawErr;

      const userIds = [...new Set((rawComments || []).map(c => c.user_id).filter(Boolean))];
      let userMap = {};
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, nickname, profile_image, user_level')
          .in('id', userIds);
        (usersData || []).forEach(u => { userMap[u.id] = u; });
      }
      comments = (rawComments || []).map(c => ({
        ...c,
        users: userMap[c.user_id] || { nickname: '익명 파일럿', profile_image: null, user_level: 'newbie' }
      }));
    }
    res.json({ success: true, data: comments });
  } catch (error) { next(error); }
};

exports.addComment = async (req, res, next) => {
  try {
    const { buildId } = req.params;
    const { content, type } = req.body;
    const userId = req.session.userId;

    let { data: newComment, error } = await supabase
      .from('comments')
      .insert([{
        build_id: buildId,
        user_id: userId,
        content: xss(content),
        type: type || 'comment'
      }])
      .select('*, users(nickname, profile_image, user_level)')
      .single();

    if (error) {
      if (error.code === '42P01') {
        return res.status(500).json({ success: false, error: '댓글 시스템이 아직 준비되지 않았습니다. 관리자에게 문의하세요.' });
      }
      // FK 조인 에러인 경우 기본 insert 후 수동으로 유저 정보 결합
      const { data: fallbackComment, error: fbErr } = await supabase
        .from('comments')
        .insert([{
          build_id: buildId,
          user_id: userId,
          content: xss(content),
          type: type || 'comment'
        }])
        .select('*')
        .single();
      if (fbErr) throw fbErr;
      const { data: uData } = await supabase.from('users').select('nickname, profile_image, user_level').eq('id', userId).single();
      newComment = { ...fallbackComment, users: uData || { nickname: '파일럿', profile_image: null, user_level: 'newbie' } };
    }

    try {
      const { data: post } = await supabase.from('takeoff_posts').select('user_id').eq('id', buildId).single();
      if (post && post.user_id !== userId) {
        const { data: actor } = await supabase.from('users').select('nickname').eq('id', userId).single();
        const shortMsg = xss(content).length > 15 ? xss(content).substring(0, 15) + '...' : xss(content);
        const { data: notif, error: notifErr } = await supabase.from('notifications').insert([{
          user_id: post.user_id,
          actor_nickname: actor?.nickname || '알 수 없음',
          type: 'comment',
          build_id: buildId,
          message: `${actor?.nickname || '알 수 없음'}님이 훈수를 남겼습니다: "${shortMsg}"`
        }]).select().single();
        if (!notifErr && notif) {
          req.app.get('io').to(`user_${post.user_id}`).emit('new_notification', notif);
        }
      }
    } catch (e) {
      console.error('[Notification] Comment failed to notify', e.message);
    }

    res.status(201).json({ success: true, data: newComment });
  } catch (error) { next(error); }
};

exports.deleteTakeoff = async (req, res, next) => {
  try {
    const { buildId } = req.params;
    const userId = req.session.userId;
    const [{ data: user }, { data: post }] = await Promise.all([
      supabase.from('users').select('role').eq('id', userId).maybeSingle(),
      supabase.from('takeoff_posts').select('user_id').eq('id', buildId).maybeSingle()
    ]);
    if (!post) return res.status(404).json({ success: false, error: '게시글을 찾을 수 없습니다.' });
    if (post.user_id !== userId && user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: '권한이 없습니다.' });
    }
    
    const { error } = await supabase.from('takeoff_posts').delete().eq('id', buildId);
    if (error) throw error;
    res.json({ success: true, message: '삭제되었습니다.' });
  } catch (error) { next(error); }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.session.userId;
    const [{ data: user }, { data: comment }] = await Promise.all([
      supabase.from('users').select('role').eq('id', userId).maybeSingle(),
      supabase.from('comments').select('user_id').eq('id', commentId).maybeSingle()
    ]);
    if (!comment) return res.status(404).json({ success: false, error: '댓글을 찾을 수 없습니다.' });
    if (comment.user_id !== userId && user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: '권한이 없습니다.' });
    }
    
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (error) throw error;
    res.json({ success: true, message: '삭제되었습니다.' });
  } catch (error) { next(error); }
};

exports.getMyPosts = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const { data: posts, error } = await supabase
      .from('takeoff_posts')
      .select('*, users(nickname, profile_image)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data: posts });
  } catch (error) { next(error); }
};

exports.getMyComments = async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*, takeoff_posts(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') return res.json({ success: true, data: [] });
      throw error;
    }
    res.json({ success: true, data: comments });
  } catch (error) { next(error); }
};