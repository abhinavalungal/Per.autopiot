// =============================================================================
//   MARITIME AUTOPILOT — CENTRALIZED LOADER
//   Hosted at a permanent URL you control (e.g. GitHub raw / your CDN).
//
//   HOW IT WORKS
//   ─────────────────────────────────────────────────────────────────────────
//   Users' bookmarks are static stubs that do ONE thing: fetch this file.
//   You never touch the bookmarks again. Everything is controlled here.
//
//   TO UPDATE THE AUTOPILOT
//     Change AUTOPILOT_SCRIPT_URL to point to a new version file,
//     or just overwrite the file at the existing URL.
//     All users get the new version on their next bookmark click.
//
//   TO DISABLE ALL ACCESS
//     Set ACCESS_ENABLED = false  (and optionally set a REVOKE_MESSAGE).
//     Every user who clicks their bookmark will see the message instead.
//
//   TO RESTRICT TO SPECIFIC USERS / DOMAINS
//     Fill ALLOWED_DOMAINS with the hostname(s) where the autopilot
//     should run (e.g. ['app.geoserves.com']).
//     Leave the array empty [] to allow any domain.
//
//   CACHE BUSTING
//     Each fetch appends ?v=<timestamp> so browsers never serve a stale
//     cached copy of the autopilot script.
// =============================================================================

(function () {

    // ── ① ACCESS CONTROL ────────────────────────────────────────────────────

    /** Set to false to immediately disable access for ALL users. */
    const ACCESS_ENABLED = true;

    /** Message shown when ACCESS_ENABLED is false. */
    const REVOKE_MESSAGE = '🚫 Autopilot access has been suspended by the administrator. Please contact the GeoEmissions team.';

    /**
     * Domain whitelist.
     * Leave empty [] to allow the bookmarklet to run on any page.
     * Example: ['app.geoserves.com', 'geoserves.com']
     */
    const ALLOWED_DOMAINS = [];

    // ── ② SCRIPT SOURCE ─────────────────────────────────────────────────────

    /**
     * The URL of the actual autopilot script.
     * To push a new version: either replace the file at this URL,
     * or update this URL to point to the new file and re-host this loader.
     *
     * Recommended pattern using GitHub raw + jsDelivr CDN:
     *   https://cdn.jsdelivr.net/gh/<user>/<repo>@<branch>/<path>.js
     *
     * The ?v= cache-buster is appended automatically — do not add it here.
     */
    const AUTOPILOT_SCRIPT_URL = 'https://cdn.jsdelivr.net/gh/YOUR_GITHUB_USER/YOUR_REPO@main/autopilot_Pv100.js';

    // ── ③ MAINTENANCE / SCHEDULED DOWNTIME ──────────────────────────────────

    /**
     * Optional maintenance window (UTC).
     * Set both to null to disable.
     * Example: block access between 02:00–04:00 UTC daily.
     *   MAINTENANCE_START_UTC_HOUR: 2
     *   MAINTENANCE_END_UTC_HOUR:   4
     */
    const MAINTENANCE_START_UTC_HOUR = null;
    const MAINTENANCE_END_UTC_HOUR   = null;
    const MAINTENANCE_MESSAGE        = '🔧 Autopilot is under scheduled maintenance. Please try again shortly.';

    // ════════════════════════════════════════════════════════════════════════
    //   RUNTIME — do not edit below this line
    // ════════════════════════════════════════════════════════════════════════

    // ── Tiny on-screen toast (shown before the autopilot UI injects itself) ─
    function showToast(msg, color) {
        const existing = document.getElementById('_ap_loader_toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.id = '_ap_loader_toast';
        toast.style.cssText = [
            'position:fixed', 'bottom:20px', 'left:20px', 'z-index:2147483647',
            'padding:14px 20px', 'font-size:14px', 'font-family:monospace',
            `background:${color}`, 'color:#fff', 'border-radius:8px',
            'box-shadow:0 4px 20px rgba(0,0,0,0.6)', 'max-width:460px',
            'line-height:1.5'
        ].join(';');
        toast.innerText = msg;
        document.body.appendChild(toast);
        return toast;
    }

    function removeToast() {
        document.getElementById('_ap_loader_toast')?.remove();
    }

    // ── Guard: access revoked ───────────────────────────────────────────────
    if (!ACCESS_ENABLED) {
        showToast(REVOKE_MESSAGE, '#b71c1c');
        return;
    }

    // ── Guard: domain whitelist ─────────────────────────────────────────────
    if (ALLOWED_DOMAINS.length > 0) {
        const currentHost = window.location.hostname;
        const allowed = ALLOWED_DOMAINS.some(d => currentHost === d || currentHost.endsWith('.' + d));
        if (!allowed) {
            showToast(
                `🚫 Autopilot is not authorized on this domain (${currentHost}).`,
                '#b71c1c'
            );
            return;
        }
    }

    // ── Guard: maintenance window ───────────────────────────────────────────
    if (MAINTENANCE_START_UTC_HOUR !== null && MAINTENANCE_END_UTC_HOUR !== null) {
        const nowHour = new Date().getUTCHours();
        const inWindow = MAINTENANCE_START_UTC_HOUR <= MAINTENANCE_END_UTC_HOUR
            ? (nowHour >= MAINTENANCE_START_UTC_HOUR && nowHour < MAINTENANCE_END_UTC_HOUR)
            : (nowHour >= MAINTENANCE_START_UTC_HOUR || nowHour < MAINTENANCE_END_UTC_HOUR);
        if (inWindow) {
            showToast(MAINTENANCE_MESSAGE, '#e65100');
            return;
        }
    }

    // ── Fetch and execute the real autopilot script ─────────────────────────
    const cacheBustedURL = AUTOPILOT_SCRIPT_URL + '?v=' + Date.now();

    const loadingToast = showToast('⏳ Loading Autopilot... please wait.', '#1565c0');

    fetch(cacheBustedURL)
        .then(function (res) {
            if (!res.ok) {
                throw new Error('HTTP ' + res.status + ' — could not fetch autopilot script.');
            }
            return res.text();
        })
        .then(function (scriptText) {
            removeToast();
            try {
                // eslint-disable-next-line no-new-func
                new Function(scriptText)();
            } catch (execErr) {
                showToast('💥 Autopilot script execution error: ' + execErr.message, '#b71c1c');
                console.error('[Autopilot Loader] Execution error:', execErr);
            }
        })
        .catch(function (fetchErr) {
            removeToast();
            showToast(
                '❌ Could not load Autopilot.\n' + fetchErr.message +
                '\n\nCheck your connection or contact the GeoEmissions team.',
                '#b71c1c'
            );
            console.error('[Autopilot Loader] Fetch error:', fetchErr);
        });

})();
