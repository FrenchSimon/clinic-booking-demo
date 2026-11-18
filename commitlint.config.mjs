// Conventional Commits, plus a roadmap task reference for code changes:
//   feat(booking): add slot picker [R2.3]
const NEEDS_TASK = ["feat", "fix", "refactor", "test", "perf"];
const TASK = /\[R\d+\.\d+\]$/;

export default {
  extends: ["@commitlint/config-conventional"],
  plugins: [
    {
      rules: {
        "roadmap-task": ({ type, header }) => {
          if (!NEEDS_TASK.includes(type ?? "")) return [true];
          return [
            TASK.test(header ?? ""),
            `"${type}" commits end with their ROADMAP.md task, e.g. "feat(scope): message [R2.1]"`,
          ];
        },
        "no-wip": ({ header }) => [
          !/\bwip\b/i.test(header ?? ""),
          "no WIP commits: finish the step or split it",
        ],
      },
    },
  ],
  rules: {
    "roadmap-task": [2, "always"],
    "no-wip": [2, "always"],
    "header-max-length": [2, "always", 100],
  },
};
