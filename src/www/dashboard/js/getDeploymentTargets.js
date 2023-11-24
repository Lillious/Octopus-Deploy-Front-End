const DeploymentTargets = async () => {
    try {
        const response = await fetch('/api/v1/deployment-targets', {
            method: 'GET'
        });
        const data = await response.json();
        return data;
    }
    catch (error) {
        return error;
    }
}

const CheckConnectionHealth = async (id) => {
    try {
        const response = await fetch(`/api/v1/deployment-targets/check-connection?id=${id}`, {
            method: 'GET'
        });
        const data = await response.json();
        return data;
    }
    catch (error) {
        return error;
    }
}

const UpdateDeploymentTarget = async (id, space) => {
    try {
        const response = await fetch(`/api/v1/deployment-target-upgrade`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id,
                space
            })
        });
        const data = await response.json();
        return data;
    }
    catch (error) {
        return error;
    }
}

(async () => {

    const result = await DeploymentTargets();
    if (result.error) return window.Notification('error', 'Failed to get deployment targets');

    for (item in result.Items) {
        createDeploymentTargetUI(result.Items[item]);
    }

    function createDeploymentTargetUI (DeploymentTarget) {
        const container = document.getElementById('deployment-targets');
        if (!container) return console.error('No container found');

        const DeploymentTargetContainer = document.createElement('div');
        DeploymentTargetContainer.classList.add('deployment-target');
        
        const DeploymentTargetName = document.createElement('h3');
        DeploymentTargetName.innerText = DeploymentTarget.Name;
        DeploymentTargetName.classList.add('title');
        DeploymentTargetName.addEventListener('click', () => {
            location.href = `/dashboard/deployment-targets/deployments/?id=${DeploymentTarget.Id}&space=${DeploymentTarget.SpaceId}&name=${DeploymentTarget.Name}`;
        });
        DeploymentTargetContainer.appendChild(DeploymentTargetName);

        const DeploymentTargetRoles = document.createElement('ul');
        DeploymentTargetRoles.classList.add('roles');
        for (role in DeploymentTarget.Roles) {
            const DeploymentTargetRole = document.createElement('li');
            DeploymentTargetRole.classList.add('role');
            DeploymentTargetRole.innerText = DeploymentTarget.Roles[role];
            DeploymentTargetRoles.appendChild(DeploymentTargetRole);
        }

        container.appendChild(DeploymentTargetContainer);

        const Health = document.createElement('div');
        Health.classList.add('health');
        Health.innerText = DeploymentTarget.HealthStatus || 'Unknown';
        if (DeploymentTarget.HealthStatus === 'Healthy') {
            Health.classList.add('healthy');
        }
        
        DeploymentTargetContainer.appendChild(Health);

        DeploymentTargetContainer.appendChild(DeploymentTargetRoles);

        const Actions = document.createElement('ui');
        Actions.classList.add('actions');

        if (!DeploymentTarget.HasLatestCalamari) {
            const Update = document.createElement('li');
            Update.classList.add('action');
            Update.classList.add('update');
            Update.innerText = 'Update';
            Actions.appendChild(Update);

            Update.addEventListener('click', async () => {
                if (Update.classList.contains('disabled')) return;
                Update.classList.add('disabled');
                setTimeout(() => {
                    Update.classList.remove('disabled');
                }, 5000);
                const data = await UpdateDeploymentTarget(DeploymentTarget.Id, DeploymentTarget.SpaceId);
                if (!data) return window.Notification('error', 'Unable to update deployment target');
                window.Notification('success', 'Successfully updated deployment target');
                Update.remove();
            });
        }

        if (DeploymentTarget.IsDisabled) {
            const Disable = document.createElement('li');
            Disable.classList.add('action');
            Disable.classList.add('disabled-target');
            Disable.innerText = 'Disabled';
            Actions.appendChild(Disable);
        }

        const checkHealth = document.createElement('li');
        checkHealth.classList.add('action');
        checkHealth.classList.add('check-health');
        checkHealth.innerText = 'Check Health';
        checkHealth.addEventListener('click', async () => {
            if (checkHealth.classList.contains('disabled')) return;
            checkHealth.classList.add('disabled');
            setTimeout(() => {
                checkHealth.classList.remove('disabled');
            }, 5000);
            const response = await CheckConnectionHealth(DeploymentTarget.Id);
            if (response.error) return window.Notification('error', 'Failed to check health');
            Health.innerText = response.Status || 'Unknown';
            if (response.Status !== 'Healthy') {
                Health.classList.remove('healthy');
                window.Notification('error', `Unable to connect to ${DeploymentTarget.Name}`);
            } else {
                if (!Health.classList.contains('healthy')) {
                    Health.classList.add('healthy');
                }
                window.Notification('success', `Successfully connected to ${DeploymentTarget.Name}`);
            }
        });

        Actions.appendChild(checkHealth);
                
        DeploymentTargetContainer.appendChild(Actions);

        const StatusSummary = document.createElement('p');
        StatusSummary.classList.add('status-summary');
        StatusSummary.innerText = DeploymentTarget.StatusSummary;
        DeploymentTargetContainer.appendChild(StatusSummary);

    }
})();