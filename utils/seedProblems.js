// Seed Problems Script
// Inserts sample problems into the MongoDB database

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Define Problem schema inline to avoid import issues
const ProblemSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: { type: String },
    problemStatement: { type: String },
    inputFormat: { type: String },
    outputFormat: { type: String },
    sampleInput: { type: String },
    sampleOutput: { type: String },
    likes: { type: Number, default: 10 },
    dislikes: { type: Number, default: 0 },
    order: { type: Number },
    category: { type: String },
    constraints: { type: String },
    companies: { type: [String], default: [] },
    starterCode: { type: String },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
    solution: { type: String },
    videoId: { type: String },
    testCases: [{ input: { type: [String], required: true }, output: { type: [String], required: true } }],
});

const Problem = mongoose.models?.Problem || mongoose.model('Problem', ProblemSchema);

const sampleProblems = [
    {
        id: 'p1',
        title: 'Two Sum',
        problemStatement: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
        inputFormat: 'First line contains n (size of array) and target separated by space. Second line contains n space-separated integers.',
        outputFormat: 'Print the two indices separated by a space.',
        sampleInput: '4 9\n2 7 11 15',
        sampleOutput: '0 1',
        difficulty: 'Easy',
        category: 'Arrays',
        constraints: '2 <= n <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9',
        companies: ['Google', 'Amazon', 'Meta', 'Apple'],
        order: 1,
        starterCode: '// Read input and find two indices whose values sum to target\n',
        testCases: [
            { input: ['4 9', '2 7 11 15'], output: ['0 1'] },
            { input: ['3 6', '3 2 4'], output: ['1 2'] },
            { input: ['2 6', '3 3'], output: ['0 1'] }
        ],
        videoId: 'dQw4w9WgXcQ'
    },
    {
        id: 'p2',
        title: 'Reverse Linked List',
        problemStatement: 'Given the head of a singly linked list, reverse the list, and return the reversed list.\n\nYou are given the list as space-separated values. Reverse all nodes and print the result.',
        inputFormat: 'First line contains n (number of nodes). Second line contains n space-separated integers representing node values.',
        outputFormat: 'Print the reversed list as space-separated values.',
        sampleInput: '5\n1 2 3 4 5',
        sampleOutput: '5 4 3 2 1',
        difficulty: 'Medium',
        category: 'Linked List',
        constraints: '0 <= n <= 5000\n-5000 <= Node.val <= 5000',
        companies: ['Microsoft', 'Amazon', 'Bloomberg'],
        order: 2,
        starterCode: '// Read the linked list and reverse it\n',
        testCases: [
            { input: ['5', '1 2 3 4 5'], output: ['5 4 3 2 1'] },
            { input: ['3', '1 2 3'], output: ['3 2 1'] },
            { input: ['1', '1'], output: ['1'] }
        ],
        videoId: '8-k1C6ehKuw'
    },
    {
        id: 'p3',
        title: 'Dijkstra Shortest Path',
        problemStatement: 'Given a weighted directed graph with V vertices (0 to V-1) and E edges, find the shortest distance from a source vertex S to all other vertices.\n\nIf a vertex is unreachable from S, print -1 for that vertex.',
        inputFormat: 'First line: V E S (vertices, edges, source). Next E lines each contain: u v w (edge from u to v with weight w).',
        outputFormat: 'Print V space-separated shortest distances from source to each vertex (0 to V-1).',
        sampleInput: '5 6 0\n0 1 2\n0 2 4\n1 2 1\n1 3 7\n2 4 3\n3 4 1',
        sampleOutput: '0 2 3 9 6',
        difficulty: 'Hard',
        category: 'Graphs',
        constraints: '1 <= V <= 1000\n1 <= E <= V*(V-1)\n0 <= w <= 10^4',
        companies: ['Google', 'Uber', 'Apple'],
        order: 3,
        starterCode: '// Implement Dijkstra\'s shortest path algorithm\n',
        testCases: [
            { input: ['5 6 0', '0 1 2', '0 2 4', '1 2 1', '1 3 7', '2 4 3', '3 4 1'], output: ['0 2 3 9 6'] },
            { input: ['3 3 0', '0 1 1', '1 2 2', '0 2 4'], output: ['0 1 3'] }
        ],
        videoId: 'h2f1YQz3G6g'
    },
    {
        id: 'p4',
        title: 'Valid Parentheses',
        problemStatement: 'Given a string s containing just the characters \'(\', \')\', \'{\', \'}\', \'[\' and \']\', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
        inputFormat: 'A single line containing the string s.',
        outputFormat: 'Print "true" if valid, "false" otherwise.',
        sampleInput: '()[]{}',
        sampleOutput: 'true',
        difficulty: 'Easy',
        category: 'Stacks',
        constraints: '1 <= s.length <= 10^4\ns consists of parentheses only \'()[]{}\'',
        companies: ['Amazon', 'Meta', 'Bloomberg'],
        order: 4,
        starterCode: '// Check if the parentheses string is valid\n',
        testCases: [
            { input: ['()[]{}'], output: ['true'] },
            { input: ['(]'], output: ['false'] },
            { input: ['{[]}'], output: ['true'] },
            { input: ['([)]'], output: ['false'] }
        ],
        videoId: 'WTzjTskDFMg'
    },
    {
        id: 'p5',
        title: 'Maximum Subarray',
        problemStatement: 'Given an integer array nums, find the subarray with the largest sum, and return its sum.\n\nA subarray is a contiguous non-empty sequence of elements within an array.',
        inputFormat: 'First line contains n (size of array). Second line contains n space-separated integers.',
        outputFormat: 'Print the maximum subarray sum.',
        sampleInput: '9\n-2 1 -3 4 -1 2 1 -5 4',
        sampleOutput: '6',
        difficulty: 'Medium',
        category: 'Dynamic Programming',
        constraints: '1 <= n <= 10^5\n-10^4 <= nums[i] <= 10^4',
        companies: ['Amazon', 'Apple', 'Microsoft', 'LinkedIn'],
        order: 5,
        starterCode: '// Find the maximum subarray sum using Kadane\'s algorithm\n',
        testCases: [
            { input: ['9', '-2 1 -3 4 -1 2 1 -5 4'], output: ['6'] },
            { input: ['1', '1'], output: ['1'] },
            { input: ['5', '5 4 -1 7 8'], output: ['23'] }
        ],
        videoId: '5WZl3MMT0Eg'
    },
    {
        id: 'p6',
        title: 'Binary Search',
        problemStatement: 'Given a sorted array of distinct integers and a target value, return the index if the target is found. If not, return -1.\n\nYou must write an algorithm with O(log n) runtime complexity.',
        inputFormat: 'First line contains n and target. Second line contains n sorted space-separated integers.',
        outputFormat: 'Print the index of target, or -1 if not found.',
        sampleInput: '6 9\n-1 0 3 5 9 12',
        sampleOutput: '4',
        difficulty: 'Easy',
        category: 'Binary Search',
        constraints: '1 <= n <= 10^4\n-10^4 < nums[i], target < 10^4\nAll integers in nums are unique.\nnums is sorted in ascending order.',
        companies: ['Google', 'Microsoft', 'Apple'],
        order: 6,
        starterCode: '// Implement binary search on a sorted array\n',
        testCases: [
            { input: ['6 9', '-1 0 3 5 9 12'], output: ['4'] },
            { input: ['6 2', '-1 0 3 5 9 12'], output: ['-1'] },
            { input: ['1 5', '5'], output: ['0'] }
        ],
        videoId: 'sSgU2Jo_vpM'
    },
    {
        id: 'p7',
        title: 'Merge Two Sorted Lists',
        problemStatement: 'You are given two sorted linked lists (as arrays). Merge the two lists into one sorted list by splicing together the nodes.\n\nReturn the merged sorted list.',
        inputFormat: 'First line: n m (sizes of the two lists). Second line: n sorted integers. Third line: m sorted integers.',
        outputFormat: 'Print the merged sorted list as space-separated values.',
        sampleInput: '3 3\n1 2 4\n1 3 4',
        sampleOutput: '1 1 2 3 4 4',
        difficulty: 'Easy',
        category: 'Linked List',
        constraints: '0 <= n, m <= 50\n-100 <= Node.val <= 100\nBoth lists are sorted in non-decreasing order.',
        companies: ['Amazon', 'Microsoft', 'Apple'],
        order: 7,
        starterCode: '// Merge two sorted lists into one sorted list\n',
        testCases: [
            { input: ['3 3', '1 2 4', '1 3 4'], output: ['1 1 2 3 4 4'] },
            { input: ['0 0', '', ''], output: [''] },
            { input: ['0 1', '', '0'], output: ['0'] }
        ],
        videoId: 'XIdigk956u0'
    },
    {
        id: 'p8',
        title: 'Climbing Stairs',
        problemStatement: 'You are climbing a staircase. It takes n steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
        inputFormat: 'A single integer n.',
        outputFormat: 'Print the number of distinct ways to climb to the top.',
        sampleInput: '5',
        sampleOutput: '8',
        difficulty: 'Easy',
        category: 'Dynamic Programming',
        constraints: '1 <= n <= 45',
        companies: ['Amazon', 'Apple', 'Adobe'],
        order: 8,
        starterCode: '// Count the number of ways to climb n stairs\n',
        testCases: [
            { input: ['2'], output: ['2'] },
            { input: ['3'], output: ['3'] },
            { input: ['5'], output: ['8'] }
        ],
        videoId: 'Y0lT9Fck7qI'
    },
    {
        id: 'p9',
        title: 'Best Time to Buy and Sell Stock',
        problemStatement: 'You are given an array prices where prices[i] is the price of a given stock on the ith day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve. If you cannot achieve any profit, return 0.',
        inputFormat: 'First line contains n. Second line contains n space-separated prices.',
        outputFormat: 'Print the maximum profit.',
        sampleInput: '6\n7 1 5 3 6 4',
        sampleOutput: '5',
        difficulty: 'Easy',
        category: 'Arrays',
        constraints: '1 <= n <= 10^5\n0 <= prices[i] <= 10^4',
        companies: ['Amazon', 'Meta', 'Goldman Sachs', 'Microsoft'],
        order: 9,
        starterCode: '// Find the maximum profit from buying and selling stock\n',
        testCases: [
            { input: ['6', '7 1 5 3 6 4'], output: ['5'] },
            { input: ['5', '7 6 4 3 1'], output: ['0'] },
            { input: ['4', '2 4 1 7'], output: ['6'] }
        ],
        videoId: '1pkOgXD63yU'
    },
    {
        id: 'p10',
        title: 'Longest Common Subsequence',
        problemStatement: 'Given two strings text1 and text2, return the length of their longest common subsequence. If there is no common subsequence, return 0.\n\nA subsequence of a string is a new string generated from the original string with some characters (can be none) deleted without changing the relative order of the remaining characters.',
        inputFormat: 'First line: text1. Second line: text2.',
        outputFormat: 'Print the length of the longest common subsequence.',
        sampleInput: 'abcde\nace',
        sampleOutput: '3',
        difficulty: 'Medium',
        category: 'Dynamic Programming',
        constraints: '1 <= text1.length, text2.length <= 1000\ntext1 and text2 consist of only lowercase English characters.',
        companies: ['Google', 'Amazon', 'Karat'],
        order: 10,
        starterCode: '// Find the longest common subsequence of two strings\n',
        testCases: [
            { input: ['abcde', 'ace'], output: ['3'] },
            { input: ['abc', 'abc'], output: ['3'] },
            { input: ['abc', 'def'], output: ['0'] }
        ],
        videoId: 'Ua0GhsJSlWM'
    },
    {
        id: 'p11',
        title: 'Number of Islands',
        problemStatement: 'Given an m x n 2D binary grid which represents a map of \'1\'s (land) and \'0\'s (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are surrounded by water.',
        inputFormat: 'First line: m n (rows and columns). Next m lines each contain n characters (\'0\' or \'1\').',
        outputFormat: 'Print the number of islands.',
        sampleInput: '4 5\n11110\n11010\n11000\n00000',
        sampleOutput: '1',
        difficulty: 'Medium',
        category: 'Graphs',
        constraints: 'm == grid.length\nn == grid[i].length\n1 <= m, n <= 300\ngrid[i][j] is \'0\' or \'1\'.',
        companies: ['Amazon', 'Meta', 'Google', 'Microsoft'],
        order: 11,
        starterCode: '// Count the number of islands in the grid\n',
        testCases: [
            { input: ['4 5', '11110', '11010', '11000', '00000'], output: ['1'] },
            { input: ['4 5', '11000', '11000', '00100', '00011'], output: ['3'] }
        ],
        videoId: 'pV2kpPD66nE'
    },
    {
        id: 'p12',
        title: 'Detect Cycle in Linked List',
        problemStatement: 'Given an array representing a linked list where each element points to the next index, determine if the linked list has a cycle in it.\n\nA cycle exists if following the next pointers eventually leads back to a previously visited node.\n\nUse Floyd\'s Cycle Detection algorithm (tortoise and hare).',
        inputFormat: 'First line: n pos (number of nodes and the position where the tail connects to, -1 if no cycle). Second line: n space-separated node values.',
        outputFormat: 'Print "true" if cycle exists, "false" otherwise.',
        sampleInput: '4 1\n3 2 0 -4',
        sampleOutput: 'true',
        difficulty: 'Medium',
        category: 'Linked List',
        constraints: '0 <= n <= 10^4\n-10^5 <= Node.val <= 10^5\npos is -1 or a valid index.',
        companies: ['Amazon', 'Microsoft', 'Goldman Sachs'],
        order: 12,
        starterCode: '// Detect if a linked list has a cycle\n',
        testCases: [
            { input: ['4 1', '3 2 0 -4'], output: ['true'] },
            { input: ['2 0', '1 2'], output: ['true'] },
            { input: ['1 -1', '1'], output: ['false'] }
        ],
        videoId: 'gBTe7lFR3vc'
    },
    {
        id: 'p13',
        title: 'Coin Change',
        problemStatement: 'You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money.\n\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.\n\nYou may assume that you have an infinite number of each kind of coin.',
        inputFormat: 'First line: n amount (number of coin types and target amount). Second line: n space-separated coin denominations.',
        outputFormat: 'Print the minimum number of coins, or -1 if impossible.',
        sampleInput: '3 11\n1 5 2',
        sampleOutput: '3',
        difficulty: 'Medium',
        category: 'Dynamic Programming',
        constraints: '1 <= coins.length <= 12\n1 <= coins[i] <= 2^31 - 1\n0 <= amount <= 10^4',
        companies: ['Amazon', 'Google', 'Apple', 'Goldman Sachs'],
        order: 13,
        starterCode: '// Find minimum coins needed to make the target amount\n',
        testCases: [
            { input: ['3 11', '1 5 2'], output: ['3'] },
            { input: ['1 3', '2'], output: ['-1'] },
            { input: ['1 0', '1'], output: ['0'] }
        ],
        videoId: 'H9bfqozjoqs'
    },
    {
        id: 'p14',
        title: 'Merge Sort',
        problemStatement: 'Given an array of n integers, sort the array using the Merge Sort algorithm and print the sorted result.\n\nMerge Sort is a divide-and-conquer algorithm that divides the array into halves, recursively sorts them, and then merges the sorted halves.',
        inputFormat: 'First line: n (size of array). Second line: n space-separated integers.',
        outputFormat: 'Print the sorted array as space-separated integers.',
        sampleInput: '6\n38 27 43 3 9 82',
        sampleOutput: '3 9 27 38 43 82',
        difficulty: 'Medium',
        category: 'Sorting',
        constraints: '1 <= n <= 10^5\n-10^9 <= arr[i] <= 10^9',
        companies: ['Microsoft', 'Amazon', 'Goldman Sachs'],
        order: 14,
        starterCode: '// Implement merge sort algorithm\n',
        testCases: [
            { input: ['6', '38 27 43 3 9 82'], output: ['3 9 27 38 43 82'] },
            { input: ['5', '5 4 3 2 1'], output: ['1 2 3 4 5'] },
            { input: ['1', '42'], output: ['42'] }
        ],
        videoId: '4VqmGbwPNUS'
    },
    {
        id: 'p15',
        title: 'Trapping Rain Water',
        problemStatement: 'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
        inputFormat: 'First line: n (number of bars). Second line: n space-separated non-negative integers representing heights.',
        outputFormat: 'Print the total amount of trapped water.',
        sampleInput: '12\n0 1 0 2 1 0 1 3 2 1 2 1',
        sampleOutput: '6',
        difficulty: 'Hard',
        category: 'Arrays',
        constraints: 'n == height.length\n1 <= n <= 2 * 10^4\n0 <= height[i] <= 10^5',
        companies: ['Amazon', 'Google', 'Meta', 'Goldman Sachs', 'Apple'],
        order: 15,
        starterCode: '// Calculate the amount of trapped rain water\n',
        testCases: [
            { input: ['12', '0 1 0 2 1 0 1 3 2 1 2 1'], output: ['6'] },
            { input: ['6', '4 2 0 3 2 5'], output: ['9'] }
        ],
        videoId: 'ZI2z5pq0TqA'
    },
    {
        id: 'p16',
        title: 'Palindrome Check',
        problemStatement: 'Given a string s, determine if it is a palindrome, considering only alphanumeric characters and ignoring cases.\n\nA string is a palindrome if it reads the same forward and backward after converting all uppercase letters to lowercase and removing all non-alphanumeric characters.',
        inputFormat: 'A single line containing the string s.',
        outputFormat: 'Print "true" if it is a palindrome, "false" otherwise.',
        sampleInput: 'A man, a plan, a canal: Panama',
        sampleOutput: 'true',
        difficulty: 'Easy',
        category: 'Strings',
        constraints: '1 <= s.length <= 2 * 10^5\ns consists only of printable ASCII characters.',
        companies: ['Meta', 'Microsoft', 'Uber'],
        order: 16,
        starterCode: '// Check if the given string is a valid palindrome\n',
        testCases: [
            { input: ['A man, a plan, a canal: Panama'], output: ['true'] },
            { input: ['race a car'], output: ['false'] },
            { input: [' '], output: ['true'] }
        ],
        videoId: 'jJXJ16kPFWg'
    },
    {
        id: 'p17',
        title: 'Fibonacci Number',
        problemStatement: 'The Fibonacci numbers, commonly denoted F(n), form a sequence where each number is the sum of the two preceding ones, starting from 0 and 1.\n\nF(0) = 0, F(1) = 1\nF(n) = F(n - 1) + F(n - 2), for n > 1\n\nGiven n, calculate F(n).',
        inputFormat: 'A single integer n.',
        outputFormat: 'Print F(n).',
        sampleInput: '10',
        sampleOutput: '55',
        difficulty: 'Easy',
        category: 'Dynamic Programming',
        constraints: '0 <= n <= 30',
        companies: ['Amazon', 'Apple', 'Google'],
        order: 17,
        starterCode: '// Compute the nth Fibonacci number\n',
        testCases: [
            { input: ['0'], output: ['0'] },
            { input: ['1'], output: ['1'] },
            { input: ['10'], output: ['55'] },
            { input: ['20'], output: ['6765'] }
        ],
        videoId: 'P8Xa2BitN3I'
    },
    {
        id: 'p18',
        title: 'Rotate Array',
        problemStatement: 'Given an integer array nums, rotate the array to the right by k steps, where k is non-negative.\n\nFor example, rotating [1,2,3,4,5,6,7] by 3 steps gives [5,6,7,1,2,3,4].',
        inputFormat: 'First line: n k (array size and rotation steps). Second line: n space-separated integers.',
        outputFormat: 'Print the rotated array as space-separated integers.',
        sampleInput: '7 3\n1 2 3 4 5 6 7',
        sampleOutput: '5 6 7 1 2 3 4',
        difficulty: 'Medium',
        category: 'Arrays',
        constraints: '1 <= n <= 10^5\n-2^31 <= nums[i] <= 2^31 - 1\n0 <= k <= 10^5',
        companies: ['Microsoft', 'Amazon', 'PayPal'],
        order: 18,
        starterCode: '// Rotate the array to the right by k steps\n',
        testCases: [
            { input: ['7 3', '1 2 3 4 5 6 7'], output: ['5 6 7 1 2 3 4'] },
            { input: ['4 2', '-1 -100 3 99'], output: ['3 99 -1 -100'] },
            { input: ['3 4', '1 2 3'], output: ['3 1 2'] }
        ],
        videoId: 'BHr381Guz3Y'
    },
    {
        id: 'p19',
        title: 'Invert Binary Tree',
        problemStatement: 'Given the root of a binary tree represented as a level-order array (with -1 for null nodes), invert the tree and print the level-order traversal of the inverted tree.\n\nInverting a binary tree means swapping the left and right children of every node.',
        inputFormat: 'First line: n (number of elements in level-order). Second line: n space-separated integers (-1 represents null).',
        outputFormat: 'Print the level-order traversal of the inverted tree (excluding trailing nulls).',
        sampleInput: '7\n4 2 7 1 3 6 9',
        sampleOutput: '4 7 2 9 6 3 1',
        difficulty: 'Easy',
        category: 'Trees',
        constraints: 'The number of nodes in the tree is in the range [0, 100].\n-100 <= Node.val <= 100',
        companies: ['Google', 'Amazon', 'Meta'],
        order: 19,
        starterCode: '// Invert a binary tree given in level-order\n',
        testCases: [
            { input: ['7', '4 2 7 1 3 6 9'], output: ['4 7 2 9 6 3 1'] },
            { input: ['3', '2 1 3'], output: ['2 3 1'] },
            { input: ['1', '1'], output: ['1'] }
        ],
        videoId: 'OnSn2XEQ4MY'
    },
    {
        id: 'p20',
        title: 'LRU Cache',
        problemStatement: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.\n\nImplement the LRU Cache with the following operations:\n- PUT key value: Insert the key-value pair. If the key exists, update the value. If the cache reaches capacity, evict the least recently used key.\n- GET key: Return the value if the key exists, otherwise return -1.\n\nBoth operations must run in O(1) average time complexity.',
        inputFormat: 'First line: capacity numOps. Next numOps lines each contain an operation: "PUT key value" or "GET key".',
        outputFormat: 'For each GET operation, print the result on a new line.',
        sampleInput: '2 7\nPUT 1 1\nPUT 2 2\nGET 1\nPUT 3 3\nGET 2\nPUT 4 4\nGET 1',
        sampleOutput: '1\n-1\n-1',
        difficulty: 'Hard',
        category: 'Design',
        constraints: '1 <= capacity <= 3000\n0 <= key <= 10^4\n0 <= value <= 10^5\nAt most 2 * 10^5 operations.',
        companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Apple'],
        order: 20,
        starterCode: '// Implement an LRU Cache with O(1) get and put\n',
        testCases: [
            { input: ['2 7', 'PUT 1 1', 'PUT 2 2', 'GET 1', 'PUT 3 3', 'GET 2', 'PUT 4 4', 'GET 1'], output: ['1', '-1', '-1'] },
            { input: ['1 5', 'PUT 2 1', 'GET 2', 'PUT 3 2', 'GET 2', 'GET 3'], output: ['1', '-1', '2'] }
        ],
        videoId: '7ABFKPK2hD4'
    },
    {
        id: 'p21',
        title: 'Product of Array Except Self',
        problemStatement: 'Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].\n\nThe product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.\n\nYou must solve it without using division and in O(n) time.',
        inputFormat: 'First line: n. Second line: n space-separated integers.',
        outputFormat: 'Print the result array as space-separated integers.',
        sampleInput: '4\n1 2 3 4',
        sampleOutput: '24 12 8 6',
        difficulty: 'Medium',
        category: 'Arrays',
        constraints: '2 <= n <= 10^5\n-30 <= nums[i] <= 30\nProduct of any prefix or suffix fits in a 32-bit integer.',
        companies: ['Amazon', 'Meta', 'Apple', 'Microsoft'],
        order: 21,
        starterCode: '// Compute product of array except self without division\n',
        testCases: [
            { input: ['4', '1 2 3 4'], output: ['24 12 8 6'] },
            { input: ['5', '-1 1 0 -3 3'], output: ['0 0 9 0 0'] }
        ],
        videoId: 'bNvIQI2wAjk'
    },
    {
        id: 'p22',
        title: 'Valid Anagram',
        problemStatement: 'Given two strings s and t, return true if t is an anagram of s, and false otherwise.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.',
        inputFormat: 'First line: string s. Second line: string t.',
        outputFormat: 'Print "true" if t is an anagram of s, "false" otherwise.',
        sampleInput: 'anagram\nnagaram',
        sampleOutput: 'true',
        difficulty: 'Easy',
        category: 'Strings',
        constraints: '1 <= s.length, t.length <= 5 * 10^4\ns and t consist of lowercase English letters.',
        companies: ['Amazon', 'Bloomberg', 'Google'],
        order: 22,
        starterCode: '// Check if two strings are anagrams\n',
        testCases: [
            { input: ['anagram', 'nagaram'], output: ['true'] },
            { input: ['rat', 'car'], output: ['false'] },
            { input: ['a', 'a'], output: ['true'] }
        ],
        videoId: '9UtInBqnCgA'
    },
    {
        id: 'p23',
        title: 'Longest Substring Without Repeating Characters',
        problemStatement: 'Given a string s, find the length of the longest substring without repeating characters.\n\nA substring is a contiguous non-empty sequence of characters within a string.',
        inputFormat: 'A single line containing the string s.',
        outputFormat: 'Print the length of the longest substring without repeating characters.',
        sampleInput: 'abcabcbb',
        sampleOutput: '3',
        difficulty: 'Medium',
        category: 'Sliding Window',
        constraints: '0 <= s.length <= 5 * 10^4\ns consists of English letters, digits, symbols and spaces.',
        companies: ['Amazon', 'Google', 'Meta', 'Bloomberg', 'Apple'],
        order: 23,
        starterCode: '// Find the longest substring without repeating characters\n',
        testCases: [
            { input: ['abcabcbb'], output: ['3'] },
            { input: ['bbbbb'], output: ['1'] },
            { input: ['pwwkew'], output: ['3'] },
            { input: [''], output: ['0'] }
        ],
        videoId: 'wiGpQwVHdE0'
    },
    {
        id: 'p24',
        title: 'Minimum Window Substring',
        problemStatement: 'Given two strings s and t of lengths m and n respectively, return the minimum window substring of s such that every character in t (including duplicates) is included in the window.\n\nIf there is no such substring, return an empty string "".\n\nThe answer is guaranteed to be unique.',
        inputFormat: 'First line: string s. Second line: string t.',
        outputFormat: 'Print the minimum window substring, or "" if none exists.',
        sampleInput: 'ADOBECODEBANC\nABC',
        sampleOutput: 'BANC',
        difficulty: 'Hard',
        category: 'Sliding Window',
        constraints: 'm == s.length\nn == t.length\n1 <= m, n <= 10^5\ns and t consist of uppercase and lowercase English letters.',
        companies: ['Meta', 'Amazon', 'Google', 'Airbnb', 'Uber'],
        order: 24,
        starterCode: '// Find the minimum window substring containing all characters of t\n',
        testCases: [
            { input: ['ADOBECODEBANC', 'ABC'], output: ['BANC'] },
            { input: ['a', 'a'], output: ['a'] },
            { input: ['a', 'aa'], output: [''] }
        ],
        videoId: 'jSto0O4AJbM'
    },
    {
        id: 'p25',
        title: 'Binary Tree Level Order Traversal',
        problemStatement: 'Given the root of a binary tree in level-order format (with -1 for null), return the level order traversal of its nodes\' values (i.e., from left to right, level by level).\n\nPrint each level on a separate line.',
        inputFormat: 'First line: n (number of elements). Second line: n space-separated integers (-1 for null).',
        outputFormat: 'Print each level\'s values on a separate line, space-separated.',
        sampleInput: '7\n3 9 20 -1 -1 15 7',
        sampleOutput: '3\n9 20\n15 7',
        difficulty: 'Medium',
        category: 'Trees',
        constraints: 'The number of nodes is in [0, 2000].\n-1000 <= Node.val <= 1000',
        companies: ['Amazon', 'Meta', 'Microsoft', 'Bloomberg'],
        order: 25,
        starterCode: '// Perform level-order traversal of a binary tree\n',
        testCases: [
            { input: ['7', '3 9 20 -1 -1 15 7'], output: ['3', '9 20', '15 7'] },
            { input: ['1', '1'], output: ['1'] }
        ],
        videoId: '6ZnyEApgFYg'
    },
    {
        id: 'p26',
        title: 'Topological Sort',
        problemStatement: 'Given a directed acyclic graph (DAG) with V vertices and E edges, find a topological ordering of the vertices.\n\nA topological ordering is a linear ordering of vertices such that for every directed edge u → v, vertex u comes before v in the ordering.\n\nIf multiple valid orderings exist, print any one of them.',
        inputFormat: 'First line: V E (number of vertices and edges). Next E lines each contain: u v (directed edge from u to v). Vertices are 0-indexed.',
        outputFormat: 'Print the topological order as space-separated vertex indices.',
        sampleInput: '6 6\n5 2\n5 0\n4 0\n4 1\n2 3\n3 1',
        sampleOutput: '5 4 2 3 1 0',
        difficulty: 'Medium',
        category: 'Graphs',
        constraints: '2 <= V <= 1000\n1 <= E <= V*(V-1)/2\nThe graph is a DAG.',
        companies: ['Amazon', 'Google', 'Microsoft', 'Intuit'],
        order: 26,
        starterCode: '// Perform topological sort on a directed acyclic graph\n',
        testCases: [
            { input: ['6 6', '5 2', '5 0', '4 0', '4 1', '2 3', '3 1'], output: ['5 4 2 3 1 0'] },
            { input: ['4 3', '0 1', '0 2', '2 3'], output: ['0 2 3 1'] }
        ],
        videoId: 'dis_c84ejhQ'
    },
    {
        id: 'p27',
        title: 'N-Queens',
        problemStatement: 'The N-Queens puzzle is the problem of placing n queens on an n x n chessboard such that no two queens attack each other.\n\nGiven an integer n, return the number of distinct solutions to the N-Queens puzzle.\n\nA queen can attack horizontally, vertically, and diagonally.',
        inputFormat: 'A single integer n.',
        outputFormat: 'Print the number of distinct solutions.',
        sampleInput: '4',
        sampleOutput: '2',
        difficulty: 'Hard',
        category: 'Backtracking',
        constraints: '1 <= n <= 9',
        companies: ['Amazon', 'Google', 'Microsoft', 'Apple'],
        order: 27,
        starterCode: '// Count the number of solutions to the N-Queens problem\n',
        testCases: [
            { input: ['1'], output: ['1'] },
            { input: ['4'], output: ['2'] },
            { input: ['8'], output: ['92'] }
        ],
        videoId: 'Ph95IHmRp5M'
    },
    {
        id: 'p28',
        title: 'Kth Largest Element in Array',
        problemStatement: 'Given an integer array nums and an integer k, return the kth largest element in the array.\n\nNote that it is the kth largest element in the sorted order, not the kth distinct element.\n\nCan you solve it without sorting?',
        inputFormat: 'First line: n k. Second line: n space-separated integers.',
        outputFormat: 'Print the kth largest element.',
        sampleInput: '6 2\n3 2 1 5 6 4',
        sampleOutput: '5',
        difficulty: 'Medium',
        category: 'Heap',
        constraints: '1 <= k <= n <= 10^5\n-10^4 <= nums[i] <= 10^4',
        companies: ['Meta', 'Amazon', 'Google', 'Microsoft'],
        order: 28,
        starterCode: '// Find the kth largest element in an unsorted array\n',
        testCases: [
            { input: ['6 2', '3 2 1 5 6 4'], output: ['5'] },
            { input: ['9 4', '3 2 3 1 2 4 5 5 6'], output: ['4'] },
            { input: ['1 1', '42'], output: ['42'] }
        ],
        videoId: 'XEmy13g1Qc8'
    },
    {
        id: 'p29',
        title: 'Word Search in Grid',
        problemStatement: 'Given an m x n grid of characters board and a string word, return true if word exists in the grid.\n\nThe word can be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring. The same letter cell may not be used more than once.',
        inputFormat: 'First line: m n (rows and cols). Next m lines: n space-separated characters. Last line: the word to search.',
        outputFormat: 'Print "true" if word exists, "false" otherwise.',
        sampleInput: '3 4\nA B C E\nS F C S\nA D E E\nABCCED',
        sampleOutput: 'true',
        difficulty: 'Medium',
        category: 'Backtracking',
        constraints: 'm == board.length\nn == board[i].length\n1 <= m, n <= 6\n1 <= word.length <= 15\nboard and word consist of only lowercase and uppercase English letters.',
        companies: ['Amazon', 'Microsoft', 'Bloomberg', 'Snapchat'],
        order: 29,
        starterCode: '// Search for a word in a 2D grid using backtracking\n',
        testCases: [
            { input: ['3 4', 'A B C E', 'S F C S', 'A D E E', 'ABCCED'], output: ['true'] },
            { input: ['3 4', 'A B C E', 'S F C S', 'A D E E', 'SEE'], output: ['true'] },
            { input: ['3 4', 'A B C E', 'S F C S', 'A D E E', 'ABCB'], output: ['false'] }
        ],
        videoId: 'pfiQ_PS1g8E'
    },
    {
        id: 'p30',
        title: 'Longest Palindromic Substring',
        problemStatement: 'Given a string s, return the longest palindromic substring in s.\n\nA palindrome is a string that reads the same forward and backward.',
        inputFormat: 'A single line containing the string s.',
        outputFormat: 'Print the longest palindromic substring. If multiple answers exist, print any one.',
        sampleInput: 'babad',
        sampleOutput: 'bab',
        difficulty: 'Medium',
        category: 'Strings',
        constraints: '1 <= s.length <= 1000\ns consist of only digits and English letters.',
        companies: ['Amazon', 'Microsoft', 'Google', 'Meta'],
        order: 30,
        starterCode: '// Find the longest palindromic substring\n',
        testCases: [
            { input: ['babad'], output: ['bab'] },
            { input: ['cbbd'], output: ['bb'] },
            { input: ['a'], output: ['a'] }
        ],
        videoId: 'XYQecbcd6_c'
    },
    {
        id: 'p31',
        title: 'Implement Trie (Prefix Tree)',
        problemStatement: 'Implement a trie (prefix tree) with the following operations:\n- INSERT word: Inserts the string word into the trie.\n- SEARCH word: Returns "true" if the string word is in the trie, "false" otherwise.\n- STARTSWITH prefix: Returns "true" if there is a previously inserted string that has the prefix, "false" otherwise.',
        inputFormat: 'First line: numOps. Next numOps lines contain operations: "INSERT word", "SEARCH word", or "STARTSWITH prefix".',
        outputFormat: 'For each SEARCH and STARTSWITH, print the result on a new line.',
        sampleInput: '5\nINSERT apple\nSEARCH apple\nSEARCH app\nSTARTSWITH app\nINSERT app',
        sampleOutput: 'true\nfalse\ntrue',
        difficulty: 'Medium',
        category: 'Trie',
        constraints: '1 <= word.length, prefix.length <= 2000\nword and prefix consist only of lowercase English letters.\nAt most 3 * 10^4 operations.',
        companies: ['Amazon', 'Google', 'Microsoft', 'Uber'],
        order: 31,
        starterCode: '// Implement a Trie data structure\n',
        testCases: [
            { input: ['5', 'INSERT apple', 'SEARCH apple', 'SEARCH app', 'STARTSWITH app', 'INSERT app'], output: ['true', 'false', 'true'] },
            { input: ['4', 'INSERT hello', 'INSERT help', 'STARTSWITH hel', 'SEARCH he'], output: ['true', 'false'] }
        ],
        videoId: 'oobqoCJlHA0'
    },
    {
        id: 'p32',
        title: 'Median of Two Sorted Arrays',
        problemStatement: 'Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.\n\nThe overall run time complexity should be O(log(m+n)).',
        inputFormat: 'First line: m n. Second line: m sorted integers (or empty). Third line: n sorted integers (or empty).',
        outputFormat: 'Print the median (as a decimal with one decimal place if not integer).',
        sampleInput: '2 2\n1 3\n2 4',
        sampleOutput: '2.5',
        difficulty: 'Hard',
        category: 'Binary Search',
        constraints: 'nums1.length == m\nnums2.length == n\n0 <= m, n <= 1000\n1 <= m + n <= 2000\n-10^6 <= nums1[i], nums2[i] <= 10^6',
        companies: ['Amazon', 'Google', 'Apple', 'Goldman Sachs', 'Adobe'],
        order: 32,
        starterCode: '// Find the median of two sorted arrays in O(log(m+n))\n',
        testCases: [
            { input: ['2 2', '1 3', '2 4'], output: ['2.5'] },
            { input: ['2 1', '1 2', '3'], output: ['2.0'] },
            { input: ['1 1', '1', '2'], output: ['1.5'] }
        ],
        videoId: 'q6IEA26hvXc'
    },
    {
        id: 'p33',
        title: 'Matrix Spiral Traversal',
        problemStatement: 'Given an m x n matrix, return all elements of the matrix in spiral order.\n\nSpiral order starts from the top-left corner and moves right, then down, then left, then up, and repeats.',
        inputFormat: 'First line: m n (rows and columns). Next m lines each contain n space-separated integers.',
        outputFormat: 'Print all elements in spiral order, space-separated.',
        sampleInput: '3 3\n1 2 3\n4 5 6\n7 8 9',
        sampleOutput: '1 2 3 6 9 8 7 4 5',
        difficulty: 'Medium',
        category: 'Matrix',
        constraints: 'm == matrix.length\nn == matrix[i].length\n1 <= m, n <= 10\n-100 <= matrix[i][j] <= 100',
        companies: ['Amazon', 'Microsoft', 'Apple', 'Google'],
        order: 33,
        starterCode: '// Traverse a matrix in spiral order\n',
        testCases: [
            { input: ['3 3', '1 2 3', '4 5 6', '7 8 9'], output: ['1 2 3 6 9 8 7 4 5'] },
            { input: ['3 4', '1 2 3 4', '5 6 7 8', '9 10 11 12'], output: ['1 2 3 4 8 12 11 10 9 5 6 7'] }
        ],
        videoId: 'BJnMZNwUk1M'
    },
    {
        id: 'p34',
        title: 'House Robber',
        problemStatement: 'You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed. The only constraint stopping you is that adjacent houses have security systems connected — if two adjacent houses are broken into on the same night, the police will be alerted.\n\nGiven an array representing the amount of money at each house, determine the maximum amount of money you can rob tonight without alerting the police.',
        inputFormat: 'First line: n (number of houses). Second line: n space-separated integers representing money in each house.',
        outputFormat: 'Print the maximum amount of money you can rob.',
        sampleInput: '4\n1 2 3 1',
        sampleOutput: '4',
        difficulty: 'Medium',
        category: 'Dynamic Programming',
        constraints: '1 <= n <= 100\n0 <= nums[i] <= 400',
        companies: ['Amazon', 'Google', 'Microsoft', 'Cisco'],
        order: 34,
        starterCode: '// Find the maximum money you can rob without robbing adjacent houses\n',
        testCases: [
            { input: ['4', '1 2 3 1'], output: ['4'] },
            { input: ['5', '2 7 9 3 1'], output: ['12'] },
            { input: ['1', '5'], output: ['5'] }
        ],
        videoId: '73r3KWiEvyk'
    },
    {
        id: 'p35',
        title: 'Subsets',
        problemStatement: 'Given an integer array nums of unique elements, return all possible subsets (the power set).\n\nThe solution set must not contain duplicate subsets. Print each subset on a separate line in sorted order. Print subsets in lexicographic order.',
        inputFormat: 'First line: n. Second line: n space-separated integers.',
        outputFormat: 'Print each subset on a separate line as space-separated integers. Empty subset as empty line.',
        sampleInput: '3\n1 2 3',
        sampleOutput: '\n1\n1 2\n1 2 3\n1 3\n2\n2 3\n3',
        difficulty: 'Medium',
        category: 'Backtracking',
        constraints: '1 <= n <= 10\n-10 <= nums[i] <= 10\nAll elements are unique.',
        companies: ['Meta', 'Amazon', 'Bloomberg'],
        order: 35,
        starterCode: '// Generate all subsets of the given array\n',
        testCases: [
            { input: ['3', '1 2 3'], output: ['', '1', '1 2', '1 2 3', '1 3', '2', '2 3', '3'] },
            { input: ['1', '0'], output: ['', '0'] }
        ],
        videoId: 'REOH22Xwdkk'
    },
    {
        id: 'p36',
        title: 'Graph BFS Shortest Path',
        problemStatement: 'Given an unweighted undirected graph with V vertices and E edges, find the shortest path distance from a source vertex S to all other vertices using BFS.\n\nIf a vertex is unreachable, print -1 for that vertex.',
        inputFormat: 'First line: V E S. Next E lines each contain: u v (undirected edge).',
        outputFormat: 'Print V space-separated shortest distances from source to each vertex (0 to V-1).',
        sampleInput: '6 7 0\n0 1\n0 2\n1 3\n2 3\n3 4\n4 5\n2 5',
        sampleOutput: '0 1 1 2 3 2',
        difficulty: 'Medium',
        category: 'Graphs',
        constraints: '1 <= V <= 10^4\n0 <= E <= V*(V-1)/2\n0 <= S < V',
        companies: ['Amazon', 'Google', 'Microsoft'],
        order: 36,
        starterCode: '// Find shortest paths using BFS in an unweighted graph\n',
        testCases: [
            { input: ['6 7 0', '0 1', '0 2', '1 3', '2 3', '3 4', '4 5', '2 5'], output: ['0 1 1 2 3 2'] },
            { input: ['4 2 0', '0 1', '2 3'], output: ['0 1 -1 -1'] }
        ],
        videoId: 'oDqjPvD54Ss'
    },
    {
        id: 'p37',
        title: 'Min Stack',
        problemStatement: 'Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.\n\nImplement the MinStack with operations:\n- PUSH val: Push val onto the stack.\n- POP: Remove the top element.\n- TOP: Get the top element.\n- GETMIN: Retrieve the minimum element in the stack.',
        inputFormat: 'First line: numOps. Next numOps lines contain operations.',
        outputFormat: 'For TOP and GETMIN operations, print the result on a new line.',
        sampleInput: '7\nPUSH -2\nPUSH 0\nPUSH -3\nGETMIN\nPOP\nTOP\nGETMIN',
        sampleOutput: '-3\n0\n-2',
        difficulty: 'Medium',
        category: 'Stacks',
        constraints: '-2^31 <= val <= 2^31 - 1\nMethods pop, top and getMin will always be called on non-empty stacks.\nAt most 3 * 10^4 calls.',
        companies: ['Amazon', 'Bloomberg', 'Goldman Sachs'],
        order: 37,
        starterCode: '// Implement a stack with O(1) minimum retrieval\n',
        testCases: [
            { input: ['7', 'PUSH -2', 'PUSH 0', 'PUSH -3', 'GETMIN', 'POP', 'TOP', 'GETMIN'], output: ['-3', '0', '-2'] }
        ],
        videoId: 'qkLl7nAwDPo'
    },
    {
        id: 'p38',
        title: '0/1 Knapsack',
        problemStatement: 'Given weights and values of n items, put these items in a knapsack of capacity W to get the maximum total value in the knapsack.\n\nEach item can either be included or excluded (0/1 property) — you cannot break an item or include it more than once.',
        inputFormat: 'First line: n W (number of items and knapsack capacity). Second line: n space-separated weights. Third line: n space-separated values.',
        outputFormat: 'Print the maximum value that can be obtained.',
        sampleInput: '3 50\n10 20 30\n60 100 120',
        sampleOutput: '220',
        difficulty: 'Medium',
        category: 'Dynamic Programming',
        constraints: '1 <= n <= 100\n1 <= W <= 1000\n1 <= weight[i], value[i] <= 1000',
        companies: ['Amazon', 'Google', 'Microsoft', 'Goldman Sachs'],
        order: 38,
        starterCode: '// Solve the 0/1 Knapsack problem using dynamic programming\n',
        testCases: [
            { input: ['3 50', '10 20 30', '60 100 120'], output: ['220'] },
            { input: ['4 7', '1 3 4 5', '1 4 5 7'], output: ['9'] },
            { input: ['1 1', '2', '10'], output: ['0'] }
        ],
        videoId: 'xOlhR_2QCQQ'
    },
    {
        id: 'p39',
        title: 'Serialize and Deserialize Binary Tree',
        problemStatement: 'Design an algorithm to serialize and deserialize a binary tree.\n\nSerialization is converting a tree to a string. Deserialization is reconstructing the tree from the string.\n\nGiven a binary tree as level-order input (-1 for null), serialize it to a string and then deserialize it back. Print the level-order traversal of the deserialized tree to verify correctness.',
        inputFormat: 'First line: n (number of elements in level-order). Second line: n space-separated integers (-1 for null).',
        outputFormat: 'Print the level-order traversal of the tree after serialize → deserialize (excluding trailing nulls).',
        sampleInput: '7\n1 2 3 -1 -1 4 5',
        sampleOutput: '1 2 3 -1 -1 4 5',
        difficulty: 'Hard',
        category: 'Trees',
        constraints: 'The number of nodes is in [0, 10^4].\n-1000 <= Node.val <= 1000',
        companies: ['Amazon', 'Meta', 'Google', 'Microsoft', 'LinkedIn'],
        order: 39,
        starterCode: '// Implement serialize and deserialize for a binary tree\n',
        testCases: [
            { input: ['7', '1 2 3 -1 -1 4 5'], output: ['1 2 3 -1 -1 4 5'] },
            { input: ['1', '1'], output: ['1'] }
        ],
        videoId: 'u4JAi2JJhI8'
    },
    {
        id: 'p40',
        title: 'Longest Increasing Subsequence',
        problemStatement: 'Given an integer array nums, return the length of the longest strictly increasing subsequence.\n\nA subsequence is derived from an array by deleting some or no elements without changing the order of the remaining elements.',
        inputFormat: 'First line: n. Second line: n space-separated integers.',
        outputFormat: 'Print the length of the longest strictly increasing subsequence.',
        sampleInput: '8\n10 9 2 5 3 7 101 18',
        sampleOutput: '4',
        difficulty: 'Medium',
        category: 'Dynamic Programming',
        constraints: '1 <= n <= 2500\n-10^4 <= nums[i] <= 10^4',
        companies: ['Amazon', 'Google', 'Meta', 'Microsoft'],
        order: 40,
        starterCode: '// Find the length of the longest increasing subsequence\n',
        testCases: [
            { input: ['8', '10 9 2 5 3 7 101 18'], output: ['4'] },
            { input: ['4', '0 1 0 3 2 3'], output: ['4'] },
            { input: ['7', '7 7 7 7 7 7 7'], output: ['1'] }
        ],
        videoId: 'CE2b_-XfVDk'
    },
    {
        id: 'p41',
        title: 'Find Median from Data Stream',
        problemStatement: 'Design a data structure that supports adding integers from a data stream and finding the median of all elements added so far.\n\nImplement:\n- ADD num: Add num to the data structure.\n- MEDIAN: Return the median of all elements.\n\nIf the count is even, the median is the average of the two middle values.',
        inputFormat: 'First line: numOps. Next numOps lines contain operations: "ADD num" or "MEDIAN".',
        outputFormat: 'For each MEDIAN operation, print the result (one decimal place if not integer).',
        sampleInput: '7\nADD 1\nADD 2\nMEDIAN\nADD 3\nMEDIAN\nADD 4\nMEDIAN',
        sampleOutput: '1.5\n2.0\n2.5',
        difficulty: 'Hard',
        category: 'Heap',
        constraints: '-10^5 <= num <= 10^5\nThere will be at least one element before MEDIAN is called.\nAt most 5 * 10^4 operations.',
        companies: ['Amazon', 'Google', 'Apple', 'Meta'],
        order: 41,
        starterCode: '// Find median from a data stream using heaps\n',
        testCases: [
            { input: ['7', 'ADD 1', 'ADD 2', 'MEDIAN', 'ADD 3', 'MEDIAN', 'ADD 4', 'MEDIAN'], output: ['1.5', '2.0', '2.5'] },
            { input: ['3', 'ADD 5', 'ADD 3', 'MEDIAN'], output: ['4.0'] }
        ],
        videoId: 'itmhHWaHupI'
    },
    {
        id: 'p42',
        title: 'Group Anagrams',
        problemStatement: 'Given an array of strings, group the anagrams together. You can return the answer in any order.\n\nAn anagram is a word formed by rearranging the letters of another word using all original letters exactly once.\n\nPrint each group on a separate line, words sorted alphabetically within the group, groups sorted by their first word.',
        inputFormat: 'First line: n. Second line: n space-separated strings.',
        outputFormat: 'Print each anagram group on a separate line, sorted.',
        sampleInput: '6\neat tea tan ate nat bat',
        sampleOutput: 'ate eat tea\nbat\nnat tan',
        difficulty: 'Medium',
        category: 'Hash Table',
        constraints: '1 <= n <= 10^4\n0 <= strs[i].length <= 100\nstrs[i] consists of lowercase English letters.',
        companies: ['Amazon', 'Meta', 'Google', 'Bloomberg'],
        order: 42,
        starterCode: '// Group strings that are anagrams of each other\n',
        testCases: [
            { input: ['6', 'eat tea tan ate nat bat'], output: ['ate eat tea', 'bat', 'nat tan'] },
            { input: ['1', ''], output: [''] },
            { input: ['1', 'a'], output: ['a'] }
        ],
        videoId: 'vzdNOK2oB2E'
    },
    {
        id: 'p43',
        title: 'Container With Most Water',
        problemStatement: 'You are given an integer array height of length n. There are n vertical lines drawn such that the two endpoints of the ith line are (i, 0) and (i, height[i]).\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn the maximum amount of water a container can store.',
        inputFormat: 'First line: n. Second line: n space-separated integers.',
        outputFormat: 'Print the maximum area.',
        sampleInput: '9\n1 8 6 2 5 4 8 3 7',
        sampleOutput: '49',
        difficulty: 'Medium',
        category: 'Two Pointers',
        constraints: 'n == height.length\n2 <= n <= 10^5\n0 <= height[i] <= 10^4',
        companies: ['Amazon', 'Google', 'Meta', 'Goldman Sachs'],
        order: 43,
        starterCode: '// Find the container with the most water using two pointers\n',
        testCases: [
            { input: ['9', '1 8 6 2 5 4 8 3 7'], output: ['49'] },
            { input: ['2', '1 1'], output: ['1'] }
        ],
        videoId: 'UuiTKBwPgAo'
    },
    {
        id: 'p44',
        title: 'Edit Distance',
        problemStatement: 'Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2.\n\nYou have the following three operations permitted:\n- Insert a character\n- Delete a character\n- Replace a character',
        inputFormat: 'First line: word1. Second line: word2.',
        outputFormat: 'Print the minimum number of operations.',
        sampleInput: 'horse\nros',
        sampleOutput: '3',
        difficulty: 'Hard',
        category: 'Dynamic Programming',
        constraints: '0 <= word1.length, word2.length <= 500\nword1 and word2 consist of lowercase English letters.',
        companies: ['Amazon', 'Google', 'Microsoft', 'Apple'],
        order: 44,
        starterCode: '// Compute the edit distance between two strings\n',
        testCases: [
            { input: ['horse', 'ros'], output: ['3'] },
            { input: ['intention', 'execution'], output: ['5'] },
            { input: ['', 'abc'], output: ['3'] }
        ],
        videoId: 'XYi2-LPrwm4'
    },
    {
        id: 'p45',
        title: 'Three Sum',
        problemStatement: 'Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.\n\nThe solution set must not contain duplicate triplets. Print each triplet sorted, one per line, triplets in lexicographic order.',
        inputFormat: 'First line: n. Second line: n space-separated integers.',
        outputFormat: 'Print each triplet on a separate line, space-separated.',
        sampleInput: '6\n-1 0 1 2 -1 -4',
        sampleOutput: '-1 -1 2\n-1 0 1',
        difficulty: 'Medium',
        category: 'Two Pointers',
        constraints: '3 <= n <= 3000\n-10^5 <= nums[i] <= 10^5',
        companies: ['Amazon', 'Meta', 'Google', 'Microsoft', 'Apple'],
        order: 45,
        starterCode: '// Find all unique triplets that sum to zero\n',
        testCases: [
            { input: ['6', '-1 0 1 2 -1 -4'], output: ['-1 -1 2', '-1 0 1'] },
            { input: ['3', '0 1 1'], output: [] },
            { input: ['3', '0 0 0'], output: ['0 0 0'] }
        ],
        videoId: 'jzZsG8n2R9A'
    }
];

async function seedProblems() {
    try {
        const MONGODB_URI = process.env.MONGO_URL;
        if (!MONGODB_URI) throw new Error('MONGO_URL environment variable is not set');

        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing problems and insert samples
        await Problem.deleteMany({});
        console.log('🗑️ Cleared existing problems');

        const inserted = await Problem.insertMany(sampleProblems);
        console.log(`✅ Inserted ${inserted.length} sample problems`);

    } catch (err) {
        console.error('❌ Error seeding problems:', err.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 DB connection closed');
    }
}

seedProblems();
