const API_Key = process.env.API_KEY as string;
const API_URL = process.env.API_URL as string;
import fetch from 'node-fetch';

const Request = {
    Post: async function (path: string, body: any) {
        const result = await fetch(API_URL + path, {
            method: 'POST',
            headers: {
                "X-Octopus-ApiKey": API_Key
            },
            body: JSON.stringify(body)
        });

        if (result.ok) return await result.json();

        const response = await result.json() as { ErrorMessage: string, Errors: object };
        return { 
            response: {
                status: result.status as number,
                message: response.ErrorMessage as string,
                errors: {
                    ...response.Errors
                } as object
            }
         };
    },

    Get: async function (path: string) {
        const result = await fetch(API_URL + path, {
            method: 'GET',
            headers: {
                "X-Octopus-ApiKey": API_Key
            }
        });

        if (result.ok) return await result.json();

        const response = await result.json() as { ErrorMessage: string, Errors: object };
        return { 
            response: {
                status: result.status as number,
                message: response.ErrorMessage as string,
                errors: {
                    ...response.Errors
                } as object
            }
         };
    },

    Delete: async function (path: string) {
        const result = await fetch(API_URL + path, {
            method: 'DELETE',
            headers: {
                "X-Octopus-ApiKey": API_Key
            }
        });

        if (result.ok) return await result.json();

        const response = await result.json() as { ErrorMessage: string, Errors: object };
        return { 
            response: {
                status: result.status as number,
                message: response.ErrorMessage as string,
                errors: {
                    ...response.Errors
                } as object
            }
         };
    },

    Put: async function (path: string, body: any) {
        const result = await fetch(API_URL + path, {
            method: 'PUT',
            headers: {
                "X-Octopus-ApiKey": API_Key
            },
            body: JSON.stringify(body)
        });

        if (result.ok) return await result.json();

        const response = await result.json() as { ErrorMessage: string, Errors: object };
        return { 
            response: {
                status: result.status as number,
                message: response.ErrorMessage as string,
                errors: {
                    ...response.Errors
                } as object
            }
         };
    }
};

export const Account = {
    List: async function () {
        return await Request.Get("/accounts/all");
    }
};

export const Deployment = {
    List: async function () {
        return await Request.Get("/deployments");
    }
};

export const DeploymentTarget = {
    List: async function () {
        return await Request.Get("/machines");
    },
    FindByName: async function (name: string) {
        return await Request.Get("/machines/all?name=" + name);
    },
    FindById: async function (id: string) {
        return await Request.Get("/machines/" + id);
    }
};

export const Environment = {
    List: async function () {
        return await Request.Get("/environments");
    }
};

export const Events = {
    List: async function () {
        return await Request.Get("/events");
    }
};

export const Feeds = {
    List: async function () {
        return await Request.Get("/feeds");
    }
};

export const Connection = {
    Check: async function (id: string) {
        return await Request.Get("/machines/" + id + "/connection");
    }
}

// const target = await DeploymentTarget.List() as { Items: { Name: string }[] };
// const name = target.Items[0].Name as string;
// console.log(name);

// const env = await Environment.List() as { Items: { Name: string }[] };
// const env_name = env.Items[0].Name as string;
// console.log(env_name);

const target = await DeploymentTarget.FindByName("Production") as { Id: string }[];
const id = target[0].Id as string;
const connection = await Connection.Check(id) as { Status: string, CurrentTentacleVersion: string, LastChecked: string};
console.log({
    machine_id: id,
    status: connection.Status as string,
    version: connection.CurrentTentacleVersion as string,
    last_checked: connection.LastChecked as string
});