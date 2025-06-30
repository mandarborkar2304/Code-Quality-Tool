// Test file for GROQ-based syntax analyzer
import { analyzeSyntaxErrors, formatSyntaxErrors, getSyntaxSummary } from '../utils/syntaxAnalyzer';

// Test cases with various syntax issues
const testCases = [
  {
    name: 'JavaScript with missing semicolons',
    code: `
function testFunction() {
  let x = 10
  let y = 20;
  
  if (x == y) {
    console.log("Equal")
  }
  
  return x + y
}

let test = 123magic;
console.log(test);
`,
    language: 'javascript'
  },
  {
    name: 'Python with missing colons',
    code: `
def test_function()
    x = 10
    y = 20
    
    if x == y
        print("Equal")
    
    return x + y

123test = "invalid"
`,
    language: 'python'
  },
  {
    name: 'Java with missing semicolon',
    code: `
public class Test {
    public static void main(String[] args) {
        int x = 10
        int y = 20;
        
        if (x == y) {
            System.out.println("Equal");
        }
        
        return x + y;
    }
}
`,
    language: 'java'
  }
];

// Function to run tests
export async function runSyntaxAnalysisTests() {
  console.log('🚀 Starting GROQ-based Syntax Analysis Tests...\n');
  
  for (const testCase of testCases) {
    console.log(`📝 Testing: ${testCase.name}`);
    console.log(`📋 Language: ${testCase.language}`);
    
    try {
      const startTime = Date.now();
      const result = await analyzeSyntaxErrors(testCase.code, testCase.language);
      const analysisTime = Date.now() - startTime;
      
      console.log(`⏱️  Analysis completed in ${analysisTime}ms`);
      console.log(`🤖 AI Analysis Used: ${result.aiAnalysisUsed ? 'Yes' : 'No (Fallback)'}`);
      console.log(`📊 Results: ${result.errors.length} errors, ${result.warnings.length} warnings, ${result.suggestions.length} suggestions`);
      
      if (result.errors.length > 0) {
        console.log('🚨 Errors found:');
        result.errors.forEach(error => {
          console.log(`   Line ${error.line}:${error.column} - ${error.message}`);
        });
      }
      
      if (result.warnings.length > 0) {
        console.log('⚠️  Warnings found:');
        result.warnings.slice(0, 3).forEach(warning => { // Show first 3 warnings
          console.log(`   Line ${warning.line}:${warning.column} - ${warning.message}`);
        });
        if (result.warnings.length > 3) {
          console.log(`   ... and ${result.warnings.length - 3} more warnings`);
        }
      }
      
      // Test formatting functions
      const formatted = formatSyntaxErrors(result);
      const summary = getSyntaxSummary(result);
      
      console.log('📋 Summary:');
      console.log(summary);
      
    } catch (error) {
      console.error(`❌ Test failed for ${testCase.name}:`, error);
    }
    
    console.log('\n' + '─'.repeat(50) + '\n');
  }
  
  console.log('✅ All syntax analysis tests completed!');
}

// Export for manual testing
if (typeof window === 'undefined') {
  // Node.js environment - can run directly
  runSyntaxAnalysisTests().catch(console.error);
}