const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

exports.checkUsername = async (req, res, next) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ success: false, error: '아이디를 입력하세요' });
    
    const { data } = await supabase.from('users').select('id').eq('username', username).single();
    res.json({ success: true, available: !data });
  } catch (error) { next(error); }
};

exports.checkNickname = async (req, res, next) => {
  try {
    const { nickname } = req.query;
    if (!nickname) return res.status(400).json({ success: false, error: '닉네임을 입력하세요' });
    
    const { data } = await supabase.from('users').select('id').eq('nickname', nickname).single();
    res.json({ success: true, available: !data });
  } catch (error) { next(error); }
};

exports.signup = async (req, res, next) => {
  try {
    if (!supabase) return res.status(500).json({ success: false, error: 'Supabase 설정이 필요합니다.' });
    
    const { username, password, nickname, my_pc, user_level } = req.body;
    
    // 1. 아이디 중복 체크
    const { data: existingId } = await supabase.from('users').select('id').eq('username', username).single();
    if (existingId) return res.status(409).json({ success: false, error: '이미 사용 중인 아이디입니다.' });

    // 2. 닉네임 중복 체크
    const { data: existingNickname } = await supabase.from('users').select('id').eq('nickname', nickname).single();
    if (existingNickname) return res.status(409).json({ success: false, error: '이미 사용 중인 닉네임입니다.' });

    const hashed = await bcrypt.hash(password, 10);

    // Create user in auth.users first to satisfy foreign key constraints (like comments table)
    const emailToUse = username.includes('@') ? username : username + '@test.com';
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: emailToUse,
      email_confirm: true,
      password: password
    });

    if (authError) {
      console.error('[Signup] Auth User Creation Failed:', authError);
      return res.status(500).json({ success: false, error: '회원가입 처리 중 오류가 발생했습니다 (Auth).' });
    }

    const newId = authData.user.id;

    // users 테이블 삽입 후 id 반환받기
    const { data: newUser, error } = await supabase.from('users').insert([{ id: newId, username, password: hashed, nickname, my_pc, user_level }]).select('id').single();
    
    if (error) {
      // Rollback auth user
      await supabase.auth.admin.deleteUser(newId);
      throw error;
    }

    // user_pcs 테이블에 상세 정보 저장
    if (my_pc && Object.values(my_pc).some(v => v)) {
      const pcData = {
        user_id: newUser.id,
        cpu: my_pc.cpu ? { name: my_pc.cpu } : null,
        gpu: my_pc.gpu ? { name: my_pc.gpu } : null,
        ram: my_pc.ram ? { name: my_pc.ram } : null,
        psu: my_pc.psu ? { name: my_pc.psu } : null
      };
      const { error: pcError } = await supabase.from('user_pcs').insert([pcData]);
      if (pcError) console.error('[Signup] Failed to insert user_pcs:', pcError.message);
    }

    res.status(201).json({ success: true, data: { message: '회원가입 성공' } });
  } catch (error) { next(error); }
};

exports.login = async (req, res, next) => {
  try {
    if (!supabase) return res.status(500).json({ success: false, error: 'Supabase 설정이 필요합니다.' });

    const { username, password } = req.body;
    const { data: user, error } = await supabase.from('users').select('*').eq('username', username).single();
    
    if (error || !user) return res.status(401).json({ success: false, error: '아이디 또는 비밀번호가 틀렸습니다.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, error: '아이디 또는 비밀번호가 틀렸습니다.' });

    // Session-based auth 유지
    if (!req.session) throw new Error('Session middleware not active');
    req.session.userId = user.id;
    res.json({
      success: true,
      data: { user: { id: user.id, username: user.username, nickname: user.nickname, profile_image: user.profile_image, my_pc: user.my_pc, user_level: user.user_level, role: user.role || 'user' } }
    });
  } catch (error) { next(error); }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('pcfit_session');
    res.json({ success: true, data: { message: '로그아웃 완료' } });
  });
};

exports.me = async (req, res, next) => {
  try {
    if (!supabase) return res.status(500).json({ success: false, error: 'Supabase 설정이 필요합니다.' });
    if (!req.session.userId) return res.status(401).json({ success: false, error: '세션이 없습니다.' });

    const { data: user, error } = await supabase.from('users').select('id, username, nickname, profile_image, my_pc, user_level, role').eq('id', req.session.userId).single();
    if (error || !user) return res.status(401).json({ success: false, error: '세션이 만료되었습니다.' });
    
    res.json({ success: true, data: { user } });
  } catch (error) { next(error); }
};

exports.updateMyPc = async (req, res, next) => {
  try {
    if (!supabase) return res.status(500).json({ success: false, error: 'Supabase 설정이 필요합니다.' });
    if (!req.session.userId) return res.status(401).json({ success: false, error: '세션이 없습니다.' });

    const userId = req.session.userId;
    const { my_pc } = req.body;

    // 1. Update users table (simple jsonb)
    const { error: userErr } = await supabase
      .from('users')
      .update({ my_pc })
      .eq('id', userId);
    
    if (userErr) throw userErr;

    // 2. Update user_pcs table (detailed columns)
    const pcData = {
      cpu: my_pc.cpu ? { name: my_pc.cpu } : null,
      gpu: my_pc.gpu ? { name: my_pc.gpu } : null,
      ram: my_pc.ram ? { name: my_pc.ram } : null,
      psu: my_pc.psu ? { name: my_pc.psu } : null
    };

    // Check if entry exists
    const { data: existingPc } = await supabase.from('user_pcs').select('id').eq('user_id', userId).single();

    if (existingPc) {
      await supabase.from('user_pcs').update(pcData).eq('user_id', userId);
    } else {
      await supabase.from('user_pcs').insert([{ user_id: userId, ...pcData }]);
    }

    res.json({ success: true, data: { message: '내 PC 정보가 업데이트되었습니다.', my_pc } });
  } catch (error) { next(error); }
};