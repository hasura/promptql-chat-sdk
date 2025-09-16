This route POSTs to `https://${PROMPTQL_API_ENDPOINT}/playground/threads/v2/start`, injects
`ddn_headers.x-hasura-ddn-token` using your PAT + project id, and sets `Authorization: api-key <PROMPTQL_API_KEY>`. It
reads `PROMPTQL_API_HOST` if you need to specify a host header, though Node's fetch will set Host from the URL.
