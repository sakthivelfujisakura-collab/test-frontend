export type SectionResult = {
  id: number;
  name: string;
  correct: number;
  total: number;
};

export type TestResult = {
  session_id: number;
  score: number;
  total: number;
  percentage: number;
  pass: boolean;
  set: {
    id: number;
    name: string;
    sections: SectionResult[];
  };
};
