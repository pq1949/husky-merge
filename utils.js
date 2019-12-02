// husky/lib/installer/gitRevParse @3.1.0
const slash = require("slash");
const execa = require("execa");

function gitRevParse() {
  // https://github.com/typicode/husky/issues/580
  // https://github.com/typicode/husky/issues/587
  const result = execa.sync("git", [
    "rev-parse",
    "--show-toplevel",
    "--git-common-dir"
  ]);

  const [topLevel, gitCommonDir] = result.stdout
    .trim()
    .split("\n")
    // Normalize for Windows
    .map(slash);

  // Git rev-parse returns unknown options as is.
  // If we get --absolute-git-dir in the output,
  // it probably means that an older version of Git has been used.
  if (gitCommonDir === "--git-common-dir") {
    throw new Error("Husky requires Git >= 2.13.0, please upgrade Git");
  }

  return { topLevel, gitCommonDir };
}

// husky/lib/installer/is @3.1.0
function isHusky(data) {
  const huskyIdentifier = '# husky'
  // Husky v0.14 and prior used #husky as an identifier.
  // Just in case some previous hooks weren't correctly uninstalled,
  // and for a better transition this will allow v0.15+ to uninstall them as well.
  const previousHuskyIdentifier = "#husky";
  return (
    data.indexOf(huskyIdentifier) !== -1 ||
    data.indexOf(previousHuskyIdentifier) !== -1
  );
}

module.exports = {
  gitRevParse,
  isHusky
};
