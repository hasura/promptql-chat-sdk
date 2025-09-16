# PromptQL Proxy Examples

This directory contains examples of proxy servers that can be used to secure your PromptQL API key and handle
authentication. The proxy servers in this directory are for demonstration purposes only and should not be used in
production without proper security hardening.

**Each example utilizes NoAuth mode on a private Hasura DDN project.** Four key-values are required for auth:

1. A PromptQL API key
2. A Hasura DDN access token (PAT or service account token) with **at least** `read-only` access to the PromptQL project
3. A PromptQL project ID
4. The dataplane URL for the PromptQL project (e.g., Public DDN: `https://promptql.ddn.hasura.app`)

## Auth Flow

When a user makes a request via the SDK, it will take the following form depending on the request type:

```sh
curl --location 'http://localhost:8080/playground/threads/v2/start' \
--header 'Content-Type: application/json' \
--data '{
    "user_message": "What schema is available?",
    "timezone": "America/Los_Angeles"
}'
```

The proxy will then intercept the request and add the necessary headers for authentication:

```sh
curl --location 'https://promptql.ddn.hasura.app/playground/threads/v2/start' \
--header 'Authorization: api-key <PROMPTQL_API_KEY>' \
--header 'Content-Type: application/json' \
--data '{
    "user_message": "What schema is available?",
    "timezone": "America/Los_Angeles",
    "ddn_headers": {
        "x-hasura-ddn-token": "<DDN_TOKEN>"
    }
}'
```

It's able to do this by utilizing the PromptQL access token to fetch a short-lived DDN token from the token refresh URL.
The proxy server will then add the DDN token to the `ddn_headers` field in the request body.

## Modifying Examples for Other Authentication Modes

Regardless of which authentication mode you utilize, you **must include a PromptQL API key**. The proxy server will add
this key to the `Authorization` header of the request. From there, access control is handled by the `ddn_headers` object
in the request body. This can be set up to use any of the authentication modes supported by the underlying DDN project.

As an example, let's take the [nginx example](./nginx-example). To modify it to use JWT authentication with the Bearer
strategy, you would need to make the following changes:

1. Modify the JWT-mingling Lua code to fetch a JWT from your auth service instead of a DDN token.
2. Update the `ddn_headers` field in the request body to include the JWT instead of the DDN token and the correct
   `Authorization` header.

```lua
local body_json.ddn_headers = {
    "Authorization": "Bearer " .. jwt_token
}
```

## See Examples

- [NGINX](./nginx-example)
- [Next.js](./nextjs-example)
