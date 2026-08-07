import { streamText, Output } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { aiReportSchema, rubricPercentage, type AIReport } from "./exam-shared";

type Question = {
  round: number;
  title: string;
  prompt: string;
  code: string | null;
  expected_output: string | null;
  constraints: string | null;
  sample_input: string | null;
  sample_output: string | null;
  test_cases: unknown;
};

const MODEL = "google/gemini-3.5-flash";

/**
 * Deterministic-first AI judging: the model is asked to trace the submission
 * against each declared test case before scoring the softer criteria.
 */
export async function evaluateSubmission(
  question: Question,
  code: string,
  language: string,
): Promise<AIReport> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI judging is not configured");

  const gateway = createLovableAiGatewayProvider(apiKey);

  const roundBrief =
    question.round === 2
      ? "This is an ERROR SPOTTING round. The participant was given broken code and had to repair it. Judge how many defects were actually fixed, whether any remain, and whether the repaired program is correct."
      : "This is a LIVE DEBUGGING round. The participant wrote the program from scratch. Judge program correctness, algorithm choice, efficiency and robustness.";

  const prompt = `${roundBrief}

PROBLEM TITLE: ${question.title}
PROBLEM STATEMENT: ${question.prompt}
${question.code ? `\nORIGINAL BROKEN CODE:\n${question.code}` : ""}
${question.sample_input ? `\nSAMPLE INPUT:\n${question.sample_input}` : ""}
${question.sample_output ? `\nSAMPLE OUTPUT:\n${question.sample_output}` : ""}
${question.expected_output ? `\nEXPECTED BEHAVIOUR:\n${question.expected_output}` : ""}
${question.constraints ? `\nCONSTRAINTS:\n${question.constraints}` : ""}
TEST CASES (JSON): ${JSON.stringify(question.test_cases ?? [])}

LANGUAGE: ${language}
PARTICIPANT SUBMISSION:
\`\`\`${language}
${code.slice(0, 20000)}
\`\`\`

Mentally execute the submission against every test case above and report pass/fail honestly — do not assume it passes. Score each criterion from 0 to 100. Award partial credit for correct logic with minor syntax or formatting mistakes. Be strict about correctness and fair about style.`;

  const result = streamText({
    model: gateway(MODEL),
    system:
      "You are a rigorous programming-contest judge. You evaluate correctness deterministically by tracing code against test cases, then rate quality, performance and debugging effectiveness. You never invent passing test results.",
    prompt,
    output: Output.object({ schema: aiReportSchema }),
  });

  const report = await result.output;
  return { ...report, final_percentage: rubricPercentage(report) };
}
