(function () {
    'use strict';

    var WL = window.WLAdmin;
    var $owner = document.getElementById('wlRepoOwner');
    var $repo = document.getElementById('wlRepoName');
    var $branch = document.getElementById('wlRepoBranch');
    var $token = document.getElementById('wlGithubToken');
    var $saveConfigBtn = document.getElementById('wlSaveConfigBtn');
    var $configStatus = document.getElementById('wlConfigStatus');

    function loadConfigIntoForm() {
        var cfg = WL.readConfig();
        if ($owner) $owner.value = (cfg && cfg.owner) || WL.DEFAULT_REPO_OWNER;
        if ($repo) $repo.value = (cfg && cfg.repo) || WL.DEFAULT_REPO_NAME;
        if ($branch) $branch.value = (cfg && cfg.branch) || WL.DEFAULT_REPO_BRANCH;
        if ($token) $token.value = (cfg && cfg.token) || '';
    }

    if ($saveConfigBtn) {
        $saveConfigBtn.addEventListener('click', function () {
            var owner = ($owner && $owner.value || '').trim();
            var repo = ($repo && $repo.value || '').trim();
            var branch = ($branch && $branch.value || '').trim() || WL.DEFAULT_REPO_BRANCH;
            var token = ($token && $token.value || '').trim();

            if (!owner || !repo || !token) {
                WL.setStatus($configStatus, 'Fill owner, repo, and token.', 'error');
                return;
            }

            WL.setStatus($configStatus, 'Verifying access…', null);
            WL.verifyGithubAccess({ owner: owner, repo: repo, branch: branch, token: token })
                .then(function () {
                    WL.writeConfig({ owner: owner, repo: repo, branch: branch, token: token });
                    WL.setStatus($configStatus, 'Connected. Branded pages and Demo Links are ready to use.', 'success');
                })
                .catch(function (err) {
                    WL.setStatus($configStatus, 'Could not connect: ' + err.message, 'error');
                });
        });
    }

    WL.initGate(function () {
        loadConfigIntoForm();
    });
})();
