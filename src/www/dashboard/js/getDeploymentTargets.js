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

(async () => {

    const result = await DeploymentTargets();
    console.log(result);
    if (!result) return window.Notification('error', 'Failed to get deployment targets');

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
        Health.innerText = DeploymentTarget.HealthStatus;
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
            Update.innerText = 'Update Available';
            Actions.appendChild(Update);

            Update.addEventListener('click', async () => {
                const response = await fetch(`/api/v1/deployment-target-upgrade`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: DeploymentTarget.Id,
                        space: DeploymentTarget.SpaceId
                    })
                });
                const data = await response.json();
                console.log(data);
                if (!data) return window.Notification('error', data.Error);
                window.Notification('success', 'Update started');
            });
        }

        if (DeploymentTarget.IsDisabled) {
            const Disable = document.createElement('li');
            Disable.classList.add('action');
            Disable.classList.add('disabled');
            Disable.innerText = 'Disabled';
            Actions.appendChild(Disable);
        }
                
        DeploymentTargetContainer.appendChild(Actions);

        const StatusSummary = document.createElement('p');
        StatusSummary.classList.add('status-summary');
        StatusSummary.innerText = DeploymentTarget.StatusSummary;
        DeploymentTargetContainer.appendChild(StatusSummary);

    }
})();