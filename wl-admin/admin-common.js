/*
 * Partners Page Admin — shared gate, GitHub API, helpers, navigation.
 */
(function (global) {
    'use strict';

    var WL = {
        ACCESS_CODE: 'STASHERWHITELABEL',
        GATE_KEY: 'wl_admin_gate_v1',
        CONFIG_KEY: 'wl_admin_config_v1',
        DEFAULT_REPO_OWNER: 'stasher-city',
        DEFAULT_REPO_NAME: 'stasher-partner-signup',
        DEFAULT_REPO_BRANCH: 'main',
        PARTNERS_JSON_PATH: 'whitelabel/partners.json',
        DEMO_LINKS_JSON_PATH: 'whitelabel/demo-links.json',
        LOGOS_DIR: 'whitelabel/logos',
        PUBLIC_PARTNERS_URL: '/whitelabel/partners.json',
        PUBLIC_DEMO_LINKS_URL: '/whitelabel/demo-links.json',
        DEFAULT_DEMO_CAL_URL: 'https://cal.com/periklis/15min',
        MAX_LOGO_BYTES: 2 * 1024 * 1024,
        SHARE_BASE_URL: 'https://partners.stasher.com/',
        partnersCache: {},
        demoLinksCache: {},
        demoLinksConfig: { version: 1, defaultUrl: 'https://cal.com/periklis/15min', links: {} },
        onUnlock: null
    };

    function $(id) { return document.getElementById(id); }

    WL.isUnlocked = function () {
        try { return sessionStorage.getItem(WL.GATE_KEY) === '1'; }
        catch (e) { return false; }
    };

    WL.readConfig = function () {
        try {
            var raw = localStorage.getItem(WL.CONFIG_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) { return null; }
    };

    WL.writeConfig = function (config) {
        try { localStorage.setItem(WL.CONFIG_KEY, JSON.stringify(config)); } catch (e) {}
    };

    WL.hasGithubConfig = function () {
        var cfg = WL.readConfig();
        return !!(cfg && cfg.token && cfg.owner && cfg.repo && cfg.branch);
    };

    WL.setStatus = function (el, msg, kind) {
        if (!el) return;
        el.textContent = msg || '';
        el.classList.remove('wl-status-success', 'wl-status-error');
        if (kind === 'success') el.classList.add('wl-status-success');
        if (kind === 'error') el.classList.add('wl-status-error');
    };

    WL.escapeHtml = function (s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    WL.escapeAttr = function (s) { return WL.escapeHtml(s); };

    WL.sanitizeCode = function (input) {
        return String(input || '').trim().replace(/[^A-Za-z0-9_-]/g, '');
    };

    WL.buildPartnerShareUrl = function (code) {
        var id = WL.sanitizeCode(code);
        if (!id) return '';
        return WL.SHARE_BASE_URL + '?via=' + encodeURIComponent(id);
    };

    WL.copyToClipboard = function (text, btn, doneLabel) {
        var original = btn ? btn.textContent : '';
        var okLabel = doneLabel || 'Copied!';
        function finish(ok) {
            if (!btn) return;
            btn.textContent = ok ? okLabel : 'Copy failed';
            setTimeout(function () { btn.textContent = original; }, 1500);
        }
        if (!text) { finish(false); return; }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () { finish(true); }).catch(fallback);
            return;
        }
        fallback();
        function fallback() {
            var temp = document.createElement('input');
            temp.value = text;
            document.body.appendChild(temp);
            temp.select();
            try { finish(document.execCommand('copy')); } catch (e) { finish(false); }
            document.body.removeChild(temp);
        }
    };

    WL.shareUrlFieldHtml = function (url) {
        if (!url) return '<span class="wl-muted">—</span>';
        return '' +
            '<div class="wl-saved-url-row wl-list-share-row">' +
                '<input type="text" class="wl-share-url-input" readonly value="' + WL.escapeAttr(url) + '" aria-label="Signup URL">' +
                '<button type="button" class="wl-btn-secondary wl-btn-compact" data-copy-url="' + WL.escapeAttr(url) + '">Copy</button>' +
                '<a class="wl-btn-secondary wl-btn-compact" href="' + WL.escapeAttr(url) + '" target="_blank" rel="noopener">Open</a>' +
            '</div>';
    };

    WL.bindCopyUrlButtons = function (root) {
        if (!root) return;
        Array.prototype.forEach.call(root.querySelectorAll('[data-copy-url]'), function (btn) {
            btn.addEventListener('click', function () {
                WL.copyToClipboard(btn.getAttribute('data-copy-url') || '', btn);
            });
        });
    };

    WL.setUrlPreview = function ($wrap, $input, $openLink, code) {
        var url = WL.buildPartnerShareUrl(code);
        if (!$wrap || !$input) return;
        if (!url) {
            $wrap.hidden = true;
            $input.value = '';
            if ($openLink) { $openLink.setAttribute('href', '#'); $openLink.hidden = true; }
            return;
        }
        $input.value = url;
        $wrap.hidden = false;
        if ($openLink) { $openLink.href = url; $openLink.hidden = false; }
    };

    WL.readFileAsBase64 = function (file) {
        return new Promise(function (resolve, reject) {
            var reader = new FileReader();
            reader.onload = function () {
                var result = String(reader.result || '');
                var comma = result.indexOf(',');
                if (comma < 0) return reject(new Error('Could not read file.'));
                resolve(result.slice(comma + 1));
            };
            reader.onerror = function () { reject(new Error('Could not read file.')); };
            reader.readAsDataURL(file);
        });
    };

    WL.fileExtension = function (file) {
        if (file.type === 'image/png') return 'png';
        if (file.type === 'image/jpeg') return 'jpg';
        return '';
    };

    WL.b64EncodeUtf8 = function (str) {
        return btoa(unescape(encodeURIComponent(str)));
    };

    WL.githubApi = function (method, path, body, token) {
        var headers = {
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        if (body) headers['Content-Type'] = 'application/json';
        return fetch('https://api.github.com' + path, {
            method: method,
            headers: headers,
            body: body ? JSON.stringify(body) : null
        }).then(function (res) {
            if (res.status === 404) return null;
            return res.json().then(function (data) {
                if (!res.ok) {
                    throw new Error((data && data.message) || ('GitHub ' + res.status));
                }
                return data;
            });
        });
    };

    WL.repoContentsPath = function (cfg, path) {
        return '/repos/' + cfg.owner + '/' + cfg.repo + '/contents/' + path;
    };

    WL.getFile = function (cfg, path) {
        return WL.githubApi(
            'GET',
            WL.repoContentsPath(cfg, path) + '?ref=' + encodeURIComponent(cfg.branch),
            null,
            cfg.token
        );
    };

    WL.upsertFile = function (cfg, path, contentBase64, message) {
        return WL.getFile(cfg, path).then(function (existing) {
            var body = { message: message, content: contentBase64, branch: cfg.branch };
            if (existing && existing.sha) body.sha = existing.sha;
            return WL.githubApi('PUT', WL.repoContentsPath(cfg, path), body, cfg.token);
        });
    };

    WL.deleteFile = function (cfg, path, message) {
        return WL.getFile(cfg, path).then(function (existing) {
            if (!existing || !existing.sha) return null;
            return WL.githubApi('DELETE', WL.repoContentsPath(cfg, path), {
                message: message,
                sha: existing.sha,
                branch: cfg.branch
            }, cfg.token);
        });
    };

    WL.verifyGithubAccess = function (cfg) {
        return WL.githubApi('GET', '/repos/' + cfg.owner + '/' + cfg.repo, null, cfg.token)
            .then(function (repoInfo) {
                if (!repoInfo || !repoInfo.permissions || (!repoInfo.permissions.push && !repoInfo.permissions.admin)) {
                    throw new Error('Token cannot push to this repo.');
                }
                return repoInfo;
            });
    };

    WL.initNav = function () {
        var path = (location.pathname || '').replace(/\/$/, '');
        var page = 'hub';
        if (path.indexOf('branded') >= 0) page = 'branded';
        else if (path.indexOf('demo') >= 0) page = 'demo';
        else if (path.indexOf('github') >= 0) page = 'github';
        else if (path === '/wl-admin' || path.indexOf('/wl-admin/index') >= 0) page = 'hub';
        document.body.dataset.wlPage = page;
        Array.prototype.forEach.call(document.querySelectorAll('.wl-app-nav-link'), function (link) {
            var target = link.getAttribute('data-wl-nav');
            if (target === page) link.classList.add('wl-app-nav-link--active');
            else link.classList.remove('wl-app-nav-link--active');
        });
    };

    WL.initGate = function (onUnlock) {
        WL.onUnlock = onUnlock || null;
        var $gate = $('wlGate');
        var $gateForm = $('wlGateForm');
        var $gateInput = $('wlGateCode');
        var $app = $('wlApp');
        var $logoutBtn = $('wlLogoutBtn');

        function unlock() {
            try { sessionStorage.setItem(WL.GATE_KEY, '1'); } catch (e) {}
            if ($gate) $gate.hidden = true;
            if ($app) $app.hidden = false;
            if (typeof WL.onUnlock === 'function') WL.onUnlock();
        }

        function lock() {
            try { sessionStorage.removeItem(WL.GATE_KEY); } catch (e) {}
            if ($app) $app.hidden = true;
            if ($gate) $gate.hidden = false;
            if ($gateInput) { $gateInput.value = ''; $gateInput.focus(); }
        }

        if ($gateForm) {
            $gateForm.addEventListener('submit', function (e) {
                e.preventDefault();
                var value = ($gateInput && $gateInput.value || '').trim();
                if (value === WL.ACCESS_CODE) {
                    if ($gate) $gate.classList.remove('wl-gate-error');
                    unlock();
                } else {
                    if ($gate) $gate.classList.add('wl-gate-error');
                    if ($gateInput) { $gateInput.value = ''; $gateInput.focus(); }
                }
            });
        }
        if ($logoutBtn) $logoutBtn.addEventListener('click', lock);
        WL.initNav();
        if (WL.isUnlocked()) unlock();
    };

    WL.showGithubRequiredBanner = function ($el) {
        if (!$el) return;
        if (WL.hasGithubConfig()) {
            $el.hidden = true;
            return;
        }
        $el.hidden = false;
    };

    global.WLAdmin = WL;
})(typeof window !== 'undefined' ? window : this);
