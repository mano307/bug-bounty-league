# Code Champion Arena

MASTER PROMPT – Build a Professional College Debugging Competition Platform

Role

You are a Senior Full Stack Software Engineer, UI/UX Designer, Backend Engineer, Database Architect, Cybersecurity Engineer, DevOps Engineer, and AI Engineer.

Design and develop a production-ready, secure, responsive, and modern web application for conducting a College Debugging Competition. The platform should be suitable for 200–1000 participants and include a powerful Admin Dashboard for managing the entire event.

Project Name

DebugX – College Debugging Competition Platform

Objective

Build a secure online debugging competition platform with three elimination rounds:

Round 1 – Multiple Choice Questions (MCQ)

Round 2 – Error Spotting (Code Rectification)

Round 3 – Live Debugging

Only selected students should gain access to the next round after admin approval.

The platform should prevent cheating, monitor suspicious behavior, record timings, calculate scores automatically, and provide detailed analytics for organizers.

Target Users

Participants

College Students

Individual Login

Can only access rounds assigned by the admin

Administrators

Event Coordinators

Faculty

Judges

Authentication

Student Login

Students should login using:

Register Number

Name

Email

Password

or

Google Login (Optional)

Admin Login

Secure Admin Login

Features

Email

Password

Two-factor Authentication (Optional)

Session Management

JWT Authentication

Student Flow

Landing Page

↓

Register/Login

↓

Instructions

↓

Rules Acceptance

↓

Round 1

↓

Wait for Results

↓

If Selected

↓

Round 2 Unlocks

↓

Wait for Results

↓

If Selected

↓

Round 3 Unlocks

↓

Final Results

Round Access Control

Students should NEVER be able to access future rounds.

Initially they should only see

✅ Round 1

Round 2

🔒 Locked

Round 3

🔒 Locked

After Round 1 evaluation

Admin selects students

↓

Round 2 automatically unlocks ONLY for selected participants.

After Round 2

Admin selects finalists

↓

Round 3 unlocks ONLY for those students.

Students who are not selected should see

"You are not selected for the next round. Thank you for participating."

ROUND 1

Multiple Choice Quiz

Features

Randomized Questions

Randomized Options

Timer

Auto Save

One Question per Page

Previous Disabled

Next Enabled

Submit Button

Question Types

Programming

Output Prediction

Debugging Concepts

OOP

DBMS

OS

Networks

Java

Python

JavaScript

C

C++

Data Structures

Algorithms

MCQ Features

Auto Marks

Negative Marks (Optional)

Auto Submit on Timer End

ROUND 2

Error Spotting Challenge

Layout

Split Screen

Left Side

Question

Broken Source Code

Instructions

Error Description

Language Selection

Right Side

Large Code Editor

Students correct the code

Submit Button

Features

Syntax Highlighting

Line Numbers

Auto Save

Monaco Editor (VS Code Style)

Supported Languages

Python

Java

JavaScript

Admin can decide

Number of questions

Time

Marks

Evaluation

Manual

or

Automatic Test Cases

ROUND 3

Live Debugging Challenge

Layout

Left Side

Problem Statement

Sample Input

Sample Output

Expected Output

Constraints

Language Selection

Right Side

Professional Code Editor

Features

VS Code-like Editor

Monaco Editor

Syntax Highlighting

Auto Indent

Bracket Matching

Autocomplete

Minimap

Terminal

Console

Debugger Panel

Output Window

Execution Status

Supported Languages

Python

Java

JavaScript

Execution

Students write the entire program from scratch.

After execution

Show

Console Output

Compilation Errors

Runtime Errors

Debugger Messages

Students can

Compile

Run

Debug

Submit

Admin can configure

Number of Attempts

Time

Memory Limit

Execution Time Limit

Integrated Debugger

Include a built-in debugger for

Python

Java

JavaScript

Debugger Features

Step Into

Step Over

Breakpoints

Variable Viewer

Stack Trace

Execution Timeline

