import { TestCase } from './index';

declare global {
  interface Window {
    testCases?: TestCase[];
  }
}