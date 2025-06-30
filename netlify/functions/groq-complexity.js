import { Groq } from 'groq-sdk';

export const handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { code, language, functionName, context: analysisContext } = JSON.parse(event.body);

    if (!code || !language) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Code and language are required' }),
      };
    }

    // Initialize Groq
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    // Perform static analysis
    const staticAnalysis = performStaticAnalysis(code, language);

    const prompt = `
You are an expert software engineer specializing in algorithm analysis and computational complexity. 
Analyze the following ${language} code and provide a comprehensive complexity analysis.

Code to analyze:
\`\`\`${language}
${code}
\`\`\`

${functionName ? `Function name: ${functionName}` : ''}
${analysisContext ? `Context: ${analysisContext}` : ''}

Static Analysis Results:
- Total loops: ${staticAnalysis.loops}
- Nested loop depth: ${staticAnalysis.nestedLoops}
- Recursive calls: ${staticAnalysis.recursiveCalls}
- Data structure allocations: ${staticAnalysis.dataStructureAllocations}

Please provide a detailed analysis in the following JSON format:

{
  "timeComplexity": {
    "notation": "O(n log n)",
    "bestCase": "O(n)",
    "averageCase": "O(n log n)",
    "worstCase": "O(n²)",
    "explanation": "Detailed explanation of why this complexity applies...",
    "factors": ["Array iteration", "Sorting operation", "Comparison overhead"],
    "confidence": 95
  },
  "spaceComplexity": {
    "notation": "O(n)",
    "auxiliary": "O(log n)",
    "total": "O(n)",
    "explanation": "Detailed explanation of memory usage...",
    "factors": ["Input array storage", "Stack space for recursion"],
    "confidence": 90
  },
  "algorithmType": "Divide and Conquer",
  "dataStructures": ["Array", "Stack"],
  "optimizationSuggestions": [
    "Consider using an in-place sorting algorithm to reduce space complexity",
    "Use iterative approach instead of recursion to reduce stack space"
  ],
  "staticAnalysis": {
    "loops": ${staticAnalysis.loops},
    "nestedLoops": ${staticAnalysis.nestedLoops},
    "recursiveCalls": ${staticAnalysis.recursiveCalls},
    "dataStructureAllocations": ${staticAnalysis.dataStructureAllocations}
  }
}

Rules for analysis:
1. Be precise with Big O notation
2. Consider best, average, and worst cases for time complexity
3. Distinguish between auxiliary and total space complexity
4. Provide confidence scores (0-100) based on code clarity
5. Include realistic optimization suggestions
6. Consider the actual algorithm being implemented, not just loop counting
7. Account for hidden complexities (e.g., string operations, sorting, searching)
8. Be aware of language-specific optimizations

Respond ONLY with the JSON object, no additional text.`;

    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from Groq API');
    }

    // Parse the JSON response
    const analysisResult = JSON.parse(content);
    
    // Add static analysis to the result
    analysisResult.staticAnalysis = staticAnalysis;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(analysisResult),
    };

  } catch (error) {
    console.error('Groq complexity analysis failed:', error);
    
    // Return fallback analysis
    const fallbackAnalysis = generateFallbackComplexityAnalysis(
      JSON.parse(event.body).code,
      JSON.parse(event.body).language
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(fallbackAnalysis),
    };
  }
};