Console Logs

Error Explanation

Runtime Inspection

Anti-Cheating System

The platform must actively monitor suspicious behavior.

If any participant:

Opens another browser tab

Changes browser tab

Switches applications

Minimizes browser

Copies text

Pastes text

Uses right click

Presses Developer Tools shortcuts

Attempts Screen Capture (where detectable)

Attempts Page Refresh

Attempts Back Button

Loses Browser Focus

System should

Show Warning Popup

Example

"Warning 1 of 3

Leaving this page is prohibited.

Further violations may result in automatic submission."

Record

Timestamp

Warning Number

Reason

Browser Event

If warnings exceed the admin-configured limit

Automatically Submit the exam.

Admin should be able to configure

Maximum Warnings

Auto Submission

Penalty Marks

Timer System

Each round has

Countdown Timer

Auto Submit

Remaining Time Display

Start Time

End Time

Completion Time

Submission Time

Total Time Taken

Automatic Time Calculation

When a student submits

Store

Start Time

End Time

Total Duration

Completion Rank

Submission Order

Fastest Solver

Slowest Solver

Score Calculation

Automatically calculate

Correct Answers

Wrong Answers

Skipped Questions

Marks

Negative Marks

Bonus Marks

Final Score

Percentage

Rank

Student Dashboard

Students should see

Current Round

Status

Timer

Instructions

Rules

Profile

Past Results

Locked Rounds

Certificates (Optional)

Leaderboard (Admin Controlled)

Admin Dashboard

Professional Analytics Dashboard

Home

Live Participants

Current Round

Completed Students

Warnings

Scores

Leaderboard

Statistics

Exports

Admin Controls

Admin should be able to

Create Events

Edit Events

Delete Events

Upload Questions

Import CSV

Export CSV

Upload Images

Upload Code Files

Schedule Round

Start Round

Pause Round

Resume Round

End Round

Publish Results

Unlock Next Round

Generate Certificates

Participant Management

Admin should see

Participant Name

Register Number

Department

Year

Email

Current Round

Round Status

Selection Status

Submission Status

Warnings

Marks

Time Taken

Completion Time

IP Address

Browser

Login Time

Logout Time

Detailed Participant Report

Each participant should have a detailed report showing:

Name

Register Number

Department

Round Attempted

Score

Percentage

Correct Answers

Wrong Answers

Skipped Questions

Time Started

Time Submitted

Total Time Taken

Completion Rank

Selection Status

Warnings Received

Warning Reasons

Browser Activity Log

Submission Status

Language Used

Code Submitted (Rounds 2 & 3)

Output Generated

Compilation Errors

Runtime Errors

Judge Remarks (Optional)

Question Management

Admin should be able to

Create

Edit

Delete

Duplicate

Randomize

Categorize

Assign Marks

Assign Difficulty

Upload Images

Upload Code

Upload Test Cases

Supported Languages

Python

Java

JavaScript

Technology Stack

Frontend

Next.js

React

TypeScript

Tailwind CSS

Framer Motion

Monaco Editor

Backend

Node.js

Express.js

Database

PostgreSQL

Authentication

JWT

bcrypt

Storage

Cloudinary / Local Storage

Execution Engine

Docker-based isolated code runner

Secure sandbox execution for Python, Java, and JavaScript

UI Design

Create an elegant, premium, and modern interface.

Theme

Dark Theme

Glassmorphism

Gradient Backgrounds

Smooth Animations

Rounded Components

Professional Dashboard

Responsive Design

Inspired by

VS Code

GitHub

Linear

Vercel

Cursor AI

Visual Features

Animated Cards

Progress Bars

Live Timer

Charts

Statistics

Leaderboards

Professional Tables

Code Editor Theme

Loading Animations

Success Animations

Error Animations

Security

HTTPS

JWT Authentication

Password Hashing

SQL Injection Protection

XSS Protection

CSRF Protection

Rate Limiting

Secure Code Execution Sandbox

Role-Based Access Control

