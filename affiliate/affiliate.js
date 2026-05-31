(function () {
    'use strict';

    // ── Config ──────────────────────────────────────────────────────────────
    var API = 'https://wpnp6ab1ge.execute-api.eu-north-1.amazonaws.com/prod/create-affiliate';
    var SESSION_KEY = 'stasher_affiliate_portal_v1';
    var RECRUIT_BASE = 'https://partners.stasher.com/?via=';

    // ── DOM refs ─────────────────────────────────────────────────────────────
    var $login      = document.getElementById('afLogin');
    var $app        = document.getElementById('afApp');
    var $loginForm  = document.getElementById('afLoginForm');
    var $loginEmail = document.getElementById('afEmail');
    var $loginBtn   = document.getElementById('afLoginBtn');
    var $loginErr   = document.getElementById('afLoginErr');
    var $logoutBtn  = document.getElementById('afLogoutBtn');
    var $avatar     = document.getElementById('afAvatar');
    var $welcome    = document.getElementById('afWelcome');
    var $pageTitle  = document.getElementById('afPageTitle');

    // Home
    var $statBookings   = document.getElementById('afStatBookings');
    var $statRevenue    = document.getElementById('afStatRevenue');
    var $statEarned     = document.getElementById('afStatEarned');
    var $statPending    = document.getElementById('afStatPending');
    var $referralLink   = document.getElementById('afReferralLink');
    var $recruitLink    = document.getElementById('afRecruitLink');
    var $couponCard     = document.getElementById('afCouponCard');
    var $couponList     = document.getElementById('afCouponList');
    var $partnerPageLink = document.getElementById('afPartnerPageLink');

    // Earnings
    var $eStatBookings  = document.getElementById('afEStatBookings');
    var $eStatRevenue   = document.getElementById('afEStatRevenue');
    var $eStatTotal     = document.getElementById('afEStatTotal');
    var $eStatPending   = document.getElementById('afEStatPending');
    var $lastPayCard    = document.getElementById('afLastPaymentCard');
    var $lastPayText    = document.getElementById('afLastPaymentText');
    var $convBody       = document.getElementById('afConvBody');
    var $commBody       = document.getElementById('afCommBody');

    // ── State ────────────────────────────────────────────────────────────────
    var session = null;
    var dashData = null;   // { conversions, commissions }
    var currentPage = 'home';
    var currentTab = 'overview';

    // ── Init ─────────────────────────────────────────────────────────────────
    function init() {
        try {
            var raw = sessionStorage.getItem(SESSION_KEY);
            if (raw) {
                session = JSON.parse(raw);
                showApp();
                return;
            }
        } catch (e) {}
        showLogin();
    }

    // ── Login / Logout ────────────────────────────────────────────────────────
    function showLogin() {
        $login.hidden = false;
        $app.hidden = true;
        $loginEmail.focus();
    }

    function showApp() {
        $login.hidden = true;
        $app.hidden = false;
        renderAvatarAndWelcome();
        navigateTo(currentPage || 'home');
        loadDashboardData();
    }

    $loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var email = ($loginEmail.value || '').trim();
        if (!email) return;

        $loginBtn.disabled = true;
        $loginBtn.textContent = 'Looking up…';
        $loginErr.hidden = true;

        apiFetch('?action=login&email=' + encodeURIComponent(email))
            .then(function (data) {
                if (data.success && data.affiliate) {
                    session = data.affiliate;
                    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch (e) {}
                    showApp();
                } else {
                    showLoginError(data.error || 'No affiliate account found with this email.');
                }
            })
            .catch(function (err) {
                showLoginError(err.message || 'Could not reach the server. Please try again.');
            })
            .finally(function () {
                $loginBtn.disabled = false;
                $loginBtn.textContent = 'Access Dashboard';
            });
    });

    function showLoginError(msg) {
        $loginErr.textContent = msg;
        $loginErr.hidden = false;
    }

    $logoutBtn.addEventListener('click', function () {
        session = null;
        dashData = null;
        currentPage = 'home';
        try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
        showLogin();
    });

    // ── Navigation ────────────────────────────────────────────────────────────
    document.addEventListener('click', function (e) {
        var link = e.target.closest('[data-page]');
        if (link) {
            e.preventDefault();
            navigateTo(link.getAttribute('data-page'));
        }
    });

    function navigateTo(page) {
        currentPage = page;
        var titles = { home: 'Home', earnings: 'Earnings', resources: 'Marketing Kit' };
        $pageTitle.textContent = titles[page] || page;

        document.querySelectorAll('.af-page').forEach(function (p) { p.hidden = true; });
        var $p = document.getElementById('afPage' + capitalize(page));
        if ($p) $p.hidden = false;

        document.querySelectorAll('.af-nav-link').forEach(function (l) {
            l.classList.toggle('af-nav-active', l.getAttribute('data-page') === page);
        });

        if (page === 'home')     renderHome();
        if (page === 'earnings') renderEarnings();
        if (page === 'resources') renderResources();
    }

    // ── Data loading ──────────────────────────────────────────────────────────
    function loadDashboardData() {
        if (!session || !session.id) return;
        apiFetch('?action=dashboard&affiliate_id=' + encodeURIComponent(session.id))
            .then(function (data) {
                dashData = data;
                renderStats(data);
                if (currentPage === 'earnings') renderEarnings();
            })
            .catch(function () {
                setStatValue($statBookings, '—');
                setStatValue($statRevenue, '—');
                setStatValue($statEarned, '—');
                setStatValue($statPending, '—');
            });
    }

    function renderStats(data) {
        var convs = data.conversions || [];
        var comms = data.commissions || [];

        var revenue = convs.reduce(function (s, c) { return s + parseFloat(c.amount || 0); }, 0);
        var earned  = comms.filter(function (c) { return c.approved; })
                           .reduce(function (s, c) { return s + parseFloat(c.amount || 0); }, 0);
        var pending = comms.filter(function (c) { return !c.approved; })
                           .reduce(function (s, c) { return s + parseFloat(c.amount || 0); }, 0);
        var currency = detectCurrency(convs, comms);

        setStatValue($statBookings, convs.length);
        setStatValue($statRevenue,  fmtCurr(revenue, currency));
        setStatValue($statEarned,   fmtCurr(earned,  currency));
        setStatValue($statPending,  fmtCurr(pending, currency));
    }

    // ── Home page ─────────────────────────────────────────────────────────────
    function renderHome() {
        if (!session) return;
        $referralLink.value = session.referral_url || '';
        $recruitLink.value  = RECRUIT_BASE + encodeURIComponent(session.id);

        // Partner page link in Resources section
        if ($partnerPageLink) {
            $partnerPageLink.href = 'https://partners.stasher.com/?via=' + encodeURIComponent(session.id);
        }

        // Coupon codes
        var coupons = session.coupon_codes || [];
        if (coupons.length > 0) {
            $couponCard.hidden = false;
            $couponList.innerHTML = coupons.map(function (c) {
                return '<div class="af-coupon">' +
                    '<span class="af-coupon-code">' + esc(c.code) + '</span>' +
                    (c.discount_percent ? '<span class="af-muted">' + esc(String(c.discount_percent)) + '% off</span>' : '') +
                    '<button class="af-copy-btn" data-copy-val="' + escAttr(c.code) + '">Copy</button>' +
                    '</div>';
            }).join('');

            $couponList.querySelectorAll('[data-copy-val]').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    copyText(btn.getAttribute('data-copy-val'), btn, 'Copy');
                });
            });
        } else {
            $couponCard.hidden = true;
        }

        if (dashData) renderStats(dashData);
    }

    // ── Earnings page ─────────────────────────────────────────────────────────
    function renderEarnings() {
        var convs = dashData ? (dashData.conversions || []) : null;
        var comms = dashData ? (dashData.commissions || []) : null;
        var currency = convs ? detectCurrency(convs, comms || []) : '';

        // Overview stats
        if (convs !== null) {
            var revenue = convs.reduce(function (s, c) { return s + parseFloat(c.amount || 0); }, 0);
            setStatValue($eStatBookings, convs.length);
            setStatValue($eStatRevenue, fmtCurr(revenue, currency));
        }
        if (comms !== null) {
            var earned  = comms.filter(function (c) { return c.approved; })
                               .reduce(function (s, c) { return s + parseFloat(c.amount || 0); }, 0);
            var pending = comms.filter(function (c) { return !c.approved; })
                               .reduce(function (s, c) { return s + parseFloat(c.amount || 0); }, 0);
            setStatValue($eStatTotal,   fmtCurr(earned, currency));
            setStatValue($eStatPending, fmtCurr(pending, currency));

            // Last approved commission date
            var approved = comms.filter(function (c) { return c.approved && c.approved_at; });
            if (approved.length > 0) {
                var last = approved.sort(function (a, b) { return b.approved_at > a.approved_at ? 1 : -1; })[0];
                $lastPayText.textContent = 'Last commission approved: ' + fmtDate(last.approved_at) +
                    ' (' + fmtCurr(parseFloat(last.amount || 0), currency) + ')';
                $lastPayCard.hidden = false;
            }
        }

        // Conversions table
        if (convs !== null) {
            if (convs.length === 0) {
                $convBody.innerHTML = '<tr><td colspan="4" class="af-table-empty">No bookings yet. Share your affiliate link to get started!</td></tr>';
            } else {
                var sorted = convs.slice().sort(function (a, b) { return b.created_at > a.created_at ? 1 : -1; });
                $convBody.innerHTML = sorted.slice(0, 100).map(function (c) {
                    var status = (c.status || 'pending').toLowerCase();
                    return '<tr>' +
                        '<td>' + fmtDate(c.created_at) + '</td>' +
                        '<td>' + fmtCurr(parseFloat(c.amount || 0), currency) + '</td>' +
                        '<td>' + fmtCurr(parseFloat(c.commission_amount || 0), currency) + '</td>' +
                        '<td><span class="af-status af-status-' + esc(status) + '">' + esc(status) + '</span></td>' +
                        '</tr>';
                }).join('');
            }
        }

        // Commissions table
        if (comms !== null) {
            if (comms.length === 0) {
                $commBody.innerHTML = '<tr><td colspan="3" class="af-table-empty">No commissions yet.</td></tr>';
            } else {
                var sortedComms = comms.slice().sort(function (a, b) { return b.created_at > a.created_at ? 1 : -1; });
                $commBody.innerHTML = sortedComms.slice(0, 100).map(function (c) {
                    var approved = c.approved === true;
                    var statusLabel = approved ? 'Approved' : 'Pending';
                    var statusClass = approved ? 'approved' : 'pending';
                    return '<tr>' +
                        '<td>' + fmtDate(c.created_at) + '</td>' +
                        '<td>' + fmtCurr(parseFloat(c.amount || 0), currency) + '</td>' +
                        '<td><span class="af-status af-status-' + statusClass + '">' + statusLabel + '</span></td>' +
                        '</tr>';
                }).join('');
            }
        }
    }

    // ── Resources page ────────────────────────────────────────────────────────
    function renderResources() {
        if (!session) return;
        if ($partnerPageLink) {
            $partnerPageLink.href = 'https://partners.stasher.com/?via=' + encodeURIComponent(session.id);
        }
    }

    // ── Tabs ─────────────────────────────────────────────────────────────────
    document.querySelectorAll('.af-tab-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var tab = btn.getAttribute('data-tab');
            currentTab = tab;
            document.querySelectorAll('.af-tab-btn').forEach(function (b) {
                b.classList.toggle('af-tab-active', b === btn);
            });
            document.querySelectorAll('.af-tab-pane').forEach(function (p) {
                p.hidden = p.id !== 'afTab' + capitalize(tab);
            });
        });
    });

    // ── Copy buttons (delegated for link cards) ───────────────────────────────
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.af-copy-btn[data-copy]');
        if (btn) {
            var inputEl = document.getElementById(btn.getAttribute('data-copy'));
            if (inputEl) copyText(inputEl.value, btn, 'Copy');
        }
    });

    function copyText(text, btn, resetLabel) {
        var orig = btn.textContent;
        try {
            navigator.clipboard.writeText(text).then(function () {
                btn.textContent = 'Copied!';
                setTimeout(function () { btn.textContent = resetLabel || orig; }, 1500);
            }).catch(fallback);
        } catch (e) { fallback(); }

        function fallback() {
            var tmp = document.createElement('input');
            tmp.value = text;
            document.body.appendChild(tmp);
            tmp.select();
            try { document.execCommand('copy'); } catch (e2) {}
            document.body.removeChild(tmp);
            btn.textContent = 'Copied!';
            setTimeout(function () { btn.textContent = resetLabel || orig; }, 1500);
        }
    }

    // ── Avatar / welcome ──────────────────────────────────────────────────────
    function renderAvatarAndWelcome() {
        if (!session) return;
        var first = (session.firstname || '')[0] || '';
        var last  = (session.lastname  || '')[0] || '';
        var initials = (first + last).toUpperCase() || (session.email || 'A')[0].toUpperCase();
        $avatar.textContent = initials;
        $welcome.textContent = 'Hi, ' + (session.firstname || session.email.split('@')[0]) + '!';
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    function apiFetch(qs) {
        return fetch(API + qs).then(function (r) {
            return r.json().then(function (data) {
                if (!r.ok) throw new Error(data.error || ('Server error ' + r.status));
                return data;
            });
        });
    }

    function setStatValue(el, val) {
        if (!el) return;
        el.innerHTML = '';
        el.textContent = String(val);
    }

    function detectCurrency(convs, comms) {
        var c = (convs && convs[0]) || (comms && comms[0]) || {};
        return c.currency || c.conversion_currency || '£';
    }

    var CURRENCY_SYMBOLS = { GBP: '£', EUR: '€', USD: '$', AUD: 'A$' };

    function fmtCurr(amount, currency) {
        if (isNaN(amount)) return '—';
        var sym = (typeof currency === 'string' && currency.length <= 4)
            ? (CURRENCY_SYMBOLS[currency.toUpperCase()] || currency + ' ')
            : (currency || '£');
        return sym + amount.toFixed(2);
    }

    function fmtDate(dateStr) {
        if (!dateStr) return '—';
        var d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function escAttr(s) { return esc(s); }

    // ── Boot ──────────────────────────────────────────────────────────────────
    init();
})();
