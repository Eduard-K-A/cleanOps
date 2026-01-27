const { supabaseAdmin } = require('../lib/supabase');
const { ensureProfile } = require('../lib/profiles');
const { sendError } = require('../lib/errors');

/**
 * GET /api/auth/me — Return current user and profile (Supabase Auth token required).
 */
async function me(req, res) {
  try {
    const { id } = req.user;
    const profile = await ensureProfile(id);
    const { data: full } = await supabaseAdmin.from('profiles').select('*').eq('id', id).single();
    return res.json({
      success: true,
      user: { id: req.user.id, email: req.user.email },
      profile: full || profile,
    });
  } catch (e) {
    console.error('auth/me', e);
    return sendError(res, 'Failed to fetch profile', 500);
  }
}

module.exports = { me };