Audit Logs

Performance

Responsive on Desktop, Tablet, and Mobile

Page load under 2 seconds

Lazy Loading

Optimized Images

Code Splitting

High Lighthouse Score

Efficient Database Queries

Deliverables

Generate a complete production-ready application including:

Full Frontend Source Code

Full Backend Source Code

Database Schema

ER Diagram

API Documentation

Complete Folder Structure

Authentication System

Admin Panel

Student Panel

Code Execution Engine

Debugger Integration

Anti-Cheating Module

Analytics Dashboard

Timer System

Question Management System

CSV Import/Export

README.md

Environment Variables (.env.example)

Docker Configuration

Deployment Guide

Test Cases

Sample Question Bank

Production-Ready Documentation

The final solution should be scalable, secure, visually impressive, and suitable for conducting real college-level debugging competitions with hundreds of simultaneous participants.
WebSocket Live Monitoring System

Implement a real-time monitoring system using WebSockets (Socket.IO or native WebSockets) so that the Admin Dashboard updates instantly without requiring page refreshes.

Real-Time Admin Dashboard

The admin should be able to monitor the competition live.

Display the following information in real time:

Total registered participants

Currently online participants

Currently taking the exam

Number of submissions

Students who have completed

Students who have not started

Students currently in each round

Round-wise participant count

Live leaderboard

Current server status

Updates should occur instantly whenever a participant performs an action.

Live Participant Status

Each participant should have a live status badge.

Possible statuses:

🟢 Online

🔵 In Exam

🟡 Idle

🟠 Switched Tab

🔴 Disconnected

✅ Submitted

🔒 Eliminated

🏁 Completed Competition

The status should change automatically in real time.

Live Activity Feed

Provide a scrolling activity log for the admin.

Example events:

Manoj Kumar logged in.

Student 24 started Round 1.

Student 18 switched browser tab.

Student 42 received Warning #2.

Student 31 submitted Round 2.

Student 15 was promoted to Round 3.

Student 10 disconnected.

Student 7 reconnected.

Competition ended.

Every event should include:

Timestamp

Student Name

Register Number

Event Type

Current Round

Live Anti-Cheating Monitoring

Whenever a participant performs a suspicious action, send an instant WebSocket event to the admin.

Monitor events such as:

Browser tab changed

Window lost focus

Browser minimized

Browser refreshed

Back button pressed

Right-click attempted

Copy attempted

Paste attempted

Developer Tools opened (where detectable)

Full-screen exited

Multiple logins detected

Network disconnected

Network reconnected

The admin should receive a real-time notification without refreshing the page.

Live Warnings Panel

Display a dedicated warnings table showing:

Student Name

Register Number

Round

Warning Count

Warning Type

Time

Current Status

Warnings should appear immediately after they occur.

Live Submission Monitoring

As soon as a participant submits, update the dashboard instantly.

Display:

Submission Time

Time Taken

Marks (if auto-evaluated)

Current Rank

Selected / Not Selected

Language Used

Total Warnings

Sort participants by submission time.

Live Leaderboard

The leaderboard should update automatically.

Show:

Rank

Name

Register Number

Department

Round

Marks

Time Taken

Submission Time

Ranking priority:

Higher Marks

Fewer Warnings

Faster Completion Time

The leaderboard should animate when rankings change.

Live Round Management

Admin actions should synchronize instantly with all connected participants.

Supported actions:

Start Round

Pause Round

Resume Round

End Round

Unlock Next Round

Lock Round

Publish Results

Broadcast Announcement

Participants should see changes immediately without refreshing the page.

Live Broadcast Notifications

Allow the admin to send announcements to all participants instantly.

Examples:

Round 2 starts in 5 minutes.

One minute remaining.

Please do not switch tabs.

Time has been extended by 5 minutes.

Competition has ended.

Results have been published.

Display announcements as toast notifications and a notification panel.

Live Countdown Synchronization

The countdown timer must remain synchronized for every participant.

