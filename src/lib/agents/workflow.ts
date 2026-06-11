import { openai, modelName } from "@/lib/ai";
import { webSearch } from "@/lib/tools/webSearch";
import { buildDocumentContext } from "@/lib/documents";

export type AgentTraceStep = {
  agent: "Research Agent" | "Draft Agent" | "Critic Agent";
  status: "done";
  summary: string;
  content: string;
};

export type AgentWorkflowInput = {
  message: string;
  memory: string;
  documentContext: string;
  shouldResearch: boolean;
  multiAgentMode?: boolean;
};

export type AgentWorkflowResult = {
  answer: string;
  researchUsed: boolean;
  trace: AgentTraceStep[];
};

async function complete(prompt: string, system: string) {
  const completion = await openai.chat.completions.create({
    model: modelName,
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
  });
  return completion.choices[0]?.message?.content || "";
}

function buildResearchContext(message: string, shouldResearch: boolean) {
  return shouldResearch
    ? webSearch(message.replace(/^(research|search|find|look up)\s*:?\s*/i, ""), 4)
    : Promise.resolve([]);
}

export async function runAgentWorkflow(input: AgentWorkflowInput): Promise<AgentWorkflowResult> {
  const multiAgentMode = input.multiAgentMode === true;
  const researchResults = await buildResearchContext(input.message, input.shouldResearch);
  const researchContext = researchResults.length
    ? researchResults.map((r, i) => `${i + 1}. ${r.title}\n${r.url}\n${r.snippet}`).join("\n\n")
    : "";

  const isOpenAIReady = Boolean(process.env.OPENAI_API_KEY);
  const userPromptBase = `Conversation memory:\n${input.memory}\n\nCurrent user message: ${input.message}\n\n${input.documentContext ? `Uploaded documents:\n${input.documentContext}\n\n` : ""}${researchContext ? `Research context:\n${researchContext}` : ""}`;

  let draft = "";
  if (isOpenAIReady) {
    if (multiAgentMode) {
      draft = await complete(
        `${userPromptBase}\n\nWrite a concise, business-friendly response. If research context exists, cite it informally with source numbers.`,
        "You are the Draft Agent. Turn the research and context into a crisp business answer."
      );
    } else {
      draft = await complete(
        `${userPromptBase}\n\nWrite a concise, business-friendly response. Remember the conversation memory and answer follow-up questions accurately. If the user asked about their name or a prior fact in this thread, use the memory. If research context exists, cite it informally with source numbers.`,
        "You are a single business assistant. Use the conversation memory and context to answer directly and accurately."
      );
    }
  } else {
    draft = researchResults.length
      ? `Based on the research, the main points are:\n\n${researchResults
          .map((r, i) => `${i + 1}. ${r.title}\n${r.snippet}`)
          .join("\n\n")}`
      : input.documentContext
        ? `I reviewed the uploaded documents and can use them for follow-up questions.`
        : `I noted your message and can remember it in this chat session.`;
  }

  let critique = "";
  if (isOpenAIReady && multiAgentMode) {
    critique = await complete(
      `Draft:\n${draft}\n\nContext:\n${userPromptBase}\n\nReview the draft for clarity, unsupported claims, missing action items, or business usefulness. Give a short critique and any final improvements.`,
      "You are the Critic Agent. Check the draft for gaps, unsupported claims, and missing business value."
    );
  } else if (isOpenAIReady) {
    critique = "Single-agent mode: answer generated directly from memory and context.";
  } else {
    critique = "No major issues detected in fallback mode.";
  }

  const trace: AgentTraceStep[] = multiAgentMode
    ? [
        {
          agent: "Research Agent",
          status: "done",
          summary: researchResults.length ? `Found ${researchResults.length} source(s)` : "Skipped web research",
          content: researchResults.length
            ? researchResults.map((r) => `${r.title} - ${r.snippet}`).join("\n")
            : "No web research was needed.",
        },
        {
          agent: "Draft Agent",
          status: "done",
          summary: "Prepared a business-ready draft",
          content: draft,
        },
        {
          agent: "Critic Agent",
          status: "done",
          summary: "Reviewed for clarity and gaps",
          content: critique,
        },
      ]
    : [];

  const finalAnswer = isOpenAIReady && multiAgentMode
    ? await complete(
        `Context:\n${userPromptBase}\n\nDraft:\n${draft}\n\nCritique:\n${critique}\n\nWrite the final response to the user. Be concise, practical, and business-friendly. If applicable, mention the strongest sources from the research step.`,
        "You are the Orchestrator. Produce the final answer from the research, draft, and critique."
      )
    : draft;

  return {
    answer: finalAnswer,
    researchUsed: researchResults.length > 0,
    trace,
  };
}

export { buildResearchContext };
