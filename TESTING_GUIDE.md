# 脚本功能测试指南

## 安装扩展

1. 在 VS Code 中按 `Ctrl+Shift+P` 打开命令面板
2. 输入 "Extensions: Install from VSIX..."
3. 选择文件 `rest-client-0.26.0.vsix`
4. 点击安装并重启 VS Code

## 测试步骤

### 1. 基础功能测试

1. 打开 `test-script-complete.http` 文件
2. 确保文件中的 `> {% ... %}` 脚本块有 JavaScript 语法高亮
3. 逐个执行每个 HTTP 请求（点击请求上方的 "Send Request" 链接）

### 2. 验证脚本执行

执行请求后，在 VS Code 的 **输出** 面板中：
1. 选择 "REST Client" 输出通道
2. 查看脚本的 console.log 输出
3. 确认没有脚本执行错误

### 3. 验证环境变量功能

1. 执行第一个请求，设置环境变量
2. 执行第二个请求，验证变量 `{{last_status}}` 被正确替换
3. 检查脚本输出中变量的获取和设置

### 4. 测试预期结果

**第一个请求（GET /json）**：
- 响应状态：200
- 脚本设置变量：`last_status` = 200，`json_slideshow_title` = slideshow标题

**第二个请求（GET /get）**：
- URL 中 `{{last_status}}` 应被替换为 "200"
- 脚本输出之前设置的变量值

**第三个请求（POST /post）**：
- 响应状态：200
- 设置 POST 相关变量

**第四个请求（GET /status/404）**：
- 响应状态：404
- 错误处理测试

**第五个请求（查看变量）**：
- 输出所有之前设置的全局变量

## 可能遇到的问题

### 1. 语法高亮不工作
- 确保文件保存为 `.http` 后缀
- 重启 VS Code

### 2. 脚本不执行
- 检查 REST Client 输出通道是否有错误信息
- 确保 `> {% ... %}` 语法正确

### 3. 变量不生效
- 确保脚本中使用 `client.global.set()` 设置变量
- 变量会保存到 `$shared` 环境中
- 可以在 VS Code 底部状态栏切换环境查看

### 4. 调试脚本
- 使用 `console.log()` 输出调试信息
- 检查 `response.status`、`response.headers`、`response.json()` 等属性
- 脚本错误会显示在输出面板中

## 成功标志

如果一切正常，你应该看到：
1. ✅ JavaScript 语法高亮工作
2. ✅ 脚本成功执行，输出 console.log 内容
3. ✅ 环境变量正确设置和获取
4. ✅ 响应数据正确解析
5. ✅ 错误处理工作正常

## 高级测试

你也可以测试更复杂的场景：
- 提取 JSON 响应中的特定字段
- 设置动态认证 token
- 基于响应内容的条件逻辑
- 数据格式验证

```http
### 高级示例：提取认证 token
POST https://httpbin.org/post
Content-Type: application/json

{
    "username": "test",
    "password": "password"
}

> {%
    // 模拟提取 token（实际应从响应中获取）
    const fakeToken = 'Bearer ' + Date.now();
    client.global.set('auth_token', fakeToken);
    console.log('Auth token set:', fakeToken);
%}

### 使用提取的 token
GET https://httpbin.org/bearer
Authorization: {{auth_token}}

> {%
    console.log('Authenticated request status:', response.status);
    const data = response.json();
    console.log('Token from response:', data.token);
%}
```
