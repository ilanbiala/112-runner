var fs = require('fs'),
  yargs = require('yargs');

args = yargs
  .usage('Usage: <file>')
  .argv._;

stream = fs.createReadStream(args[0]);
file = '';

// Helpers
function findFunctionStartPoints(lines) {
  var functionRegex = /def\s\S+\(/i;
  var functionIndices = [];
  lines.forEach(function(line, i) {
    if (functionRegex.test(line) == true) {
      functionIndices.push(i);
    }
  });
  return functionIndices;
}

function getFunctionNames(lines) {
  fnNames = [];
  var functionRegex = /def\s\S+\(/i;
  var defLength = 'def '.length;
  lines.forEach(function(line) {
    if (functionRegex.test(line) == true && line.indexOf('def test') === -1) {
      fnNames.push(line.substring(line.indexOf('def ') + defLength, line.indexOf('(')));
    }
  });
  return fnNames;
}

function getTestFunctionNames(lines) {
  testFnNames = [];
  var functionRegex = /def\s\S+\(/i;
  var defLength = 'def '.length;
  lines.forEach(function(line) {
    if (functionRegex.test(line) == true && line.indexOf('def test') !== -1) {
      testFnNames.push(line.substring(line.indexOf('def ') + defLength, line.indexOf('(')));
    }
  });
  return testFnNames;
}

// Validation functions
function findLinesLongerThan80(lines) {
  var maxLength = 80;
  var badLines = {};
  lines.forEach(function(line, i) {
    if (line.length > maxLength) {
      badLines[i + 1] = line;
    }
  });
  return badLines;
}

function findFunctionsLongerThan20(lines) {
  var startPoints = findFunctionStartPoints(lines);
  var maxLength = 20;
  var badFunctions = {};
  startPoints.forEach(function(index, i) {
    var functionLength = 0;
    var numberOfComments = 0
    var currentLine = lines[index + 1];
    while (!(currentLine.trim().length == 0
          && lines[index + 1] != startPoints[i + 1])) {
      if (currentLine.trim().startsWith('#')) {
        numberOfComments++;
        currentLine = lines[index + numberOfComments + functionLength];
      } else {
        functionLength++;
        currentLine = lines[index + numberOfComments + functionLength];
      }

    }
    // Necessary because the while loop doesn't catch the blank line
    functionLength--;
    if (functionLength > maxLength) {
      badFunctions[lines[index]] = functionLength;
    }
  });
  return badFunctions;
}

function findMagicNumbers(lines) {
  return lines.filter(function(line, i) {
    return line.test(/(?![\-2-210])\d/) ? line : false;
  });
}

function findMissingTestFunctions(lines) {
  fnNames = getFunctionNames(lines);
  testFnNames = getTestFunctionNames(lines);
  missingTestFunctions = [];
  fnNames.forEach(function(fnName) {
    fnName = fnName.substring(0, 1).toUpperCase() + fnName.substring(1)
    testFnName = 'test' + fnName;
    if (testFnNames.indexOf(testFnName) === -1) {
      missingTestFunctions.push(fnName);
    }
  });
  return missingTestFunctions;
}

function checkForOwnership(lines) {
  /* Expect something like this on the first 4 lines
  # hw6.py
  # Ilan Biala
  # ibiala
  # Section 1F
  */
  ownershipLineCount = 4;
  console.log(lines[0]);
  var hwTitleCheck = (/hw\d\.py/).test(lines[0]);
  var nameCheck = (/^.+$/).test(lines[1]);
  var andrewIdCheck = (/^.+$/).test(lines[2]);
  var sectionCheck = (/\d[A-Z]+/).test(lines[3]);
  if (hwTitleCheck === -1 ||
      nameCheck === -1 ||
      andrewIdCheck === -1 ||
      sectionCheck === -1) {
    return false;
  }
}

stream.on('data', function(buffer) {
  file += buffer.toString();
});

stream.on('end', function() {
  lines = file.split('\r\n');
  badLines = findLinesLongerThan80(lines);
  Object.keys(badLines).forEach(function(key) {
    console.log(`Line %s: %s`, key, badLines[key]);
  });
  console.log('\n');
  badFunctions = findFunctionsLongerThan20(lines);
  Object.keys(badFunctions).forEach(function(key) {
    console.log(`%s length = %d`, key, badFunctions[key])
  });
  console.log('\nMissing test functions:');
  console.log(findMissingTestFunctions(lines));
  if (checkForOwnership(lines) === false) {
    console.log('\nMissing ownership comments');
  }
});
