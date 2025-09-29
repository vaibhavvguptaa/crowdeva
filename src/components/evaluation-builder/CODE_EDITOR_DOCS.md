# Code Editor Component Documentation

## Overview
The Code Editor component is an interactive code editing tool that allows users to write and execute JavaScript code directly within the evaluation form builder. It provides syntax highlighting, line numbering, and real-time code execution capabilities.

## Features
- Syntax highlighting for multiple languages
- Line numbering
- Light/Dark themes
- Code execution in the browser
- Console output capture
- Error handling
- Copy to clipboard
- Download code as file
- Custom language support

## Properties
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `default_code` | string | `''` | The initial code to display in the editor |
| `language` | string | `'javascript'` | The programming language for syntax highlighting |
| `custom_language` | string | `''` | Custom language name when language is set to 'custom' |
| `theme` | `'light' | 'dark'` | `'light'` | The editor theme |
| `line_numbers` | boolean | `true` | Whether to show line numbers |
| `min_height` | number | `200` | Minimum height of the editor in pixels |

## Supported Languages
- JavaScript
- TypeScript
- Python
- Java
- C++
- HTML
- CSS
- JSON
- Custom (user-defined language name)

## Custom Language Support
The code editor now supports custom language names. When setting the `language` property to `'custom'`, you can specify any language name using the `custom_language` property. This allows for greater flexibility in labeling the editor for any programming language or domain-specific syntax.

## Usage in Evaluation Forms
The code editor can be used in evaluation forms to:
1. Create custom evaluation logic
2. Process response data
3. Generate scores based on criteria
4. Provide feedback to evaluators

## Example Code
```javascript
// Example evaluation function
function evaluateResponse({ response, criteria }) {
  console.log('Evaluating response:', response);
  
  // Simple scoring logic
  let score = 0;
  const feedback = [];
  
  // Check if response contains required keywords
  const keywords = ['accuracy', 'clarity', 'completeness'];
  keywords.forEach(keyword => {
    if (response.toLowerCase().includes(keyword)) {
      score += 1;
      feedback.push(`Contains keyword: ${keyword}`);
    }
  });
  
  return { score, feedback };
}

// Test the function
const result = evaluateResponse({
  response: "This is a sample response",
  criteria: ['accuracy', 'clarity']
});

console.log('Result:', result);
```

## Execution Environment
The code runs in a browser sandbox with access to:
- `console.log`, `console.warn`, `console.error` (output captured in the results panel)
- Basic JavaScript functions and objects
- No access to DOM manipulation or network requests

## Best Practices
1. Always handle errors gracefully in your code
2. Use `console.log` to output results and debugging information
3. Keep code simple and focused on evaluation logic
4. Test your code thoroughly before deploying forms
5. Avoid infinite loops or long-running operations

## Security
- Code execution is sandboxed within the browser
- No access to server-side resources or file system
- Network requests are restricted by browser security policies