// Helper functions
function performStaticAnalysis(code, language) {
  const lines = code.split('\n');
  
  // Count loops
  const loopPatterns = [
    /\bfor\s*\(/g,
    /\bwhile\s*\(/g,
    /\bdo\s*\{/g,
    /\.forEach\s*\(/g,
    /\.map\s*\(/g,
    /\.filter\s*\(/g,
    /\.reduce\s*\(/g,
    /\bfor\s+\w+\s+in\s+/g, // Python for loops
  ];
  
  let totalLoops = 0;
  loopPatterns.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) totalLoops += matches.length;
  });
  
  // Estimate nested loops
  let nestedLoops = 0;
  let currentDepth = 0;
  let maxDepth = 0;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (loopPatterns.some(pattern => pattern.test(trimmed))) {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
    }
    if (trimmed.includes('}') && currentDepth > 0) {
      currentDepth--;
    }
  }
  nestedLoops = maxDepth;
  
  // Count recursive calls
  const functionNames = extractFunctionNames(code, language);
  let recursiveCalls = 0;
  
  functionNames.forEach(funcName => {
    const funcCallCount = (code.match(new RegExp(`\\b${funcName}\\s*\\(`, 'g')) || []).length;
    if (funcCallCount > 1) {
      recursiveCalls++;
    }
  });
  
  // Count data structure allocations
  const allocPatterns = [
    /new\s+(?:Array|ArrayList|Vector|List|HashMap|HashSet|TreeMap|TreeSet)/g,
    /\[\s*\]/g,
    /\{\s*\}/g,
    /dict\s*\(/g,
    /list\s*\(/g,
    /set\s*\(/g,
  ];
  
  let dataStructureAllocations = 0;
  allocPatterns.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) dataStructureAllocations += matches.length;
  });
  
  return {
    loops: totalLoops,
    nestedLoops,
    recursiveCalls,
    dataStructureAllocations
  };
}

function extractFunctionNames(code, language) {
  const names = [];
  
  const patterns = {
    javascript: [
      /function\s+(\w+)\s*\(/g,
      /(\w+)\s*=\s*function/g,
      /(\w+)\s*=\s*\([^)]*\)\s*=>/g,
      /(\w+)\s*\([^)]*\)\s*\{/g,
    ],
    python: [
      /def\s+(\w+)\s*\(/g,
    ],
    java: [
      /(?:public|private|protected|static|\s)+\w+\s+(\w+)\s*\(/g,
    ],
    cpp: [
      /\w+\s+(\w+)\s*\([^)]*\)\s*\{/g,
    ],
    csharp: [
      /(?:public|private|protected|internal|static|\s)+\w+\s+(\w+)\s*\(/g,
    ]
  };
  
  const langPatterns = patterns[language] || patterns.javascript;
  
  langPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      names.push(match[1]);
    }
  });
  
  return [...new Set(names)];
}

function generateFallbackComplexityAnalysis(code, language) {
  const staticAnalysis = performStaticAnalysis(code, language);
  
  // Basic complexity estimation based on static analysis
  let timeComplexity = "O(1)";
  let spaceComplexity = "O(1)";
  
  if (staticAnalysis.nestedLoops >= 3) {
    timeComplexity = "O(n³)";
  } else if (staticAnalysis.nestedLoops >= 2) {
    timeComplexity = "O(n²)";
  } else if (staticAnalysis.loops > 0 || staticAnalysis.recursiveCalls > 0) {
    timeComplexity = "O(n)";
  }
  
  if (staticAnalysis.recursiveCalls > 0) {
    spaceComplexity = "O(n)";
  } else if (staticAnalysis.dataStructureAllocations > 0) {
    spaceComplexity = "O(n)";
  }
  
  // Check for common patterns
  const hasSorting = /\.sort\s*\(|Arrays\.sort|Collections\.sort|sorted\s*\(/i.test(code);
  const hasBinarySearch = /binary.*search|while.*mid|left.*right.*middle/i.test(code);
  
  if (hasSorting && timeComplexity === "O(n)") {
    timeComplexity = "O(n log n)";
  }
  
  if (hasBinarySearch && timeComplexity === "O(1)") {
    timeComplexity = "O(log n)";
  }
  
  return {
    timeComplexity: {
      notation: timeComplexity,
      bestCase: timeComplexity,
      averageCase: timeComplexity,
      worstCase: timeComplexity,
      explanation: `Estimated based on static analysis. ${staticAnalysis.nestedLoops} nested loops detected.`,
      factors: [`${staticAnalysis.loops} loops`, `${staticAnalysis.recursiveCalls} recursive calls`],
      confidence: 60
    },
    spaceComplexity: {
      notation: spaceComplexity,
      auxiliary: spaceComplexity,
      total: spaceComplexity,
      explanation: `Estimated based on data structure allocations and recursion depth.`,
      factors: [`${staticAnalysis.dataStructureAllocations} data structures`, `${staticAnalysis.recursiveCalls} recursive calls`],
      confidence: 55
    },
    algorithmType: "Unknown",
    dataStructures: ["Array"],
    optimizationSuggestions: [
      "Consider reducing nested loops if possible",
      "Use more efficient data structures",
      "Consider iterative approaches instead of recursion"
    ],
    staticAnalysis
  };
}

// Handler is already exported as const above