(function () {
    'use strict';

    var WL = window.WLAdmin;
    var $githubBanner = document.getElementById('wlGithubBanner');
    var $formCard = document.getElementById('wlFormCard');
    var $formTitle = document.getElementById('wlFormTitle');
    var $form = document.getElementById('wlPartnerForm');
    var $editingCode = document.getElementById('wlEditingCode');
    var $code = document.getElementById('wlPartnerCode');
    var $logo = document.getElementById('wlPartnerLogo');
    var $logoEditHint = document.getElementById('wlLogoEditHint');
    var $logoPreview = document.getElementById('wlLogoPreview');
    var $logoPreviewImg = document.getElementById('wlLogoPreviewImg');
    var $logoPreviewLabel = document.getElementById('wlLogoPreviewLabel');
    var $logoPreviewHint = document.getElementById('wlLogoPreviewHint');
    var savedLogoPreviewSrc = '';
    var $colorPicker = document.getElementById('wlPartnerColor');
    var $colorHex = document.getElementById('wlPartnerColorHex');
    var $heroHeadline = document.getElementById('wlPartnerHeroHeadline');
    var $heroSubtitle = document.getElementById('wlPartnerHeroSubtitle');
    var $titleField = document.getElementById('wlPartnerTitle');
    var $desc = document.getElementById('wlPartnerDescription');
    var $ctaUrl = document.getElementById('wlPartnerCtaUrl');
    var $ctaLabel = document.getElementById('wlPartnerCtaLabel');
    var $saveBtn = document.getElementById('wlSaveBtn');
    var $saveStatus = document.getElementById('wlSaveStatus');
    var $cancelEditBtn = document.getElementById('wlCancelEditBtn');
    var $savedUrl = document.getElementById('wlSavedUrl');
    var $savedUrlInput = document.getElementById('wlSavedUrlInput');
    var $savedUrlCopy = document.getElementById('wlSavedUrlCopy');
    var $partnerUrlPreview = document.getElementById('wlPartnerUrlPreview');
    var $partnerUrlPreviewInput = document.getElementById('wlPartnerUrlPreviewInput');
    var $partnerUrlPreviewCopy = document.getElementById('wlPartnerUrlPreviewCopy');
    var $partnerUrlPreviewOpen = document.getElementById('wlPartnerUrlPreviewOpen');
    var $listCard = document.getElementById('wlListCard');
    var $listContent = document.getElementById('wlListContent');
    var $refreshBtn = document.getElementById('wlRefreshBtn');

    function togglePageVisibility() {
        var has = WL.hasGithubConfig();
        if ($formCard) $formCard.hidden = !has;
        if ($listCard) $listCard.hidden = !has;
        WL.showGithubRequiredBanner($githubBanner);
    }

    function hidePartnerUrlPreview() {
        if ($partnerUrlPreview) $partnerUrlPreview.hidden = true;
        if ($partnerUrlPreviewInput) $partnerUrlPreviewInput.value = '';
    }

    function updatePartnerUrlPreview() {
        WL.setUrlPreview($partnerUrlPreview, $partnerUrlPreviewInput, $partnerUrlPreviewOpen, $code && $code.value);
    }

    if ($code) {
        $code.addEventListener('input', updatePartnerUrlPreview);
        $code.addEventListener('change', updatePartnerUrlPreview);
    }
    if ($partnerUrlPreviewCopy) {
        $partnerUrlPreviewCopy.addEventListener('click', function () {
            WL.copyToClipboard($partnerUrlPreviewInput.value, $partnerUrlPreviewCopy);
        });
    }

    if ($colorPicker && $colorHex) {
        $colorPicker.addEventListener('input', function () {
            $colorHex.value = $colorPicker.value.toUpperCase();
        });
        $colorHex.addEventListener('input', function () {
            var v = ($colorHex.value || '').trim();
            if (!/^#?[0-9a-fA-F]{6}$/.test(v)) return;
            if (v.charAt(0) !== '#') v = '#' + v;
            $colorHex.value = v.toUpperCase();
            $colorPicker.value = v.toLowerCase();
        });
    }

    function refreshBranded() {
        if (!$listContent || ($listCard && $listCard.hidden)) return;
        $listContent.innerHTML = '<p class="wl-muted">Loading…</p>';
        var cfg = WL.readConfig();
        var fetchPartners;
        if (cfg && cfg.token) {
            fetchPartners = WL.getFile(cfg, WL.PARTNERS_JSON_PATH).then(function (existing) {
                if (!existing || !existing.content) return { version: 1, partners: {} };
                try {
                    return JSON.parse(atob(existing.content.replace(/\n/g, '')));
                } catch (e) {
                    return { version: 1, partners: {} };
                }
            });
        } else {
            fetchPartners = fetch(WL.PUBLIC_PARTNERS_URL, { cache: 'no-store' })
                .then(function (r) { return r.ok ? r.json() : { partners: {} }; });
        }
        fetchPartners
            .then(function (data) {
                WL.partnersCache = (data && data.partners) ? data.partners : {};
                renderList(WL.partnersCache);
            })
            .catch(function (err) {
                $listContent.innerHTML = '<p class="wl-list-empty">Could not load list: ' + WL.escapeHtml(err.message) + '</p>';
            });
    }

    function renderList(partners) {
        var codes = Object.keys(partners).sort();
        if (codes.length === 0) {
            $listContent.innerHTML = '<p class="wl-list-empty">No branded pages yet. Create one above.</p>';
            return;
        }
        var html = codes.map(function (code) {
            var p = partners[code] || {};
            var logoSrc = p.logoPath || '';
            var color = p.brandColor || '#142e59';
            var url = WL.buildPartnerShareUrl(code);
            return '' +
                '<div class="wl-list-item">' +
                    '<div class="wl-list-logo">' +
                        (logoSrc ? '<img src="' + WL.escapeAttr(logoSrc) + '" alt="' + WL.escapeAttr(code) + ' logo">' : '') +
                    '</div>' +
                    '<div class="wl-list-body">' +
                        '<p class="wl-list-field-label">Parent ID</p>' +
                        '<p class="wl-list-code"><code>' + WL.escapeHtml(code) + '</code></p>' +
                        '<p class="wl-list-field-label">Signup URL</p>' +
                        WL.shareUrlFieldHtml(url) +
                        '<div class="wl-list-meta">' +
                            '<span class="wl-color-chip">' +
                                '<span class="wl-color-chip-dot" style="background:' + WL.escapeAttr(color) + '"></span>' +
                                WL.escapeHtml(color.toUpperCase()) +
                            '</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="wl-list-actions">' +
                        '<a class="wl-link" href="' + WL.escapeAttr(url) + '" target="_blank" rel="noopener">Preview</a>' +
                        '<button type="button" class="wl-link" data-edit="' + WL.escapeAttr(code) + '">Edit</button>' +
                        '<button type="button" class="wl-link wl-link-danger" data-delete="' + WL.escapeAttr(code) + '">Delete</button>' +
                    '</div>' +
                '</div>';
        }).join('');
        $listContent.innerHTML = html;
        WL.bindCopyUrlButtons($listContent);
        Array.prototype.forEach.call($listContent.querySelectorAll('[data-edit]'), function (btn) {
            btn.addEventListener('click', function () { enterEditMode(btn.getAttribute('data-edit')); });
        });
        Array.prototype.forEach.call($listContent.querySelectorAll('[data-delete]'), function (btn) {
            btn.addEventListener('click', function () { deletePartner(btn.getAttribute('data-delete')); });
        });
    }

    function upsertPartnersJson(cfg, code, entry) {
        return WL.getFile(cfg, WL.PARTNERS_JSON_PATH).then(function (existing) {
            var current = { version: 1, partners: {} };
            if (existing && existing.content) {
                try {
                    var parsed = JSON.parse(atob(existing.content.replace(/\n/g, '')));
                    if (parsed && parsed.partners) current = parsed;
                    if (!current.version) current.version = 1;
                } catch (e) {}
            }
            current.partners[code] = entry;
            var body = {
                message: 'whitelabel: save partner ' + code,
                content: WL.b64EncodeUtf8(JSON.stringify(current, null, 2) + '\n'),
                branch: cfg.branch
            };
            if (existing && existing.sha) body.sha = existing.sha;
            return WL.githubApi('PUT', WL.repoContentsPath(cfg, WL.PARTNERS_JSON_PATH), body, cfg.token);
        });
    }

    function removePartnerFromJson(cfg, code) {
        return WL.getFile(cfg, WL.PARTNERS_JSON_PATH).then(function (existing) {
            var current = { version: 1, partners: {} };
            if (existing && existing.content) {
                try {
                    current = JSON.parse(atob(existing.content.replace(/\n/g, '')));
                    if (!current.partners) current.partners = {};
                } catch (e) {}
            }
            if (!(code in current.partners)) return;
            delete current.partners[code];
            var body = {
                message: 'whitelabel: remove partner ' + code,
                content: WL.b64EncodeUtf8(JSON.stringify(current, null, 2) + '\n'),
                branch: cfg.branch
            };
            if (existing && existing.sha) body.sha = existing.sha;
            return WL.githubApi('PUT', WL.repoContentsPath(cfg, WL.PARTNERS_JSON_PATH), body, cfg.token);
        });
    }

    function savePartner() {
        var cfg = WL.readConfig();
        if (!cfg || !cfg.token) {
            return Promise.reject(new Error('Connect GitHub Repo first.'));
        }
        var editingCode = ($editingCode.value || '').trim();
        var isEditing = !!editingCode;
        var code = isEditing ? editingCode : WL.sanitizeCode($code.value);
        if (!code) return Promise.reject(new Error('Parent ID code is invalid.'));

        var file = $logo.files && $logo.files[0];
        if (!isEditing && !file) return Promise.reject(new Error('Please choose a logo file.'));
        if (file) {
            if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
                return Promise.reject(new Error('Logo must be a PNG or JPEG.'));
            }
            if (file.size > WL.MAX_LOGO_BYTES) {
                return Promise.reject(new Error('Logo is larger than 2 MB.'));
            }
        }

        var color = ($colorHex.value || '').trim();
        if (color.charAt(0) !== '#') color = '#' + color;
        if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
            return Promise.reject(new Error('Brand colour must be a hex like #1A73E8.'));
        }

        var description = ($desc.value || '').trim();
        if (!description) return Promise.reject(new Error('Description is required.'));

        $saveBtn.disabled = true;
        $savedUrl.hidden = true;

        var existingPartner = WL.partnersCache[code] || null;
        var existingLogoPath = (existingPartner && existingPartner.logoPath) ? existingPartner.logoPath.replace(/^\//, '') : null;
        var finalLogoPath;
        var logoUploadPromise;

        if (file) {
            var ext = WL.fileExtension(file);
            if (!ext) return Promise.reject(new Error('Unsupported file type.'));
            finalLogoPath = WL.LOGOS_DIR + '/' + code + '.' + ext;
            WL.setStatus($saveStatus, 'Uploading logo…', null);
            logoUploadPromise = WL.readFileAsBase64(file).then(function (b64) {
                return WL.upsertFile(cfg, finalLogoPath, b64, 'whitelabel: upload logo for ' + code);
            }).then(function () {
                if (existingLogoPath && existingLogoPath !== finalLogoPath) {
                    return WL.deleteFile(cfg, existingLogoPath, 'whitelabel: remove old logo for ' + code).catch(function () {});
                }
            });
        } else {
            finalLogoPath = existingLogoPath;
            logoUploadPromise = Promise.resolve();
        }

        return logoUploadPromise
            .then(function () {
                WL.setStatus($saveStatus, 'Saving partner…', null);
                return upsertPartnersJson(cfg, code, {
                    code: code,
                    brandColor: color.toLowerCase(),
                    heroHeadline: ($heroHeadline.value || '').trim(),
                    heroSubtitle: ($heroSubtitle.value || '').trim(),
                    title: ($titleField.value || '').trim(),
                    description: description,
                    ctaUrl: ($ctaUrl.value || '').trim(),
                    ctaLabel: ($ctaLabel.value || '').trim(),
                    logoPath: '/' + finalLogoPath,
                    updatedAt: new Date().toISOString()
                });
            })
            .then(function () {
                var url = WL.buildPartnerShareUrl(code);
                $savedUrlInput.value = url;
                $savedUrl.hidden = false;
                WL.setUrlPreview($partnerUrlPreview, $partnerUrlPreviewInput, $partnerUrlPreviewOpen, code);
                WL.setStatus($saveStatus, isEditing ? 'Updated. Live within a few minutes.' : 'Saved. Live within a few minutes.', 'success');
                $saveBtn.disabled = false;
                exitEditMode();
                $form.reset();
                $colorPicker.value = '#142e59';
                $colorHex.value = '#142E59';
                refreshBranded();
            });
    }

    function enterEditMode(code) {
        var partner = WL.partnersCache[code];
        if (!partner) {
            WL.setStatus($saveStatus, 'Could not find partner: ' + code, 'error');
            return;
        }
        $editingCode.value = code;
        $code.value = code;
        $code.readOnly = true;
        $code.classList.add('wl-readonly');
        $heroHeadline.value = partner.heroHeadline || '';
        $heroSubtitle.value = partner.heroSubtitle || '';
        $titleField.value = partner.title || '';
        $desc.value = partner.description || '';
        $colorPicker.value = (partner.brandColor || '#142e59').toLowerCase();
        $colorHex.value = (partner.brandColor || '#142e59').toUpperCase();
        $ctaUrl.value = partner.ctaUrl || '';
        $ctaLabel.value = partner.ctaLabel || '';
        $logo.value = '';
        $logo.required = false;
        $logoEditHint.hidden = false;
        showSavedLogoPreview(partner.logoPath);
        $formTitle.textContent = 'Edit branded page: ' + code;
        $saveBtn.textContent = 'Update branded page';
        $cancelEditBtn.hidden = false;
        var shareUrl = WL.buildPartnerShareUrl(code);
        $savedUrlInput.value = shareUrl;
        $savedUrl.hidden = !shareUrl;
        WL.setUrlPreview($partnerUrlPreview, $partnerUrlPreviewInput, $partnerUrlPreviewOpen, code);
        WL.setStatus($saveStatus, '', null);
        $formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function exitEditMode() {
        $editingCode.value = '';
        $code.readOnly = false;
        $code.classList.remove('wl-readonly');
        $logo.required = true;
        $logoEditHint.hidden = true;
        $formTitle.textContent = 'Create a branded page';
        $saveBtn.textContent = 'Save branded page';
        $cancelEditBtn.hidden = true;
        hideLogoPreview();
        hidePartnerUrlPreview();
    }

    function showSavedLogoPreview(logoPath) {
        if (!logoPath) { hideLogoPreview(); return; }
        savedLogoPreviewSrc = logoPath + (logoPath.indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now();
        $logoPreviewImg.src = savedLogoPreviewSrc;
        $logoPreviewLabel.textContent = 'Current logo';
        $logoPreviewHint.textContent = 'Pick a new file to replace it, or leave empty to keep this one.';
        $logoPreview.hidden = false;
    }

    function hideLogoPreview() {
        $logoPreview.hidden = true;
        $logoPreviewImg.removeAttribute('src');
        savedLogoPreviewSrc = '';
    }

    function deletePartner(code) {
        var cfg = WL.readConfig();
        if (!cfg || !cfg.token) {
            WL.setStatus($saveStatus, 'Connect GitHub Repo first.', 'error');
            return;
        }
        var partner = WL.partnersCache[code];
        if (!partner) return;
        if (!window.confirm('Delete branded page "' + code + '"? This cannot be undone.')) return;

        WL.setStatus($saveStatus, 'Deleting ' + code + '…', null);
        var logoPath = (partner.logoPath || '').replace(/^\//, '');
        var deleteLogoPromise = logoPath
            ? WL.deleteFile(cfg, logoPath, 'whitelabel: delete logo for ' + code).catch(function () {})
            : Promise.resolve();

        deleteLogoPromise
            .then(function () { return removePartnerFromJson(cfg, code); })
            .then(function () {
                WL.setStatus($saveStatus, 'Deleted ' + code + '.', 'success');
                if ($editingCode.value === code) {
                    exitEditMode();
                    $form.reset();
                }
                refreshBranded();
            })
            .catch(function (err) {
                WL.setStatus($saveStatus, 'Delete failed: ' + err.message, 'error');
            });
    }

    if ($form) {
        $form.addEventListener('submit', function (e) {
            e.preventDefault();
            savePartner().catch(function (err) {
                WL.setStatus($saveStatus, 'Save failed: ' + err.message, 'error');
                $saveBtn.disabled = false;
            });
        });
    }
    if ($savedUrlCopy) {
        $savedUrlCopy.addEventListener('click', function () {
            WL.copyToClipboard($savedUrlInput.value, $savedUrlCopy);
            WL.setStatus($saveStatus, 'URL copied to clipboard.', 'success');
        });
    }
    if ($cancelEditBtn) {
        $cancelEditBtn.addEventListener('click', function () {
            exitEditMode();
            $form.reset();
            $colorPicker.value = '#142e59';
            $colorHex.value = '#142E59';
            $savedUrl.hidden = true;
            WL.setStatus($saveStatus, '', null);
        });
    }
    if ($logo) {
        $logo.addEventListener('change', function () {
            var file = $logo.files && $logo.files[0];
            if (file) {
                var reader = new FileReader();
                reader.onload = function () {
                    $logoPreviewImg.src = String(reader.result || '');
                    $logoPreviewLabel.textContent = 'New logo (preview)';
                    $logoPreviewHint.textContent = 'This will replace the current logo when you save.';
                    $logoPreview.hidden = false;
                };
                reader.readAsDataURL(file);
            } else if (savedLogoPreviewSrc) {
                $logoPreviewImg.src = savedLogoPreviewSrc;
                $logoPreviewLabel.textContent = 'Current logo';
                $logoPreview.hidden = false;
            } else {
                hideLogoPreview();
            }
        });
    }
    if ($refreshBtn) $refreshBtn.addEventListener('click', refreshBranded);

    WL.initGate(function () {
        togglePageVisibility();
        refreshBranded();
    });
})();
