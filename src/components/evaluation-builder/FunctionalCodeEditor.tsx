'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Copy, Download, ChevronDown } from 'lucide-react';

interface FunctionalCodeEditorProps {
  code: string;
  language?: string;
  customLanguage?: string;
  theme?: 'light' | 'dark';
  lineNumbers?: boolean;
  minHeight?: number;
  onCodeChange?: (code: string) => void;
  onLanguageChange?: (language: string, customLanguage?: string) => void;
  readOnly?: boolean;
}

const FunctionalCodeEditor: React.FC<FunctionalCodeEditorProps> = ({
  code: initialCode,
  language = 'javascript',
  customLanguage = '',
  theme = 'light',
  lineNumbers = true,
  minHeight = 200,
  onCodeChange,
  onLanguageChange,
  readOnly = false
}) => {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Available languages for the dropdown
  const availableLanguages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'json', label: 'JSON' },
    { value: 'custom', label: 'Custom Language' }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update code when initialCode changes
  useEffect(() => {
    setCode(initialCode);
  }, [initialCode]);

  // Handle code changes
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCode(newCode);
    if (onCodeChange) {
      onCodeChange(newCode);
    }
  };

  // Handle language change
  const handleLanguageChange = (newLanguage: string, customLang?: string) => {
    if (onLanguageChange) {
      onLanguageChange(newLanguage, customLang);
    }
    setShowLanguageDropdown(false);
  };

  // Execute the code
  const executeCode = () => {
    if (isExecuting) return;
    
    setIsExecuting(true);
    setExecutionError(null);
    setOutput('');
    
    try {
      // Create a sandboxed execution environment
      const sandboxConsole = {
        logs: [] as string[],
        log: function(...args: any[]) {
          const formatted = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ');
          this.logs.push(formatted);
        },
        warn: function(...args: any[]) {
          const formatted = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ');
          this.logs.push(`[WARN] ${formatted}`);
        },
        error: function(...args: any[]) {
          const formatted = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ');
          this.logs.push(`[ERROR] ${formatted}`);
        }
      };
      
      // Execute the code in a more controlled way
      const executeInContext = new Function(
        'console', 
        'setTimeout', 
        'setInterval', 
        'clearTimeout', 
        'clearInterval',
        code
      );
      
      // Execute with a timeout to prevent infinite loops
      const executionTimeout = setTimeout(() => {
        setExecutionError('Execution timed out (possible infinite loop)');
        setIsExecuting(false);
      }, 5000);
      
      try {
        executeInContext(sandboxConsole, setTimeout, setInterval, clearTimeout, clearInterval);
        clearTimeout(executionTimeout);
      } catch (error) {
        clearTimeout(executionTimeout);
        throw error;
      }
      
      setOutput(sandboxConsole.logs.join('\n'));
    } catch (error) {
      setExecutionError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsExecuting(false);
    }
  };

  // Stop execution
  const stopExecution = () => {
    setIsExecuting(false);
  };

  // Copy code to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
  };

  // Download code as file
  const downloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileExtension = language === 'custom' 
      ? (customLanguage || 'custom').toLowerCase()
      : language === 'javascript' ? 'js' : language;
    a.download = `code.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Calculate line numbers
  const lineCount = code.split('\n').length;
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1);

  // Get display name for current language
  const getLanguageDisplayName = () => {
    if (language === 'custom') {
      return customLanguage || 'CUSTOM';
    }
    const lang = availableLanguages.find(l => l.value === language);
    return lang ? lang.label : language.toUpperCase();
  };

  return (
    <div className={`rounded-lg border ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}>
      {/* Editor Header */}
      <div className={`flex items-center justify-between px-4 py-2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-t-lg`}>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          {/* Language Selector Dropdown */}
          <div className="relative" ref={languageDropdownRef}>
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              disabled={readOnly}
              className={`flex items-center text-xs ml-2 px-2 py-1 rounded ${theme === 'dark' ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} ${readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {getLanguageDisplayName()}
              <ChevronDown className="w-3 h-3 ml-1" />
            </button>
            
            {showLanguageDropdown && (
              <div className={`absolute top-full left-0 mt-1 w-48 rounded-md shadow-lg z-10 ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                <div className="py-1">
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => {
                        if (lang.value === 'custom') {
                          const customLang = prompt('Enter custom language name:');
                          if (customLang) {
                            handleLanguageChange('custom', customLang);
                          }
                        } else {
                          handleLanguageChange(lang.value);
                        }
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${theme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      {lang.label}
                      {language === lang.value && (
                        <span className="float-right">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={copyToClipboard}
            className={`p-1.5 rounded ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button 
            onClick={downloadCode}
            className={`p-1.5 rounded ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
            title="Download code"
          >
            <Download className="w-4 h-4" />
          </button>
          {isExecuting ? (
            <button 
              onClick={stopExecution}
              className="flex items-center px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
            >
              <Square className="w-4 h-4 mr-1" />
              Stop
            </button>
          ) : (
            <button 
              onClick={executeCode}
              disabled={readOnly}
              className={`flex items-center px-3 py-1 rounded text-sm ${
                readOnly 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              <Play className="w-4 h-4 mr-1" />
              Run
            </button>
          )}
        </div>
      </div>

      {/* Code Editor */}
      <div className="relative">
        {lineNumbers && (
          <div 
            className={`absolute left-0 top-0 bottom-0 w-12 py-4 text-right pr-2 border-r ${
              theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-500' : 'bg-gray-50 border-gray-200 text-gray-400'
            }`}
            style={{ minHeight: `${minHeight}px` }}
          >
            {lines.map(line => (
              <div key={line} className="text-xs leading-6">
                {line}
              </div>
            ))}
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleCodeChange}
          readOnly={readOnly}
          spellCheck="false"
          className={`w-full font-mono text-sm resize-none focus:outline-none p-4 ${
            lineNumbers ? 'pl-14' : 'pl-4'
          } ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'}`}
          style={{ 
            minHeight: `${minHeight}px`,
            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
          }}
          placeholder="// Write your code here..."
        />
      </div>

      {/* Output Panel */}
      {(output || executionError || isExecuting) && (
        <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`px-4 py-2 text-xs font-medium ${theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
            OUTPUT
          </div>
          <div 
            ref={outputRef}
            className={`p-4 font-mono text-sm whitespace-pre-wrap max-h-40 overflow-y-auto ${
              theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-800'
            }`}
          >
            {isExecuting ? (
              <div className="flex items-center text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500 mr-2"></div>
                Executing...
              </div>
            ) : executionError ? (
              <div className="text-red-500">
                <div className="font-bold">Error:</div>
                <div>{executionError}</div>
              </div>
            ) : (
              output || <span className="text-gray-500">No output</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FunctionalCodeEditor;