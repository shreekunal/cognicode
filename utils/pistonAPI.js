// OneCompiler API Helper - Code execution API
// Documentation: https://onecompiler.com/apis/code-execution

const ONECOMPILER_API_URL = 'https://api.onecompiler.com/v1/run';
const ONECOMPILER_API_KEY = process.env.ONECOMPILER_API_KEY;

// Language mapping to OneCompiler language ids
const languageMap = {
    'python3': 'python',
    'cpp': 'cpp',
    'java': 'java',
    'nodejs': 'javascript',
    'c': 'c',
};

// File names per language
function getFileName(language) {
    const fileNames = {
        'python': 'main.py',
        'cpp': 'main.cpp',
        'java': 'Main.java',
        'javascript': 'main.js',
        'c': 'main.c',
    };
    return fileNames[language] || 'main.txt';
}

/**
 * Execute code using OneCompiler API
 * @param {string} language - Language identifier (python3, cpp, java, nodejs, c)
 * @param {string} code - Source code to execute
 * @param {string} input - Standard input for the program
 * @returns {Promise<{output: string, cpuTime: number, memory: number, error?: string}>}
 */
export async function executeCode(language, code, input = '') {
    try {
        const ocLanguage = languageMap[language] || language;

        const response = await fetch(ONECOMPILER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': ONECOMPILER_API_KEY,
            },
            body: JSON.stringify({
                language: ocLanguage,
                stdin: input,
                files: [
                    {
                        name: getFileName(ocLanguage),
                        content: code,
                    }
                ],
            }),
        });

        const result = await response.json();

        if (result.status === 'failed') {
            return {
                output: result.error || 'Execution failed',
                cpuTime: 0,
                memory: 0,
                error: result.error,
            };
        }

        // Map OneCompiler response to our format
        const hasError = result.exception || result.stderr;
        return {
            output: result.stdout || result.stderr || result.exception || '',
            cpuTime: result.executionTime ? result.executionTime / 1000 : 0,
            memory: result.memoryUsed || 0,
            error: hasError ? (result.stderr || result.exception) : null,
        };
    } catch (error) {
        console.error('OneCompiler API execution error:', error);
        throw error;
    }
}

/**
 * Execute code with multiple inputs (batch) using OneCompiler API
 * @param {string} language - Language identifier
 * @param {string} code - Source code
 * @param {string[]} inputs - Array of stdin values
 * @returns {Promise<Array>} - Array of execution results
 */
export async function executeBatch(language, code, inputs = []) {
    try {
        const ocLanguage = languageMap[language] || language;

        const response = await fetch(ONECOMPILER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': ONECOMPILER_API_KEY,
            },
            body: JSON.stringify({
                language: ocLanguage,
                stdin: inputs,
                files: [
                    {
                        name: getFileName(ocLanguage),
                        content: code,
                    }
                ],
            }),
        });

        const results = await response.json();

        // If batch, results is an array
        if (Array.isArray(results)) {
            return results.map(r => ({
                output: r.stdout || r.stderr || r.exception || '',
                cpuTime: r.executionTime ? r.executionTime / 1000 : 0,
                memory: 0,
                error: r.exception || r.stderr || null,
            }));
        }

        // Single result fallback
        return [{
            output: results.stdout || results.stderr || results.exception || '',
            cpuTime: results.executionTime ? results.executionTime / 1000 : 0,
            memory: results.memoryUsed || 0,
            error: results.exception || results.stderr || null,
        }];
    } catch (error) {
        console.error('OneCompiler batch execution error:', error);
        throw error;
    }
}
