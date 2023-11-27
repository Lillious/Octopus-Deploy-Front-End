if (!location.search.includes('id=') || !location.search.includes('space=') || !location.search.includes('name=')) {
    location.href = '/dashboard';
}

// Get the name= query string value
const name = location.search.split('name=')[1].split('&')[0].replaceAll('%20', ' ');
const id = location.search.split('id=')[1].split('&')[0];
const space = location.search.split('space=')[1].split('&')[0];

const breadcrumbs = document.getElementById('breadcrumbs');
if (breadcrumbs) {
    breadcrumbs.innerHTML = breadcrumbs.innerHTML + ` &#8250; ${name}`;
}

const Deployments = async () => {
    try {
        const response = await fetch(`/api/v1/deployment-history/?id=${id}&space=${space}`,
        {
            method: 'GET'
        });
        const data = await response.json();
        return data;
    }
    catch (error) {
        return error;
    }
};

(async () => {
    const result = await Deployments();
    console.log(result);
    if (result.error) return window.Notify('error', 'Failed to get deployment target history');
    for (item in result.Items) {
        createDeploymentHistoryUI(result.Items[item]);
    }

    function createDeploymentHistoryUI(Deployment) {
        // Deployment Container
        const container = document.getElementById('deployment-history');
        if (!container) return console.error('No container found');
        const DeploymentContainer = document.createElement('div');
        DeploymentContainer.classList.add('deployment');

        // Deployment Name
        const DeploymentName = document.createElement('h3');
        DeploymentName.innerText = Deployment.Description;
        DeploymentName.classList.add('title');
        DeploymentContainer.appendChild(DeploymentName);

        // Deployment Task Status
        const status = document.createElement('div');
        if (Deployment.IsCompleted === true) {
            status.innerText = Deployment.FinishedSuccessfully
                ? 'done'
                : 'close';
        } else {
            status.innerText = 'cached';
        }

        if (Deployment.FinishedSuccessfully && Deployment.IsCompleted) {
            status.classList.add('task-success');
        }
        else if (!Deployment.FinishedSuccessfully && Deployment.IsCompleted) {
            status.classList.add('task-failed');
        } else {
            status.classList.add('task-queued');
        }
        
        status.classList.add('status');
        status.classList.add('material-icons');
        DeploymentContainer.appendChild(status);

        // Deployment Task Actions
        const Actions = document.createElement('ui');
        Actions.classList.add('actions');

        if (Deployment.CanRerun) {
            const reRunDeployment = document.createElement('div');
            reRunDeployment.innerText = 'Deploy';
            reRunDeployment.classList.add('action');
            reRunDeployment.addEventListener('click', async () => {
                const response = await fetch(`/api/v1/deployment-task-rerun`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: Deployment.Id
                    })
                });
                const data = await response.json();
                if (data?.response?.status === 404) {
                    return window.Notify('error', 'Deployment not found');
                }
                if (data?.response?.status === 400) {
                    return window.Notify('error', 'Deployment cannot be re-run');
                }
                if (data?.response?.status === 500) {
                    return window.Notify('error', 'Failed to re-run deployment');
                }
                window.Notify('success', 'Deployment re-run');
            });

            Actions.appendChild(reRunDeployment);

        }

        DeploymentContainer.appendChild(Actions);

        // Deployment Task Completed Time
        if (Deployment.CompletedTime) {
            const CompletedTime = document.createElement('p');
            const date = new Date(Deployment.CompletedTime);
            const options = { month: "long", day: "numeric", year: "numeric" };
            const formattedDate = date.toLocaleDateString("en-US", options);
            CompletedTime.innerText = `${formattedDate} - ${Deployment.Duration}`;
            CompletedTime.classList.add('completed-time');
            DeploymentContainer.appendChild(CompletedTime);
        }

        container.appendChild(DeploymentContainer);
    }
})();