import { ElectionAssistant } from "@/services/decision-engine";
import { UserContext } from "@/types";

const mockContext: UserContext = {
  location: { country: "United States", state: "California" },
  electionType: "national",
  userRole: "voter",
  registrationStatus: "unknown",
  conversationHistory: [],
  detectedIntent: "",
  upcomingElections: ["General Election 2024"],
  daysUntilDeadline: 20,
  disclosureLevel: "brief",
};

describe("ElectionAssistant", () => {
  let assistant: ElectionAssistant;

  beforeEach(() => {
    assistant = new ElectionAssistant(mockContext);
  });

  it("classifies greeting intent", () => {
    expect(assistant.classifyIntent("hello")).toBe("greeting");
    expect(assistant.classifyIntent("Hi there")).toBe("greeting");
  });

  it("classifies registration_check intent", () => {
    expect(assistant.classifyIntent("Am I registered to vote?")).toBe("registration_check");
    expect(assistant.classifyIntent("check my registration status")).toBe("registration_check");
  });

  it("classifies polling_place intent", () => {
    expect(assistant.classifyIntent("Where do I vote?")).toBe("polling_place");
    expect(assistant.classifyIntent("Find my polling place")).toBe("polling_place");
  });

  it("classifies absentee_mail intent", () => {
    expect(assistant.classifyIntent("How do I vote by mail?")).toBe("absentee_mail");
    expect(assistant.classifyIntent("absentee ballot request")).toBe("absentee_mail");
  });

  it("classifies voter_id intent", () => {
    expect(assistant.classifyIntent("What ID do I need to vote?")).toBe("voter_id");
  });

  it("classifies deadlines intent", () => {
    expect(assistant.classifyIntent("What are the registration deadlines?")).toBe("deadlines");
  });

  it("returns unknown for unmatched queries", () => {
    expect(assistant.classifyIntent("xzyzxzyx blorp florp")).toBe("unknown");
  });

  it("returns a response message for greeting", () => {
    const msg = assistant.chat("hello");
    expect(msg.role).toBe("assistant");
    expect(msg.content).toBeTruthy();
    expect(msg.intent).toBe("greeting");
  });

  it("includes suggested actions in responses", () => {
    const msg = assistant.chat("Where do I vote?");
    expect(msg.suggestedActions).toBeDefined();
    expect(msg.suggestedActions!.length).toBeGreaterThan(0);
  });

  it("returns brief response at brief level", () => {
    const msg = assistant.chat("Am I registered?");
    expect(msg.disclosureLevel).toBe("brief");
    expect(msg.content.length).toBeLessThan(1000);
  });

  it("returns longer response at complete level", () => {
    const ctx: UserContext = { ...mockContext, disclosureLevel: "complete" };
    const a2 = new ElectionAssistant(ctx);
    const msg = a2.chat("How do I register to vote?");
    expect(msg.disclosureLevel).toBe("complete");
    expect(msg.content.length).toBeGreaterThan(500);
  });

  it("adds urgency banner when deadline is within 7 days", () => {
    const urgentCtx: UserContext = { ...mockContext, daysUntilDeadline: 3 };
    const a3 = new ElectionAssistant(urgentCtx);
    const msg = a3.chat("hello");
    expect(msg.content).toContain("3 day");
  });

  it("updates context correctly", () => {
    assistant.updateContext({ registrationStatus: "registered" });
    const msg = assistant.chat("Am I registered?");
    expect(msg.content).toContain("registered");
  });
});
