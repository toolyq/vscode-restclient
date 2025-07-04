# REST Client Script Feature

This enhancement adds JavaScript post-response script execution to the REST Client extension.

## Syntax

After any HTTP request, you can add a script block to process the response:

```http
GET https://api.example.com/users

> {%
    var userId = response.body.json.id;
    client.global.set("user_id", userId);
    console.log("User ID:", userId);
%}
```

## Script Context

The script has access to the following objects:

### response
- `response.body.json` - Parsed JSON response (if valid JSON)
- `response.body.text` - Raw response body as text
- `response.headers` - Response headers object
- `response.status` - HTTP status code
- `response.statusText` - HTTP status message

### client
- `client.global.set(name, value)` - Set a global environment variable
- `client.global.get(name)` - Get a global environment variable
- `client.global.clear(name)` - Clear a global environment variable

### console
- `console.log()`, `console.error()`, `console.warn()`, `console.info()` - Logging functions

## Examples

### Extract token from login response
```http
POST https://api.example.com/login
Content-Type: application/json

{
    "username": "user",
    "password": "pass"
}

> {%
    var token = response.body.json.access_token;
    client.global.set("access_token", token);
    console.log("Token set:", token);
%}
```

### Use extracted token in subsequent request
```http
GET https://api.example.com/protected
Authorization: Bearer {{access_token}}
```

### Conditional processing
```http
GET https://api.example.com/status

> {%
    if (response.status === 200) {
        var status = response.body.json.status;
        client.global.set("service_status", status);
        console.log("Service is", status);
    } else {
        console.error("Failed to get status:", response.status);
    }
%}
```

## Implementation Details

- Scripts are executed after the response is received but before the response is displayed
- Scripts run in a sandboxed environment with limited access to Node.js APIs
- Global variables are stored in the `$shared` environment in VS Code settings
- Script execution errors are logged and displayed as error messages
- JavaScript syntax highlighting is provided for script blocks