Requirements:

Server-controlled timer

Auto-sync after reconnecting

No client-side timer manipulation

Accurate countdown across all devices

Connection Recovery

If a participant loses internet connectivity:

Pause communication while preserving progress.

Automatically reconnect using WebSockets.

Restore the current question and timer state.

Notify the admin of disconnect and reconnect events.

Record downtime in the participant's activity log.

WebSocket Events

Implement real-time events for:

User Connected

User Disconnected

User Reconnected

Participant Started Round

Question Changed

Answer Saved

Submission Completed

Warning Issued

Tab Changed

Full Screen Exited

Round Started

Round Paused

Round Resumed

Round Ended

Next Round Unlocked

Results Published

Broadcast Announcement

Leaderboard Updated

Participant Eliminated

Participant Promoted

Real-Time Analytics Dashboard

Provide live charts that update automatically.

Charts include:

Participants Online

Active Participants by Round

Submission Rate

Average Completion Time

Warning Distribution

Marks Distribution

Language Usage (Python, Java, JavaScript)

Completion Timeline

Hourly Activity

Round-wise Selection Statistics

All charts should animate smoothly when new data arrives.

Performance Requirements

Support at least 1,000 concurrent participants.

WebSocket latency under 100 milliseconds on a local network.

Automatic reconnection with exponential backoff.

Heartbeat mechanism to detect inactive clients.

Efficient event broadcasting to minimize server load.

Real-time updates without page refreshes.

The WebSocket implementation should be secure, scalable, fault-tolerant, and optimized for large college competitions.
Real-Time Leaderboard System

Implement a professional, real-time leaderboard that updates instantly using WebSockets without requiring participants or administrators to refresh the page.

Leaderboard Types

Provide multiple leaderboard views:

Overall Leaderboard

Shows rankings across the entire competition.

Round 1 Leaderboard

Displays rankings for MCQ participants only.

Round 2 Leaderboard

Displays rankings for Error Spotting participants.

Round 3 Leaderboard

Displays rankings for Live Debugging participants.

Department-wise Leaderboard

Ranks participants by department.

Year-wise Leaderboard

Ranks participants by academic year.

College-wise Leaderboard (Optional)

Supports inter-college competitions.

Leaderboard Information

Each leaderboard entry should display:

Rank

Participant Name

Register Number

Department

College

Current Round

Programming Language Used

Score

Percentage

Number of Correct Answers

Number of Wrong Answers

Number of Skipped Questions

Time Taken

Submission Time

Warning Count

Current Status (Active, Qualified, Eliminated, Completed)

Display participant avatars or initials for better visual appeal.

Ranking Rules

Participants should be ranked based on:

Highest Total Score

Highest Round Score

Fewest Warnings

Fastest Completion Time

Earliest Submission Time

If all criteria are equal, assign the same rank.

Live Updates

The leaderboard should automatically update whenever:

A participant submits an answer.

A participant completes a round.

Marks are updated.

Admin manually adjusts marks.

A participant qualifies for the next round.

A participant is eliminated.

A warning affects ranking.

A tie is resolved.

All connected users should see updates immediately without refreshing the page.

Leaderboard Animations

Provide smooth UI animations when rankings change.

Features:

Animated rank changes

Highlight newly qualified participants

Highlight top scorers

Animated score counters

Progress bars

Smooth row transitions

Confetti animation for Rank #1 (optional)

Medal animations for the Top 3

Top Performers Section

Display a dedicated podium showing:

🥇 1st Place (Gold)

🥈 2nd Place (Silver)

🥉 3rd Place (Bronze)

Include:

Participant Photo or Avatar

Name

Department

Score

Time Taken

Total Warnings

Qualification Status

Clearly indicate participant status:

🟢 Qualified for Next Round

🟡 Waiting for Results

🔴 Eliminated

🏁 Competition Completed

👑 Winner

Leaderboard Filters

Allow filtering by:

Round

Department

Year

College

Programming Language

Qualification Status

