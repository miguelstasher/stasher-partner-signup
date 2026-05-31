(function () {
    'use strict';

    var WL = window.WLAdmin;
    var $githubBanner = document.getElementById('wlGithubBanner');
    var $demoDefaultUrl = document.getElementById('wlDemoDefaultUrl');
    var $saveDefaultDemoBtn = document.getElementById('wlSaveDefaultDemoBtn');
    var $demoDefaultStatus = document.getElementById('wlDemoDefaultStatus');
    var $demoDefaultCard = document.getElementById('wlDemoDefaultCard');
    var $demoFormCard = document.getElementById('wlDemoFormCard');
    var $demoFormTitle = document.getElementById('wlDemoFormTitle');
    var $demoForm = document.getElementById('wlDemoForm');
    var $demoEditingId = document.getElementById('wlDemoEditingId');
    var $demoName = document.getElementById('wlDemoName');
    var $demoParentId = document.getElementById('wlDemoParentId');
    var $demoCalUrl = document.getElementById('wlDemoCalUrl');
    var $demoSaveBtn = document.getElementById('wlDemoSaveBtn');
    var $demoSaveStatus = document.getElementById('wlDemoSaveStatus');
    var $cancelDemoEditBtn = document.getElementById('wlCancelDemoEditBtn');
    var $demoSignupUrlPreview = document.getElementById('wlDemoSignupUrlPreview');
    var $demoSignupUrlPreviewInput = document.getElementById('wlDemoSignupUrlPreviewInput');
    var $demoSignupUrlPreviewCopy = document.getElementById('wlDemoSignupUrlPreviewCopy');
    var $demoSignupUrlPreviewOpen = document.getElementById('wlDemoSignupUrlPreviewOpen');
    var $demoListCard = document.getElementById('wlDemoListCard');
    var $demoListContent = document.getElementById('wlDemoListContent');
    var $demoRefreshBtn = document.getElementById('wlDemoRefreshBtn');

    function togglePageVisibility() {
        var has = WL.hasGithubConfig();
        if ($demoDefaultCard) $demoDefaultCard.hidden = !has;
        if ($demoFormCard) $demoFormCard.hidden = !has;
        if ($demoListCard) $demoListCard.hidden = !has;
        WL.showGithubRequiredBanner($githubBanner);
    }

    function hideDemoSignupUrlPreview() {
        if ($demoSignupUrlPreview) $demoSignupUrlPreview.hidden = true;
        if ($demoSignupUrlPreviewInput) $demoSignupUrlPreviewInput.value = '';
    }

    function updateDemoSignupUrlPreview() {
        WL.setUrlPreview($demoSignupUrlPreview, $demoSignupUrlPreviewInput, $demoSignupUrlPreviewOpen, $demoParentId && $demoParentId.value);
    }

    if ($demoParentId) {
        $demoParentId.addEventListener('input', updateDemoSignupUrlPreview);
        $demoParentId.addEventListener('change', updateDemoSignupUrlPreview);
    }
    if ($demoSignupUrlPreviewCopy) {
        $demoSignupUrlPreviewCopy.addEventListener('click', function () {
            WL.copyToClipboard($demoSignupUrlPreviewInput.value, $demoSignupUrlPreviewCopy);
        });
    }

    function loadDemoLinksDocument(cfg) {
        return WL.getFile(cfg, WL.DEMO_LINKS_JSON_PATH).then(function (existing) {
            var current = { version: 1, defaultUrl: WL.DEFAULT_DEMO_CAL_URL, links: {} };
            if (existing && existing.content) {
                try { current = JSON.parse(atob(existing.content.replace(/\n/g, ''))); } catch (e) {}
            }
            if (!current.links) current.links = {};
            if (!current.defaultUrl) current.defaultUrl = WL.DEFAULT_DEMO_CAL_URL;
            if (!current.version) current.version = 1;
            return { existing: existing, data: current };
        });
    }

    function saveDemoLinksDocument(cfg, patch) {
        return loadDemoLinksDocument(cfg).then(function (result) {
            var current = result.data;
            if (patch.defaultUrl) current.defaultUrl = patch.defaultUrl;
            var body = {
                message: 'whitelabel: update demo links config',
                content: WL.b64EncodeUtf8(JSON.stringify(current, null, 2) + '\n'),
                branch: cfg.branch
            };
            if (result.existing && result.existing.sha) body.sha = result.existing.sha;
            return WL.githubApi('PUT', WL.repoContentsPath(cfg, WL.DEMO_LINKS_JSON_PATH), body, cfg.token);
        });
    }

    function upsertDemoLink(cfg, parentId, entry) {
        return loadDemoLinksDocument(cfg).then(function (result) {
            var current = result.data;
            current.links[parentId] = entry;
            var body = {
                message: 'whitelabel: save demo link ' + parentId,
                content: WL.b64EncodeUtf8(JSON.stringify(current, null, 2) + '\n'),
                branch: cfg.branch
            };
            if (result.existing && result.existing.sha) body.sha = result.existing.sha;
            return WL.githubApi('PUT', WL.repoContentsPath(cfg, WL.DEMO_LINKS_JSON_PATH), body, cfg.token);
        });
    }

    function removeDemoLinkFromJson(cfg, parentId) {
        return loadDemoLinksDocument(cfg).then(function (result) {
            var current = result.data;
            if (!(parentId in current.links)) return;
            delete current.links[parentId];
            var body = {
                message: 'whitelabel: remove demo link ' + parentId,
                content: WL.b64EncodeUtf8(JSON.stringify(current, null, 2) + '\n'),
                branch: cfg.branch
            };
            if (result.existing && result.existing.sha) body.sha = result.existing.sha;
            return WL.githubApi('PUT', WL.repoContentsPath(cfg, WL.DEMO_LINKS_JSON_PATH), body, cfg.token);
        });
    }

    function refreshDemo() {
        if (!$demoListContent || ($demoListCard && $demoListCard.hidden)) return;
        $demoListContent.innerHTML = '<p class="wl-muted">Loading…</p>';
        var cfg = WL.readConfig();
        var fetchDemo;
        if (cfg && cfg.token) {
            fetchDemo = WL.getFile(cfg, WL.DEMO_LINKS_JSON_PATH).then(function (existing) {
                if (!existing || !existing.content) {
                    return { version: 1, defaultUrl: WL.DEFAULT_DEMO_CAL_URL, links: {} };
                }
                try {
                    return JSON.parse(atob(existing.content.replace(/\n/g, '')));
                } catch (e) {
                    return { version: 1, defaultUrl: WL.DEFAULT_DEMO_CAL_URL, links: {} };
                }
            });
        } else {
            fetchDemo = fetch(WL.PUBLIC_DEMO_LINKS_URL, { cache: 'no-store' })
                .then(function (r) {
                    return r.ok ? r.json() : { version: 1, defaultUrl: WL.DEFAULT_DEMO_CAL_URL, links: {} };
                });
        }
        fetchDemo
            .then(function (config) {
                WL.demoLinksConfig = config || { version: 1, defaultUrl: WL.DEFAULT_DEMO_CAL_URL, links: {} };
                if (!WL.demoLinksConfig.links) WL.demoLinksConfig.links = {};
                if (!WL.demoLinksConfig.defaultUrl) WL.demoLinksConfig.defaultUrl = WL.DEFAULT_DEMO_CAL_URL;
                WL.demoLinksCache = WL.demoLinksConfig.links;
                if ($demoDefaultUrl) {
                    $demoDefaultUrl.value = WL.demoLinksConfig.defaultUrl || WL.DEFAULT_DEMO_CAL_URL;
                }
                renderDemoList(WL.demoLinksConfig);
            })
            .catch(function (err) {
                $demoListContent.innerHTML = '<p class="wl-list-empty">Could not load demo links: ' + WL.escapeHtml(err.message) + '</p>';
            });
    }

    function renderDemoList(config) {
        if (!$demoListContent) return;
        var links = (config && config.links) ? config.links : {};
        var defaultUrl = (config && config.defaultUrl) ? config.defaultUrl : WL.DEFAULT_DEMO_CAL_URL;
        var ids = Object.keys(links).sort();

        var defaultHtml = '' +
            '<div class="wl-default-preview">' +
                '<span class="wl-live-badge">Live</span>' +
                '<strong>Default (fallback when no parent match):</strong> ' +
                '<a href="' + WL.escapeAttr(defaultUrl) + '" target="_blank" rel="noopener">' + WL.escapeHtml(defaultUrl) + '</a>' +
            '</div>';

        if (ids.length === 0) {
            $demoListContent.innerHTML = defaultHtml + '<p class="wl-list-empty">No parent-specific demo links yet. Add one above.</p>';
            return;
        }

        var html = ids.map(function (id) {
            var link = links[id] || {};
            var calUrl = link.calUrl || '';
            var signupUrl = WL.buildPartnerShareUrl(id);
            var name = link.name || id;
            return '' +
                '<div class="wl-list-item wl-list-item--demo">' +
                    '<div class="wl-list-avatar" aria-hidden="true">' +
                        '<span class="wl-list-avatar-letter">' + WL.escapeHtml(name.charAt(0).toUpperCase()) + '</span>' +
                    '</div>' +
                    '<div class="wl-list-body">' +
                        '<p class="wl-list-field-label">Name</p>' +
                        '<p class="wl-list-title-row">' +
                            '<span class="wl-live-badge">Live</span>' +
                            '<span class="wl-list-name">' + WL.escapeHtml(name) + '</span>' +
                        '</p>' +
                        '<p class="wl-list-field-label">Parent ID</p>' +
                        '<p class="wl-list-code"><code>' + WL.escapeHtml(id) + '</code></p>' +
                        '<p class="wl-list-field-label">Signup URL</p>' +
                        WL.shareUrlFieldHtml(signupUrl) +
                        '<p class="wl-list-field-label">Cal.com link</p>' +
                        (calUrl
                            ? '<a class="wl-list-link" href="' + WL.escapeAttr(calUrl) + '" target="_blank" rel="noopener">' + WL.escapeHtml(calUrl) + '</a>'
                            : '<span class="wl-muted">—</span>') +
                    '</div>' +
                    '<div class="wl-list-actions">' +
                        (calUrl ? '<a class="wl-link" href="' + WL.escapeAttr(calUrl) + '" target="_blank" rel="noopener">Open Cal</a>' : '') +
                        '<button type="button" class="wl-link" data-demo-edit="' + WL.escapeAttr(id) + '">Edit</button>' +
                        '<button type="button" class="wl-link wl-link-danger" data-demo-delete="' + WL.escapeAttr(id) + '">Delete</button>' +
                        (calUrl ? '<button type="button" class="wl-link" data-copy-url="' + WL.escapeAttr(calUrl) + '">Copy Cal</button>' : '') +
                    '</div>' +
                '</div>';
        }).join('');

        $demoListContent.innerHTML = defaultHtml + html;
        WL.bindCopyUrlButtons($demoListContent);

        Array.prototype.forEach.call($demoListContent.querySelectorAll('[data-demo-edit]'), function (btn) {
            btn.addEventListener('click', function () {
                enterDemoEditMode(btn.getAttribute('data-demo-edit'));
            });
        });
        Array.prototype.forEach.call($demoListContent.querySelectorAll('[data-demo-delete]'), function (btn) {
            btn.addEventListener('click', function () {
                deleteDemoLink(btn.getAttribute('data-demo-delete'));
            });
        });
    }

    function enterDemoEditMode(parentId) {
        var link = WL.demoLinksCache[parentId];
        if (!link) {
            WL.setStatus($demoSaveStatus, 'Could not find demo link: ' + parentId, 'error');
            return;
        }
        $demoEditingId.value = parentId;
        $demoParentId.value = parentId;
        $demoParentId.readOnly = true;
        $demoParentId.classList.add('wl-readonly');
        $demoName.value = link.name || '';
        $demoCalUrl.value = link.calUrl || '';
        $demoFormTitle.textContent = 'Edit demo link';
        $demoSaveBtn.textContent = 'Update demo link';
        $cancelDemoEditBtn.hidden = false;
        WL.setUrlPreview($demoSignupUrlPreview, $demoSignupUrlPreviewInput, $demoSignupUrlPreviewOpen, parentId);
        WL.setStatus($demoSaveStatus, '', null);
        $demoFormCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function exitDemoEditMode() {
        $demoEditingId.value = '';
        $demoParentId.readOnly = false;
        $demoParentId.classList.remove('wl-readonly');
        $demoFormTitle.textContent = 'Add demo link';
        $demoSaveBtn.textContent = 'Save demo link';
        $cancelDemoEditBtn.hidden = true;
        hideDemoSignupUrlPreview();
    }

    function saveDemoLink() {
        var cfg = WL.readConfig();
        if (!cfg || !cfg.token) {
            return Promise.reject(new Error('Connect GitHub Repo first.'));
        }
        var editingId = ($demoEditingId.value || '').trim();
        var isEditing = !!editingId;
        var parentId = isEditing ? editingId : WL.sanitizeCode($demoParentId.value);
        if (!parentId) return Promise.reject(new Error('Parent ID is invalid.'));

        var name = ($demoName.value || '').trim();
        if (!name) return Promise.reject(new Error('Name is required.'));

        var calUrl = ($demoCalUrl.value || '').trim();
        if (!calUrl || !/^https?:\/\//i.test(calUrl)) {
            return Promise.reject(new Error('Cal.com link must start with http:// or https://.'));
        }

        $demoSaveBtn.disabled = true;
        WL.setStatus($demoSaveStatus, 'Saving…', null);

        return upsertDemoLink(cfg, parentId, {
            parentId: parentId,
            name: name,
            calUrl: calUrl,
            updatedAt: new Date().toISOString()
        }).then(function () {
            WL.setStatus($demoSaveStatus, isEditing ? 'Updated.' : 'Saved.', 'success');
            $demoSaveBtn.disabled = false;
            exitDemoEditMode();
            $demoForm.reset();
            refreshDemo();
        });
    }

    function deleteDemoLink(parentId) {
        var cfg = WL.readConfig();
        if (!cfg || !cfg.token) {
            WL.setStatus($demoSaveStatus, 'Connect GitHub Repo first.', 'error');
            return;
        }
        var link = WL.demoLinksCache[parentId];
        if (!link) return;
        if (!window.confirm('Delete demo link for "' + (link.name || parentId) + '"?')) return;

        WL.setStatus($demoSaveStatus, 'Deleting…', null);
        removeDemoLinkFromJson(cfg, parentId)
            .then(function () {
                WL.setStatus($demoSaveStatus, 'Deleted.', 'success');
                if ($demoEditingId.value === parentId) {
                    exitDemoEditMode();
                    $demoForm.reset();
                }
                refreshDemo();
            })
            .catch(function (err) {
                WL.setStatus($demoSaveStatus, 'Delete failed: ' + err.message, 'error');
            });
    }

    if ($saveDefaultDemoBtn) {
        $saveDefaultDemoBtn.addEventListener('click', function () {
            var cfg = WL.readConfig();
            if (!cfg || !cfg.token) {
                WL.setStatus($demoDefaultStatus, 'Connect GitHub Repo first.', 'error');
                return;
            }
            var defaultUrl = ($demoDefaultUrl.value || '').trim();
            if (!defaultUrl || !/^https?:\/\//i.test(defaultUrl)) {
                WL.setStatus($demoDefaultStatus, 'Enter a valid Cal.com URL.', 'error');
                return;
            }
            WL.setStatus($demoDefaultStatus, 'Saving default…', null);
            saveDemoLinksDocument(cfg, { defaultUrl: defaultUrl })
                .then(function () {
                    WL.setStatus($demoDefaultStatus, 'Default saved.', 'success');
                    refreshDemo();
                })
                .catch(function (err) {
                    WL.setStatus($demoDefaultStatus, 'Save failed: ' + err.message, 'error');
                });
        });
    }

    if ($demoForm) {
        $demoForm.addEventListener('submit', function (e) {
            e.preventDefault();
            saveDemoLink().catch(function (err) {
                WL.setStatus($demoSaveStatus, 'Save failed: ' + err.message, 'error');
                $demoSaveBtn.disabled = false;
            });
        });
    }
    if ($cancelDemoEditBtn) {
        $cancelDemoEditBtn.addEventListener('click', function () {
            exitDemoEditMode();
            $demoForm.reset();
            hideDemoSignupUrlPreview();
            WL.setStatus($demoSaveStatus, '', null);
        });
    }
    if ($demoRefreshBtn) $demoRefreshBtn.addEventListener('click', refreshDemo);

    WL.initGate(function () {
        togglePageVisibility();
        refreshDemo();
    });
})();
