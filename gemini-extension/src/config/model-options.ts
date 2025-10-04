const ENGLISH_TEXT: LanguageModelExpected = {
  type: 'text',
  languages: ['en'],
};

export const CORE_MODEL_OPTIONS: LanguageModelCreateCoreOptions = {
  expectedInputs: [ENGLISH_TEXT],
  expectedOutputs: [ENGLISH_TEXT],
};
