const supabase = require('../config/supabase');

exports.getDashboard = async (req, res, next) => {
  try {
    // 1. Total users
    const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
    
    // 2. Total builds
    const { count: totalBuilds } = await supabase.from('saved_builds').select('*', { count: 'exact', head: true });
    
    // 3. AI Tokens (sum from api_usage_logs where api_type = 'gemini_ai')
    // We can't do SUM easily with JS client without RPC, so we fetch all 'tokens_used' for gemini_ai and sum in JS
    // This is fine for small scale
    const { data: aiLogs } = await supabase.from('api_usage_logs').select('tokens_used').eq('api_type', 'gemini_ai');
    const totalAiTokens = aiLogs ? aiLogs.reduce((acc, curr) => acc + (curr.tokens_used || 0), 0) : 0;
    
    // 4. Total API calls
    const { count: totalApiCalls } = await supabase.from('api_usage_logs').select('*', { count: 'exact', head: true });
    
    // 5. Today's builds & API calls
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = today.toISOString();
    
    const { count: todayBuilds } = await supabase.from('saved_builds')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayIso);
      
    const { count: todayApiCalls } = await supabase.from('api_usage_logs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayIso);

    res.json({
      success: true,
      data: {
        totalUsers: totalUsers || 0,
        totalBuilds: totalBuilds || 0,
        totalAiTokens,
        totalApiCalls: totalApiCalls || 0,
        todayBuilds: todayBuilds || 0,
        todayApiCalls: todayApiCalls || 0
      }
    });
  } catch (error) { next(error); }
};

exports.getUsers = async (req, res, next) => {
  try {
    const { data: users, error } = await supabase.from('users')
      .select('id, username, nickname, user_level, role, created_at')
      .order('created_at', { ascending: false });
      
    if (error) throw error;

    // Fetch token usage grouped by user_id
    const { data: allLogs } = await supabase.from('api_usage_logs').select('user_id, tokens_used');
    const tokenMap = {};
    if (allLogs) {
      allLogs.forEach(log => {
        if (log.user_id) {
          tokenMap[log.user_id] = (tokenMap[log.user_id] || 0) + (log.tokens_used || 0);
        }
      });
    }

    // Fetch build counts grouped by user_id
    const { data: allBuilds } = await supabase.from('saved_builds').select('user_id');
    const buildMap = {};
    if (allBuilds) {
      allBuilds.forEach(b => {
        if (b.user_id) {
          buildMap[b.user_id] = (buildMap[b.user_id] || 0) + 1;
        }
      });
    }

    const enhancedUsers = users.map(u => ({
      ...u,
      total_tokens: tokenMap[u.id] || 0,
      total_builds: buildMap[u.id] || 0
    }));

    res.json({ success: true, data: enhancedUsers });
  } catch (error) { next(error); }
};

exports.getApiUsage = async (req, res, next) => {
  try {
    // We fetch all logs and group in JS (for small scale)
    const { data: logs, error } = await supabase.from('api_usage_logs').select('api_type, tokens_used, created_at');
    if (error) throw error;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {};
    if (logs) {
      logs.forEach(log => {
        const type = log.api_type;
        if (!stats[type]) {
          stats[type] = { total_calls: 0, today_calls: 0, total_tokens: 0 };
        }
        stats[type].total_calls++;
        stats[type].total_tokens += (log.tokens_used || 0);
        
        if (new Date(log.created_at) >= today) {
          stats[type].today_calls++;
        }
      });
    }

    const maskKey = (key) => {
      if (!key || key.length < 8) return 'NOT_SET';
      return key.substring(0, 4) + '●●●●●●' + key.substring(key.length - 4);
    };

    const apiKeys = [
      {
        name: '네이버 오픈API (이미지/검색)',
        type: 'naver_shopping',
        key: maskKey(process.env.NAVER_CLIENT_ID),
        stats: stats['naver_shopping'] || { total_calls: 0, today_calls: 0, total_tokens: 0 },
        status: process.env.NAVER_CLIENT_ID ? '정상' : '미설정'
      },
      {
        name: 'AI Gateway (Claude / GPT / Gemini)',
        type: 'gemini_ai',
        key: maskKey(process.env.OPENAI_API_KEY),
        stats: stats['gemini_ai'] || { total_calls: 0, today_calls: 0, total_tokens: 0 },
        status: process.env.OPENAI_API_KEY ? '정상' : '미설정'
      },
      {
        name: 'YouTube API',
        type: 'youtube',
        key: maskKey(process.env.YOUTUBE_API_KEY),
        stats: stats['youtube'] || { total_calls: 0, today_calls: 0, total_tokens: 0 },
        status: process.env.YOUTUBE_API_KEY ? '정상' : '미설정'
      }
    ];

    res.json({ success: true, data: apiKeys });
  } catch (error) { next(error); }
};

exports.getTokenUsage = async (req, res, next) => {
  // We'll just return an empty array for now since we aren't doing the chart bonus
  res.json({ success: true, data: [] });
};