Score Range

Warning Count

Search & Sorting

Enable searching by:

Participant Name

Register Number

Department

Sorting options:

Highest Score

Lowest Score

Fastest Completion Time

Slowest Completion Time

Least Warnings

Most Warnings

Alphabetical Order

Submission Time

Live Statistics Panel

Display real-time statistics above the leaderboard:

Total Participants

Active Participants

Participants Completed

Participants Remaining

Highest Score

Average Score

Average Completion Time

Fastest Completion Time

Slowest Completion Time

Total Warnings Issued

Number Qualified for Next Round

All values should update automatically using WebSockets.

Participant Profile Popup

Clicking a participant should open a detailed profile containing:

Personal Details

Current Round

Round-wise Marks

Time Taken

Submission History

Warning History

Browser Activity Log

Programming Language

Submitted Code (Rounds 2 & 3)

Output Generated

Compilation Errors

Runtime Errors

Qualification Status

Admin Leaderboard Controls

Admins should be able to:

Publish or Hide Leaderboard

Freeze Leaderboard During Evaluation

Refresh Rankings

Lock Rankings

Export Leaderboard (PDF, Excel, CSV)

Print Leaderboard

Pin Top Performers

Highlight Winners

Announce Results

Public Display Mode

Provide a full-screen "Presentation Mode" suitable for projection during the event.

Features:

Auto-refresh using WebSockets

Large readable fonts

Dark theme

Animated transitions

Podium display

Top 10 participants

Event branding and logo

Current round indicator

Live timer (if applicable)

Winner Announcement

When the competition ends:

Automatically display the Top 3 podium.

Animate the final rankings.

Highlight winners with gold, silver, and bronze themes.

Display total score, completion time, and warning count.

Allow downloading winner certificates and final result reports.

Performance Requirements

Support at least 1,000 concurrent users.

Leaderboard updates should occur in under 100 milliseconds.

Use efficient WebSocket broadcasting with minimal bandwidth.

Optimize database queries to prevent unnecessary refreshes.

Ensure smooth scrolling and animations even with large participant lists.

The leaderboard should deliver a professional contest experience comparable to HackerRank, CodeChef, LeetCode, HackerEarth, and ICPC programming competitions.
AI-Powered Code Evaluation & Intelligent Judging System

Implement an advanced AI-powered code evaluation system for Rounds 2 (Error Spotting) and 3 (Live Debugging). The AI should act as an intelligent coding judge that evaluates submissions based on correctness, efficiency, code quality, and debugging ability while allowing administrators to override any automated decision.

Supported Programming Languages

The evaluation engine must support:

Python

Java

JavaScript

The architecture should be modular so additional languages can be added in the future.

AI Evaluation Workflow

When a participant submits code:

Compile the program (where applicable).

Execute the code inside a secure Docker-based sandbox.

Run hidden and visible test cases.

Compare outputs with expected results.

Analyze runtime and memory usage.

Evaluate code quality and best practices.

Detect common programming mistakes.

Generate an overall AI evaluation score.

Store the complete evaluation report.

Notify the admin in real time through WebSockets.

Automatic Test Case Evaluation

Support:

Public Sample Test Cases

Hidden Test Cases

Edge Cases

Boundary Value Tests

Invalid Input Tests

Performance Tests

Stress Tests

Custom Admin Test Cases

For every test case display:

Input

Expected Output

Actual Output

Pass/Fail Status

Execution Time

Memory Usage

AI Code Quality Analysis

The AI should evaluate:

Logical correctness

Algorithm correctness

Readability

Naming conventions

Code formatting

Function decomposition

Modular programming

Error handling

Exception handling

Input validation

Output formatting

Code reusability

Maintainability

Best practices

Each criterion should receive an individual score.

Performance Analysis

Measure:

Execution Time

Memory Consumption

CPU Usage

Algorithm Complexity (Estimated Time Complexity)

Space Complexity

Scalability

Display performance comparisons with the fastest accepted solution.

