import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface TestCase {
  input: string;
  expected_output: string;
  actual_output?: string;
  status?: 'Pass' | 'Fail' | '' | 'Running';
  verdict_message?: string;
}

interface TestCaseDisplayProps {
  testCases: TestCase[];
  setTestCases: React.Dispatch<React.SetStateAction<TestCase[]>>; // Add setTestCases prop
}

const TestCaseDisplay: React.FC<TestCaseDisplayProps> = ({
  testCases,
  setTestCases,
}) => {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (testCases && testCases.length > 0) {
      setActiveTab(0); // Reset to first tab when testCases change
    }
  }, [testCases]);

  const currentTestCase = testCases[activeTab];
  const currentInput = currentTestCase?.input;
  const currentExpectedOutput = currentTestCase?.expected_output;
  const currentActualOutput = currentTestCase?.actual_output;
  const currentJudgeStatus = currentTestCase?.status;
  const currentVerdictMessage = currentTestCase?.verdict_message;

  const handleAddTestCase = () => {
    setTestCases([...testCases, { input: '', expected_output: '', actual_output: '', status: '', verdict_message: '' }]);
    setActiveTab(testCases.length);
  };

  const handleRemoveTestCase = () => {
    if (testCases.length > 0) {
      const newTestCases = testCases.slice(0, -1);
      setTestCases(newTestCases);
      if (activeTab >= newTestCases.length && newTestCases.length > 0) {
        setActiveTab(newTestCases.length - 1);
      } else if (newTestCases.length === 0) {
        setActiveTab(0);
      }
    }
  };

  const handleInputChange = (index: number, field: keyof TestCase, value: string) => {
    const newTestCases = [...testCases];
    newTestCases[index] = { ...newTestCases[index], [field]: value };
    setTestCases(newTestCases);
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      <div className="flex justify-end mb-4 p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddTestCase}
          className="mr-2"
        >
          Add Test Case
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRemoveTestCase}
          disabled={testCases.length === 0}
        >
          Remove Last Test Case
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {testCases.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
            <div className="text-6xl mb-4 opacity-20">🧪</div>
            <h3 className="text-lg font-semibold mb-2">No Test Cases Available</h3>
            <p className="text-sm">Click "Add Test Case" to create your first test scenario</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                {testCases.map((_, index) => (
                  <button
                    key={index}
                    className={`py-2 px-4 text-sm font-medium focus:outline-none whitespace-nowrap ${activeTab === index
                      ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}
                    `}
                    onClick={() => setActiveTab(index)}
                  >
                    Test Case {index + 1}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Details for Test Case {activeTab + 1}:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Input:</h4>
                  <textarea
                    id="test-case-input"
                    className="w-full h-24 p-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-sm"
                    value={currentInput || ''}
                    onChange={(e) => handleInputChange(activeTab, 'input', e.target.value)}
                    placeholder="Enter input for test case"
                  />
                </div>
                <div>
                  <h4 className="font-medium">Expected Output:</h4>
                  <textarea
                    id="test-case-expected-output"
                    className="w-full h-24 p-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-sm"
                    value={currentExpectedOutput || ''}
                    onChange={(e) => handleInputChange(activeTab, 'expected_output', e.target.value)}
                    placeholder="Enter expected output for test case"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>


      {currentJudgeStatus !== '' && (currentJudgeStatus !== undefined) && (
        <div className="mt-4 p-3 rounded-md"
          style={{
            backgroundColor: currentJudgeStatus === 'Pass' ? 'rgba(144, 238, 144, 0.2)' : 'rgba(255, 99, 71, 0.2)',
            borderColor: currentJudgeStatus === 'Pass' ? 'lightgreen' : 'tomato',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
        >
          <h4 className="font-semibold">Result: <span className={currentJudgeStatus === 'Pass' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>{currentJudgeStatus}</span></h4>
          {currentVerdictMessage && <p className="text-sm mt-1">Verdict: {currentVerdictMessage}</p>}
          {currentActualOutput && (
            <div className="mt-2">
              <h5 className="font-medium">Actual Output:</h5>
              <pre className="whitespace-pre-wrap text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded-md mt-1">{currentActualOutput}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TestCaseDisplay;
