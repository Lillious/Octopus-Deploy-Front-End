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
        const response = await fetch(`/api/v1/deployment-task`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            body: JSON.stringify({
                "Name": 'Health',
                "Description": 'Check Connection',
                "Arguments": {
                    "Timeout": '00:01:00',
                    "MachineIds": [id],
                    "OnlyTestConnection": true
                }
            })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        return error;
    }
}

const GetDeploymentTask = async (id) => {
    return await new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`/api/v1/deployment-task/?id=${id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache'
                    }
                });
                const data = await response.json();
                
                    if (data.State === 'Success' || data.State === 'Failed') {
                    resolve(data);
                    clearInterval(interval);
                }
            } catch (error) {
                reject(error);
                clearInterval(interval);
            }
        }, 1000);
    });
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

const GetEnvironment = async (space, id) => {
    try {
        const response = await fetch(`/api/v1/deployment-target-environments/?space=${space}&id=${id}`,
        {
            method: 'GET'
        });
        const data = await response.json();
        return data;
    }
    catch (error) {
        return error;
    }
}

const GetAllEnvironments = async (space, ids) => {
    const environments = [];
    for (id in ids) {
        const environment = await GetEnvironment(space, ids[id]);
        environments.push(environment.Name);
    }
    return environments;
}

(async () => {

    const result = await DeploymentTargets();
    if (result.error) return window.Notify('error', 'Failed to get deployment targets');

    for (item in result.Items) {
        createDeploymentTargetUI(result.Items[item]);
    }

    async function createDeploymentTargetUI (DeploymentTarget) {
        const container = document.getElementById('deployment-targets');
        if (!container) return console.error('No container found');

        // Deployment Target Container
        const DeploymentTargetContainer = document.createElement('div');
        DeploymentTargetContainer.classList.add('deployment-target');

        // Deployment Target Name
        const DeploymentTargetName = document.createElement('h3');
        DeploymentTargetName.innerText = DeploymentTarget.Name;
        DeploymentTargetName.classList.add('title');
        DeploymentTargetName.addEventListener('click', () => {
            location.href = `/dashboard/deployment-targets/deployments/?id=${DeploymentTarget.Id}&space=${DeploymentTarget.SpaceId}&name=${DeploymentTarget.Name}`;
        });
        DeploymentTargetContainer.appendChild(DeploymentTargetName);

        // Health Status
        const Health = document.createElement('div');
        Health.classList.add('health');
        Health.innerText = DeploymentTarget.HealthStatus || 'Unknown';
        if (DeploymentTarget.HealthStatus === 'Healthy') {
            Health.classList.add('healthy');
        }
        DeploymentTargetContainer.appendChild(Health);

        // Environments
        const Environments = await GetAllEnvironments(DeploymentTarget.SpaceId, DeploymentTarget.EnvironmentIds);
        const DeploymentTargetEnvironments = document.createElement('ul');
        DeploymentTargetEnvironments.classList.add('environments');
        Environments.forEach(element => {
            const DeploymentTargetEnvironment = document.createElement('li');
            DeploymentTargetEnvironment.classList.add('environment');
            DeploymentTargetEnvironment.innerText = element;
            DeploymentTargetEnvironments.appendChild(DeploymentTargetEnvironment);
        });
        DeploymentTargetContainer.appendChild(DeploymentTargetEnvironments);

        // Roles
        const DeploymentTargetRoles = document.createElement('ul');
        DeploymentTargetRoles.classList.add('roles');
        for (role in DeploymentTarget.Roles) {
            const DeploymentTargetRole = document.createElement('li');
            DeploymentTargetRole.classList.add('role');
            DeploymentTargetRole.innerText = DeploymentTarget.Roles[role];
            DeploymentTargetRoles.appendChild(DeploymentTargetRole);
        }
        DeploymentTargetContainer.appendChild(DeploymentTargetRoles);

        // Actions
        const Actions = document.createElement('ui');
        Actions.classList.add('actions');

        // Update Action
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
                if (!data) return window.Notify('error', 'Unable to update deployment target');
                window.Notify('success', 'Successfully updated deployment target');
                Update.remove();
            });
        }

        // Disabled Action
        if (DeploymentTarget.IsDisabled) {
            const Disable = document.createElement('li');
            Disable.classList.add('action');
            Disable.classList.add('disabled-target');
            Disable.innerText = 'Disabled';
            Actions.appendChild(Disable);
        }

        // Check Health Action
        const checkHealth = document.createElement('li');
        checkHealth.classList.add('action');
        checkHealth.classList.add('check-health');
        checkHealth.innerText = 'Check Health';
        checkHealth.addEventListener('click', async () => {
            if (checkHealth.classList.contains('disabled')) return;
            checkHealth.classList.add('disabled');
            Health.classList.remove('healthy');
            Health.innerText = 'Checking...';
            Health.classList.add('checking');
            window.Notify('success', `Checking health of ${DeploymentTarget.Name}`);
            const response = await CheckConnectionHealth(DeploymentTarget.Id).catch(error => {
                window.Notify('error', 'Failed to check health');
                return;
            });
            const status = await asyncCall(response.Id).catch(error => {
                window.Notify('error', 'Failed to check health');
                return;
            });
            if (status.State === 'Success') {
                Health.innerText = 'Healthy';
                Health.classList.remove('checking');
                Health.classList.add('healthy');
                checkHealth.classList.remove('disabled');
                StatusSummary.innerText = `Octopus was able to successfully establish a connection with this machine on ${status.Completed}`;
                window.Notify('success', `Successfully checked health of ${DeploymentTarget.Name}`);
                return;
            } else {
                Health.innerText = 'Unavailable';
                Health.classList.remove('checking');
                Health.classList.add('unhealthy');
                checkHealth.classList.remove('disabled');
                window.Notify('error', `Failed to check health of ${DeploymentTarget.Name}`);
                return;
            }
        });

        Actions.appendChild(checkHealth);
                
        DeploymentTargetContainer.appendChild(Actions);

        // Status Summary
        const StatusSummary = document.createElement('p');
        StatusSummary.classList.add('status-summary');
        StatusSummary.innerText = DeploymentTarget.StatusSummary;
        DeploymentTargetContainer.appendChild(StatusSummary);
        container.appendChild(DeploymentTargetContainer);

        async function asyncCall(id) {
            const result = await GetDeploymentTask(id);
            return result;
        }
    }
})();
