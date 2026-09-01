export class AiProviderUnavailableError extends Error {
  constructor(message = "AI provider is not configured or unavailable") {
    super(message);
    this.name = "AiProviderUnavailableError";
  }
}

export class MalformedAiOutputError extends Error {
  constructor(message = "AI provider returned malformed structured output") {
    super(message);
    this.name = "MalformedAiOutputError";
  }
}
