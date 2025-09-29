'use client';

import React, { useState } from 'react';
import FunctionalCodeEditor from '@/components/evaluation-builder/FunctionalCodeEditor';

export default function CustomLanguageDemo() {
  const [code, setCode] = useState(`// Example code in a custom language
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));`);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Custom Language Demo</h1>
      <p className="text-gray-600 mb-6">
        This demo shows the code editor with a custom language option.
      </p>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Code Editor with Custom Language</h2>
        <FunctionalCodeEditor 
          code={code}
          language="custom"
          customLanguage="Rust"
          theme="dark"
          lineNumbers={true}
          minHeight={300}
          onCodeChange={setCode}
        />
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">Features Demonstrated</h2>
        <ul className="list-disc pl-5 space-y-1 text-blue-700">
          <li>Custom language selection in the editor header</li>
          <li>Ability to specify any programming language name</li>
          <li>File download with custom extension</li>
          <li>Consistent styling with other editor features</li>
        </ul>
      </div>
    </div>
  );
}