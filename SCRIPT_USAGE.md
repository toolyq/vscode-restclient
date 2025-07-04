# JavaScript Post-Response Scripts

This feature allows you to execute JavaScript code after receiving an HTTP response. This is useful for extracting data from responses and setting variables for subsequent requests.

## Basic Usage

Add a script block after your HTTP request using the following syntax:

```http
GET https://httpbin.org/json

> {%
    var title = response.body.json.slideshow.title;
    client.global.set("extracted_title", title);
    console.log("Title:", title);
%}
```

## Available Objects

- **response.body.json** - Parsed JSON response (if valid)
- **response.body.text** - Raw response text  
- **response.headers** - Response headers
- **response.status** - HTTP status code
- **response.statusText** - HTTP status message
- **client.global.set(name, value)** - Set environment variable
- **client.global.get(name)** - Get environment variable  
- **client.global.clear(name)** - Clear environment variable
- **console.log/error/warn/info** - Logging functions

## Example: Extract Authentication Token

```http
POST https://api.example.com/login
Content-Type: application/json

{
    "username": "admin",
    "password": "secret"
}

> {%
    if (response.status === 200) {
        var token = response.body.json.access_token;
        client.global.set("auth_token", token);
        console.log("Authentication successful, token saved");
    } else {
        console.error("Login failed:", response.status);
    }
%}

### Use the token in subsequent requests
GET https://api.example.com/users
Authorization: Bearer {{auth_token}}
```

## Example: Data Processing

```http
GET https://api.example.com/users

> {%
    var users = response.body.json;
    var adminUsers = users.filter(user => user.role === 'admin');
    
    console.log("Total users:", users.length);
    console.log("Admin users:", adminUsers.length);
    
    if (adminUsers.length > 0) {
        client.global.set("first_admin_id", adminUsers[0].id);
    }
%}
```