Intelligent Debugging Analysis

If the submission contains errors, identify:

Syntax Errors

Runtime Errors

Logical Errors

Infinite Loops

Null Reference Errors

Index Errors

Type Errors

Division by Zero

Input Handling Issues

Output Formatting Mistakes

Provide a detailed explanation for admins.

AI Feedback Report

Generate a detailed report including:

Overall Score

Display:

Total Score

Percentage

Grade

Rank

Correctness

Evaluate:

Test Cases Passed

Test Cases Failed

Accuracy

Code Quality

Rate:

Excellent

Good

Average

Needs Improvement

Performance

Display:

Execution Time

Memory Usage

Estimated Complexity

Bug Analysis

List:

Detected Bugs

Severity

Suggested Improvements

Best Practices

Check:

Variable Naming

Function Naming

Comments

Formatting

Modularity

AI Scoring Rubric

The final score should be calculated using configurable weights.

Example:

Correctness: 50%

Test Case Pass Rate: 20%

Code Quality: 10%

Performance: 10%

Debugging Accuracy: 5%

Best Practices: 5%

Admins should be able to customize these weights.

Automatic Partial Scoring

Award partial marks for:

Correct Logic with Minor Syntax Errors

Partially Passing Test Cases

Correct Algorithm but Formatting Issues

Efficient Solution with Minor Mistakes

Nearly Correct Output

AI Recommendation Engine

Provide recommendations such as:

Simplify loops

Reduce duplicate code

Improve variable names

Optimize algorithm

Handle exceptions

Validate inputs

Improve readability

Reduce memory usage

Round 2 Evaluation

For Error Spotting:

Evaluate:

Number of errors corrected

Remaining errors

Correctness after fixing

Code quality after correction

Time taken to debug

Provide an "Error Fix Accuracy" percentage.

Round 3 Evaluation

For Live Debugging:

Evaluate:

Program correctness

Output correctness

Algorithm selection

Coding efficiency

Debugging effectiveness

Time taken

Performance

Generate a complete programming score.

Admin Evaluation Dashboard

Admins should be able to view:

AI Evaluation Score

Manual Score

Final Score

Test Case Results

Execution Logs

Runtime Errors

Compilation Errors

Performance Charts

Similarity Score

Warning History

Allow admins to:

Override AI scores

Add judge remarks

Re-run submissions

Re-evaluate with updated test cases

Approve or reject AI evaluation

All changes should be recorded in an audit log.

Real-Time AI Evaluation

Immediately after submission:

Queue the code for evaluation.

Execute test cases.

Generate AI analysis.

Update the participant's score.

Refresh the leaderboard.

Notify admins via WebSockets.

The entire workflow should occur automatically without manual intervention.

AI Insights Dashboard

Provide analytics such as:

Most Common Errors

Average Code Quality Score

Average Execution Time

Average Memory Usage

Pass Rate by Programming Language

Hardest Questions

Most Failed Test Cases

Most Common Runtime Errors

Language Popularity

Performance Distribution

Display these as interactive charts.

Security

Execute all code inside isolated Docker containers.

Prevent network access from submitted programs.

Restrict file system access.

Limit execution time and memory usage.

Terminate infinite loops automatically.

Log every execution securely.

Performance Requirements

Evaluate submissions within 5–10 seconds.

Support at least 1,000 concurrent participants.

Use asynchronous job queues for scalability.

Cache repeated evaluations where appropriate.

Ensure deterministic and reproducible results.

AI Models

Design the system so the evaluation engine can integrate with modern LLMs through APIs or self-hosted models, including:

OpenAI GPT

Google Gemini

Anthropic Claude

Meta Llama

DeepSeek

Qwen

Mistral

The AI should assist in evaluating code quality, readability, and debugging effectiveness. Correctness and scoring must primarily rely on deterministic compilation and automated test-case execution, ensuring fairness and consistency across all participants.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/66341766-8117-4f80-90a4-ec5220de17e0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
