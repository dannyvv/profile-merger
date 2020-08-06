import * as path from 'path';
import * as chalk from 'chalk';
import * as fsExtra from 'fs-extra';
import * as glob from 'glob';
import * as yargs from 'yargs';

function fail(message: string): never {
  console.error(chalk.red(message));
  process.exit(1);
}

interface ProfileEntry {
  // Fields for google profiler entries
  name: string,
  ph: "X",
  ts: number,
  pid: number,
  tid: number,
  dur?: number,

  // Additional useful information
  id: number,
  cwd: string,
  source: string,
  packageName: string | undefined,
  state: "running" | "succeeded" | "failed",
  startTime: [number, number],
}

const argv = yargs.options({
  folder: {
    type: 'string',
    describe: 'Folder where to find profiles to merge',
  },
}).argv;

const folder = argv.folder;

if (!folder) {
  fail("Missing required argument: 'folder'");
}

if (!fsExtra.pathExistsSync(folder)) {
  fail(`Specified argument: 'folder' with value '${folder}' does not exist.`);
}

let profiles : {
  [name: string]: ProfileEntry
} = {};

const lernaFiles = glob.sync(path.join(folder, "Lerna-Profile-*.json"));
let lernaNames : {
  [name: string]: string
} = {};

switch (lernaFiles.length) {
  case 0:
    fail(`Did not find a lerna-profile json file in '${folder}'`);
  case 1:
    const lernaFile = lernaFiles[0];
    console.log(chalk.white(`Processing: ${lernaFile}`))
    const lernaProfiles = <ProfileEntry[]>fsExtra.readJSONSync(lernaFile);

    for (let lernaProfile of lernaProfiles)
    {
      lernaProfile.source = lernaFile;
      profiles[lernaProfile.name] = lernaProfile;
      lernaNames[lernaProfile.name.toLowerCase()] = lernaProfile.name;
    }
    
    break;
  default:
    fail(`Found multiple lerna-profile json files in '${folder}'. Clean the folder and regenerate the profile to ensure there is only one.`);
}

const justFiles = glob.sync(path.join(folder, "just-tasks-Profile-*.json"));
for (let justFile of justFiles)
{
  console.log(chalk.white(`Processing: ${justFile}`))
  
  const justProfiles = fsExtra.readJSONSync(justFile);
  const justEvents = <ProfileEntry[]>justProfiles.traceEvents;
  let matchingLernaName = "";
  if (justEvents.length > 0)
  {
    const firstEvent = justEvents[0];
    for (let lernaKey in lernaNames)
    {
      if (firstEvent.packageName?.toLowerCase()  === lernaKey)
      {
        console.log(chalk.cyan(`Matched ${justFile} with pid ${firstEvent.pid} to ${lernaKey}`))

        const lernaName = lernaNames[lernaKey];
        profiles[lernaNames[lernaKey]].name = `${lernaName} (${firstEvent.pid})`
        matchingLernaName = lernaName;
      }
    }
  }

  for (let justEvent of justEvents)
  {
    if (justEvent.name === "_wrapFunction")
    {
      continue;
    }
    
    justEvent.source = justFile;
    justEvent.name = `${matchingLernaName} ${justEvent.name}`
    profiles[justEvent.name] = justEvent;
  }
}

let profilesToWrite : ProfileEntry[] = [];
for (var key in profiles)
{
  profilesToWrite.push(profiles[key]);
}

fsExtra.writeJSONSync(path.join(folder, 'merged.json'), profilesToWrite, {spaces: 2});

console.log(chalk.greenBright(`written: ${profilesToWrite.length}.`));