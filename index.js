#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const utils = require("./utils");
const hookList = require("./hookList");

const gitRevParse = utils.gitRevParse;
const isHusky = utils.isHusky;

const { gitCommonDir } = gitRevParse();

function getHooks(gitDir) {
  const gitHooksDir = path.join(gitDir, "hooks");
  return hookList.map(hookName => path.join(gitHooksDir, hookName));
}

function getTargetHookPath(gitDir, name) {
  return path.join(gitDir, "hooks", name);
}

function isHuskyFile(filename) {
  if (fs.existsSync(filename)) {
    const data = fs.readFileSync(filename, "utf-8");
    return isHusky(data);
  }

  return false;
}

function fix(target, append) {
  console.log(`begin to fix: ${target} ${append || ""}`);
  const huskyHookFiles = getHooks(gitCommonDir).filter(hook =>
    isHuskyFile(hook)
  );
  const targetHookFilePath = getTargetHookPath(gitCommonDir, target);
  let originTargetHookScript;
  if (fs.existsSync(targetHookFilePath) && !isHuskyFile(targetHookFilePath)) {
    originTargetHookScript = fs.readFileSync(targetHookFilePath, "utf-8");
  }

  if (huskyHookFiles && huskyHookFiles.length && originTargetHookScript) {
    const huskyScript = fs.readFileSync(huskyHookFiles[0], "utf-8");
    let mergedHookScript = "";
    if (append) {
      mergedHookScript =
`${originTargetHookScript}

# Merged at ${new Date().toLocaleString()}

${huskyScript}
`;
    } else {
      mergedHookScript =
`${huskyScript}

# Merged at ${new Date().toLocaleString()}

${originTargetHookScript}
`;
    }
    // console.log(mergedHookScript)
    fs.writeFileSync(targetHookFilePath, mergedHookScript, "utf-8");
    fs.chmodSync(targetHookFilePath, 0o0755);
    console.log(`husky-merge merge success: ${target} ${append || ""}`);
  }
}

try {
  const program = require("commander");

  program
    .version(require("./package.json").version)
    .option("-t, --target <fileName>", "target hook file name", "commit-msg")
    .option(
      "-a, --append",
      "append husky script to the end of exited hook file(default husky is in the front)"
    )
    .option("-l, --list ", "list all husky hook file name")
    .parse(process.argv);

  if (program.list) {
    console.log("All hookList is");
    console.log("=======");
    hookList.forEach(item => console.log(item));
    console.log("=======");
  } else if (program.target) {
    fix(program.target, program.append);
  }
} catch (err) {
  console.log("husky-merge merge error", err);
}
