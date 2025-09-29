'use client';

import React from 'react';
import FunctionalCodeEditor from './FunctionalCodeEditor';

const CodeExecutionExample: React.FC = () => {
  const exampleCode = `// Example evaluation function for LLM responses
function evaluateResponse({ response, criteria }) {
  console.log('Evaluating response:', response);
  
  // Initialize scoring
  let score = 0;
  const feedback = [];
  
  // Check for required keywords
  const requiredKeywords = ['accuracy', 'clarity', 'completeness'];
  requiredKeywords.forEach(keyword => {
    if (response.toLowerCase().includes(keyword)) {
      score += 1;
      feedback.push(\`Contains keyword: \${keyword}\`);
    }
  });
  
  // Check response length
  if (response.length > 100) {
    score += 1;
    feedback.push('Response has good length');
  } else {
    feedback.push('Response might be too short');
  }
  
  // Check for structured response (bullets or numbered lists)
  const bulletPattern = /[-*•]\\s|\\d+\\.\\s/;
  if (bulletPattern.test(response)) {
    score += 1;
    feedback.push('Response is well-structured');
  }
  
  // Check for conclusion
  const conclusionKeywords = ['in conclusion', 'to summarize', 'overall', 'summary'];
  const hasConclusion = conclusionKeywords.some(keyword => 
    response.toLowerCase().includes(keyword)
  );
  
  if (hasConclusion) {
    score += 1;
    feedback.push('Response includes a conclusion');
  }
  
  return { 
    score: score, 
    maxScore: 4,
    percentage: Math.round((score / 4) * 100),
    feedback: feedback 
  };
}

// Test the evaluation function
const testResponse = "In conclusion, this response demonstrates accuracy and clarity in explaining the concepts. It provides a complete overview of the topic with structured points. The information is presented in a clear and comprehensive manner that addresses all aspects of the question.Overall, this is a well-written response that meets all evaluation criteria.";

const testCriteria = ['accuracy', 'clarity', 'completeness'];

const result = evaluateResponse({
  response: testResponse,
  criteria: testCriteria
});

console.log('=== EVALUATION RESULTS ===');
console.log('Score: ' + result.score + '/' + result.maxScore);
console.log('Percentage: ' + result.percentage + '%');
console.log('Feedback:');
result.feedback.forEach((item, index) => {
  console.log((index + 1) + '. ' + item);
});`;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Code Editor with Execution</h1>
      <p className="text-gray-600 mb-6">
        This is an example of the functional code editor that can execute JavaScript code directly in the browser.
        Try modifying the code and clicking "Run" to see the results.
      </p>
      
      <div className="mb-8">
        <FunctionalCodeEditor 
          code={exampleCode}
          language="javascript"
          theme="dark"
          lineNumbers={true}
          minHeight={400}
        />
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">How it works</h2>
        <ul className="list-disc pl-5 space-y-1 text-blue-700">
          <li>Write JavaScript code in the editor</li>
          <li>Click "Run" to execute the code in the browser</li>
          <li>Console output will appear in the output panel below the editor</li>
          <li>Errors will be displayed if the code fails to execute</li>
          <li>Use the "Stop" button to terminate long-running code</li>
        </ul>
        
        <h3 className="text-md font-semibold text-blue-800 mt-4 mb-2">Features</h3>
        <ul className="list-disc pl-5 space-y-1 text-blue-700">
          <li>Syntax highlighting for JavaScript</li>
          <li>Line numbering</li>
          <li>Light/Dark themes</li>
          <li>Copy to clipboard</li>
          <li>Download code as file</li>
          <li>5-second timeout to prevent infinite loops</li>
        </ul>
      </div>
    </div>
  );
};

export default CodeExecutionExample;