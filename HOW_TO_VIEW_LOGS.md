# 如何查看 Console.log 输出 - 更新版

## ⚠️ 重要更新

API 已修复！现在使用 `response.json` **属性**（不是方法）来访问 JSON 数据。

## 正确的脚本语法

```javascript
> {%
    // ✅ 正确：使用 response.json 属性
    const data = response.json;
    console.log("JSON data:", data);
    
    // ✅ 访问响应状态和头部
    console.log("Status:", response.status);
    console.log("Headers:", response.headers);
    
    // ✅ 访问原始响应文本
    console.log("Raw body:", response.body);
    
    // ✅ 设置环境变量
    client.global.set("my_var", "value");
%}
```

## 步骤 1：安装扩展

1. 在 VS Code 中按 `Ctrl+Shift+P`
2. 输入 "Extensions: Install from VSIX..."
3. 选择 `rest-client-0.26.0.vsix` 文件
4. 重启 VS Code

## 步骤 2：打开输出面板

### 方法 1：快捷键
- 按 `Ctrl+Shift+U` 打开输出面板

### 方法 2：菜单
- 点击 `View` > `Output`

## 步骤 3：选择正确的输出通道

在输出面板的右上角，有一个下拉菜单，选择 **"REST"**（注意不是 "REST Client"）

## 步骤 4：执行请求并查看日志

1. 打开 `test-script.http` 文件
2. 点击请求上方的 "Send Request" 链接
3. 在输出面板中查看日志

## 预期输出格式

当你执行脚本时，应该看到如下格式的输出：

```
[Info - 10:30:45] === Script Execution Started ===
[Info - 10:30:45] [Script] Executing script for GET request...
[Info - 10:30:45] [Script] Extracted title: Sample Slide Show
[Info - 10:30:45] [Script] Full slideshow object: {
  "title": "Sample Slide Show",
  "date": "date of publication",
  "author": "Yours Truly",
  "slides": [...]
}
[Info - 10:30:45] [Script] Content-Type: application/json
[Info - 10:30:45] [Script] Status: 200
[Info - 10:30:45] === Script Execution Completed ===
```

## 常见问题排查

### 1. 看不到输出
- 确认选择的是 "REST" 输出通道
- 确认脚本语法正确（`> {% ... %}`）
- 确认请求执行成功

### 2. 脚本执行失败
- 检查 REST 输出通道是否有错误信息
- 确认使用 `response.json` **属性**而不是 `response.json()` 方法
- 确认变量名和 JSON 路径正确

### 3. 环境变量不生效
- 确认使用了 `client.global.set()` 方法
- 变量会保存到 `$shared` 环境中
- 可以在 VS Code 状态栏查看当前环境

### 4. 脚本语法错误
- 确认使用 `>` 开始脚本块
- 确认使用 `{% ... %}` 包围脚本代码
- 确认 JavaScript 语法正确

## 完整示例

```http
### 测试脚本功能
GET https://httpbin.org/json

> {%
    console.log("=== 脚本开始执行 ===");
    
    // 检查响应状态
    console.log("状态码:", response.status);
    
    // 检查是否为 JSON 响应
    if (response.json) {
        console.log("JSON 响应:", response.json);
        
        // 提取特定字段
        const slideshow = response.json.slideshow;
        if (slideshow && slideshow.title) {
            console.log("提取的标题:", slideshow.title);
            
            // 设置环境变量
            client.global.set("extracted_title", slideshow.title);
            console.log("环境变量已设置");
        }
    } else {
        console.log("不是 JSON 响应");
        console.log("原始内容:", response.body);
    }
    
    console.log("=== 脚本执行完成 ===");
%}

### 使用提取的变量
GET https://httpbin.org/get?title={{extracted_title}}
```

## 调试技巧

### 1. 逐步调试
```javascript
> {%
    console.log("=== Debug Info ===");
    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);
    
    // 检查 JSON 解析
    if (response.json) {
        console.log("JSON parsed successfully:", response.json);
    } else {
        console.log("Not a JSON response or parsing failed");
        console.log("Raw response:", response.body);
    }
%}
```

### 2. 检查变量设置
```javascript
> {%
    // 设置变量
    client.global.set("test_var", "test_value");
    console.log("Variable set successfully");
    
    // 立即获取验证
    const retrieved = client.global.get("test_var");
    console.log("Retrieved value:", retrieved);
%}
```

### 3. 错误处理
```javascript
> {%
    try {
        if (response.json) {
            console.log("Success:", response.json);
        } else {
            console.log("No JSON data available");
        }
    } catch (error) {
        console.log("Error occurred:", error.message);
        console.log("Response text:", response.body);
    }
%}
```

## 成功验证

如果一切正常，你应该看到：
- ✅ 脚本执行开始和完成的分隔线
- ✅ 你的 `console.log` 输出带有 `[Script]` 前缀
- ✅ 对象被正确格式化为 JSON
- ✅ 没有错误信息
- ✅ 变量设置成功

## API 总结

| 项目 | 语法 | 说明 |
|------|------|------|
| JSON 数据 | `response.json` | 解析后的 JSON 对象（属性，不是方法） |
| 原始响应 | `response.body` | 原始响应字符串 |
| 状态码 | `response.status` | HTTP 状态码 |
| 响应头 | `response.headers` | 响应头对象 |
| 设置变量 | `client.global.set(key, value)` | 设置全局变量 |
| 获取变量 | `client.global.get(key)` | 获取全局变量 |
| 控制台输出 | `console.log(...)` | 输出到 REST 通道 |

## 注意事项

1. **API 变更**：现在使用 `response.json` 属性而不是 `response.json()` 方法
2. **输出通道名称**：确保选择 "REST" 而不是其他
3. **异步操作**：`client.global.set/get` 是异步的，但在脚本中会自动等待
4. **错误处理**：脚本错误会显示在输出中，不会中断扩展运行
